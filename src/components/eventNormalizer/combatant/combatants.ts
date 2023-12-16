import { Actor, CombatantInfo, PlayerDetails } from "../../../wcl/gql/types";
import { getBuffHistory } from "./buffs";
import { Buff } from "../util/_generateFights";

export type BaseStats = {
  timestamp: number;
  playerId: number;
  MainStat: number;
  Mastery: number;
  Haste: number;
  Crit: number;
  Versatility: number;
};

export type Combatant = {
  id: number;
  name: string;
  pets: Pet[];
  buffHistory: Buff[];
  baseStats?: BaseStats;
  class: string;
  server?: string;
  icon: string;
  spec: string;
  role: string;
  combatantInfo: CombatantInfo | never[];
};

export type Pet = {
  name: string;
  id: number;
  petOwner: number;
};

export function generateCombatants(
  buffHistories: Buff[],
  playerDetails: PlayerDetails,
  actors: Actor[] | undefined
): Combatant[] {
  const combatants: Combatant[] = Object.keys(playerDetails)
    .flatMap((key) => {
      return playerDetails[key as keyof PlayerDetails].map((player) => {
        return {
          id: player.id,
          name: player.name,
          pets: findPets(player.id, actors),
          buffHistory: getBuffHistory(player.id, buffHistories),
          //baseStats: getBaseStats(player),
          class: player.type,
          server: player.server,
          icon: player.icon,
          spec: player.specs[0],
          role: key,
          combatantInfo: player.combatantInfo,
        };
      });
    })
    .sort((a, b) => a.id - b.id);
  return combatants;
}

function findPets(playerId: number, actors: Actor[] | undefined): Pet[] {
  if (!actors) {
    return [];
  }
  return actors.reduce<Pet[]>((acc, actor) => {
    if (actor.petOwner === playerId) {
      return acc.concat({
        name: actor.name ?? "Unknown pet",
        id: actor.id,
        petOwner: playerId,
      });
    }

    return acc;
  }, []);
}
