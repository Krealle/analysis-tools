import {
  ABILITY_BROKEN_ATTRIBUTION,
  COMBUSTION_BUFF,
  EBON_MIGHT,
  EBON_MIGHT_CORRECTION_VALUE,
  PRESCIENCE,
  SHIFTING_SANDS,
  SHIFTING_SANDS_CORRECTION_VALUE,
} from "../../../util/constants";
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

  const fabricatedEventsForPlayers: Record<number, number> = {};

  for (const event of events) {
    if (
      event.subtractsFromSupportedActor ||
      ((!event.supportEvents || event.supportEvents.length === 0) &&
        event.activeBuffs.length === 0)
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

      // https://www.wowhead.com/spell=198030/eye-beam
      if (
        (sourceEvent.hitType !== HitType.Crit || hasCombustion) &&
        sourceEvent.abilityGameID !== 269576 // Master Marksman - hate this ability
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
              : 0.03;

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
            const pin = `&pins=2%24Off%24rgb(78%25, 61%25, 43%25)%24expression%24supportedActor.name %3D '${sourceEvent.source.name}' or source.name %3D '${sourceEvent.source.name}'^0%24Separate%24%23909049%24damage%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24${sourceEvent.abilityGameID}^0%24Separate%24%23a04D8A%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24395152^0%24Separate%24%23DF5353%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24413984^0%24Separate%24rgb(78%25, 61%25, 43%25)%24auras-gained%240%240.0.0.Any%240.0.0.Any%24true%240.0.0.Any%24false%24410089`;

            const wclUrl = `https://www.warcraftlogs.com/reports/${
              fightDataSet.fight.reportCode
            }#fight=${fightDataSet.fight.id}&type=damage-done&start=${
              event.timestamp - 50
            }&end=${event.timestamp + 50}&source=${
              fabricatedSupportEvent.source.id
            }&view=events${pin}`;

            if (
              sourceEvent.abilityGameID !== 269576 // Dumb ass master marksman
            ) {
              /* console.group(sourceEvent);
              console.log(
                buffSpell === EBON_MIGHT
                  ? "Ebon Might"
                  : buffSpell === SHIFTING_SANDS
                  ? "Shifting Sands"
                  : "Prescience"
              );
              
              console.log(wclUrl);
              console.groupEnd(); */

              const spellId = sourceEvent.abilityGameID;
              const data = {
                spellId: `=HYPERLINK("https://www.wowhead.com/spell=${spellId}", "${spellId}")`,
                supportType:
                  buffSpell === EBON_MIGHT
                    ? "Ebon Might"
                    : buffSpell === SHIFTING_SANDS
                    ? "Shifting Sands"
                    : "Prescience",
                url: `=HYPERLINK("${wclUrl}", "Log")`,
              };

              logData.push(data);
            }
          }
        } else {
          const supportEvent = supportEvents.splice(index, 1)[0];
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

  console.log(
    Object.entries(fabricatedEventsForPlayers).sort(
      ([, valueA], [, valueB]) => valueB - valueA
    )
  );

  return { normalizedEvents, logData };
}
