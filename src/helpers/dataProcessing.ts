import { getBuffHistory } from "../components/findAttributionProblems/problemFinder";
import {
  EBON_MIGHT_BUFF,
  EBON_MIGHT_CORRECTION_VALUE,
  MELEE_HIT,
  SHIFTING_SANDS_BUFF,
  SHIFTING_SANDS_CORRECTION_VALUE,
  mrtColorMap,
} from "../util/constants";
import { formatDuration } from "../util/format";
import {
  ApplyBuffEvent,
  DamageEvent,
  EventType,
  RemoveBuffEvent,
} from "../wcl/events/types";
import { Actor, PlayerDetails, WCLReport, ReportFight } from "../wcl/gql/types";
import {
  EventVariables,
  getEvents,
  getPlayerDetails,
} from "../wcl/util/queryWCL";
import {
  FightTracker,
  FormattedTimeSkipIntervals,
  IntervalEntry,
  IntervalSet,
  PlayerBuffEvents,
  TotInterval,
} from "./types";

function getFilter(playerDetails: PlayerDetails, abilityBlacklist: string) {
  const nameFilter = playerDetails.dps
    .map((player) => `"${player.name}"`)
    .join(`,`);
  const abilityFilter = abilityBlacklist;

  const filter = `(source.name in (${nameFilter}) OR source.owner.name in (${nameFilter})) 
    AND (ability.id not in (${abilityFilter}))
    AND (target.id != source.id)
    AND target.id not in(169428, 169430, 169429, 169426, 169421, 169425, 168932)
    AND not (target.id = source.owner.id)
    AND not (source.id = target.owner.id)`;

  return filter;
}

function getBuffFilter(buffList: string) {
  const filter = `(ability.id in (${buffList})) 
  AND (type in ("${EventType.ApplyBuffEvent}", "${EventType.RemoveBuffEvent}"))`;
  return filter;
}

export function handleMetaData(report?: WCLReport) {
  if (!report || !report.fights || !report.masterData) {
    console.log("getMetaData - no report found");
    return null;
  }
  console.log("getMetaData - report found:", report);
  const playerTracker = new Map<number, Actor>();
  /** id - gameId */
  const enemyTracker = new Map<number, number>();
  const petToPlayerMap = new Map<number, number>();

  /** Link pet to owner
   * and populate playerTracker for class information */
  if (report.masterData.actors) {
    for (const actor of report.masterData.actors) {
      if (actor.petOwner) {
        petToPlayerMap.set(actor.id, actor.petOwner);
      }
      if (actor.type === "Player") {
        playerTracker.set(actor.id, actor);
      }
      if (actor.type === "NPC") {
        enemyTracker.set(actor.id, actor.gameID ?? -1);
      }
    }
  }

  return {
    fights: report.fights,
    petToPlayerMap: petToPlayerMap,
    playerTracker: playerTracker,
    enemyTracker: enemyTracker,
  };
}

export function getBuffCount(
  playerBuffEvents: PlayerBuffEvents,
  playerId: number,
  buffId: number,
  timestamp: number
): number {
  let amountOfBuffs = 0;

  const playerBuffs = playerBuffEvents[playerId];

  if (playerBuffs && playerBuffs[buffId]) {
    for (const buff of playerBuffs[buffId]) {
      if (buff.start <= timestamp && buff.end >= timestamp) {
        amountOfBuffs++;
      }
    }
  }

  return amountOfBuffs;
}

