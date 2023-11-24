import {
  EnemyTracker,
  FormattedTimeSkipIntervals,
  IntervalEntry,
  IntervalSet,
  TotInterval,
} from "../../../helpers/types";
import { mrtColorMap } from "../../../util/constants";
import { formatDuration } from "../../../util/format";
import { Combatant } from "../combatant/combatants";
import { Fight } from "../generateFights";

export function getAverageIntervals(
  fights: Fight[],
  selectedFights: number[],
  currentReportCode: string,
  timeSkipIntervals: FormattedTimeSkipIntervals[],
  enemyTracker: EnemyTracker,
  abilityNoEMScaling: number[],
  abilityNoScaling: number[],
  ebonWeight: number,
  intervalDuration: number,
  abilityBlacklist: number[],
  enemyBlacklist: number[],
  deathCutOff: number
): TotInterval[] {
  const sortedIntervals: TotInterval[] = [];

  for (const fight of fights) {
    if (
      !selectedFights.includes(fight.fightId) ||
      fight.reportCode !== currentReportCode
    ) {
      continue;
    }
    let currentInterval = 1;

    const intervalDur = intervalDuration * 1000;
    let intervalTimer = fight.startTime;
    let interval: IntervalSet = [];
    let latestTimestamp = 0;

    const deathCutOffTime =
      deathCutOff <= fight.deathEvents.length && deathCutOff !== 0
        ? fight.deathEvents[deathCutOff - 1].timestamp
        : undefined;

    for (const event of fight.normalizedDamageEvents) {
      if (
        event.source.spec === "Augmentation" ||
        event.normalizedAmount === 0 ||
        enemyBlacklist.includes(enemyTracker.get(event.targetID) ?? -1) ||
        abilityBlacklist.includes(event.abilityGameID) ||
        abilityNoScaling.includes(event.abilityGameID) ||
        event.source.id === -1
      ) {
        continue;
      }

      if (deathCutOffTime && event.timestamp >= deathCutOffTime) {
        break;
      }

      const overlapsWithTimeSkip = timeSkipIntervals.some((skipInterval) => {
        return (
          event.timestamp >= skipInterval.start + fight.startTime &&
          event.timestamp <= skipInterval.end + fight.startTime
        );
      });

      if (
        event.timestamp > intervalTimer + intervalDur ||
        overlapsWithTimeSkip
      ) {
        if (interval.length === 0 && overlapsWithTimeSkip) {
          intervalTimer = event.timestamp;
          continue;
        }
        const sortedInterval = interval.slice();
        sortedInterval.sort((a, b) => b.damage - a.damage);

        const existingEntry = sortedIntervals.find(
          (entry) => entry.currentInterval === currentInterval
        );

        const endTimestamp =
          latestTimestamp > 0 ? latestTimestamp : event.timestamp;
        if (existingEntry) {
          existingEntry.intervalEntries.push(sortedInterval);
        } else {
          sortedIntervals.push({
            currentInterval,
            intervalEntries: [sortedInterval],
            start: intervalTimer - fight.startTime,
            end: endTimestamp - fight.startTime,
          });
        }

        intervalTimer = event.timestamp;
        interval = [];
        currentInterval++;
        if (overlapsWithTimeSkip) {
          continue;
        }
      }
      latestTimestamp = event.timestamp;

      const intervalEntry = interval.find(
        (entry) => entry.id === event.source.id
      );

      const multiplier = abilityNoEMScaling.includes(event.abilityGameID)
        ? ebonWeight
        : 0;

      const amount = event.normalizedAmount * (1 - multiplier);

      if (intervalEntry) {
        intervalEntry.damage += amount;
      } else {
        interval.push({
          id: event.source.id,
          damage: amount,
        });
      }
    }
  }
  const averageIntervals = averageOutIntervals(sortedIntervals);

  return averageIntervals;
}

export function averageOutIntervals(
  totIntervals: TotInterval[]
): TotInterval[] {
  const avgIntervals: TotInterval[] = [];

  for (const entry of totIntervals) {
    const currentInterval = entry.currentInterval;
    const intervalRecord: Record<
      number,
      { totalDamage: number; count: number }
    > = {};

    for (const interval of entry.intervalEntries) {
      for (const { id, damage } of interval) {
        if (!intervalRecord[id]) {
          intervalRecord[id] = { totalDamage: damage, count: 1 };
        } else {
          intervalRecord[id].totalDamage += damage;
          intervalRecord[id].count++;
        }
      }
    }

    const intervalSet: IntervalEntry[] = Object.entries(intervalRecord).map(
      ([id, intervalData]) => ({
        id: +id,
        damage: intervalData.totalDamage / intervalData.count,
      })
    );

    const sortedIntervalSet = intervalSet.sort((a, b) => b.damage - a.damage);

    avgIntervals.push({
      currentInterval: currentInterval,
      intervalEntries: [sortedIntervalSet],
      start: entry.start,
      end: entry.end,
    });
  }

  return avgIntervals;
}

export function getTop4Pumpers(topPumpersData: TotInterval[]): TotInterval[] {
  return topPumpersData.map((interval) => ({
    currentInterval: interval.currentInterval,
    intervalEntries: [interval.intervalEntries[0].slice(0, 4)],
    start: interval.start,
    end: interval.end,
  }));
}

export function getMRTNote(
  avgTopPumpersData: TotInterval[],
  combatants: Combatant[]
): string {
  const threshold: number = 1.5;
  const defaultTargets: Set<number> = getDefaultTargets(avgTopPumpersData);

  let note: string = "prescGlowsStart \n" + "defaultTargets - ";
  note += [...defaultTargets]
    .map((id) => {
      const player = combatants.find((player) => player.id === id);

      return mrtColorMap.get(player?.class ?? "") + (player?.name ?? "") + "|r";
    })
    .join(" ");
  note += "\n";

  avgTopPumpersData.forEach((interval, index) => {
    const dataSet: IntervalSet = interval.intervalEntries[0];
    const top2: Set<number> = new Set(
      dataSet.slice(0, 2).map((entry) => entry.id)
    );

    let isImportant: boolean = false;
    let top2Damage: number = 0;
    let defaultDamage: number = 0;

    for (const player of dataSet) {
      if (defaultTargets.has(player.id)) {
        defaultDamage += player.damage;
      }
      if (top2.has(player.id)) {
        top2Damage += player.damage;
      }
    }

    if (top2Damage > defaultDamage * threshold) {
      isImportant = true;
    }
    if (index === 0) {
      note += "PREPULL" + " - ";
    } else {
      note += formatDuration(interval.start) + " - ";
    }

    note += [...top2]
      .map((id) => {
        const player = combatants.find((player) => player.id === id);

        return (
          mrtColorMap.get(player?.class ?? "") + (player?.name ?? "") + "|r"
        );
      })
      .join(" ");

    note += `${isImportant ? " *" : ""} \n`;
  });

  note += "prescGlowsEnd";

  return note;
}

function getDefaultTargets(avgTopPumpersData: TotInterval[]) {
  const idSum = new Map<number, number>();

  for (const interval of avgTopPumpersData) {
    interval.intervalEntries[0].slice(0, 4).forEach((entry) => {
      const currentSum = idSum.get(entry.id) ?? 0;
      const sum = currentSum + entry.damage;

      idSum.set(entry.id, sum);
    });
  }

  const sortedIds = [...idSum.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const defaultTargets: Set<number> = new Set(sortedIds.map(([id]) => id));

  return defaultTargets;
}
