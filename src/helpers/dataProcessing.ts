import {
  ABILITY_BLACKLIST,
  ABILITY_NO_SCALING,
  ABILITY_NO_EM_SCALING,
  BOSS_ID_LIST,
  ABILITY_NO_BOE_SCALING,
} from "../util/constants";
import { DamageEvent, EventType } from "../wcl/events/types";
import { Actor, PlayerDetails, Report, ReportFight } from "../wcl/gql/types";
import {
  EventVariables,
  getEvents,
  getPlayerDetails,
} from "../wcl/util/queryWCL";
import {
  FightTracker,
  IntervalEntry,
  IntervalSet,
  TimeSkipIntervals,
  TotInterval,
} from "./types";

function getFilter(playerDetails: PlayerDetails, customBlacklist: string) {
  const nameFilter = playerDetails.dps
    .map((player) => `"${player.name}"`)
    .join(`,`);
  let abilityFilter = ABILITY_BLACKLIST.map((ability) => `${ability}`).join(
    `,`
  );
  if (customBlacklist !== "") {
    abilityFilter += `,${customBlacklist}`;
  }

  const filter = `(source.name in (${nameFilter}) OR source.owner.name in (${nameFilter})) 
    AND (ability.id not in (${abilityFilter}))
    AND (target.id != source.id)
    AND target.id not in(169428, 169430, 169429, 169426, 169421, 169425, 168932)
    AND not (target.id = source.owner.id)
    AND not (source.id = target.owner.id)`;

  return filter;
}

export function handleMetaData(report?: Report) {
  if (!report || !report.fights || !report.masterData) {
    console.log("getMetaData - no report found");
    return null;
  }
  console.log("getMetaData - report found:", report);
  const playerTracker = new Map<number, Actor>();
  const petToPlayerMap = new Map<number, number>();
  const bossIdList = new Set<number>();

  /** Link pet to owner
   * and populate playerTracker for class informations */
  if (report.masterData.actors) {
    for (const actor of report.masterData.actors) {
      if (actor.petOwner) {
        petToPlayerMap.set(actor.id, actor.petOwner);
      }
      if (actor.type === "Player") {
        playerTracker.set(actor.id, actor);
      }
      if (BOSS_ID_LIST.includes(actor.gameID ?? -1)) {
        bossIdList.add(actor.id);
      }
    }
  }

  return {
    fights: report.fights,
    petToPlayerMap: petToPlayerMap,
    playerTracker: playerTracker,
    bossIdList: bossIdList,
  };
}

