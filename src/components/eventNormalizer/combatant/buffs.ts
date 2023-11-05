import { AnyBuffEvent, EventType } from "../../../wcl/events/types";
import { Combatant } from "./combatants";
import { Buff } from "../generateFights";

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
    if (event.type === EventType.ApplyBuffEvent) {
      let endTime = fightEnd;
      const buffEvents: AnyBuffEvent[] = [event];

      for (let j = index + 1; events.length > j; j++) {
        const nextEvent = events[j];

        if (
          nextEvent.type !== EventType.RemoveBuffEvent ||
          !isSameBuff(event, nextEvent)
        ) {
          continue;
        }

        endTime = nextEvent.timestamp;
        buffEvents.push(nextEvent);
        break;
      }

      buffHistory.push({
        abilityGameID: event.abilityGameID,
        start: event.timestamp,
        end: endTime,
        sourceID: event.sourceID,
        sourceInstance: event.sourceInstance,
        targetID: event.targetID,
        targetInstance: event.targetInstance,
        events: buffEvents,
      });
    } else if (event.type === EventType.RemoveBuffEvent) {
      const hasBuff = buffHistory.find((buff) => isSameBuff(buff, event));

      if (!hasBuff) {
        buffHistory.push({
          abilityGameID: event.abilityGameID,
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
