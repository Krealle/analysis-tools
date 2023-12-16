import { AbilityFilters } from "../../components/eventNormalizer/EventNormalizer";
import {
  COMBUSTION_BUFF,
  EBON_MIGHT,
  PRESCIENCE,
  SHIFTING_SANDS,
} from "../../util/constants";
import { EventType } from "../events/types";

export function getFilter(abilityFilters: AbilityFilters): string {
  const filter = `(${getBuffFilter()}) 
      OR (${getDebuffFilter()}) 
      OR (${getDamageFilter(abilityFilters)}) 
      OR (${getCastFilter()}) 
      OR (${getDeathFilter()})`;
  return filter;
}

/**
 * Filter does the following(in order of occurrence):
 *
 * Filters out blacklisted abilities
 *
 * Removes selfharm
 *
 * Removes certain target.id that are unwanted
 *
 * Removes selfharm from pets
 *
 * Removes selfharm support events
 *
 * Removes selfharm to pets
 *
 * Only collect friendly damage
 *
 * Ignore friendly fire
 *
 * @returns WCL filter expression
 */
export function getDamageFilter(abilityFilters: AbilityFilters): string {
  const abilityBlacklist = abilityFilters.blacklist.join(",");
  console.log(abilityBlacklist);
  const filter = `type = "damage" 
      AND not (ability.id in (${abilityBlacklist}))
      AND (target.id != source.id)
      AND target.id not in(169428, 169430, 169429, 169426, 169421, 169425, 168932)
      AND not (target.id = source.owner.id)
      AND not (supportedActor.id = target.id)
      AND not (source.id = target.owner.id)
      AND source.disposition = "friendly"
      AND target.disposition != "friendly"
      AND (source.id > 0)`;
  return filter;
}

export function getBuffFilter(): string {
  const filter = `(ability.id in (${EBON_MIGHT},${SHIFTING_SANDS},${PRESCIENCE},${COMBUSTION_BUFF},268998)) 
      AND (type in ("${EventType.ApplyBuffEvent}", "${EventType.RemoveBuffEvent}","${EventType.ApplyBuffStackEvent}", "${EventType.RemoveBuffStackEvent}"))`;
  return filter;
}

export function getDebuffFilter(): string {
  const filter = `type in ("${EventType.ApplyDebuffEvent}","${EventType.RefreshDebuffEvent}","${EventType.RemoveDebuffEvent}") 
    AND source.disposition = "friendly"`;

  return filter;
}

export function getCastFilter(): string {
  const filter = `type = "${EventType.CastEvent}"
    AND source.disposition = "friendly"`;

  return filter;
}

export function getDeathFilter(): string {
  const filter = `type = "death"  
    AND target.disposition = "friendly"
    AND target.type = "player"
    AND feign = false`;

  return filter;
}
