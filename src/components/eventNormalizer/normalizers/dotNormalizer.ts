import {
  AnyDebuffEvent,
  ApplyDebuffEvent,
  DamageEvent,
  EventType,
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
 *
 * This is mainly only needed for the very few dots left in the game that snapshot.
 * Where the attribution part is always calculated on Debuff Apply or Debuff Refresh.
 *
 * An example of this is BM hunters - Master Marksman
 * https://www.wowhead.com/spell=260309/master-marksman
 * https://www.warcraftlogs.com/reports/X2yBtArq6RbVkD1Z#fight=5&type=damage-done&start=1285631&end=1285631&view=events
 *
 */
export function normalizeDots(
  events: (AnyDebuffEvent | DamageEvent)[]
): DamageEvent[] {
  const linkedEvents: DamageEvent[] = [];

  const parentEventRecord: Record<
    string,
    ApplyDebuffEvent | RefreshDebuffEvent | undefined
  > = {};

  let lastDebuffRemoveTimestamp = 0;

  const parentEventRemovedRecord: Record<
    string,
    ApplyDebuffEvent | RefreshDebuffEvent | undefined
  > = {};

  for (const event of events) {
    const key = getKey(event);

    if (event.type === EventType.RemoveDebuffEvent) {
      parentEventRemovedRecord[key] = parentEventRecord[key];
      parentEventRecord[key] = undefined;
      lastDebuffRemoveTimestamp = event.timestamp;
    }

    if (
      event.type === EventType.ApplyDebuffEvent ||
      event.type === EventType.RefreshDebuffEvent
    ) {
      parentEventRecord[key] = event;
    }
    if (event.type === EventType.DamageEvent) {
      if (!event.tick) {
        linkedEvents.push(event);
        continue;
      }
      const newEvent = { ...event, parentEvent: parentEventRecord[key] };
      const lastRecord = parentEventRemovedRecord[key];

      if (!newEvent.parentEvent) {
        if (lastDebuffRemoveTimestamp === event.timestamp) {
          newEvent.parentEvent = lastRecord;
          /* console.log("parent event not found but we corrected it", newEvent); */
        } else {
          console.error(
            "parent event not found and we weren't able to correct it"
          );
          console.warn(
            "newEvent",
            newEvent,
            "key",
            key,
            "parentEventRecord event",
            parentEventRecord[key],
            "parentEventRecord",
            parentEventRecord,
            "lastRecord",
            lastRecord
          );
          throw new Error(`parent event not found`);
        }
      }

      linkedEvents.push(newEvent);
    }
  }

  return linkedEvents;
}

function getKey(
  event: DamageEvent | ApplyDebuffEvent | RefreshDebuffEvent | RemoveDebuffEvent
): string {
  let key = `${event.targetID}_${event.abilityGameID}`;
  if (event.targetInstance) key += `_${event.targetInstance}`;

  key += `_${event.sourceID}`;
  if (event.sourceInstance) key += `_${event.sourceInstance}`;

  return key;
}