export const WCL_CLIENT_ID = (() => {
  if (!import.meta.env.VITE_WCL_CLIENT_ID) {
    throw new Error('missing environment variable: "WCL_CLIENT_ID"');
  }

  return import.meta.env.VITE_WCL_CLIENT_ID;
})();

export const WCL_CLIENT_SECRET = (() => {
  if (!import.meta.env.VITE_WCL_CLIENT_SECRET) {
    throw new Error('missing environment variable: "CLIENT_SECRET"');
  }

  return import.meta.env.VITE_WCL_CLIENT_SECRET;
})();

/** SpellIds to blacklist */
export const ABILITY_BLACKLIST: number[] = [
  98021, // Spirit link totem
  201657, // Earthen Wall Totem
];

/** SpellIds that don't scale with buffs */
export const ABILITY_NO_SCALING: number[] = [
  404908, // Fate Mirror
  410265, // Infernos Blessing
  409632, // Breath of Eons
  360828, // Blistering Scales
];

/** SpellIds for abilities that scale off armor/HP */
export const ABILITY_NO_SHIFTING_SCALING: number[] = [
  322109, // Touch of Death
  400223, // Thorns of Iron
  124280, // Touch of Karma
];

/** SpellIds that don't attribute to Breath of Eons */
export const ABILITY_NO_BOE_SCALING: number[] = [
  402583, // Beacon
  408682, // Dragonfire Bomb Dispenser
  401324, // Pocket Anvil (Echoed Flare)
  401306, // Pocket Anvil (Anvil Strike)
  401422, // Vessel of Searing Shadow (Shadow Spike)
  401428, // Vessel of Searing Shadow (Ravenous Shadowflame)
  418774, // Mirror of Fractured Tomorrows ()
  418588, // Mirror of Fractured Tomorrows (Sand Cleave)
  419591, // Mirror of Fractured Tomorrows (Auto Attack)
  418607, // Mirror of Fractured Tomorrows (Sand Bolt)
  406251, // Roiling Shadowflame
  406889, // Roiling Shadowflame (Self Harm)
  379403, // Toxic Thorn Footwraps (Launched Thorns)
  408791, // Ashkandur, Fall of the Brotherhood
  378426, // Slimy Expulsion Boots boots (Corrosive Slime)
  381006, // Acidic Hailstone Treads (Deep Chill)
  381700, // Forgestorm (Forgestorm Ignited)
  406764, // Shadowflame Wreathe
  394453, // Broodkeeper's Blaze
  370794, // Unstable Frostfire Belt (Lingering Frostspark)
  408836, // Djaruun, Pillar of the Elder Flame
  408815, // Djaruun, Pillar of the Elder Flame
  381475, // Erupting Spear Fragment
  281721, // Bile-Stained Crawg Tusks (Vile Bile)
  214397, // Mark of Dargrul (Landslide)
  408469, // Call to Suffering (Self Harm)
  374087, // Glacial Fury
];

/** SpellsIds to softlist, ie. abilities that doesn't scale off mainstat but vers/crit */
export const ABILITY_NO_EM_SCALING: number[] = [
  402583, // Beacon
  408682, // Dragonfire Bomb Dispenser
  401324, // Pocket Anvil (Echoed Flare)
  401306, // Pocket Anvil (Anvil Strike)
  401422, // Vessel of Searing Shadow (Shadow Spike)
  401428, // Vessel of Searing Shadow (Ravenous Shadowflame)
  418774, // Mirror of Fractured Tomorrows ()
  418588, // Mirror of Fractured Tomorrows (Sand Cleave)
  419591, // Mirror of Fractured Tomorrows (Auto Attack)
  418607, // Mirror of Fractured Tomorrows (Sand Bolt)
  406251, // Roiling Shadowflame
  406889, // Roiling Shadowflame (Self Harm)
  379403, // Toxic Thorn Footwraps (Launched Thorns)
  408791, // Ashkandur, Fall of the Brotherhood
  378426, // Slimy Expulsion Boots boots (Corrosive Slime)
  381006, // Acidic Hailstone Treads (Deep Chill)
  381700, // Forgestorm (Forgestorm Ignited)
  406764, // Shadowflame Wreathe
  394453, // Broodkeeper's Blaze
  370794, // Unstable Frostfire Belt (Lingering Frostspark)
  408836, // Djaruun, Pillar of the Elder Flame
  408815, // Djaruun, Pillar of the Elder Flame
  381475, // Erupting Spear Fragment
  281721, // Bile-Stained Crawg Tusks (Vile Bile)
  214397, // Mark of Dargrul (Landslide)
  408469, // Call to Suffering (Self Harm)
  374087, // Glacial Fury
  184689, // Shield of Vengeance
];

/** SpellsIds that don't appear to re-attribute properly.
 * Non-exhaustive list.
 */
export const ABILITY_BROKEN_ATTRIBUTION: number[] = [
  394021, // Mutilated Flesh
  10444, // Flametongue Attack
  83381, // Kill command
  16827, // Claw
  386301, // Completely Safe Rocket Blast
  419737, // Timestrike
  409483, // Poisoned Edges
  201754, // Stomp
];

export const SNAPSHOTTED_DOTS: number[] = [
  269576, // Master Marksman (BM)
];

export const mrtColorMap: Map<string, string> = new Map([
  ["Mage", "|cff3fc7eb"],
  ["Paladin", "|cfff48cba"],
  ["Warrior", "|cffc69b6d"],
  ["Druid", "|cffff7c0a"],
  ["DeathKnight", "|cffc41e3a"],
  ["Hunter", "|cffaad372"],
  ["Priest", "|cffffffff"],
  ["Rogue", "|cfffff468"],
  ["Shaman", "|cff0070dd"],
  ["Warlock", "|cff8788ee"],
  ["Monk", "|cff00ff98"],
  ["DemonHunter", "|cffa330c9"],
  ["Evoker", "|cff33937f"],
]);

export const MELEE_HIT = 1;
export const EBON_MIGHT = 395152;
export const SHIFTING_SANDS = 413984;
export const PRESCIENCE = 410089;

/**
 * These values represent an estimation of about how much
 * these buffs provide to a players throughput
 * we use these values to attempt to combat abilities with
 * broken attribution, this is obviously not a perfect solution
 * but will help us with getting a more accurate idea of actual
 * throughput.
 */
export const EBON_MIGHT_CORRECTION_VALUE = 0.09;
export const SHIFTING_SANDS_CORRECTION_VALUE = 0.11;
