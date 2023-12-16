import {
  EnemyTracker,
  FormattedTimeSkipIntervals,
  IntervalEntry,
  IntervalSet,
  TotInterval,
} from "../../../helpers/types";
import { AbilityFilters } from "../EventNormalizer";
import { Fight } from "../util/_generateFights";

export function getAverageIntervals(
  fights: Fight[],
  selectedFights: number[],
  currentReportCode: string,
  timeSkipIntervals: FormattedTimeSkipIntervals[],
  enemyTracker: EnemyTracker,
  abilityFilters: AbilityFilters,
  ebonWeight: number,
  intervalDuration: number,
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
        abilityFilters.blacklist.includes(event.abilityGameID) ||
        abilityFilters.noScaling.includes(event.abilityGameID) ||
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

      const multiplier = abilityFilters.noEMScaling.includes(
        event.abilityGameID
      )
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
