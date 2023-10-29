import {
  ABILITY_NO_EM_SCALING,
  ABILITY_NO_SCALING,
  EBON_MIGHT_BUFF,
  EBON_MIGHT_DAMAGE,
  PRESCIENCE_BUFF,
  PRESCIENCE_DAMAGE,
  SHIFTING_SANDS_BUFF,
  SHIFTING_SANDS_DAMAGE,
} from "../../../util/constants";
import {
  AttributionHook,
  DamageEvent,
  HitType,
  NormalizedDamageEvent,
  SupportEvent,
} from "../../../wcl/events/types";
import { getBuffCount, getBuffs } from "./buffs";
import { Combatant, Pet } from "./combatants";
import { Buff } from "./generateFights";

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
 * TODO: We need to link dot events together, since dot attribution is based on application rather than tick.
 * eg. Warlock casts a dot with 2 EM up. Now it starts ticking, for tick 1,2,3,4 he might still have 2x EM up and all is gucci.
 * Now 1 EM drops and for tick 5,6,7,8 we only have 1xEM up. This makes normalizing dots a mess until they are linked.
 *
 * @param events
 * @param combatants
 * @returns
 */
export function damageEventsNormalizer(
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
  const bossEvents: DamageEvent[] = [];

  for (const event of events) {
    const petOwner = pets.find((pet) => pet.id === event.sourceID);

    const player = combatants.find(
      (player) => player.id === (petOwner ? petOwner.petOwner : event.sourceID)
    );

    const activeBuffs = getBuffs(event.timestamp, player);

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
    };

    if (normalizedEvent.source.id === -1) {
      bossEvents.push(event);
      continue;
    }

    if (event.subtractsFromSupportedActor) {
      const supportKey = getKey(event);

      if (!supportEventsRecord[supportKey]) {
        console.group("support event");
        console.warn("supportEventsMap[key] not defined");
        console.log("key", supportKey);
        console.log("supportEventsMap", supportEventsRecord);
        console.log("event", normalizedEvent);
        console.log("lastEvent", lastEvent);
        console.groupEnd();
        throw new Error("support event not defined"); // shouldn't happen any more but if it does need to be fixed asap basically
      }

      if (supportEventsRecord[supportKey].length === 0) {
        if (
          lastEvent?.sourceID === event.supportID &&
          lastEvent?.targetID === event.targetID &&
          lastEvent.sourceInstance === event.sourceInstance &&
          normalizedEvents.length > 0
        ) {
          const lastNormalizedEvent = normalizedEvents.pop();
          if (lastNormalizedEvent) {
            supportEventsRecord[supportKey] = [lastNormalizedEvent];
            supportEventsRecord[supportKey].push(normalizedEvent);

            const newNormalizedEvents = createSupportEvents(
              supportEventsRecord[key]
            );

            supportEventsRecord[key] = [];
            normalizedEvents.push(...newNormalizedEvents);
            console.warn(
              "Support event without parent found but we were able to correct the issue.",
              "event",
              normalizedEvent,
              "lastEvent",
              lastEvent
            );
            lastEvent = normalizedEvent;
            continue;
          }
        }
      }
      supportEventsRecord[supportKey].push(normalizedEvent);
      lastEvent = normalizedEvent;
      continue;
    }

    // new damage event need to sort out old one
    if (supportEventsRecord[key] && supportEventsRecord[key].length > 0) {
      const newNormalizedEvent = createSupportEvents(supportEventsRecord[key]);
      supportEventsRecord[key] = [];
      normalizedEvents.push(...newNormalizedEvent);
    }

    if (
      normalizedEvent.activeBuffs.length > 0 ||
      event.abilityGameID === 360828 // Blistering scales SMILERS
    ) {
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
    const newNormalizedEvent = createSupportEvents(supportEventsRecord[events]);
    supportEventsRecord[events] = [];
    normalizedEvents.push(...newNormalizedEvent);
  });

  if (normalizedEvents.length + bossEvents.length - events.length !== 0) {
    console.warn(
      "expected events:",
      events.length,
      "events gotten:",
      normalizedEvents.length,
      "difference:",
      normalizedEvents.length + bossEvents.length - events.length
    );
  }

  const sortedNormalizedEvents = normalizedEvents.sort(
    (a, b) => a.timestamp - b.timestamp
  );
  return sortedNormalizedEvents;
}

function getKey(event: DamageEvent): string {
  if (event.subtractsFromSupportedActor) {
    return event.supportInstance
      ? `${event.targetID}_${event.supportID}_${event.supportInstance}`
      : `${event.targetID}_${event.supportID}`;
  } else {
    return event.sourceInstance
      ? `${event.targetID}_${event.sourceID}_${event.sourceInstance}`
      : `${event.targetID}_${event.sourceID}`;
  }
}

