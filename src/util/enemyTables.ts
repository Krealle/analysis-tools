export enum EnemyType {
  Boss = "boss",
  Add = "add",
  Trash = "trash",
  Custom = "custom",
}

type Enemy = {
  id: number;
  name: string;
  type: EnemyType;
};

type EnemyMap = Record<string, Enemy[]>;

export function createEnemy(id: number, name: string, type: EnemyType): Enemy {
  return { id, name, type };
}

export const AmirdrassilEnemies: EnemyMap = {
  Gnarlroot: [
    createEnemy(209333, "Gnarlroot", EnemyType.Boss),
    createEnemy(210231, "Tainted Lasher", EnemyType.Add),
    createEnemy(211904, "Tainted Treant", EnemyType.Add),
  ],
  IgiraTheCruel: [
    createEnemy(200926, "Igira the Cruel", EnemyType.Boss),
    createEnemy(207341, "Blistering Spear", EnemyType.Add),
  ],
  Volcoross: [createEnemy(208478, "Volcoross", EnemyType.Boss)],
  CouncilOfDreams: [
    createEnemy(208365, "Aerwynn", EnemyType.Boss),
    createEnemy(208367, "Pip", EnemyType.Boss),
    createEnemy(208363, "Urctos", EnemyType.Boss),
  ],
  LarodarKeeperOfTheFlame: [
    createEnemy(208445, "Larodar, Keeper of the Flame", EnemyType.Boss),
    createEnemy(208459, "Fiery Treant", EnemyType.Add),
    createEnemy(208461, "Scorching Roots", EnemyType.Add),
  ],
  NymueWeaverOfTheCycle: [
    createEnemy(206172, "Nymue", EnemyType.Boss),
    createEnemy(209800, "Cycle Warden", EnemyType.Add),
    createEnemy(213143, "Manifested Dream", EnemyType.Add),
  ],
  Smolderon: [createEnemy(200927, "Smolderon", EnemyType.Boss)],
  TindralSageswiftSeerOfTheFlame: [
    createEnemy(209090, "Tindral Sageswift", EnemyType.Boss),
    createEnemy(211306, "Fiery Vines", EnemyType.Add),
    createEnemy(214441, "Scorched Treant", EnemyType.Add),
  ],
  FyrakkTheBlazing: [
    createEnemy(204931, "Fyrakk", EnemyType.Boss),
    createEnemy(207796, "Burning Colossus", EnemyType.Add),
    createEnemy(214608, "Screaming Soul", EnemyType.Add),
  ],
};

export const AberrusEnemies: EnemyMap = {
  Kazzara: [createEnemy(201261, "Kazzara, the Hellforged", EnemyType.Boss)],
  AssaultOfTheZaqali: [
    createEnemy(199659, "Warlord Kagni", EnemyType.Boss),
    createEnemy(200840, "Flamebound Huntsman", EnemyType.Add),
    createEnemy(199703, "Magma Mystic", EnemyType.Add),
    createEnemy(200836, "Obsidian Guard", EnemyType.Add),
    createEnemy(199812, "Zaqali Wallclimber", EnemyType.Add),
  ],
  RashokTheElder: [createEnemy(201320, "Rashok", EnemyType.Boss)],
  TheAmalgamationChamber: [
    createEnemy(201774, "Essence of Shadow", EnemyType.Boss),
    createEnemy(201773, "Eternal Blaze", EnemyType.Boss),
    createEnemy(201934, "Shadowflame Amalgamation", EnemyType.Boss),
  ],
  TheForgottenExperiments: [
    createEnemy(200912, "Neldris", EnemyType.Boss),
    createEnemy(200918, "Rionthus", EnemyType.Boss),
    createEnemy(200913, "Thadrion", EnemyType.Boss),
    createEnemy(202824, "Erratic Remnant", EnemyType.Add),
  ],
  TheVigilantStewardZskarn: [
    createEnemy(202375, "Zskarn", EnemyType.Boss),
    createEnemy(203230, "Dragonfire Golem", EnemyType.Add),
  ],
  Magmorax: [createEnemy(201579, "Magmorax", EnemyType.Boss)],
  EchoOfNeltharion: [
    createEnemy(201668, "Neltharion", EnemyType.Boss),
    createEnemy(202814, "Twisted Aberration", EnemyType.Add),
    createEnemy(203812, "Voice From Beyond", EnemyType.Add),
  ],
  ScalecommanderSarkareth: [
    createEnemy(201754, "Sarkareth", EnemyType.Boss),
    createEnemy(202969, "Empty Recollection", EnemyType.Add),
    createEnemy(202971, "Null Glimmer", EnemyType.Add),
  ],
};

