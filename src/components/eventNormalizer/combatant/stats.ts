import { AnyBuffEvent, EventType } from "../../../wcl/events/types";
import { PlayerDetails } from "../../../wcl/gql/types";
import { BUFF_GIVES_STATS } from "./buffsWithStats";
import { BaseStats, Combatant } from "./combatants";

export type BuffStats = {
  MainStat: number;
  Mastery: number;
  Haste: number;
  Crit: number;
  Versatility: number;
};

export function generateStatHistories(
  events: AnyBuffEvent[],
  playerDetails: PlayerDetails,
  fightStart: number,
  fightEnd: number
): BaseStats[] {
  if (!events || events.length === 0 || fightEnd <= fightStart) {
    console.error("Invalid input data or fight duration");
  }

  const statHistory: BaseStats[] = getBaseStats(playerDetails, fightStart);

  for (const event of events) {
    const buffGivesStats = BUFF_GIVES_STATS.get(event.abilityGameID);
    if (!buffGivesStats) {
      continue;
    }

    if (event.type === EventType.ApplyBuffEvent) {
      const currentStats = statHistory.find(
        (statEntry) => statEntry.playerId === event.targetID
      );

      if (!currentStats) {
        console.error("No stat entry found for player", event.targetID);
        continue;
      }

      const buffValue: BuffStats = getBuffStats(event.abilityGameID);

      const newStats: BaseStats = {
        timestamp: event.timestamp,
        playerId: event.targetID,
        MainStat: currentStats.MainStat + buffValue.MainStat,
        Mastery: currentStats.Mastery + buffValue.Mastery,
        Haste: currentStats.Haste + buffValue.Haste,
        Crit: currentStats.Crit + buffValue.Crit,
        Versatility: currentStats.Versatility + buffValue.Versatility,
      };

      statHistory.push(newStats);
    } else if (event.type === EventType.RemoveBuffEvent) {
      //
    }
  }

  return statHistory;
}

export function getBuffStats(abilityId: number): BuffStats {
  const buffStats = BUFF_GIVES_STATS.get(abilityId);

  if (!buffStats) {
    console.warn("Somehow we didn't find the stats for", abilityId);
    return {
      MainStat: 0,
      Mastery: 0,
      Haste: 0,
      Crit: 0,
      Versatility: 0,
    };
  }

  return buffStats;
}
/* 
export function getStatHistory(playerId: number, buffHistory: BaseStats[]) {
  const buffs = buffHistory.filter((buff) => buff.targetID === playerId);
  return buffs;
}

export function getBuffs(
  timestamp: number,
  player?: Combatant, // cba with typescript some times
  abilityId?: number
): BaseStats[] {
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
} */

function getBaseStats(players: PlayerDetails, timestamp: number): BaseStats[] {
  const baselineStats: BaseStats[] = Object.keys(players).flatMap((key) => {
    return players[key as keyof PlayerDetails].map((player) => {
      if (!player.combatantInfo) {
        return {
          timestamp: timestamp,
          playerId: player.id,
          MainStat: -1,
          Mastery: -1,
          Haste: -1,
          Crit: -1,
          Versatility: -1,
        };
      } else {
        const playerStats = player.combatantInfo.stats;
        const mainStat =
          playerStats?.Agility?.min ??
          playerStats?.Intellect?.min ??
          playerStats?.Strength?.min ??
          -1;

        return {
          timestamp: timestamp,
          playerId: player.id,
          MainStat: mainStat,
          Mastery: playerStats?.Mastery?.min ?? -1,
          Haste: playerStats?.Haste?.min ?? -1,
          Crit: playerStats?.Crit?.min ?? -1,
          Versatility: playerStats?.Versatility?.min ?? -1,
        };
      }
    });
  });

  return baselineStats;
}
