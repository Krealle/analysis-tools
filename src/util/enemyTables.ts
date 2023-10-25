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
  ],
  IgiraTheCruel: [
    createEnemy(200926, "Igira the Cruel", EnemyType.Boss),
    createEnemy(207341, "Blistering Spear", EnemyType.Add),
  ],
  Volcoross: [],
  CouncilOfDreams: [],
  LarodarKeeperOfTheFlame: [],
  NymueWeaverOfTheCycle: [],
  Smolderon: [],
  TindralSageswiftSeerOfTheFlame: [],
  FyrakkTheBlazing: [],
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
}

for (const [encounter, enemies] of Object.entries(AmirdrassilEnemies)) {
  console.log(`Encounter: ${encounter}`);
  console.log(EncounterNames[encounter]);
  for (const enemy of enemies) {
    console.log(`  Enemy Name: ${enemy.name}`);
    console.log(`  Enemy Type: ${enemy.type}`);
    console.log(`  Enemy ID: ${enemy.id}`);
  }
}
