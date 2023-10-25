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
  409632, // Breath of Eons (Removed since technically they can feed each other, but this is weak with 2x limit and just makes it more annoying to filter stuff properly later)
];

/** SpellIds for abilities that scale off armor/HP but attribute to Breath of Eons */
export const ABILITY_NO_SCALING: number[] = [
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

/** SpellsIds to softlist, ie. abilities that doesn't scale off mainstat but vers/crit, and don't contribute to Breath of Eons */
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
