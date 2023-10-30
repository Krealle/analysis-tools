import {
  ABILITY_BLACKLIST,
  EBON_MIGHT_BUFF,
  PRESCIENCE_BUFF,
  SHIFTING_SANDS_BUFF,
} from "../../../util/constants";
import {
  AnyBuffEvent,
  AnyDebuffEvent,
  AnyEvent,
  DamageEvent,
  EventType,
  NormalizedDamageEvent,
  PhaseStartEvent,
} from "../../../wcl/events/types";
import { ReportFight, WCLReport } from "../../../wcl/gql/types";
import {
  EventVariables,
  getEvents,
  getSummaryTable,
} from "../../../wcl/util/queryWCL";
import { generateBuffHistories } from "./buffs";
import { Combatant, generateCombatants } from "./combatants";
import { normalizeDots } from "./debuffLinkNormalizer";
import { damageEventsNormalizer } from "./supportLinkNormalizer";

export type Buff = {
  abilityGameID: number;
  start: number;
  end: number;
  sourceID: number;
  sourceInstance?: number;
  targetID: number;
  targetInstance?: number;
  events: AnyBuffEvent[];
};

export type Fight = {
  fightId: number;
  reportCode: string;
  startTime: number;
  endTime: number;
  events: {
    damageEvents: DamageEvent[];
    normalizedDamageEvents: NormalizedDamageEvent[];
    buffHistory: Buff[];
  };
  combatants: Combatant[];
  phaseHistory: PhaseStartEvent[];
};

/**
 *
 * @param WCLReport masterData
 * @param selectedFights
 * @param reportFights
 * @param storedFights
 * @returns fights with normalized events
 */
export async function generateFights(
  WCLReport: WCLReport,
  selectedFights: number[],
  reportFights: ReportFight[],
  storedFights: Fight[]
): Promise<Fight[]> {
  const newFights: Fight[] = [...storedFights];

  const fightsToGenerate = reportFights.filter(
    (fight) =>
      selectedFights.includes(fight.id) &&
      !newFights.some(
        (entry) =>
          entry.fightId === fight.id && entry.reportCode === WCLReport.code
      )
  );

  const newFightDataSets = await getFightDataSets(
    fightsToGenerate,
    WCLReport.code
  );

  for (const fightDataSet of newFightDataSets) {
    console.log("event amount:", fightDataSet.events.length);
    const buffEvents: AnyBuffEvent[] = [];
    const eventsToLink: (DamageEvent | AnyDebuffEvent)[] = [];
    const unexpectedEvents: AnyEvent[] = [];

    for (const event of fightDataSet.events) {
      if (
        event.type === EventType.ApplyBuffEvent ||
        event.type === EventType.RemoveBuffEvent
      ) {
        buffEvents.push(event);
        continue;
      }
      if (
        event.type === EventType.DamageEvent ||
        event.type === EventType.RefreshDebuffEvent ||
        event.type === EventType.ApplyDebuffEvent ||
        event.type === EventType.RemoveDebuffEvent
      ) {
        eventsToLink.push(event);
        continue;
      }
      unexpectedEvents.push(event);
    }

    if (unexpectedEvents.length > 0) {
      console.error("Unexpected events!", unexpectedEvents);
    }
    console.log("buff events:", buffEvents);
    console.log("dot events:", eventsToLink);

    const buffHistories: Buff[] = generateBuffHistories(
      buffEvents,
      fightDataSet.fight.startTime,
      fightDataSet.fight.endTime
    );

    const combatants: Combatant[] = generateCombatants(
      buffHistories,
      fightDataSet.summaryTable.playerDetails,
      WCLReport.masterData?.actors
    );

    console.log("combatants:", combatants);

    try {
      const linkedEvents = normalizeDots(eventsToLink);

      const normalizedDamageEvents = damageEventsNormalizer(
        linkedEvents,
        combatants
      );

      console.log("normalizedDamageEvents:", normalizedDamageEvents);

      const dammies: {
        name: string;
        damage: number;
        events: NormalizedDamageEvent[];
      }[] = [];
      const totalDammies = normalizedDamageEvents.reduce((acc, e) => {
        if (e.subtractsFromSupportedActor) {
          return acc;
        }
        const amount: number =
          e.originalEvent.amount + (e.originalEvent.absorbed ?? 0);
        return acc + amount;
      }, 0);

      for (const player of combatants) {
        const damage = normalizedDamageEvents
          .filter((event) => event.source.id === player.id)
          .reduce((acc, e) => {
            const amount: number = e.normalizedAmount;
            return acc + amount;
          }, 0);

        dammies.push({
          name: player.name,
          damage: damage,
          events: normalizedDamageEvents.filter(
            (event) => event.source.id === player.id
          ),
        });
      }

      dammies.sort((a, b) => b.damage - a.damage);
      console.log("combatant damage:", dammies);
      console.log("totalDammies:", totalDammies);
    } catch (error) {
      console.error(error);
    }
  }

  return newFights;
}

/**
 *
 * @param fightsToGenerate  selected fights
 * @param reportCode  WCL report code
 * @returns fight data sets with summary table, damage events, buff events
 */
async function getFightDataSets(
  fightsToGenerate: ReportFight[],
  reportCode: string
) {
  const fetchPromises = fightsToGenerate.map(async (fight) => {
    const variables: EventVariables = {
      reportID: reportCode,
      fightIDs: [fight.id],
      startTime: fight.startTime,
      endTime: fight.endTime,
      limit: 10000,
    };
    const summaryTable = await getSummaryTable(variables);

    variables.filterExpression = getFilter();
    const events = await getEvents(variables);

    return {
      fight: fight,
      summaryTable: summaryTable,
      events: events,
    };
  });

  const result = await Promise.all(fetchPromises);

  return result;
}

/**
 * Filter does the following(in order of occurrence):
 *
 * Removes selfharm
 *
 * Removes certain target.id that are unwanted
 *
 * Removes selfharm from pets
 *
 * Removes selfharm support events
 *
 * Removes selfharm to pets
 *
 * Blacklist certain abilities
 *
 * Only collect friendly damage
 *
 * @returns WCL filter expression
 */
function getDamageFilter(): string {
  const abilityFilter = ABILITY_BLACKLIST.map((ability) => ability).join(`,`);
  const filter = `type = "damage" 
    AND (target.id != source.id)
    AND target.id not in(169428, 169430, 169429, 169426, 169421, 169425, 168932)
    AND not (target.id = source.owner.id)
    AND not (supportedActor.id = target.id)
    AND not (source.id = target.owner.id)
    AND not ability.id in (${abilityFilter})
    AND source.disposition = "friendly"
    AND (source.id > 0)`;
  return filter;
}

function getFilter(): string {
  const filter = `(${getBuffFilter()}) OR (${getDebuffFilter()}) OR (${getDamageFilter()})`;
  return filter;
}

/**
 *
 * @param buffList - WCL filter expression for buff IDs to collect
 * @returns WCL filter expression
 */
function getBuffFilter(): string {
  const filter = `(ability.id in (${EBON_MIGHT_BUFF},${SHIFTING_SANDS_BUFF},${PRESCIENCE_BUFF})) 
    AND (type in ("${EventType.ApplyBuffEvent}", "${EventType.RemoveBuffEvent}"))`;
  return filter;
}

function getDebuffFilter(): string {
  const filter = `type in ("${EventType.ApplyDebuffEvent}","${EventType.RefreshDebuffEvent}","${EventType.RemoveDebuffEvent}") 
  AND source.disposition = "friendly"`;

  return filter;
}
