import {
  ABILITY_BLACKLIST,
  ABILITY_SOFT_LIST,
  BOSS_ID_LIST,
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

function getFilter(playerDetails: PlayerDetails) {
  const nameFilter = playerDetails.dps
    .map((player) => `"${player.name}"`)
    .join(`,`);
  const abilityFilter = ABILITY_BLACKLIST.map((ability) => `${ability}`).join(
    `,`
  );

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

        if (existingEntry) {
          existingEntry.intervalEntries.push(sortedInterval);
        } else {
          sortedIntervals.push({
            currentInterval,
            intervalEntries: [sortedInterval],
            start: intervalTimer - fight.startTime,
            end: event.timestamp - fight.startTime,
          });
        }

        intervalTimer = event.timestamp;
        interval = [];
        currentInterval++;
        if (overlapsWithTimeSkip) {
          continue;
        }
      }

      const sourceID = event.subtractsFromSupportedActor
        ? petToPlayerMap.get(event.supportID ?? -1) ?? event.supportID ?? -1
        : petToPlayerMap.get(event.sourceID) ?? event.sourceID;

      const intervalEntry = interval.find((entry) => entry.id === sourceID);

      let amount = 0;
      if (event.subtractsFromSupportedActor) {
        amount = -(event.amount + (event.absorbed ?? 0));
      } else {
        // abilities on soft doesn't scale off mainstat so they should be devalued
        amount = ABILITY_SOFT_LIST.includes(event.abilityGameID)
          ? (event.amount + (event.absorbed ?? 0)) * 0.2
          : event.amount + (event.absorbed ?? 0);
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
  fightTracker: FightTracker[] = []
) {
  const variables: EventVariables = {
    reportID: reportCode,
    limit: 10000,
    startTime: 0,
    endTime: 0,
  };

  for (const fight of fights) {
    if (!fight.difficulty || !selectedFights.includes(fight.id)) {
      console.log("parseFights - Skipping fight");
      continue;
    }

    if (
      fightTracker.some(
        (entry) => entry.fightId === fight.id && entry.reportCode === reportCode
      )
    ) {
      console.log("parseFights - Fight already parsed");
      continue;
    }

    variables.startTime = fight.startTime;
    variables.endTime = fight.endTime;
    variables.fightIDs = [fight.id]; // TODO: maybe remove

    const playerDetails = await getPlayerDetails(variables);

    if (playerDetails) {
      const filter = getFilter(playerDetails);
      variables.filterExpression = filter;
    }

    console.log("parseFights - fetching events for:", fight);
    const events = (await getEvents(
      variables,
      EventType.DamageEvent
    )) as DamageEvent[];

    console.log("parseFights - fetched events:", events);
    fightTracker.push({
      fightId: fight.id,
      reportCode: reportCode,
      startTime: fight.startTime,
      endTime: fight.endTime,
      actors: fight.friendlyPlayers ?? [],
      events: events,
    });
  }

  return fightTracker;
}
