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
import { AbilityFilters } from "../EventNormalizer";
import { Buff, generateBuffHistories } from "../combatant/buffs";
import { Combatant, generateCombatants } from "../combatant/combatants";
import { eventLinkNormalizer } from "../normalizers/eventLinkNormalizer";
import { correctSupportEvents } from "../normalizers/supportEventCorrecter";
import { supportEventLinkNormalizer } from "../normalizers/supportEventLinkNormalizer";
import { FightDataSet } from "./fetchFightData";
import { WCLReport } from "../../../wcl/gql/types";

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

export function handleFightData(
  WCLReport: WCLReport,
  FightDataSets: FightDataSet[],
  abilityFilters: AbilityFilters
): Fight[] {
  const newFights: Fight[] = [];

  for (const fightDataSet of FightDataSets) {
    const buffEvents: AnyBuffEvent[] = [];
    const eventsToLink: (DamageEvent | AnyDebuffEvent | CastEvent)[] = [];
    const deathEvents: DeathEvent[] = [];
    const unexpectedEvents: AnyEvent[] = [];

    for (const event of fightDataSet.events) {
      switch (event.type) {
        case EventType.ApplyBuffEvent:
        case EventType.RemoveBuffEvent:
        case EventType.ApplyBuffStackEvent:
        case EventType.RemoveBuffStackEvent:
          buffEvents.push(event);
          break;
        case EventType.DamageEvent:
        case EventType.RefreshDebuffEvent:
        case EventType.ApplyDebuffEvent:
        case EventType.RemoveDebuffEvent:
        case EventType.CastEvent:
          eventsToLink.push(event);
          break;
        case EventType.DeathEvent:
          deathEvents.push(event);
          break;
        default:
          unexpectedEvents.push(event);
          break;
      }
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

  return newFights;
}