export function handleFightData(
  selectedFights: number[],
  reportCode: string,
  fightTracker: FightTracker[],
  bossIdList: Set<number>,
  timeSkipIntervals: TimeSkipIntervals[],
  petToPlayerMap: Map<number, number>,
  onlyBosses?: boolean
): TotInterval[] {
  const sortedIntervals: TotInterval[] = [];

  for (const fight of fightTracker) {
    if (
      !selectedFights.includes(fight.fightId) ||
      fight.reportCode !== reportCode
    ) {
      continue;
    }

    let currentInterval = 1;

    // TODO: should be variable
    const intervalDur = 30_000;
    let intervalTimer = fight.startTime;
    let interval: IntervalSet = [];
    let latestTimestamp = 0;

    for (const event of fight.events) {
      if (onlyBosses && !bossIdList.has(event.targetID)) {
        continue;
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

      const sourceID = event.subtractsFromSupportedActor
        ? petToPlayerMap.get(event.supportID ?? -1) ?? event.supportID ?? -1
        : petToPlayerMap.get(event.sourceID) ?? event.sourceID;

      const intervalEntry = interval.find((entry) => entry.id === sourceID);

      let amount = 0;
      if (event.subtractsFromSupportedActor) {
        amount = -(event.amount + (event.absorbed ?? 0));
      } else {
        /**
         * To determine accurate values, we use a weighted system:
         * - Abilities that synergize with Ebon Might, Shifting Sands, Prescience, and
         *   Breath of Eons are weighted at 1 as our baseline.
         *
         * - Abilities that don't scale with the mainstat, only with Shifting Sands or
         *   Prescience, receive lower weights.
         *
         * - Abilities not contributing to Breath of Eons are devalued; fortunately, this
         *   is straightforward, as non-mainstat-scaling abilities, e.g., trinkets, don't
         *   count toward Breath of Eons.
         *
         * - Assuming a weight of 1 for a constant 80% uptime of Ebon Might (EM), we need
         *   to establish the EM uptime to Shifting Sands uptime ratio. The average total
         *   Shifting Sands uptime is around 50-60%, distributed with 2-4 buffs, making
         *   it necessary to determine a reasonable average for individual players. An
         *   uptime of 20-30% from top logs suggests a practical value. Using 20% for
         *   simplicity, Shifting Sands is assigned a weight of 0.25.
         *
         * - It's important to note that Shifting Sands is a more potent buff than EM and
         *   typically contributes more to damage in terms of uptime and throughput.
         *   Taking into account the scaling of Prescience/Fate Mirror into this, a weight
         *   of 0.5 for Shifting Sands seems reasonable.
         *
         * - If an ability doesn't scale with Breath of Eons it will lose 0.1 weight as well.
         *
         * - Keep in mind that our calculations depend on Blizzard's data and attribution.
         *   Therefore, the result will have some degree of inaccuracy no matter the
         *   formula. Nevertheless, this approach should provide a more reliable result
         *   compared to a strict reliance on logs.
         */
        const noScaling = ABILITY_NO_SCALING.includes(event.abilityGameID);
        const noEMScaling = ABILITY_NO_EM_SCALING.includes(event.abilityGameID)
          ? 0.5
          : 0;
        const noBOEScaling = ABILITY_NO_BOE_SCALING.includes(
          event.abilityGameID
        )
          ? 0.1
          : 0;

        const weight = noScaling ? 0.1 : 1 - noEMScaling - noBOEScaling;

        amount = (event.amount + (event.absorbed ?? 0)) * weight;
      }

      if (intervalEntry) {
        intervalEntry.damage += amount;
      } else {
        interval.push({
          id: sourceID,
          damage: amount,
        });
      }
    }
  }
  /**
   * potentially we want to look at events that in the end of a fight, but didnt happen within
   * an entire interval, with averaging across many pulls this can kinda get skewed, data-wise
   * so for now we just ignore them.
   */
  return sortedIntervals;
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

export async function parseFights(
  reportCode: string,
  fights: ReportFight[],
  selectedFights: number[],
  fightTracker: FightTracker[] = [],
  customBlacklist: string
) {
  const baseVariables: EventVariables = {
    reportID: reportCode,
    limit: 10000,
    startTime: 0,
    endTime: 0,
  };

  const eventPromises = fights
    .filter((fight) => fight.difficulty && selectedFights.includes(fight.id))
    .filter(
      (fight) =>
        !fightTracker.some(
          (entry) =>
            entry.fightId === fight.id && entry.reportCode === reportCode
        )
    )
    .map(async (fight) => {
      const variables: EventVariables = {
        ...baseVariables,
        reportID: reportCode,
        startTime: fight.startTime,
        endTime: fight.endTime,
        fightIDs: [fight.id],
      };

      const playerDetails = await getPlayerDetails(variables);

      if (playerDetails) {
        const filter = getFilter(playerDetails, customBlacklist);
        variables.filterExpression = filter;
      }

      const events = await getEvents<DamageEvent>(
        variables,
        EventType.DamageEvent
      );
      return { fight: fight, events };
    });

  await Promise.all(eventPromises).then((results) => {
    results.forEach(({ fight, events }) => {
      fightTracker.push({
        fightId: fight.id,
        reportCode: reportCode,
        startTime: fight.startTime,
        endTime: fight.endTime,
        actors: fight.friendlyPlayers ?? [],
        events: events,
      });
    });
  });

  return fightTracker;
}
