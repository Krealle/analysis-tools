import { Pet } from "../../components/eventNormalizer/combatant/combatants";
import { Buff } from "../../components/eventNormalizer/generateFights";

export type BaseEvent<T extends Record<string, unknown>> = T & {
  timestamp: number;
  sourceID: number;
  targetID: number;
  sourceInstance?: number;
  targetInstance?: number;
  sourceMarker?: number;
  targetMarker?: number;
  abilityGameID: number;
  // pin: "0" but irrelevant
};

type EncounterStartEvent = Omit<
  BaseEvent<{
    type: "encounterstart";
    encounterID: number;
    name: string;
    difficulty: number;
    size: number;
    level: number;
    affixes: number[];
  }>,
  | "sourceID"
  | "targetID"
  | "sourceInstance"
  | "targetInstance"
  | "abilityGameID"
>;

type CombatantInfoEvent = Omit<
  BaseEvent<{
    type: "combatantinfo";
    gear: [];
    auras: {
      source: number;
      ability: number;
      stacks: number;
      icon: string;
      name?: string;
    }[];
    expansion: string;
    faction: number;
    specID: number;
    covenantID: number;
    soulbindID: number;
    strength: number;
    agility: number;
    stamina: number;
    intellect: number;
    dodge: number;
    parry: number;
    block: number;
    armor: number;
    critMelee: number;
    critRanged: number;
    critSpell: number;
    speed: number;
    leech: number;
    hasteMelee: number;
    hasteRanged: number;
    hasteSpell: number;
    avoidance: number;
    mastery: number;
    versatilityDamageDone: number;
    versatilityHealingDone: number;
    versatilityDamageReduction: number;
    talents: { id: number; icon: string }[];
    pvpTalents: { id: number; icon: string }[];
    artifact: {
      traitID: number;
      rank: number;
      spellID: number;
      icon: string;
    }[];
    heartOfAzeroth: {
      traitID: number;
      rank: number;
      spellID: number;
      icon: string;
    }[];
  }>,
  "targetID" | "sourceInstance" | "targetInstance" | "abilityGameID"
>;

export type ApplyDebuffEvent = BaseEvent<{
  type: "applydebuff";
}>;

export type ApplyDebuffStackEvent = BaseEvent<{
  type: "applydebuffstack";
  stack: number;
}>;

export type ApplyBuffEvent = BaseEvent<{
  type: "applybuff";
}>;

export type RemoveBuffEvent = BaseEvent<{
  type: "removebuff";
}>;

export type CastEvent = BaseEvent<{
  type: "cast";
}>;

export type DungeonEncounterEnd = {
  timestamp: number;
  type: "dungeonencounterend";
  kill: boolean;
  encounterID: number;
  size: number;
  difficulty: number;
  name: string;
};

export type DungeonEnd = {
  /**
   * time
   */
  completion: number;
  difficulty: number;
  /**
   * dungeonID prefixed with 1
   */
  encounterID: number;
  kill: boolean;
  loggerTotalRating: number;
  /**
   * key level
   */
  medal: number;
  name: "";
  rating: number;
  size: number;
  timestamp: number;
  type: "dungeonend";
};

export type BeginCastEvent = BaseEvent<{
  type: "begincast";
}>;

export type RemoveDebuffEvent = BaseEvent<{
  type: "removedebuff";
}>;

type SummonEvent = BaseEvent<{
  type: "summon";
}>;

export type PhaseStartEvent = Omit<
  BaseEvent<{
    type: "phasestart";
    encounterID: number;
    name: string;
    difficulty: number;
    size: number;
  }>,
  | "sourceID"
  | "targetID"
  | "targetInstance"
  | "sourceInstance"
  | "abilityGameID"
>;

export type HealEvent = BaseEvent<{
  type: "heal";
  hitType: number;
  amount: number;
  tick?: boolean;
  overheal?: number;
  absorbed?: number;
}>;

type ResourceChangeEvent = BaseEvent<{
  type: "resourcechange";
  resourceChange: number;
  resourceChangeType: number;
  otherResourceChange: number;
  waste: number;
}>;

export type ApplyBuffStackEvent = BaseEvent<{
  type: "applybuffstack";
  stack: number;
}>;

export type InterruptEvent = BaseEvent<{
  type: "interrupt";
  extraAbilityGameID: number;
}>;

export type AbsorbEvent = BaseEvent<{
  type: "absorbed";
  attackerID: number;
  amount: number;
  extraAbilityGameID: number;
}>;

export type RefreshDebuffEvent = BaseEvent<{
  type: "refreshdebuff";
}>;

