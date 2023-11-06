import { SNAPSHOTTED_DOTS } from "../../../util/constants";
import {
  ApplyDebuffEvent,
  AttributionHook,
  DamageEvent,
  NormalizedDamageEvent,
  RefreshDebuffEvent,
  RemoveDebuffEvent,
  SupportEvent,
} from "../../../wcl/events/types";
import { getBuffs } from "../combatant/buffs";
import { Combatant, Pet } from "../combatant/combatants";

/**
 * So in essence what needs to happen here is that we go through all the events that happened
 * and link together supported and support events together. We will then use these link to compare
 * if we have gotten the proper amount of support events. If we don't we need to fabricate new support events.
 *
 * Ideally we also deal with amount that gets attributed around to verify, but as Saeldur has pointed out:
 * this requires you to know the amount of stats someone has at the given timestamp, this is not something that is
 * logged besides the playerDetails information that is derived from the fightStart.
 *
 * A possible solution to this problem can be derived from the solution used for WoWa:
 * Manually go through buff events and attempt to reconstruct the amount of stats a player would have at a given timestamp.
 * This is obviously a very intensive solution that has issues of it's own.
 * One issue is that if a player starts the fight with a certain buff, ie. popped a buff pre-pull, they will initialize with
 * a non-base stat value.
 *
 * @param events
 * @param combatants
 * @returns
 */
export function supportEventLinkNormalizer(
  events: DamageEvent[],
  combatants: Combatant[]
): NormalizedDamageEvent[] {
  if (events.length === 0) {
    throw new Error("No events to normalize");
  }
  if (combatants.length === 0) {
    throw new Error("No combatants");
  }

  const normalizedEvents: NormalizedDamageEvent[] = [];
  const supportEventsRecord: { [key: string]: NormalizedDamageEvent[] } = {};
  let lastEvent: DamageEvent | undefined;

  const pets: Pet[] = combatants.flatMap((player) => player.pets);

  for (const event of events) {
    const petOwner = pets.find((pet) => pet.id === event.sourceID);

    const player = combatants.find(
      (player) => player.id === (petOwner ? petOwner.petOwner : event.sourceID)
    );

    const activeBuffs =
      SNAPSHOTTED_DOTS.includes(event.abilityGameID) && event.parentEvent
        ? getBuffs(event.parentEvent.timestamp, player)
        : getBuffs(event.timestamp, player);

    const key = getKey(event);

    const normalizedEvent: NormalizedDamageEvent = {
      ...event,
      source: {
        name: player?.name ?? "Unknown",
        id: player?.id ?? -1,
        class: player?.class ?? "Unknown",
        spec: player?.spec ?? "Unknown",
        petOwner: petOwner,
      },
      activeBuffs: activeBuffs,
      originalEvent: event,
      normalizedAmount: event.amount + (event.absorbed ?? 0),
      supportEvents: [],
    };

    if (event.subtractsFromSupportedActor) {
      const supportKey = getKey(event);

      if (!supportEventsRecord[supportKey]) {
        supportEventsRecord[supportKey] = [];
      }

      if (supportEventsRecord[supportKey].length === 0) {
        if (
          lastEvent?.sourceID === event.supportID &&
          lastEvent?.targetID === event.targetID &&
          lastEvent.targetInstance === event.targetInstance &&
          lastEvent.sourceInstance === event.supportInstance &&
          normalizedEvents.length > 0
        ) {
          const lastNormalizedEvent = normalizedEvents.pop();
          if (lastNormalizedEvent) {
            supportEventsRecord[supportKey] = [lastNormalizedEvent];
            supportEventsRecord[supportKey].push(normalizedEvent);

            continue;
          }
        }
        console.log("dumb shit happening");
        console.log("event", event, "lastEvent", lastEvent);
        continue;
      }

      supportEventsRecord[supportKey].push(normalizedEvent);
      continue;
    }

    // new damage event need to sort out old one
    if (supportEventsRecord[key] && supportEventsRecord[key].length > 0) {
      const newNormalizedEvent = createEventLinks(supportEventsRecord[key]);
      supportEventsRecord[key] = [];
      normalizedEvents.push(...newNormalizedEvent);
    }

    if (normalizedEvent.activeBuffs.length > 0) {
      // target is buffed and we need to catch buff events before we push it
      supportEventsRecord[key] = [normalizedEvent];
    } else {
      normalizedEvents.push(normalizedEvent);
    }
    lastEvent = normalizedEvent;
  }

  Object.keys(supportEventsRecord).forEach((events) => {
    if (supportEventsRecord[events].length === 0) {
      return;
    }
    const newNormalizedEvent = createEventLinks(supportEventsRecord[events]);
    supportEventsRecord[events] = [];
    normalizedEvents.push(...newNormalizedEvent);
  });

  if (normalizedEvents.length !== events.length) {
    console.warn(
      "expected events:",
      events.length,
      "events gotten:",
      normalizedEvents.length,
      "difference:",
      normalizedEvents.length - events.length
    );
  }

  const sortedNormalizedEvents = normalizedEvents.sort(
    (a, b) => a.timestamp - b.timestamp
  );
  return sortedNormalizedEvents;
}

