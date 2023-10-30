import {
  ApplyDebuffEvent,
  DamageEvent,
  RefreshDebuffEvent,
  RemoveDebuffEvent,
} from "../../../wcl/events/types";

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
  debuffEvents: (ApplyDebuffEvent | RefreshDebuffEvent | RemoveDebuffEvent)[]
): DamageEvent[] {
  const dotEvents = damageEvents.filter((event) => event.tick);

  const combinedEvents: (
    | DamageEvent
    | ApplyDebuffEvent
    | RefreshDebuffEvent
    | RemoveDebuffEvent
  )[] = [...dotEvents, ...debuffEvents];

  const linkedEvents: DamageEvent[] = [];

  for (const event of combinedEvents) {
  }

  return linkedEvents;
}
