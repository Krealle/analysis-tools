import { DeathEvent } from "../events/types";

export type RootReport = {
  reportData: ReportData;
};

export type ReportData = {
  report: WCLReport;
};

export type WCLReport = {
  __typename?: "Report";
  archiveStatus?: ReportArchiveStatus;
  title: string;
  code: string;
  endtime: number;
  startTime: number;
  graph?: JSON;
  masterData?: ReportMasterData;
  events?: ReportEventPaginator;
  fights?: ReportFight[];
  owner?: User;
  playerDetails?: PlayerDetailsRoot;
  rankedCharacters?: Character[];
  rankings?: JSON;
  //region?: Region;
  revision: number;
  segments: number;
  table?: { data: SummaryTable };
  visibility: string;
  exportedSegments: number;
  zone?: GameZone;
};

export interface PlayerDetailsRoot {
  data: { playerDetails: PlayerDetails };
}

export interface PlayerDetails {
  healers: Player[];
  tanks: Player[];
  dps: Player[];
}

export interface Player {
  name: string;
  id: number;
  guid: number;
  type: string;
  server?: string;
  icon: string;
  specs: string[];
  minItemLevel: number;
  maxItemLevel: number;
  potionUse: number;
  healthstoneUse: number;
  /**
   * in report K9Mfcb2CtjZ7pX6q fight 45, combatantInfo is an empty array
   * for a single player
   */
  combatantInfo: CombatantInfo | never[];
}

export type CombatantInfo = {
  stats: Stats;
  talents: Talent[];
  gear: Item[];
  customPowerSet: CustomPowerSet[];
  secondaryCustomPowerSet: SecondaryCustomPowerSet[];
  tertiaryCustomPowerSet: unknown[];
  specIDs: number[];
  factionID: number;
  covenantID?: number;
  soulbindID?: number;
};

type Stats = {
  Speed: Stat;
  Dodge: Stat;
  Mastery: Stat;
  Stamina: Stat;
  Haste: Stat;
  Leech: Stat;
  Armor: Stat;
  Agility: Stat;
  Crit: Stat;
  "Item Level": Stat;
  Parry: Stat;
  Avoidance: Stat;
  Versatility: Stat;
  Intellect: Stat;
};

type Stat = {
  min: number;
  max: number;
};

export type Talent = {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
};

type CustomPowerSet = {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
  total: number;
};

export enum ItemQuality {
  POOR = 1,
  COMMON = 2,
  RARE = 3,
  SUPERIOR = 4,
  LEGENDARY = 5,
}

export type Item = {
  id: number;
  slot: number;
  quality: ItemQuality;
  icon: string;
  name?: string;
  itemLevel: number;
  bonusIDs?: number[];
  gems?: Gem[];
  permanentEnchant?: number;
  permanentEnchantName?: string;
  onUseEnchant?: number;
  onUseEnchantName?: string;
  effectID?: number;
  effectIcon?: string;
  effectName?: string;
  temporaryEnchant?: number;
  temporaryEnchantName?: string;
};

type Gem = {
  id: number;
  itemLevel: number;
  icon: string;
};

type SecondaryCustomPowerSet = {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
  total: number;
};

export interface Spec {
  spec: string;
  count: number;
}

/** The ReportMasterData object contains information about the log version of a report, as well as the actors and abilities used in the report. */
export type ReportMasterData = {
  __typename?: "ReportMasterData";
  /** A list of every ability that occurs in the report. */
  abilities?: ReportAbility[];
  /** A list of every actor (player, NPC, pet) that occurs in the report. */
  actors?: Actor[];
  /** The version of the game that generated the log file. Used to distinguish Classic and Retail Warcraft primarily. */
  gameVersion?: number;
  /** The auto-detected locale of the report. This is the source language of the original log file. */
  lang?: string;
  /** The version of the client parser that was used to parse and upload this log file. */
  logVersion: number;
};

/** The ReportAbility represents a single ability that occurs in the report. */
export type ReportAbility = {
  __typename?: "ReportAbility";
  /** The game ID of the ability. */
  gameID?: number;
  /** An icon to use for the ability. */
  icon?: string;
  /** The name of the actor. */
  name?: string;
  /** The type of the ability. This represents the type of damage (e.g., the spell school in WoW). */
  type?: string;
};

