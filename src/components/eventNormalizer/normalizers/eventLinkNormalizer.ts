import {
  AnyDebuffEvent,
  ApplyDebuffEvent,
  CastEvent,
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
export function eventLinkNormalizer(
  events: (AnyDebuffEvent | DamageEvent | CastEvent)[]
): DamageEvent[] {
  const linkedEvents: DamageEvent[] = [];

  const parentDotEventRecord: Record<
    string,
    ApplyDebuffEvent | RefreshDebuffEvent | undefined
  > = {};
  const parentCastEventRecord: Record<string, CastEvent | undefined> = {};

  let lastDebuffRemoveTimestamp = 0;

  const parentDotEventRemovedRecord: Record<
    string,
    ApplyDebuffEvent | RefreshDebuffEvent | undefined
  > = {};

  for (const event of events) {
    const key = getKey(event);

    if (event.type === EventType.RemoveDebuffEvent) {
      parentDotEventRemovedRecord[key] = parentDotEventRecord[key];
      parentDotEventRecord[key] = undefined;
      lastDebuffRemoveTimestamp = event.timestamp;
    }
    if (event.type === EventType.CastEvent) {
      const castKey = getCastKey(event);
      parentCastEventRecord[castKey] = event;
    }

    if (
      event.type === EventType.ApplyDebuffEvent ||
      event.type === EventType.RefreshDebuffEvent
    ) {
      parentDotEventRecord[key] = event;
    }
    if (event.type === EventType.DamageEvent) {
      /* if (!event.tick) {
        linkedEvents.push(event);
        continue;
      } */
      /* if (
        parentCastEventRecord[key] === undefined &&
        event.abilityGameID !== 1 &&
        event.abilityGameID !== 75 &&
        event.abilityGameID !== 1822
      ) {
        console.log(event);
        console.log(parentCastEventRecord[key]);
        throw new Error(`parentCastEventRecord[key] is undefined`);
      } */
      const castKey = getCastKey(event);
      const newEvent = {
        ...event,
        parentDotEvent: parentDotEventRecord[key],
        castEvent: parentCastEventRecord[castKey],
      };
      const lastRecord = parentDotEventRemovedRecord[key];

      if (!newEvent.parentDotEvent) {
        if (lastDebuffRemoveTimestamp === event.timestamp) {
          newEvent.parentDotEvent = lastRecord;
          /* console.log("parent event not found but we corrected it", newEvent); */
        } else {
          // This should only happen for prepull dots, lets just ignore those for now.
          /* console.error(
            "parent event not found and we weren't able to correct it"
          );
          console.warn("newEvent", newEvent);
          console.log("key", key);
          console.log("parentEventRecord event", parentEventRecord[key]);
          console.log("parentEventRecord", parentEventRecord);
          console.log("lastRecord", lastRecord); */
          //throw new Error(`parent event not found`);
        }
      }

      linkedEvents.push(newEvent);
    }
  }

  return linkedEvents;
}

function getKey(
  event:
    | DamageEvent
    | ApplyDebuffEvent
    | RefreshDebuffEvent
    | RemoveDebuffEvent
    | CastEvent
): string {
  let key = `${event.targetID}_${event.abilityGameID}`;
  if (event.targetInstance) key += `_${event.targetInstance}`;

  key += `_${event.sourceID}`;
  if (event.sourceInstance) key += `_${event.sourceInstance}`;

  return key;
}

function getCastKey(event: CastEvent | DamageEvent): string {
  /**
   * We need to do some manual linking due to some spells damage Ids
   * not being the same as their cast Ids :))
   */
  const spellId =
    event.abilityGameID === 257045 // Rapid Fire Damage
      ? 257044 // Rapid Fire Cast
      : event.abilityGameID === 191043 // Wind Arrow
      ? 19434 // Aimed shot
      : event.abilityGameID;
  let key = `${spellId}`;

  key += `_${event.sourceID}`;
  if (event.sourceInstance) key += `_${event.sourceInstance}`;

  return key;
}
