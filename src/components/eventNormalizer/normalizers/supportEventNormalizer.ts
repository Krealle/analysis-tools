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
  AnyEvent,
  HitType,
  NormalizedDamageEvent,
} from "../../../wcl/events/types";
import { getBuffCount } from "./buffs";
import { Buff } from "./generateFights";

export function supportEventNormalizer(
  events: NormalizedDamageEvent[]
): NormalizedDamageEvent[] {
  const normalizedEvents: NormalizedDamageEvent[] = [];
  const unexpectedEvents: AnyEvent[] = [];

  for (const event of events) {
    if (event.subtractsFromSupportedActor) {
      normalizedEvents.push(event);
      continue;
    }
    if (!event.supportEvents || event.supportEvents.length === 0) {
      normalizedEvents.push(event);
      continue;
    }
    if (event.supportEvents) {
      const sourceEvent = event;
      const supportEvents = event.supportEvents.map((entry) => entry.event);

      let playerBuffs: Buff[] = sourceEvent.activeBuffs;

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
      const ebonMightSupportEvents = supportEvents.filter(
        (event) => event.abilityGameID === EBON_MIGHT_DAMAGE
      ).length;
      const shiftingSandsEvents = supportEvents.filter(
        (event) => event.abilityGameID === SHIFTING_SANDS_DAMAGE
      ).length;
      const prescienceEvents = supportEvents.filter(
        (event) => event.abilityGameID === PRESCIENCE_DAMAGE
      ).length;

      if (
        ebonMightCount !== ebonMightSupportEvents ||
        shiftingSandsCount !== shiftingSandsEvents ||
        prescienceCount !== prescienceEvents
      ) {
        console.group(
          "Found following problems for sourceEvent:",
          event,
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
        if (prescienceCount !== prescienceEvents) {
          console.log(
            "unexpected PR events. expected:",
            prescienceCount,
            "got",
            prescienceEvents
          );
        }
        console.groupEnd();
      }

      let supportDamage = 0;
      for (const supportEvent of supportEvents) {
        supportDamage += supportEvent.amount + (supportEvent.absorbed ?? 0);
      }

      sourceEvent.normalizedAmount -= supportDamage;

      normalizedEvents.push(sourceEvent);
      continue;
    }

    /** Fallback */
    unexpectedEvents.push(event);
  }
  return normalizedEvents;
}
