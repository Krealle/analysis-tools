import { AnyBuffEvent, EventType } from "../../../wcl/events/types";
import { Combatant } from "./combatants";

export type Buff = {
  abilityGameID: number;
  buffStacks: number;
  start: number;
  end: number;
  sourceID: number;
  sourceInstance?: number;
  targetID: number;
  targetInstance?: number;
  events: AnyBuffEvent[];
};

export function generateBuffHistories(
  events: AnyBuffEvent[],
  fightStart: number,
  fightEnd: number
): Buff[] {
  if (!events || events.length === 0 || fightEnd <= fightStart) {
    console.error("Invalid input data or fight duration");
  }

  const buffHistory: Buff[] = [];

  for (let index = 0; events.length > index; index++) {
    const event = events[index];

    if (
      event.type === EventType.ApplyBuffEvent ||
      event.type === EventType.ApplyBuffStackEvent ||
      event.type === EventType.RemoveBuffStackEvent
    ) {
      let endTime = fightEnd;
      const buffEvents: AnyBuffEvent[] = [event];

      for (let j = index + 1; events.length > j; j++) {
        const nextEvent = events[j];

        if (
          nextEvent.type === EventType.ApplyBuffEvent ||
          !isSameBuff(event, nextEvent)
        ) {
          continue;
        }

        endTime = nextEvent.timestamp;
        buffEvents.push(nextEvent);
        break;
      }

      const buffStacks =
        event.type === EventType.ApplyBuffEvent ? 1 : event.stack;

      const latestBuffIndex = buffHistory.findIndex(
        (currentBuff) =>
          currentBuff.abilityGameID === event.abilityGameID &&
          currentBuff.start === event.timestamp &&
          currentBuff.targetID === event.targetID &&
          currentBuff.sourceID === event.sourceID
      );

      const latestBuff = buffHistory[latestBuffIndex];

      if (
        latestBuff &&
        latestBuff.abilityGameID === event.abilityGameID &&
        latestBuff.start === event.timestamp &&
        latestBuff.targetID === event.targetID &&
        latestBuff.sourceID === event.sourceID
      ) {
        latestBuff.buffStacks = buffStacks;
        latestBuff.end = endTime;
        if (latestBuff.events[latestBuff.events.length - 1] !== event) {
          latestBuff.events = [...latestBuff.events, event];
        }
      } else {
        buffHistory.push({
          abilityGameID: event.abilityGameID,
          start: event.timestamp,
          buffStacks: buffStacks,
          end: endTime,
          sourceID: event.sourceID,
          sourceInstance: event.sourceInstance,
          targetID: event.targetID,
          targetInstance: event.targetInstance,
          events: buffEvents,
        });
      }
    } else if (event.type === EventType.RemoveBuffEvent) {
      const hasBuff = buffHistory.find((buff) => isSameBuff(buff, event));

      if (!hasBuff) {
        buffHistory.push({
          abilityGameID: event.abilityGameID,
          buffStacks: 0,
          start: fightStart,
          end: event.timestamp,
          sourceID: event.sourceID,
          sourceInstance: event.sourceInstance,
          targetID: event.targetID,
          targetInstance: event.targetInstance,
          events: [event],
        });
      }
    }
  }

  return buffHistory;
}

function isSameBuff(a: Buff | AnyBuffEvent, b: AnyBuffEvent | Buff) {
  return (
    a.sourceID === b.sourceID &&
    a.targetID === b.targetID &&
    a.targetInstance === b.targetInstance &&
    a.abilityGameID === b.abilityGameID
  );
}

export function getBuffHistory(playerId: number, buffHistory: Buff[]) {
  const buffs = buffHistory.filter((buff) => buff.targetID === playerId);
  return buffs;
}

export function getBuffs(
  timestamp: number,
  player?: Combatant, // cba with typescript some times
  abilityId?: number
): Buff[] {
  if (!player) {
    return [];
  }

  const buffHistory = player.buffHistory.filter(
    (buff) => buff.start <= timestamp && buff.end >= timestamp
  );
  if (abilityId) {
    buffHistory.filter((buff) => buff.abilityGameID === abilityId);
  }
  return buffHistory;
}

export function getBuffCount(buffs: Buff[], abilityId: number): number {
  const filteredBuffs = buffs.filter(
    (buff) => buff.abilityGameID === abilityId
  );
  return filteredBuffs.length;
}
