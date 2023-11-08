import { EBON_MIGHT, PRESCIENCE, SHIFTING_SANDS } from "../../util/constants";
import {
  AnyBuffEvent,
  AnyDebuffEvent,
  AnyEvent,
  CastEvent,
  DamageEvent,
  EventType,
  NormalizedDamageEvent,
  PhaseStartEvent,
} from "../../wcl/events/types";
import { ReportFight, SummaryTable, WCLReport } from "../../wcl/gql/types";
import {
  EventVariables,
  getEvents,
  getSummaryTable,
} from "../../wcl/util/queryWCL";
import { generateBuffHistories } from "./combatant/buffs";
import { Combatant, generateCombatants } from "./combatant/combatants";
import { eventLinkNormalizer } from "./normalizers/eventLinkNormalizer";
import { supportEventNormalizer } from "./normalizers/supportEventNormalizer";
import { supportEventLinkNormalizer } from "./normalizers/supportLinkNormalizer";

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
  normalizedDamageEvents: NormalizedDamageEvent[];
  buffHistory: Buff[];
  combatants: Combatant[];
  phaseHistory?: PhaseStartEvent[];
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
  storedFights: Fight[],
  abilityNoScaling: number[],
  abilityNoEMScaling: number[],
  abilityNoShiftingScaling: number[],
  refreshData: boolean
): Promise<Fight[]> {
  /** This is a lazy mans approach to dealing with manual filter changes
   * Ideally we wouldn't re-fetch all of our data, but due to the way it is structured,
   * this is a simple approach, it doesn't really cost much in terms of time, only
   * in API calls. */
  const newFights: Fight[] = refreshData ? [] : [...storedFights];

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

  const logDataTot: {
    spellId: string;
    supportType: string;
    url: string;
  }[] = [];

  for (const fightDataSet of newFightDataSets) {
    const buffEvents: AnyBuffEvent[] = [];
    const eventsToLink: (DamageEvent | AnyDebuffEvent | CastEvent)[] = [];
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
        event.type === EventType.RemoveDebuffEvent ||
        event.type === EventType.CastEvent
      ) {
        eventsToLink.push(event);
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

    console.log("combatants:", combatants);

    const linkedEvents = eventLinkNormalizer(eventsToLink);

    const damageEvents = supportEventLinkNormalizer(linkedEvents, combatants);

    const { normalizedEvents, logData } = supportEventNormalizer(
      damageEvents,
      combatants,
      abilityNoScaling,
      abilityNoEMScaling,
      abilityNoShiftingScaling,
      fightDataSet
    );

    logDataTot.push(...logData);

    newFights.push({
      fightId: fightDataSet.fight.id,
      reportCode: WCLReport.code,
      startTime: fightDataSet.fight.startTime,
      endTime: fightDataSet.fight.endTime,
      normalizedDamageEvents: normalizedEvents,
      buffHistory: buffHistories,
      combatants: combatants,
    });
  }

  const csvData = convertToCSV(logDataTot);

  downloadCSV(csvData, "This shit is whack");

  return newFights;
}

export type FightDataSet = {
  fight: ReportFight;
  summaryTable: SummaryTable;
  events: AnyEvent[];
};
/**
 *
 * @param fightsToGenerate  selected fights
 * @param reportCode  WCL report code
 * @returns fight data sets with summary table, damage events, buff events
 */
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
 * Ignore friendly fire
 *
 * @returns WCL filter expression
 */
function getDamageFilter(): string {
  const filter = `type = "damage" 
    AND (target.id != source.id)
    AND target.id not in(169428, 169430, 169429, 169426, 169421, 169425, 168932)
    AND not (target.id = source.owner.id)
    AND not (supportedActor.id = target.id)
    AND not (source.id = target.owner.id)
    AND source.disposition = "friendly"
    AND target.disposition != "friendly"
    AND (source.id > 0)`;
  return filter;
}

function getFilter(): string {
  const filter = `(${getBuffFilter()}) 
  OR (${getDebuffFilter()}) 
  OR (${getDamageFilter()}) 
  OR (${getCastFilter()})`;
  return filter;
}

function getBuffFilter(): string {
  const filter = `(ability.id in (${EBON_MIGHT},${SHIFTING_SANDS},${PRESCIENCE})) 
    AND (type in ("${EventType.ApplyBuffEvent}", "${EventType.RemoveBuffEvent}"))`;
  return filter;
}

function getDebuffFilter(): string {
  const filter = `type in ("${EventType.ApplyDebuffEvent}","${EventType.RefreshDebuffEvent}","${EventType.RemoveDebuffEvent}") 
  AND source.disposition = "friendly"`;

  return filter;
}

function getCastFilter(): string {
  const filter = `type = "${EventType.CastEvent}"
  AND source.disposition = "friendly"`;

  return filter;
}

function convertToCSV(
  objArray: {
    spellId: string;
    supportType: string;
    url: string;
  }[]
) {
  const array = typeof objArray !== "object" ? JSON.parse(objArray) : objArray;
  let str = "";

  // Generate header row
  const header = Object.keys(array[0]);
  str += header.join("|") + "\r\n";

  // Generate data rows
  for (let i = 0; i < array.length; i++) {
    let line = "";
    for (const index in array[i]) {
      if (line !== "") line += "|";
      line += array[i][index];
    }
    str += line + "\r\n";
  }

  return str;
}

function downloadCSV(csvContent: string, fileName: string) {
  const csvFile = new Blob([csvContent], { type: "text/csv" });
  const downloadLink = document.createElement("a");
  downloadLink.download = `${fileName}.csv`;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}
