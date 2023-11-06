import {
  Actor,
  CombatantInfo,
  Player,
  PlayerDetails,
} from "../../../wcl/gql/types";
import { getBuffHistory } from "./buffs";
import { Buff } from "../generateFights";

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

export type BaseStats = {
  MainStat: number;
  Mastery: number;
  Haste: number;
  Crit: number;
  Versatility: number;
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

/**
 * Since the stats received from WCL are both inaccurate and sometimes missing, we will need to
 * get these ourselves if we want accurate information to work with.
 * We will do this by going through a players gear and set a baseline based on that.
 */
function getBaseStats(player: Player): BaseStats {
  if (!player.combatantInfo) {
    return {
      MainStat: -1,
      Mastery: -1,
      Haste: -1,
      Crit: -1,
      Versatility: -1,
    };
  }

  const playerStats = player.combatantInfo.stats;
  const mainStat =
    playerStats?.Agility?.min ??
    playerStats?.Intellect?.min ??
    playerStats?.Strength?.min ??
    -1;

  const stats: BaseStats = {
    MainStat: mainStat,
    Mastery: playerStats?.Mastery?.min ?? -1,
    Haste: playerStats?.Haste?.min ?? -1,
    Crit: playerStats?.Crit?.min ?? -1,
    Versatility: playerStats?.Versatility?.min ?? -1,
  };

  return stats;
}