/**
 * Here we take in an array of events, first entry should ALWAYS be the supported event
 * and the subsequent entries should ONLY be the support events.
 *
 * Here we want to figure out if the amount of support events line up with what we expect.
 * Fabricating any events that should have happened eg. broken re-attribution.
 *
 * We also normalize the supported event to sort out attributions.
 *
 * @param eventMap
 * @returns A new array with the normalized events along with any potentially fabricated ones.
 */
function createSupportEvents(
  eventMap: NormalizedDamageEvent[]
): NormalizedDamageEvent[] {
  const sourceEvent = eventMap[0];
  /** Welcome to blizzard combat logs, things don't always happen when they are supposed to */
  const bufferMS = 30;

  let playerBuffs: Buff[] = sourceEvent.activeBuffs;

  const newEventMap: NormalizedDamageEvent[] = [];

  /** litterly impossible with guard clause in above code, but I wrote it so you never know SMILERS */
  if (sourceEvent.subtractsFromSupportedActor) {
    console.error(
      "unexpected support event when trying to create support event",
      sourceEvent,
      "eventMap",
      eventMap
    );
    return eventMap;
  }

  if (sourceEvent.hitType !== HitType.Crit) {
    playerBuffs = playerBuffs.filter(
      (buff) => buff.abilityGameID !== PRESCIENCE_BUFF
    );
  }

  if (ABILITY_NO_EM_SCALING.includes(sourceEvent.abilityGameID)) {
    playerBuffs = playerBuffs.filter(
      (buff) => buff.abilityGameID !== EBON_MIGHT_BUFF
    );
  }

  if (ABILITY_NO_SCALING.includes(sourceEvent.abilityGameID)) {
    playerBuffs = playerBuffs.filter(
      (buff) => buff.abilityGameID !== SHIFTING_SANDS_BUFF
    );
  }

  /** Find the players buffs
   * we need this information to figure out
   * if we have gotten the correct amount of support events */
  const ebonMightCount = getBuffCount(playerBuffs, EBON_MIGHT_BUFF);
  const shiftingSandsCount = getBuffCount(playerBuffs, SHIFTING_SANDS_BUFF);
  const prescienceCount = getBuffCount(playerBuffs, PRESCIENCE_BUFF);

  /** check to see if this is correct or if we need to fabricate one
   * ability might not scale with the buffs on the player
   * eg. they have Ebon Might active only, and it's trinket damage */
  const ebonMightSupportEvents = eventMap.filter(
    (event) => event.abilityGameID === EBON_MIGHT_DAMAGE
  ).length;
  const shiftingSandsEvents = eventMap.filter(
    (event) => event.abilityGameID === SHIFTING_SANDS_DAMAGE
  ).length;
  const prescienceEvents = eventMap.filter(
    (event) => event.abilityGameID === PRESCIENCE_DAMAGE
  ).length;
  if (
    ebonMightCount !== ebonMightSupportEvents ||
    shiftingSandsCount !== shiftingSandsEvents ||
    prescienceCount !== prescienceEvents
  ) {
    console.group(
      "Found following problems for sourceEvent:",
      eventMap,
      "was dot tick:",
      sourceEvent.tick ? true : false,
      "was pet:",
      sourceEvent.source.petOwner ? true : false
    );
    if (ebonMightCount !== ebonMightSupportEvents)
      console.log(
        "unexpected EM events. expected:",
        ebonMightCount,
        "got",
        ebonMightSupportEvents
      );
    if (shiftingSandsCount !== shiftingSandsEvents)
      console.log(
        "unexpected SS events. expected:",
        shiftingSandsCount,
        "got",
        shiftingSandsEvents
      );
    if (prescienceCount !== prescienceEvents)
      console.log(
        "unexpected PR events. expected:",
        prescienceCount,
        "got",
        prescienceEvents
      );
    console.groupEnd();
  }

  if (eventMap.length === 1) {
    return eventMap;
  }

  let supportDamage = 0;
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

    supportDamage += supportEvent.amount + (supportEvent.absorbed ?? 0);

    sourceEvent.supportEvents
      ? sourceEvent.supportEvents.push(newSupportEvent)
      : (sourceEvent.supportEvents = [newSupportEvent]);
    newEventMap.push(supportEvent);
  }

  sourceEvent.normalizedAmount =
    sourceEvent.amount + (sourceEvent.absorbed ?? 0) - supportDamage;

  if (sourceEvent.normalizedAmount < 0) {
    console.error("normalized damage was less than 0", sourceEvent);
    console.error(
      "normalizedEvent.normalizedAmount",
      sourceEvent.normalizedAmount,
      "supportDamage",
      supportDamage
    );
  }

  newEventMap.push(sourceEvent);

  return newEventMap;
}
