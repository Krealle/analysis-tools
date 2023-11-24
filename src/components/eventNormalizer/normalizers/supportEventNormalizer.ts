import {
  ABILITY_BROKEN_ATTRIBUTION,
  COMBUSTION_BUFF,
  EBON_MIGHT,
  EBON_MIGHT_CORRECTION_VALUE,
  PRESCIENCE,
  PRESCIENCE_CORRECTION_VALUE,
  SHIFTING_SANDS,
  SHIFTING_SANDS_CORRECTION_VALUE,
} from "../../../util/constants";
import { generateCSVEntry } from "../../../util/csvHandler";
import {
  AnyEvent,
  AttributionHook,
  EventType,
  HitType,
  NormalizedDamageEvent,
} from "../../../wcl/events/types";
import { Combatant } from "../combatant/combatants";
import { Buff, FightDataSet } from "../generateFights";

export function supportEventNormalizer(
  events: NormalizedDamageEvent[],
  combatants: Combatant[],
  abilityNoScaling: number[],
  abilityNoEMScaling: number[],
  abilityNoShiftingScaling: number[],
  fightDataSet: FightDataSet
) {
  const normalizedEvents: NormalizedDamageEvent[] = [];
  const unexpectedEvents: AnyEvent[] = [];

  const logData: {
    spellId: string;
    supportType: string;
    url: string;
  }[] = [];

  const emptyEvents: {
    spellId: string;
    supportType: string;
    url: string;
  }[] = [];

  const overSteal: {
    spellId: string;
    supportType: string;
    url: string;
  }[] = [];

  const susAmount: {
    spellId: string;
    supportType: string;
    url: string;
  }[] = [];

  const underAttributedAmount: {
    spellId: string;
    supportType: string;
    url: string;
  }[] = [];

  const fabricatedEventsForPlayers: Record<number, number> = {};

  for (const event of events) {
    if (
      event.subtractsFromSupportedActor ||
      ((!event.supportEvents || event.supportEvents.length === 0) &&
        event.activeBuffs.length === 0) // TODO: Change
    ) {
      normalizedEvents.push(event);
      continue;
    }

    if (event.supportEvents || event.activeBuffs.length > 0) {
      const sourceEvent = event;
      const supportEvents = event.supportEvents
        ? event.supportEvents.map((entry) => entry.event)
        : [];

      const fabricatedEvents: NormalizedDamageEvent[] = [];

      const hasCombustion = sourceEvent.activeBuffs.find(
        (buff) => buff.abilityGameID === COMBUSTION_BUFF
      );

      let playerBuffs: Buff[] = abilityNoScaling.includes(
        sourceEvent.abilityGameID
      )
        ? []
        : sourceEvent.activeBuffs.filter(
            (buff) =>
              buff.abilityGameID === EBON_MIGHT ||
              buff.abilityGameID === SHIFTING_SANDS ||
              buff.abilityGameID === PRESCIENCE
          );

      if (
        (sourceEvent.hitType !== HitType.Crit ||
          hasCombustion ||
          sourceEvent.abilityGameID === 427908 ||
          sourceEvent.abilityGameID === 258922 ||
          sourceEvent.abilityGameID === 258921) &&
        sourceEvent.abilityGameID !== 269576
      ) {
        playerBuffs = playerBuffs.filter(
          (buff) => buff.abilityGameID !== PRESCIENCE
        );
      }

      if (abilityNoEMScaling.includes(sourceEvent.abilityGameID)) {
        playerBuffs = playerBuffs.filter(
          (buff) => buff.abilityGameID !== EBON_MIGHT
        );
      }

      if (abilityNoShiftingScaling.includes(sourceEvent.abilityGameID)) {
        playerBuffs = playerBuffs.filter(
          (buff) => buff.abilityGameID !== SHIFTING_SANDS
        );
      }

      /** like this we can basically just run through all our buffs
       * and see if we have the correct amount of support events, if we find some
       * missing we can fabricate and attribute directly to the correct player.
       *
       * We will also cross reference with our currently linked supportEvents
       * to see if we somehow have more than expected.
       */
      let supportDamage = 0;

      for (const buff of playerBuffs) {
        /** whenever EM drops/applies on the same tick weird stuff happens, so lets just ignore these edge cases */
        if (
          buff.end === sourceEvent.timestamp ||
          buff.start === sourceEvent.timestamp
        ) {
          continue;
        }

        const buffSpell =
          buff.abilityGameID === EBON_MIGHT
            ? EBON_MIGHT
            : buff.abilityGameID === SHIFTING_SANDS
            ? SHIFTING_SANDS
            : PRESCIENCE;

        const index = supportEvents.findIndex(
          (supEvent) =>
            supEvent.sourceID === buff.sourceID &&
            supEvent.abilityGameID === buffSpell
        );

        /** Fabricate missing events */
        if (index === -1) {
          const player = combatants.find(
            (player) => player.id === buff.sourceID
          );

          /**
           * Important note about this:
           *
           * These values are essentially a lowball estimation of provided value,
           * without proper tracking of stats this is kinda the best we can do for now.
           */
          const multiplier =
            buffSpell === EBON_MIGHT
              ? EBON_MIGHT_CORRECTION_VALUE
              : buffSpell === SHIFTING_SANDS
              ? SHIFTING_SANDS_CORRECTION_VALUE
              : PRESCIENCE_CORRECTION_VALUE;

          const attributedAmount = event.normalizedAmount * multiplier;

          const fabricatedSupportEvent: NormalizedDamageEvent = {
            abilityGameID: buffSpell,
            amount: attributedAmount,
            fight: sourceEvent.fight,
            hitType: sourceEvent.hitType,
            source: {
              name: player?.name ?? "Unknown",
              id: player?.id ?? -1,
              class: player?.class ?? "Unknown",
              spec: player?.spec ?? "Unknown",
            },
            timestamp: sourceEvent.timestamp,
            normalizedAmount: attributedAmount,
            subtractsFromSupportedActor: true,
            sourceID: buff.sourceID,
            sourceInstance: buff.sourceInstance,
            supportID: sourceEvent.sourceID,
            supportInstance: sourceEvent.sourceInstance,
            targetID: sourceEvent.targetID,
            targetInstance: sourceEvent.targetInstance,
            type: EventType.DamageEvent,
            originalEvent: sourceEvent, // This can *potentially* be misleading, but also the opposite, since this leaves a trace from fabrication to source event
            fabricated: true,
            activeBuffs: [],
            supportEvents: [],
          };

          supportDamage += attributedAmount;

          fabricatedEvents.push(fabricatedSupportEvent);

          sourceEvent.supportEvents
            ? sourceEvent.supportEvents.push({
                event: fabricatedSupportEvent,
                delay: 0,
                hookType: AttributionHook.FABRICATED_HOOK,
              })
            : (sourceEvent.supportEvents = [
                {
                  event: fabricatedSupportEvent,
                  delay: 0,
                  hookType: AttributionHook.FABRICATED_HOOK,
                },
              ]);

          fabricatedEventsForPlayers[sourceEvent.abilityGameID] =
            fabricatedEventsForPlayers[sourceEvent.abilityGameID]
              ? fabricatedEventsForPlayers[sourceEvent.abilityGameID] + 1
              : 1;
          if (!ABILITY_BROKEN_ATTRIBUTION.includes(sourceEvent.abilityGameID)) {
            if (sourceEvent.abilityGameID !== 269576) {
              const csvEntry = generateCSVEntry(
                fightDataSet,
                sourceEvent,
                fabricatedSupportEvent,
                buffSpell === EBON_MIGHT
                  ? "Ebon Might"
                  : buffSpell === SHIFTING_SANDS
                  ? "Shifting Sands"
                  : "Prescience"
              );

              logData.push(csvEntry);
            }
          }
        } else {
          const supportEvent = supportEvents.splice(index, 1)[0];
          const buffSpell =
            supportEvent.abilityGameID === EBON_MIGHT
              ? "EBON_MIGHT"
              : buff.abilityGameID === SHIFTING_SANDS
              ? "SHIFTING_SANDS"
              : "PRESCIENCE";

          if (
            (supportEvent.amount + (supportEvent.absorbed ?? 0) === 0 &&
              sourceEvent.normalizedAmount !== 0) ||
            (!supportEvent.amount && !supportEvent.absorbed)
          ) {
            const csvEntry = generateCSVEntry(
              fightDataSet,
              sourceEvent,
              supportEvent,
              `Empty Event ${buffSpell}`
            );
            emptyEvents.push(csvEntry);

            const multiplier =
              supportEvent.abilityGameID === EBON_MIGHT
                ? EBON_MIGHT_CORRECTION_VALUE
                : supportEvent.abilityGameID === SHIFTING_SANDS
                ? SHIFTING_SANDS_CORRECTION_VALUE
                : PRESCIENCE_CORRECTION_VALUE;

            const attributedAmount = event.normalizedAmount * multiplier;

            const player = combatants.find(
              (player) => player.id === supportEvent.sourceID
            );

            const fabricatedSupportEvent: NormalizedDamageEvent = {
              abilityGameID: supportEvent.abilityGameID,
              amount: attributedAmount,
              fight: sourceEvent.fight,
              hitType: sourceEvent.hitType,
              source: {
                name: player?.name ?? "Unknown",
                id: player?.id ?? -1,
                class: player?.class ?? "Unknown",
                spec: player?.spec ?? "Unknown",
              },
              timestamp: sourceEvent.timestamp,
              normalizedAmount: attributedAmount,
              subtractsFromSupportedActor: true,
              sourceID: buff.sourceID,
              sourceInstance: buff.sourceInstance,
              supportID: sourceEvent.sourceID,
              supportInstance: sourceEvent.sourceInstance,
              targetID: sourceEvent.targetID,
              targetInstance: sourceEvent.targetInstance,
              type: EventType.DamageEvent,
              originalEvent: sourceEvent, // This can *potentially* be misleading, but also the opposite, since this leaves a trace from fabrication to source event
              fabricated: true,
              activeBuffs: [],
              supportEvents: [],
            };

            supportDamage += attributedAmount;

            fabricatedEvents.push(fabricatedSupportEvent);

            sourceEvent.supportEvents
              ? sourceEvent.supportEvents.push({
                  event: fabricatedSupportEvent,
                  delay: 0,
                  hookType: AttributionHook.EMPTY_HOOK,
                })
              : (sourceEvent.supportEvents = [
                  {
                    event: fabricatedSupportEvent,
                    delay: 0,
                    hookType: AttributionHook.EMPTY_HOOK,
                  },
                ]);
          }

          if (
            supportEvent.amount + (supportEvent.absorbed ?? 0) >=
            sourceEvent.normalizedAmount
          ) {
            const csvEntry = generateCSVEntry(
              fightDataSet,
              sourceEvent,
              supportEvent,
              `Full steal ${buffSpell}`
            );
            overSteal.push(csvEntry);
          }

          if (
            (supportEvent.abilityGameID === EBON_MIGHT &&
              supportEvent.amount + (supportEvent.absorbed ?? 0) >=
                sourceEvent.normalizedAmount * 0.25) ||
            (supportEvent.abilityGameID === SHIFTING_SANDS &&
              supportEvent.amount + (supportEvent.absorbed ?? 0) >=
                sourceEvent.normalizedAmount * 0.35) ||
            (supportEvent.abilityGameID === PRESCIENCE &&
              supportEvent.amount + (supportEvent.absorbed ?? 0) >=
                sourceEvent.normalizedAmount * 0.1)
          ) {
            const csvEntry = generateCSVEntry(
              fightDataSet,
              sourceEvent,
              supportEvent,
              `Sus Attribution ${buffSpell}`
            );
            susAmount.push(csvEntry);
          }

          if (
            (supportEvent.abilityGameID === EBON_MIGHT &&
              supportEvent.amount + (supportEvent.absorbed ?? 0) <=
                sourceEvent.normalizedAmount * 0.05) ||
            (supportEvent.abilityGameID === SHIFTING_SANDS &&
              supportEvent.amount + (supportEvent.absorbed ?? 0) <=
                sourceEvent.normalizedAmount * 0.1) ||
            (supportEvent.abilityGameID === PRESCIENCE &&
              supportEvent.amount + (supportEvent.absorbed ?? 0) <=
                sourceEvent.normalizedAmount * 0.01)
          ) {
            const csvEntry = generateCSVEntry(
              fightDataSet,
              sourceEvent,
              supportEvent,
              `Under Attribution ${buffSpell}`
            );
            underAttributedAmount.push(csvEntry);
          }

          supportDamage += supportEvent.amount + (supportEvent.absorbed ?? 0);
        }
      }

      /**
       * So with the logic above we should have dealt with all support events? lol nope
       *
       * Above code checks for current and missing hooks. But, somehow, sometimes you get excess
       * events - possible reasons are: Travel time, buffs dropping off same timestamp as damage happens, blizzfuckery, etc
       *
       * So we basically just make sure that we loop through them and include them.
       */
      if (supportEvents.length > 0) {
        for (const excessEvents of supportEvents) {
          supportDamage += excessEvents.amount + (excessEvents.absorbed ?? 0);
        }
      }

      sourceEvent.normalizedAmount -= supportDamage;

      normalizedEvents.push(sourceEvent);
      normalizedEvents.push(...fabricatedEvents);
      continue;
    }

    /** Fallback */
    unexpectedEvents.push(event);
  }

  if (unexpectedEvents.length > 0) {
    console.log("Unexpected events", unexpectedEvents);
    throw new Error("Unexpected events!");
  }

  /* console.log(
    Object.entries(fabricatedEventsForPlayers).sort(
      ([, valueA], [, valueB]) => valueB - valueA
    )
  ); */

  return {
    normalizedEvents,
    logData,
    emptyEvents,
    overSteal,
    susAmount,
    underAttributedAmount,
  };
}