export function handleFightData(
  selectedFights: number[],
  reportCode: string,
  fightTracker: FightTracker[],
  timeSkipIntervals: FormattedTimeSkipIntervals[],
  petToPlayerMap: Map<number, number>,
  enemyBlacklist: number[],
  enemyTracker: Map<number, number>,
  abilityNoEMScaling: number[],
  abilityNoBoEScaling: number[],
  abilityNoScaling: number[],
  abilityBrokenAttribution: number[],
  playerTracker: Map<number, Actor>
): TotInterval[] {
  const sortedIntervals: TotInterval[] = [];

  for (const fight of fightTracker) {
    if (
      !selectedFights.includes(fight.fightId) ||
      fight.reportCode !== reportCode
    ) {
      continue;
    }
    const playerBuffEvents: PlayerBuffEvents = getBuffHistory(fight);

    let currentInterval = 1;

    // TODO: should be variable
    const intervalDur = 30_000;
    let intervalTimer = fight.startTime;
    let interval: IntervalSet = [];
    let latestTimestamp = 0;

    findBorkedEvents(
      petToPlayerMap,
      fight,
      playerBuffEvents,
      abilityNoEMScaling
    );

    for (const event of fight.damageEvents) {
      if (enemyBlacklist.includes(enemyTracker.get(event.targetID) ?? -1)) {
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
         *
         * Here we also attempt to reduce the problem with broken attribution, such as Beast Cleave
         * we figure out the amount of buffs a player have to reduce the damage manually.
         * Not a perfect solution but should help us none the less.
         */
        const noScaling = abilityNoScaling.includes(event.abilityGameID);
        const noEMScaling = abilityNoEMScaling.includes(event.abilityGameID)
          ? 0.5
          : 0;
        const noBOEScaling = abilityNoBoEScaling.includes(event.abilityGameID)
          ? 0.1
          : 0;

        const abilityHasBrokenAttribution = abilityBrokenAttribution.includes(
          event.abilityGameID
        );

        const isBMHunterPet =
          playerTracker.get(sourceID)?.subType === "Hunter" &&
          petToPlayerMap.get(event.sourceID);

        let ebonMightCount = 0;
        let shiftingSandsCount = 0;

        if (
          abilityHasBrokenAttribution ||
          (isBMHunterPet && event.abilityGameID !== MELEE_HIT)
        ) {
          ebonMightCount = getBuffCount(
            playerBuffEvents,
            sourceID,
            EBON_MIGHT_BUFF,
            event.timestamp
          );
          shiftingSandsCount = getBuffCount(
            playerBuffEvents,
            sourceID,
            SHIFTING_SANDS_BUFF,
            event.timestamp
          );
        }
        const weight = noScaling
          ? 0.1
          : 1 -
            noEMScaling -
            noBOEScaling -
            (ebonMightCount * EBON_MIGHT_CORRECTION_VALUE +
              shiftingSandsCount * SHIFTING_SANDS_CORRECTION_VALUE);

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
   * potentially we want to look at events that in the end of a fight, but didn't happen within
   * an entire interval, with averaging across many pulls this can kinda get skewed, data-wise
   * so for now we just ignore them.
   */
  console.log("sortedIntervals", sortedIntervals);
  return sortedIntervals;
}

type BorkedEvents = {
  event: DamageEvent;
  supportEvent: DamageEvent | undefined;
  delay: number;
  url: string;
};

function findBorkedEvents(
  petToPlayerMap: Map<number, number>,
  fight: FightTracker,
  playerBuffEvents: PlayerBuffEvents,
  abilityNoEMScaling: number[]
) {
  const bufferMS = 30;

  const pin = `&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability`;

  const borkedEvents = new Map<number, BorkedEvents[]>();
  const nattyEvents = fight.damageEvents.filter(
    (event) => !event.subtractsFromSupportedActor
  );
  const supportEvents = fight.damageEvents.filter(
    (event) => event.subtractsFromSupportedActor
  );

  for (const event of nattyEvents) {
    const actualSource = petToPlayerMap.get(event.sourceID) || event.sourceID;
    const isBuffed =
      getBuffCount(
        playerBuffEvents,
        actualSource,
        EBON_MIGHT_BUFF,
        event.timestamp
      ) > 0;

    if (!isBuffed || abilityNoEMScaling.includes(event.abilityGameID)) {
      continue;
    }

    const foundSupportEvent = supportEvents.find(
      (supEvent) =>
        event.sourceID === supEvent.supportID &&
        event.timestamp >= supEvent.timestamp &&
        event.timestamp <= supEvent.timestamp + bufferMS
    );

    if (
      foundSupportEvent &&
      ((foundSupportEvent.amount || 0) + (foundSupportEvent.absorbed || 0)) /
        (event.amount + (event.absorbed || 0)) >
        0.3
    ) {
      continue;
    }

    const timeDifference = foundSupportEvent
      ? (foundSupportEvent.timestamp || event.timestamp) - event.timestamp
      : -1;

    if (
      !foundSupportEvent ||
      (timeDifference > 0 && timeDifference <= bufferMS)
    ) {
      const wclUrl = `https://www.warcraftlogs.com/reports/${
        fight.reportCode
      }#fight=${fight.fightId}&type=damage-done&start=${
        event.timestamp - 50
      }&end=${
        event.timestamp + 50
      }&source=${actualSource}&view=events&ability=${
        event.abilityGameID
      }${pin}`;
      const newBorkedEvent = {
        event,
        supportEvent: foundSupportEvent,
        delay: timeDifference,
        url: wclUrl,
      };

      if (!borkedEvents.has(event.abilityGameID)) {
        borkedEvents.set(event.abilityGameID, [newBorkedEvent]);
      } else {
        borkedEvents.get(event.abilityGameID)?.push(newBorkedEvent);
      }
    }
  }

  console.log(borkedEvents);
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

  const newFightTracker = [...fightTracker];

  const eventPromises = fights
    .filter((fight) => fight.difficulty && selectedFights.includes(fight.id))
    .filter(
      (fight) =>
        !newFightTracker.some(
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
      console.log(playerDetails);
      if (playerDetails) {
        const filter = getFilter(playerDetails, customBlacklist);
        variables.filterExpression = filter;
      }

      const damageEvents = await getEvents<DamageEvent>(
        variables,
        EventType.DamageEvent
      );

      const buffFilter = getBuffFilter(
        `${EBON_MIGHT_BUFF},${SHIFTING_SANDS_BUFF}`
      );
      variables.filterExpression = buffFilter;
      const buffEvents = await getEvents<ApplyBuffEvent | RemoveBuffEvent>(
        variables
      );
      return { fight: fight, damageEvents, buffEvents };
    });

  await Promise.all(eventPromises).then((results) => {
    results.forEach(({ fight, damageEvents, buffEvents }) => {
      newFightTracker.push({
        fightId: fight.id,
        reportCode: reportCode,
        startTime: fight.startTime,
        endTime: fight.endTime,
        actors: fight.friendlyPlayers ?? [],
        damageEvents: damageEvents,
        buffEvents: buffEvents,
      });
    });
  });

  return newFightTracker;
}

export function getMRTNote(
  avgTopPumpersData: TotInterval[],
  playerTracker: Map<number, Actor>
): string {
  const threshold: number = 1.5;
  const defaultTargets: Set<number> = getDefaultTargets(avgTopPumpersData);

  let note: string = "prescGlowsStart \n" + "defaultTargets - ";
  note += [...defaultTargets]
    .map((id) => {
      const player = playerTracker.get(id);

      return (
        mrtColorMap.get(player?.subType ?? "") + (player?.name ?? "") + "|r"
      );
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
        const player = playerTracker.get(id);

        return (
          mrtColorMap.get(player?.subType ?? "") + (player?.name ?? "") + "|r"
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
/* 

https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1133171&end=1134171&source=55&view=events&ability=1&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
1 weird melee borked

https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1133401&end=1134401&source=3&view=events&ability=201754&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
201754 (stmop bm) borked
https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1133401&end=1134401&source=55&view=events&ability=10444&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
10444 flametongue attack borked
https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1133579&end=1134579&source=3&view=events&ability=16827&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
16827 claw(bm) borked

https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1134195&end=1135195&source=51&view=events&ability=204598&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
204598 sigil of flame

https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1134468&end=1135468&source=55&view=events&ability=25504&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
25504 windfury attack, semi sus
https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1136808&end=1137808&source=3&view=events&ability=83381&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
83381 kill command(bm) borked
https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1137129&end=1138129&source=51&view=events&ability=419737&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
419737 timestrike borked
https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1140069&end=1141069&source=3&view=events&ability=321538&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
321538 bloodshed(bm) borked

https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1145191&end=1146191&source=41&view=events&ability=589&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
589 shadow word pain semi sus

https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1148175&end=1149175&source=36&view=events&ability=383346&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
383346 expurgation semi sus

https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1164307&end=1165307&source=23&view=events&ability=59638&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
59638 mirror image frostbolt

https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1171439&end=1172439&source=3&view=events&ability=386301&pins=0%24Separate%24%23244F4B%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152%5E0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152&by=ability dataProcessing.ts:293:22
completely safe rocket blast (bm) 
*/
