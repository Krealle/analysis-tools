import {
  SuspectEvents,
  convertToCSV,
  downloadCSV,
} from "../../../util/csvHandler";
import {
  AnyBuffEvent,
  AnyDebuffEvent,
  AnyEvent,
  CastEvent,
  DamageEvent,
  DeathEvent,
  EventType,
  NormalizedDamageEvent,
  PhaseStartEvent,
} from "../../../wcl/events/types";
import { ReportFight, SummaryTable, WCLReport } from "../../../wcl/gql/types";
import { getFilter } from "../../../wcl/util/filters";
import {
  EventVariables,
  getEvents,
  getSummaryTable,
} from "../../../wcl/util/queryWCL";
import { Buff, generateBuffHistories } from "../combatant/buffs";
import { Combatant, generateCombatants } from "../combatant/combatants";
import { eventLinkNormalizer } from "../normalizers/eventLinkNormalizer";
import { supportEventLinkNormalizer } from "../normalizers/supportEventLinkNormalizer";
import { correctSupportEvents } from "../normalizers/supportEventCorrecter";
import { AbilityFilters } from "../EventNormalizer";
import { cloneDeep } from "lodash";

export type Fight = {
  fightId: number;
  reportCode: string;
  startTime: number;
  endTime: number;
  events: AnyEvent[];
  normalizedDamageEvents: NormalizedDamageEvent[];
  deathEvents: DeathEvent[];
  buffHistory: Buff[];
  combatants: Combatant[];
  phaseHistory?: PhaseStartEvent[];
};

export async function generateFights(
  WCLReport: WCLReport,
  selectedFights: number[],
  reportFights: ReportFight[],
  storedFights: Fight[],
  abilityFilters: AbilityFilters,
  refreshData: boolean,
  getCSV: boolean
): Promise<Fight[]> {
  /** This is a lazy mans approach to dealing with manual filter changes
   * Ideally we wouldn't re-fetch all of our data, but due to the way it is structured,
   * this is a simple approach, it doesn't really cost much in terms of time, only
   * in API calls. */
  const newFights: Fight[] = refreshData ? [] : cloneDeep(storedFights);

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
  const totSuspectEvents: SuspectEvents[] = [];

  for (const fightDataSet of newFightDataSets) {
    const buffEvents: AnyBuffEvent[] = [];
    const eventsToLink: (DamageEvent | AnyDebuffEvent | CastEvent)[] = [];
    const deathEvents: DeathEvent[] = [];
    const unexpectedEvents: AnyEvent[] = [];

    for (const event of fightDataSet.events) {
      if (
        event.type === EventType.ApplyBuffEvent ||
        event.type === EventType.RemoveBuffEvent ||
        event.type === EventType.ApplyBuffStackEvent ||
        event.type === EventType.RemoveBuffStackEvent
      ) {
        buffEvents.push(event);
        continue;
      }
      if (
        event.type === EventType.DamageEvent ||
        event.type === EventType.RefreshDebuffEvent ||
        event.type === EventType.ApplyDebuffEvent ||
        event.type === EventType.RemoveDebuffEvent ||
        event.type === EventType.CastEvent
      ) {
        eventsToLink.push(event);
        continue;
      }
      if (event.type === EventType.DeathEvent) {
        deathEvents.push(event);
        continue;
      }
      unexpectedEvents.push(event);
    }

    if (unexpectedEvents.length > 0) {
      console.error("Unexpected events!", unexpectedEvents);
    }

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

    console.log(combatants);

    const linkedEvents = eventLinkNormalizer(eventsToLink);

    const linkedSupportEvent = supportEventLinkNormalizer(
      linkedEvents,
      combatants
    );

    const correctedEvents = correctSupportEvents(
      linkedSupportEvent,
      combatants,
      abilityFilters
    );

    /* totSuspectEvents.push(...suspectEvents); */

    newFights.push({
      fightId: fightDataSet.fight.id,
      reportCode: WCLReport.code,
      startTime: fightDataSet.fight.startTime,
      endTime: fightDataSet.fight.endTime,
      normalizedDamageEvents: correctedEvents,
      events: fightDataSet.events,
      deathEvents: deathEvents,
      buffHistory: buffHistories,
      combatants: combatants,
    });
  }

  if (totSuspectEvents.length > 0 && getCSV) {
    const csvData = convertToCSV(totSuspectEvents);
    downloadCSV(csvData, "Suspect Events");
  }

  return newFights;
}

export type FightDataSet = {
  fight: ReportFight;
  summaryTable: SummaryTable;
  events: AnyEvent[];
};

async function getFightDataSets(
  fightsToGenerate: ReportFight[],
  reportCode: string
): Promise<FightDataSet[]> {
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
      fight: { ...fight, reportCode: reportCode },
      summaryTable: summaryTable,
      events: events,
    };
  });

  const result = await Promise.all(fetchPromises);

  return result;
}
