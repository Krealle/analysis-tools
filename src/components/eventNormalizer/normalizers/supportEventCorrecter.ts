import {
  COMBUSTION_BUFF,
  EBON_MIGHT,
  EBON_MIGHT_CORRECTION_VALUE,
  PRESCIENCE,
  PRESCIENCE_CORRECTION_VALUE,
  SHIFTING_SANDS,
  SHIFTING_SANDS_CORRECTION_VALUE,
} from "../../../util/constants";
import {
  AttributionHook,
  EventType,
  HitType,
  NormalizedDamageEvent,
} from "../../../wcl/events/types";
import { AbilityFilters } from "../EventNormalizer";
import { Buff } from "../combatant/buffs";
import { Combatant } from "../combatant/combatants";

export function correctSupportEvents(
  events: NormalizedDamageEvent[],
  combatants: Combatant[],
  abilityFilters: AbilityFilters
): NormalizedDamageEvent[] {
  const correctedEvents = events.reduce<NormalizedDamageEvent[]>(
    (corEvents, event) => {
      if (!event.supportEvents.length && !event.activeBuffs.length) {
        corEvents.push(event);
        return corEvents;
      }

      const playerBuffs: Buff[] = getRelevantPlayerBuffs(event, abilityFilters);
      const supEvents: NormalizedDamageEvent[] = [];

      let supportDamage = 0;
      event.supportEvents.forEach((e) => {
        const supEvent = e.event;

        const trueSupportDamage = getSupportDamage(event, supEvent);

        if (supEvent.normalizedAmount === 0 && trueSupportDamage !== 0) {
          supEvent.modified = true;
        }

        supEvent.normalizedAmount = trueSupportDamage;
        supportDamage += trueSupportDamage;

        const buffIndex = playerBuffs.findIndex(
          (b) =>
            b.sourceID === supEvent.sourceID &&
            b.abilityGameID === supEvent.abilityGameID
        );

        if (buffIndex !== -1) {
          playerBuffs.splice(buffIndex, 1);
        }

        supEvents.push(supEvent);
      });

      playerBuffs.forEach((buff) => {
        const fabricatedSupportEvent = fabricateEvent(event, buff, combatants);

        if (fabricatedSupportEvent) {
          supEvents.push(fabricatedSupportEvent);
          event.supportEvents.push({
            event: fabricatedSupportEvent,
            delay: 0,
            hookType: AttributionHook.FABRICATED_HOOK,
          });
          supportDamage += fabricatedSupportEvent.normalizedAmount;
        }
      });

      event.normalizedAmount -= supportDamage;

      corEvents.push(event);
      corEvents.push(...supEvents);

      return corEvents;
    },
    []
  );
  return correctedEvents;
}

function fabricateEvent(
  event: NormalizedDamageEvent,
  buff: Buff,
  combatants: Combatant[]
): NormalizedDamageEvent | undefined {
  /** whenever EM drops/applies on the same tick weird stuff happens, so lets just ignore these edge cases */
  if (buff.end === event.timestamp || buff.start === event.timestamp) {
    return;
  }

  const player = combatants.find((player) => player.id === buff.sourceID);

  const attributedAmount =
    event.normalizedAmount * getAbilityMultiplier(buff.abilityGameID);

  const fabricatedSupportEvent: NormalizedDamageEvent = {
    abilityGameID: buff.abilityGameID,
    amount: attributedAmount,
    fight: event.fight,
    hitType: event.hitType,
    source: {
      name: player?.name ?? "Unknown",
      id: player?.id ?? -1,
      class: player?.class ?? "Unknown",
      spec: player?.spec ?? "Unknown",
    },
    timestamp: event.timestamp,
    normalizedAmount: attributedAmount,
    subtractsFromSupportedActor: true,
    sourceID: buff.sourceID,
    sourceInstance: buff.sourceInstance,
    supportID: event.sourceID,
    supportInstance: event.sourceInstance,
    targetID: event.targetID,
    targetInstance: event.targetInstance,
    type: EventType.DamageEvent,
    originalEvent: event, // This can *potentially* be misleading, but also the opposite, since this leaves a trace from fabrication to source event
    fabricated: true,
    activeBuffs: [],
    supportEvents: [],
  };

  return fabricatedSupportEvent;
}

function getRelevantPlayerBuffs(
  event: NormalizedDamageEvent,
  abilityFilters: AbilityFilters
): Buff[] {
  const hasCombustion = event.activeBuffs.find(
    (buff) => buff.abilityGameID === COMBUSTION_BUFF
  );

  let playerBuffs: Buff[] =
    abilityFilters.noScaling.includes(event.abilityGameID) ||
    abilityFilters.blacklist.includes(event.abilityGameID)
      ? []
      : event.activeBuffs.filter(
          (buff) =>
            buff.abilityGameID === EBON_MIGHT ||
            buff.abilityGameID === SHIFTING_SANDS ||
            buff.abilityGameID === PRESCIENCE
        );
  if (
    (event.hitType !== HitType.Crit ||
      hasCombustion ||
      event.abilityGameID === 427908 ||
      event.abilityGameID === 258922 ||
      event.abilityGameID === 258921) &&
    event.abilityGameID !== 269576
  ) {
    playerBuffs = playerBuffs.filter(
      (buff) => buff.abilityGameID !== PRESCIENCE
    );
  }

  if (abilityFilters.noEMScaling.includes(event.abilityGameID)) {
    playerBuffs = playerBuffs.filter(
      (buff) => buff.abilityGameID !== EBON_MIGHT
    );
  }

  if (abilityFilters.noShiftingScaling.includes(event.abilityGameID)) {
    playerBuffs = playerBuffs.filter(
      (buff) => buff.abilityGameID !== SHIFTING_SANDS
    );
  }

  return playerBuffs;
}

function getSupportDamage(
  event: NormalizedDamageEvent,
  supEvent: NormalizedDamageEvent
) {
  let attributedAmount = supEvent.normalizedAmount;

  if (attributedAmount === 0 && event.normalizedAmount !== 0) {
    attributedAmount =
      event.normalizedAmount * getAbilityMultiplier(supEvent.abilityGameID);
  }
  return attributedAmount;
}

/**
 * Important note about this:
 *
 * These values are essentially a lowball estimation of provided value,
 * without proper tracking of stats this is kinda the best we can do for now.
 */
function getAbilityMultiplier(abilityId: number): number {
  const multiplier =
    abilityId === EBON_MIGHT
      ? EBON_MIGHT_CORRECTION_VALUE
      : abilityId === SHIFTING_SANDS
      ? SHIFTING_SANDS_CORRECTION_VALUE
      : PRESCIENCE_CORRECTION_VALUE;

  return multiplier;
}