// prettier-ignore
export const EncounterNames: Record<string, string> = {
  /** Aberrus */
  "Kazzara": "Kazzara",
  "AssaultOfTheZaqali": "Assault of the Zaqali",
  "RashokTheElder": "Rashok, the Elder",
  "TheAmalgamationChamber": "The Amalgamation Chamber",
  "TheForgottenExperiments": "The Forgotten Experiments",
  "TheVigilantStewardZskarn": "The Vigilant Steward, Zskarn",
  "Magmorax": "Magmorax",
  "EchoOfNeltharion": "Echo of Neltharion",
  "ScalecommanderSarkareth": "Scalecommander Sarkareth",
  /** Amirdrassil */
  "Gnarlroot": "Gnarlroot",
  "IgiraTheCruel": "Igira the Cruel",
  "Volcoross": "Volcoross",
  "CouncilOfDreams": "Council of Dreams",
  "LarodarKeeperOfTheFlame": "Larodar, Keeper of the Flame",
  "NymueWeaverOfTheCycle": "Nymue, Weaver of the Cycle",
  "Smolderon": "Smolderon",
  "TindralSageswiftSeerOfTheFlame": "Tindral Sageswift, Seer of the Flame",
  "FyrakkTheBlazing": "Fyrakk the Blazing",
};

// prettier-ignore
export const EncounterImages: Record<string, string> = {
  /** Aberrus */
  "Kazzara": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-kazzara-the-hellforged.png",
  "AssaultOfTheZaqali": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-assault-of-the-zaqali.png",
  "RashokTheElder": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-rashok-the-elder.png",
  "TheAmalgamationChamber": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-the-amalgamation-chamber.png",
  "TheForgottenExperiments": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-the-forgotten-experiments.png",
  "TheVigilantStewardZskarn": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-the-vigilant-steward-zskarn.png",
  "Magmorax": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-magmorax.png",
  "EchoOfNeltharion": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-echo-of-neltharion.png",
  "ScalecommanderSarkareth": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-scalecommander-sarkareth.png",
  "Gnarlroot": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-gnarlroot.png",
  "IgiraTheCruel": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-igira-the-cruel.png",
  "Volcoross": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-volcoross.png",
  "CouncilOfDreams": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-council-of-dreams.png",
  "LarodarKeeperOfTheFlame": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-larodar-keeper-of-the-flame.png",
  "NymueWeaverOfTheCycle": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-nymue-weaver-of-the-cycle.png",
  "Smolderon": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-smolderon.png",
  "TindralSageswiftSeerOfTheFlame": "",
  "FyrakkTheBlazing": "https://wow.zamimg.com/images/wow/journal/ui-ej-boss-fyrakk-the-burning.png",
}

// prettier-ignore
export const EncounterIds: Record<string, string> = {
  /** Amirdrassil */
  "Gnarlroot": "2820",
  "IgiraTheCruel": "2709",
  "Volcoross": "2737",
  "CouncilOfDreams": "2728",
  "LarodarKeeperOfTheFlame": "2731",
  "NymueWeaverOfTheCycle": "2708",
  "Smolderon": "2824",
  "TindralSageswiftSeerOfTheFlame": "2786",
  "FyrakkTheBlazing": "2677",
};
