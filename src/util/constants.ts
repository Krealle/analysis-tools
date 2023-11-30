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
  408694, // Dragonfire Bomb Dispenser
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
  370817, // Shocking Disclosure
  426564, // Augury of the Primal Flame (Annihilating Flame)
  417458, // Accelerating Sandglass
  424965, // Thorn Spirit
  425181, // Thorn Blast
  419737, // Timestrike
  265953, // Touch of Gold
  425154, // Vicious Brand
  425156, // Radiating Brand
  422146, // Solar Maelstrom
  426341, // Tindral's Fowl Fantasia
  426431, // Denizen Of The Flame
  426486, // Denizen Of The Flame Final
  426339, // Igiras Cruel Nightmare
  426527, // Flaying Torment
  259756, // Entropic Embrace
  427209, // Web of Dreams
  422956, // Essence Splice
  424324, // Hungering Shadowflame
  419279, // Extinction Blast
  215444, // Dark Blast
  214168, // Brutal Haymaker
  214169, // Brutal Haymaker
  228784, // Brutal Haymaker Vulnerability
  214350, // Nightmare Essence
  422750, // Shadowflame Rage
  425701, // Shadowflame Lash Enemy
  422750, // Tainted Heart
  425461, // Tainted Heart Enemy Damage
  417458, // Accelerating Sandglass
  215407, // Dark Blast
  270827, // Webweavers Soul Gem
  213785, // Nightfall
];

/** SpellsIds that doesn't scale off mainstat but vers/crit */
export const ABILITY_NO_EM_SCALING: number[] = [
  402583, // Beacon
  408682, // Dragonfire Bomb Dispenser
  408694, // Dragonfire Bomb Dispenser
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
  322109, // Touch of Death
  400223, // Thorns of Iron
  124280, // Touch of Karma
  370817, // Shocking Disclosure
  426564, // Augury of the Primal Flame (Annihilating Flame)
  417458, // Accelerating Sandglass
  424965, // Thorn Spirit
  425181, // Thorn Blast
  419737, // Timestrike
  265953, // Touch of Gold
  425154, // Vicious Brand
  425156, // Radiating Brand
  422146, // Solar Maelstrom
  426341, // Tindral's Fowl Fantasia
  426431, // Denizen Of The Flame
  426486, // Denizen Of The Flame Final
  426339, // Igiras Cruel Nightmare
  426527, // Flaying Torment
  259756, // Entropic Embrace
  427209, // Web of Dreams
  422956, // Essence Splice
  424324, // Hungering Shadowflame
  419279, // Extinction Blast
  215444, // Dark Blast
  214168, // Brutal Haymaker
  214169, // Brutal Haymaker
  228784, // Brutal Haymaker Vulnerability
  214350, // Nightmare Essence
  422750, // Shadowflame Rage
  425701, // Shadowflame Lash Enemy
  422750, // Tainted Heart
  425461, // Tainted Heart Enemy Damage
  417458, // Accelerating Sandglass
  215407, // Dark Blast
  270827, // Webweavers Soul Gem
  213785, // Nightfall
  386297, // Completely Safe Rocket Blast
];

/** SpellsIds that don't appear to re-attribute properly.
 * Non-exhaustive list.
 */
export const ABILITY_BROKEN_ATTRIBUTION: number[] = [
  /* 388070, // Fel Barrage
  271971, // Dreadbite
  205196, // Dreadbite 2.0
  259756, // Entropic Embrace
  // 394021, // Mutilated Flesh
  91778, // Sweeping Claws
  91776, // Claw
  47632, // Death Coil
  390271, // Coil of Devastation
  10444, // Flametongue Attack
  83381, // Kill command
  426703, // Kill Command 2.0
  16827, // Claw
  75, // Auto Shot
  389448, // Kill Cleave
  386301, // Completely Safe Rocket Blast
  // 385638, // Razor Fragments
  118459, // Beast Cleave
  344572, // Bestial Wrath
  321538, // Bloodshed
  118459, // Beast Cleave
  // 409483, // Poisoned Edges
  // 201754, // Stomp
  116858, // Chaos Bolt (Prescience)
  425610, // Dumb boss spell
  428493, // Chaotic Disposition
  258922, // Immolation Aura
  258921, // Immolation Aura 2.0
  // 204598, // Sigil of Flame
  423193, // Sanguine Blades
  409483, // Poisoned Edges
  409605, // Soulreave
  409604, // Soulrip
  419800, // Intensifying Flame
  //351140, // Meteor
  12654, // Ignite
  408310, // Crashing Star
  394061, // Astral Smolder
  394047, // Goldrinn's Fang
  202497, // Shooting Stars
  191037, // Starfall
  164815, // Sunfire
  164812, // Moonfire
  384391, // Sidearm
  361500, // Living Flame
  359077, // Eternity Surge
  418588, // Mirror trinket (Sand Cleave)
  388009, // Blessing of Summer
  22482, // Blade Flurry */
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
export const COMBUSTION_BUFF = 190319;

/**
 * These values represent an estimation of about how much
 * these buffs provide to a players throughput
 * we use these values to attempt to combat abilities with
 * broken attribution, this is obviously not a perfect solution
 * but will help us with getting a more accurate idea of actual
 * throughput.
 */
export const EBON_MIGHT_CORRECTION_VALUE = 0.06;
export const SHIFTING_SANDS_CORRECTION_VALUE = 0.14;
export const PRESCIENCE_CORRECTION_VALUE = 0.025;