function getKey(
  event: DamageEvent | ApplyDebuffEvent | RefreshDebuffEvent | RemoveDebuffEvent
): string {
  let key = `${event.targetID}`;
  if (event.targetInstance) key += `_${event.targetInstance}`;

  if ("subtractsFromSupportedActor" in event) {
    key += `_${event.supportID}`;
    if (event.supportInstance) key += `_${event.supportInstance}`;
  } else {
    key += `_${event.sourceID}`;
    if (event.sourceInstance) key += `_${event.sourceInstance}`;
  }

  return key;
}

/**
 * Here we take in an array of events, first entry should ALWAYS be the supported event
 * and the subsequent entries should ONLY be the support events.
 *
 * @param eventMap
 * @returns A new array with the normalized events along with any potentially fabricated ones.
 */
function createEventLinks(
  eventMap: NormalizedDamageEvent[]
): NormalizedDamageEvent[] {
  const sourceEvent = eventMap[0];
  /** Welcome to blizzard combat logs, things don't always happen when they are supposed to */
  const bufferMS = 30;

  const newEventMap: NormalizedDamageEvent[] = [];

  if (sourceEvent.subtractsFromSupportedActor) {
    console.error(
      "unexpected support event when trying to create support event",
      sourceEvent,
      "eventMap",
      eventMap
    );
    throw new Error(
      "Unexpected source event when trying to create support event"
    );
    return eventMap;
  }

  if (eventMap.length === 1) {
    return eventMap;
  }

  for (let i = 1; eventMap.length > i; i++) {
    const supportEvent = eventMap[i];
    const delay = supportEvent.timestamp - sourceEvent.timestamp;

    /** On earlier tests this was happening, potential cause is this
     * support event actually belongs to another supported event.
     * earlier tests was completely different code so this still shouldn't happen
     * but if it does we defo need to find out why */
    if (delay > bufferMS) {
      console.error(
        "support event delayed more than expected",
        supportEvent,
        "eventMap",
        eventMap
      );
      continue;
    }

    const hookType =
      delay > 0 ? AttributionHook.DELAYED_HOOK : AttributionHook.GOOD_HOOK;

    const newSupportEvent: SupportEvent = {
      event: supportEvent,
      delay: delay,
      hookType: hookType,
    };

    sourceEvent.supportEvents
      ? sourceEvent.supportEvents.push(newSupportEvent)
      : (sourceEvent.supportEvents = [newSupportEvent]);
    newEventMap.push(supportEvent);
  }

  newEventMap.push(sourceEvent);

  return newEventMap;
}
