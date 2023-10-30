import {
  AnyDebuffEvent,
  ApplyDebuffEvent,
  DamageEvent,
  EventType,
  RefreshDebuffEvent,
  RemoveDebuffEvent,
} from "../../../wcl/events/types";
import { getKey } from "./normalizeEvents";

/**
 * The goal of this normalizer is to link dot ticks up with their application
 * this is needed so we can know what buffs to snapshot along with our dots
 *
 * the way this works is that we link the "parent" event to the "child" event
 * aka. the event that applied/refreshed the dot.
 *
 * This way we can reference the parent event and grab our buff count from that event!
 */
export function normalizeDots(
  damageEvents: DamageEvent[],
  debuffEvents: AnyDebuffEvent[]
): DamageEvent[] {
  const dotEvents = damageEvents.filter((event) => event.tick);

  const combinedEvents: (DamageEvent | AnyDebuffEvent)[] = [
    ...dotEvents,
    ...debuffEvents,
  ];

  const linkedEvents: DamageEvent[] = [];

  const parentEventMap: Map<string, ApplyDebuffEvent | RefreshDebuffEvent> =
    new Map();

  for (const event of combinedEvents) {
    const key = getKey(event);

    if (event.type === EventType.RemoveDebuffEvent) {
      event;
      parentEventMap.delete(key);
    }

    if (event.type === EventType.DamageEvent) {
      const newEvent = { ...event, parentEvent: parentEventMap.get(key) };

      if (!newEvent.parentEvent) {
        console.warn("parent event not found", newEvent, parentEventMap);
      }

      linkedEvents.push(newEvent);
      continue;
    }

    if (
      event.type === EventType.ApplyDebuffEvent ||
      event.type === EventType.RefreshDebuffEvent
    ) {
      parentEventMap.set(key, event);
    }
  }

  return linkedEvents;
}
