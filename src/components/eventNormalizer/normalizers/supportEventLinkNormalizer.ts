import { SNAPSHOTTED_DOTS } from "../../../util/constants";
import {
  AttributionHook,
  DamageEvent,
  NormalizedDamageEvent,
} from "../../../wcl/events/types";
import { getBuffs } from "../combatant/buffs";
import { Combatant, Pet } from "../combatant/combatants";

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

  const bufferMS = 30;

  const eventRecord: { [key: string]: number } = {};
  const pets: Pet[] = combatants.flatMap((player) => player.pets);

  let idx = 0;
  const normalizedEvents = events.reduce<NormalizedDamageEvent[]>(
    (normEvents, event) => {
      const petOwner = pets.find((pet) => pet.id === event.sourceID);

      const player = combatants.find(
        (player) =>
          player.id === (petOwner ? petOwner.petOwner : event.sourceID)
      );

      const activeBuffs =
        event.castEvent && !event.tick
          ? getBuffs(event.castEvent.timestamp, player)
          : SNAPSHOTTED_DOTS.includes(event.abilityGameID) &&
            event.parentDotEvent
          ? getBuffs(event.parentDotEvent.timestamp, player)
          : getBuffs(event.timestamp, player);

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

      const eventKey = getKey(event);
      if (!event.subtractsFromSupportedActor) {
        eventRecord[eventKey] = idx;
        normEvents.push(normalizedEvent);
        idx++;
      } else {
        const supportedEventIndex = eventRecord[eventKey];

        if (!supportedEventIndex) {
          console.warn("We done fucked up", event);
        } else {
          const delay =
            event.timestamp - normEvents[supportedEventIndex].timestamp;

          if (delay > bufferMS) {
            console.error(
              "support event delayed more than expected",
              event,
              "eventMap",
              normEvents[supportedEventIndex]
            );
          }

          const hookType =
            normalizedEvent.normalizedAmount === 0
              ? AttributionHook.EMPTY_HOOK
              : delay > 0
              ? AttributionHook.DELAYED_HOOK
              : AttributionHook.GOOD_HOOK;

          normEvents[supportedEventIndex].supportEvents.push({
            event: normalizedEvent,
            delay: delay,
            hookType: hookType,
          });
        }
      }

      return normEvents;
    },
    []
  );

  return normalizedEvents;
}

function getKey(event: DamageEvent): string {
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