type DispelEvent = BaseEvent<{
  type: "dispel";
  extraAbilityGameID: number;
  isBuff: boolean;
}>;

export type DeathEvent = BaseEvent<{
  type: "death";
  // only present if NPC kills player
  killerID?: number;
  killerInstance?: number;
  killingAbilityGameID?: number;
}>;

export type DamageEvent = BaseEvent<{
  timestamp: number;
  type: "damage";
  sourceID: number;
  targetID: number;
  abilityGameID: number;
  fight: number;
  hitType: number;
  amount: number;
  unmitigatedAmount?: number;
  supportID?: number;
  subtractsFromSupportedActor?: boolean;
  mitigated?: number;
  tick?: boolean;
  sourceInstance?: number;
  absorbed?: number;
  supportInstance?: number;
  targetInstance?: number;
  overkill?: number;
  /** used for dots, the event that applied/refreshed the dot */
  parentEvent?: ApplyDebuffEvent | RefreshDebuffEvent;
}>;

export type NormalizedDamageEvent = DamageEvent & {
  source: EventSource;
  originalEvent: DamageEvent;
  normalizedAmount: number;
  activeBuffs: Buff[];
  supportEvents?: SupportEvent[];
  fabricated?: boolean;
};
export type SupportEvent = {
  event: DamageEvent;
  delay: number;
  hookType: AttributionHook;
};

export type EventSource = {
  name: string;
  id: number;
  class: string;
  spec: string;
  petOwner?: Pet;
};

export enum AttributionStatus {
  NO_HOOK = "NO_HOOK",
  INCORRECT_HOOK_AMOUNT = "INCORRECT_HOOK_AMOUNT",
  HOOK_FOUND = "HOOK_FOUND",
}

export enum AttributionHook {
  GOOD_HOOK = "GOOD_HOOK",
  DELAYED_HOOK = "DELAYED_HOOK",
  UNEXPECTED_DAMAGE_RATIO = "UNEXPECTED_DAMAGE_RATIO",
  FABRICATED_HOOK = "FABRICATED_HOOK",
}

export type AttributionTable = {
  events: AttributionEvent[];
};

export type AttributionEvent = {
  event: DamageEvent;
  supportEvent: SupportEvent[];
  attributionStatus: AttributionStatus;
  expectedHooks: number;
  url: string;
};

export type AnyEvent =
  | DeathEvent
  | DispelEvent
  | RefreshDebuffEvent
  | AbsorbEvent
  | InterruptEvent
  | ApplyBuffStackEvent
  | ResourceChangeEvent
  | HealEvent
  | PhaseStartEvent
  | SummonEvent
  | RemoveDebuffEvent
  | BeginCastEvent
  | DamageEvent
  | CastEvent
  | RemoveBuffEvent
  | ApplyBuffEvent
  | ApplyDebuffStackEvent
  | ApplyDebuffEvent
  | CombatantInfoEvent
  | EncounterStartEvent
  | DungeonEncounterEnd
  | DungeonEnd;
export type AllTrackedEventTypes =
  | CastEvent
  | ApplyDebuffStackEvent
  | ApplyDebuffEvent
  | ApplyBuffEvent
  | RemoveBuffEvent
  | DamageEvent
  | BeginCastEvent
  | HealEvent
  | ApplyBuffStackEvent
  | InterruptEvent
  | DeathEvent
  | RemoveDebuffEvent;
export type AnyBuffEvent = ApplyBuffEvent | RemoveBuffEvent;
export type AnyDebuffEvent =
  | ApplyDebuffEvent
  | RemoveDebuffEvent
  | RefreshDebuffEvent;

export enum EventType {
  DeathEvent = "death",
  DispelEvent = "dispel",
  RefreshDebuffEvent = "refreshdebuff",
  AbsorbEvent = "absorbed",
  InterruptEvent = "interrupt",
  ApplyBuffStackEvent = "applybuffstack",
  ResourceChangeEvent = "resourcechange",
  HealEvent = "heal",
  PhaseStartEvent = "phasestart",
  SummonEvent = "summon",
  RemoveDebuffEvent = "removedebuff",
  BeginCastEvent = "begincast",
  DamageEvent = "damage",
  CastEvent = "cast",
  RemoveBuffEvent = "removebuff",
  ApplyBuffEvent = "applybuff",
  ApplyDebuffStackEvent = "applydebuffstack",
  ApplyDebuffEvent = "applydebuff",
  CombatantInfoEvent = "combatantinfo",
  EncounterStartEvent = "encounterstart",
  DungeonEncounterEnd = "dungeonencounterend",
  DungeonEnd = "dungeonend",
}

export enum HitType {
  Crit = 2,
}