/** The ReportActor represents a single player, pet or NPC that occurs in the report. */
export type Actor = {
  __typename?: "ReportActor";
  /** The game ID of the actor. */
  gameID?: number;
  /** An icon to use for the actor. For pets and NPCs, this will be the icon the site chose to represent that actor. */
  icon?: string;
  /** The report ID of the actor. This ID is used in events to identify sources and targets. */
  id: number;
  /** The name of the actor. */
  name?: string;
  /** The report ID of the actor's owner if the actor is a pet. */
  petOwner?: number;
  /** The normalized server name of the actor. */
  server?: string;
  /** The sub-type of the actor, for players it's their class, and for NPCs, they are further subdivided into normal NPCs and bosses. */
  subType?: string;
  /** The type of the actor, i.e., if it is a player, pet or NPC. */
  type?: string;
};

export type ReportArchiveStatus = {
  __typename?: "ReportArchiveStatus";
  /** The date on which the report was archived (if it has been archived). */
  archiveDate?: number;
  /** Whether the current user can access the report. Always true if the report is not archived, and always false if not using user authentication. */
  isAccessible: boolean;
  /** Whether the report has been archived. */
  isArchived: boolean;
};

export type ReportFight = {
  id: number;
  reportCode: string;
  startTime: number;
  endTime: number;
  gameZone: GameZone;
  fightPercentage?: number;
  lastPhase?: number;
  name?: string;
  difficulty?: number;
  kill?: boolean;
  friendlyPlayers?: number[];
};

export type GameZone = {
  id: number;
};

export type ReportEventPaginator = {
  // The list of events obtained.
  data: JSON;
  // A timestamp to pass in as the start time when fetching the next page of data.
  nextPageTimestamp: number;
};

/** A single user of the site. */
export type User = {
  __typename?: "User";
  /** The battle tag of the user if they have linked it. */
  battleTag?: string;
  /** The ID of the user. */
  id: number;
  /** The name of the user. */
  name: string;
};

export type Character = {
  __typename?: "Character";
  /** The canonical ID of the character. If a character renames or transfers, then the canonical id can be used to identify the most recent version of the character. */
  canonicalID: number;
  /** The class id of the character. */
  classID: number;
  /** Encounter rankings information for a character, filterable to specific zones, bosses, metrics, etc. This data is not considered frozen, and it can change without notice. Use at your own risk. */
  encounterRankings?: JSON;
  /** The faction of the character. */
  //faction: GameFaction;
  /** Cached game data such as gear for the character. This data was fetched from the appropriate source (Blizzard APIs for WoW, Lodestone for FF). This call will only return a cached copy of the data if it exists already. It will not go out to Blizzard or Lodestone to fetch a new copy. */
  gameData?: JSON;
  /** The guild rank of the character in their primary guild. This is not the user rank on the site, but the rank according to the game data, e.g., a Warcraft guild rank or an FFXIV Free Company rank. */
  guildRank: number;
  /** All guilds that the character belongs to. */
  //guilds?: Guild[];
  /** Whether or not the character has all its rankings hidden. */
  hidden: boolean;
  /** The ID of the character. */
  id: number;
  /** The level of the character. */
  level: number;
  /** The name of the character. */
  name: string;
  /** Recent reports for the character. */
  //recentReports?: ReportPagination;
  /** The server that the character belongs to. */
  //server: Server;
  /** Rankings information for a character, filterable to specific zones, bosses, metrics, etc. This data is not considered frozen, and it can change without notice. Use at your own risk. */
  zoneRankings?: JSON;
};

export type SummaryTable = {
  totalTime: number;
  itemLevel: number;
  composition: Composition[];
  damageDone: DamageDone[];
  healingDone: HealingDone[];
  damageTaken: DamageTaken[];
  deathEvents: DeathEvent[];
  playerDetails: PlayerDetails;
  logVersion: number;
  gameVersion: number;
};

export type Composition = {
  name: string;
  id: number;
  guid: number;
  type: string;
  specs: Spec[];
};

export type DamageDone = {
  name: string;
  id: number;
  guid: number;
  type: string;
  icon: string;
  total: number;
};

export type HealingDone = {
  name: string;
  id: number;
  guid: number;
  type: string;
  icon: string;
  total: number;
};

export type DamageTaken = {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
  total: number;
  composite?: boolean;
};
