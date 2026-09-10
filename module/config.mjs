/**
 * The SW5E configuration object. Mirrors the "CONFIG.SW5E" pattern used by
 * the official dnd5e system: a single namespaced object of static reference
 * data (labels, tables, formulas-as-data) that document classes, sheets, and
 * templates all read from, so game-content tuning never requires touching
 * document logic.
 */
export const SW5E = {};

/* -------------------------------------------- */
/*  Abilities                                    */
/* -------------------------------------------- */

SW5E.abilities = {
  str: { label: "SW5E.AbilityStr", abbreviation: "SW5E.AbilityStrAbbr" },
  dex: { label: "SW5E.AbilityDex", abbreviation: "SW5E.AbilityDexAbbr" },
  con: { label: "SW5E.AbilityCon", abbreviation: "SW5E.AbilityConAbbr" },
  int: { label: "SW5E.AbilityInt", abbreviation: "SW5E.AbilityIntAbbr" },
  wis: { label: "SW5E.AbilityWis", abbreviation: "SW5E.AbilityWisAbbr" },
  cha: { label: "SW5E.AbilityCha", abbreviation: "SW5E.AbilityChaAbbr" }
};

/* -------------------------------------------- */
/*  Character Skills                             */
/* -------------------------------------------- */

// Per "What's Different": Arcana/History/Religion merged into Lore; Piloting
// and Technology are new skills.
SW5E.skills = {
  acr: { label: "SW5E.SkillAcr", ability: "dex" },
  ani: { label: "SW5E.SkillAni", ability: "wis" },
  ath: { label: "SW5E.SkillAth", ability: "str" },
  dec: { label: "SW5E.SkillDec", ability: "cha" },
  ins: { label: "SW5E.SkillIns", ability: "wis" },
  itm: { label: "SW5E.SkillItm", ability: "cha" },
  inv: { label: "SW5E.SkillInv", ability: "int" },
  lor: { label: "SW5E.SkillLor", ability: "int" }, // Lore (merged Arcana/History/Religion)
  med: { label: "SW5E.SkillMed", ability: "wis" },
  nat: { label: "SW5E.SkillNat", ability: "int" },
  prc: { label: "SW5E.SkillPrc", ability: "wis" },
  prf: { label: "SW5E.SkillPrf", ability: "cha" },
  pil: { label: "SW5E.SkillPil", ability: "int" }, // Piloting (new)
  per: { label: "SW5E.SkillPer", ability: "cha" },
  slt: { label: "SW5E.SkillSlt", ability: "dex" },
  ste: { label: "SW5E.SkillSte", ability: "dex" },
  sur: { label: "SW5E.SkillSur", ability: "wis" },
  tec: { label: "SW5E.SkillTec", ability: "int" } // Technology (new)
};

/* -------------------------------------------- */
/*  Ship Skills / Proficiencies                  */
/* -------------------------------------------- */

// These are the checks referenced throughout Ch.9 Combat & Ch.7 Ability
// Scores of Starships of the Galaxy. A ship "rolls" these using its own
// ability modifier, but only adds a proficiency bonus if the acting
// crewmember has at least 1 rank in the associated deployment.
SW5E.shipSkills = {
  ast: { label: "SW5E.ShipSkillAstrogation", ability: "int", deployment: "pilot" },
  boo: { label: "SW5E.ShipSkillBoost", ability: "str", deployment: "any" },
  con: { label: "SW5E.ShipSkillConceal", ability: "dex", deployment: "pilot" },
  int: { label: "SW5E.ShipSkillInterfere", ability: "cha", deployment: "operator" },
  man: { label: "SW5E.ShipSkillManeuvering", ability: "dex", deployment: "pilot" },
  mec: { label: "SW5E.ShipSkillMechanics", ability: "int", deployment: "mechanic" },
  pat: { label: "SW5E.ShipSkillPatch", ability: "con", deployment: "any" },
  pil: { label: "SW5E.ShipSkillPiloting", ability: "int", deployment: "pilot" },
  prb: { label: "SW5E.ShipSkillProbe", ability: "int", deployment: "operator" },
  ram: { label: "SW5E.ShipSkillRam", ability: "str", deployment: "pilot" },
  reg: { label: "SW5E.ShipSkillRegulation", ability: "con", deployment: "mechanic" },
  scn: { label: "SW5E.ShipSkillScan", ability: "wis", deployment: "operator" }
};

/* -------------------------------------------- */
/*  Sizes                                        */
/* -------------------------------------------- */

SW5E.actorSizes = {
  tiny: { label: "SW5E.SizeTiny", token: 0.5, abbreviation: "SW5E.SizeTinyAbbr" },
  sm: { label: "SW5E.SizeSmall", token: 1, abbreviation: "SW5E.SizeSmallAbbr" },
  med: { label: "SW5E.SizeMedium", token: 1, abbreviation: "SW5E.SizeMediumAbbr" },
  lg: { label: "SW5E.SizeLarge", token: 2, abbreviation: "SW5E.SizeLargeAbbr" },
  huge: { label: "SW5E.SizeHuge", token: 3, abbreviation: "SW5E.SizeHugeAbbr" },
  grg: { label: "SW5E.SizeGargantuan", token: 4, abbreviation: "SW5E.SizeGargantuanAbbr" }
};

/* -------------------------------------------- */
/*  Starship Hull Sizes                          */
/* -------------------------------------------- */

/**
 * Every field here is transcribed directly from the SotG rulebook (see the
 * project README's "Rules Sources" section). `die` is the size of a single
 * Hull/Shield/AC-upgrade die for the hull size; `hullDice0`/`shieldDice0` are
 * the number of dice at Tier 0; `diceGrowth` is dice gained per Tier (Huge
 * and Gargantuan gain 2 per tier instead of 1); `firstDieFace` is the flat
 * value of the guaranteed-max first Hull/Shield Die.
 */
SW5E.starshipSizes = {
  tiny: {
    label: "SW5E.HullTiny", die: 4, firstDieFace: 4, hullDice0: 1, shieldDice0: 1, diceGrowth: 1,
    cost: 12500, modSlots: 10, cargo: 0, crewMin: 0, crewMax: 0, hardpointMod: 1,
    groundScale: "SW5E.GroundScaleHuge", initiativeBase: 10, sizeCostModifier: 0.5
  },
  small: {
    label: "SW5E.HullSmall", die: 6, firstDieFace: 6, hullDice0: 3, shieldDice0: 3, diceGrowth: 1,
    cost: 25000, modSlots: 20, cargo: 2, crewMin: 1, crewMax: 1, hardpointMod: 1,
    groundScale: "SW5E.GroundScaleGargantuan", initiativeBase: 9, sizeCostModifier: 1
  },
  medium: {
    label: "SW5E.HullMedium", die: 8, firstDieFace: 8, hullDice0: 5, shieldDice0: 5, diceGrowth: 1,
    cost: 75000, modSlots: 30, cargo: 25, crewMin: 4, crewMax: null, hardpointMod: 1.5,
    groundScale: "SW5E.GroundScaleColossal", initiativeBase: 8, sizeCostModifier: 2
  },
  large: {
    label: "SW5E.HullLarge", die: 10, firstDieFace: 10, hullDice0: 7, shieldDice0: 7, diceGrowth: 1,
    cost: 500000, modSlots: 50, cargo: 500, crewMin: 10, crewMax: null, hardpointMod: 2.5,
    groundScale: "SW5E.GroundScaleColossal", initiativeBase: 7, sizeCostModifier: 10
  },
  huge: {
    label: "SW5E.HullHuge", die: 12, firstDieFace: 12, hullDice0: 9, shieldDice0: 9, diceGrowth: 2,
    cost: 100000000, modSlots: 60, cargo: 10000, crewMin: 75, crewMax: null, hardpointMod: 2,
    groundScale: "SW5E.GroundScaleColossal", initiativeBase: 6, sizeCostModifier: 100
  },
  gargantuan: {
    label: "SW5E.HullGargantuan", die: 20, firstDieFace: 20, hullDice0: 11, shieldDice0: 11, diceGrowth: 2,
    cost: 1000000000, modSlots: 70, cargo: 200000, crewMin: 800, crewMax: null, hardpointMod: 3,
    groundScale: "SW5E.GroundScaleColossal", initiativeBase: 5, sizeCostModifier: 1000
  }
};

/* -------------------------------------------- */
/*  Starship Tier Progression                    */
/* -------------------------------------------- */

// Base Upgrade Cost by Tier (before size multiplier), and the cumulative AC
// bonus a ship has earned by that tier (starts at Tier 2, +1/tier, capped +4
// at Tier 5).
SW5E.starshipTiers = {
  0: { upgradeCost: 0, ac: 0 },
  1: { upgradeCost: 3900, ac: 0 },
  2: { upgradeCost: 77500, ac: 1 },
  3: { upgradeCost: 297000, ac: 2 },
  4: { upgradeCost: 620000, ac: 3 },
  5: { upgradeCost: 1150000, ac: 4 }
};

/* -------------------------------------------- */
/*  Power Dice                                   */
/* -------------------------------------------- */

// Power Die face size by ship Tier (Tier 0 ships effectively have none).
SW5E.powerDieByTier = { 0: null, 1: 4, 2: 6, 3: 8, 4: 10, 5: 12 };

SW5E.powerSystems = {
  engines: { label: "SW5E.PowerSystemEngines", deployment: "pilot" },
  shields: { label: "SW5E.PowerSystemShields", deployment: "technician" },
  weapons: { label: "SW5E.PowerSystemWeapons", deployment: "gunner" },
  sensors: { label: "SW5E.PowerSystemSensors", deployment: "operator" },
  comms: { label: "SW5E.PowerSystemComms", deployment: "coordinator" }
};

SW5E.reactors = {
  fuelCell: { label: "SW5E.ReactorFuelCell", cost: 4500, fuelMod: 1, formula: "1" },
  ionization: { label: "SW5E.ReactorIonization", cost: 5100, fuelMod: 0.5, formula: "1d2 - 1" },
  powerCore: { label: "SW5E.ReactorPowerCore", cost: 5750, fuelMod: 1.5, formula: "1d2" }
};

// Central pool capacity + per-system pool capacity for each coupling type.
SW5E.powerCouplings = {
  direct: { label: "SW5E.CouplingDirect", cost: 4100, central: 4, perSystem: 0 },
  distributed: { label: "SW5E.CouplingDistributed", cost: 5100, central: 0, perSystem: 2 },
  hubSpoke: { label: "SW5E.CouplingHubSpoke", cost: 5600, central: 2, perSystem: 1 }
};

/* -------------------------------------------- */
/*  Shields (starship)                           */
/* -------------------------------------------- */

SW5E.shieldTypes = {
  directional: { label: "SW5E.ShieldDirectional", capMult: 1, regenMult: 1 },
  fortress: { label: "SW5E.ShieldFortress", capMult: 1.5, regenMult: 2 / 3 },
  quickCharge: { label: "SW5E.ShieldQuickCharge", capMult: 2 / 3, regenMult: 1.5 }
};

/* -------------------------------------------- */
/*  Starship Armor                               */
/* -------------------------------------------- */

SW5E.starshipArmor = {
  lightweight: { label: "SW5E.ArmorLightweight", dexCap: null, dr: 0, stealthDisadvantage: false },
  deflection: { label: "SW5E.ArmorDeflection", dexCap: 2, dr: 3, stealthDisadvantage: false },
  reinforced: { label: "SW5E.ArmorReinforced", dexCap: 0, dr: 6, stealthDisadvantage: true }
};

/* -------------------------------------------- */
/*  Deployments (Crew Roles)                     */
/* -------------------------------------------- */

SW5E.deployments = {
  pilot: { label: "SW5E.DeploymentPilot", powerSystem: "engines", pool: "SW5E.PoolTactics" },
  gunner: { label: "SW5E.DeploymentGunner", powerSystem: "weapons", pool: "SW5E.PoolGambits" },
  mechanic: { label: "SW5E.DeploymentMechanic", powerSystem: null, pool: "SW5E.PoolTechniques" },
  technician: { label: "SW5E.DeploymentTechnician", powerSystem: "shields", pool: "SW5E.PoolStratagems" },
  operator: { label: "SW5E.DeploymentOperator", powerSystem: "sensors", pool: "SW5E.PoolDisruptions" },
  coordinator: { label: "SW5E.DeploymentCoordinator", powerSystem: "comms", pool: "SW5E.PoolCollaborations" }
};

/* -------------------------------------------- */
/*  System Damage / Slowed Conditions            */
/* -------------------------------------------- */

SW5E.systemDamageLevels = {
  0: { label: "SW5E.SystemDamageNone" },
  1: { label: "SW5E.SystemDamage1" },
  2: { label: "SW5E.SystemDamage2" },
  3: { label: "SW5E.SystemDamage3" },
  4: { label: "SW5E.SystemDamage4" },
  5: { label: "SW5E.SystemDamage5" },
  6: { label: "SW5E.SystemDamage6" }
};

SW5E.slowedSpeedPenalty = { 0: 0, 1: 150, 2: 250, 3: 300, 4: Infinity };

/* -------------------------------------------- */
/*  Skeleton Crew Penalty                        */
/* -------------------------------------------- */

// Fraction-of-minimum-crew thresholds -> extra System Damage levels applied
// (non-cumulative across rows; use the *lowest* fraction met/exceeded).
SW5E.skeletonCrewPenalty = [
  { fraction: 3 / 4, extraDamage: 1 },
  { fraction: 1 / 2, extraDamage: 2 },
  { fraction: 1 / 4, extraDamage: 3 },
  { fraction: 1 / 10, extraDamage: 4 }
];

/* -------------------------------------------- */
/*  Hyperdrive Classes                           */
/* -------------------------------------------- */

SW5E.hyperdriveClasses = {
  "0.5": 50000, "0.75": 25000, "1": 15000, "1.5": 12500, "2": 10000,
  "3": 7500, "4": 5000, "5": 2500, "8": 1000, "12": 750, "15": 500
};

/* -------------------------------------------- */
/*  Ship Weapon Categories                       */
/* -------------------------------------------- */

SW5E.starshipWeaponCategories = {
  primary: { label: "SW5E.WeaponPrimary" },
  secondary: { label: "SW5E.WeaponSecondary" },
  tertiary: { label: "SW5E.WeaponTertiary" },
  quaternary: { label: "SW5E.WeaponQuaternary" }
};

SW5E.starshipWeaponProperties = {
  amm: "SW5E.WeaponPropAmmunition", aut: "SW5E.WeaponPropAuto", brs: "SW5E.WeaponPropBurst",
  con: "SW5E.WeaponPropConstitution", dir: "SW5E.WeaponPropDire", exp: "SW5E.WeaponPropExplosive",
  hvy: "SW5E.WeaponPropHeavy", hid: "SW5E.WeaponPropHidden", hom: "SW5E.WeaponPropHoming",
  ion: "SW5E.WeaponPropIonizing", keen: "SW5E.WeaponPropKeen", mlt: "SW5E.WeaponPropMelt",
  ovh: "SW5E.WeaponPropOverheat", prc: "SW5E.WeaponPropPiercing", pow: "SW5E.WeaponPropPower",
  rap: "SW5E.WeaponPropRapid", rel: "SW5E.WeaponPropReload", sat: "SW5E.WeaponPropSaturate",
  spc: "SW5E.WeaponPropSpecial", vic: "SW5E.WeaponPropVicious", zon: "SW5E.WeaponPropZone"
};

/* -------------------------------------------- */
/*  Damage Types                                 */
/* -------------------------------------------- */

SW5E.damageTypes = {
  acid: { label: "SW5E.DamageAcid" }, cold: { label: "SW5E.DamageCold" },
  energy: { label: "SW5E.DamageEnergy" }, fire: { label: "SW5E.DamageFire" },
  force: { label: "SW5E.DamageForce" }, ion: { label: "SW5E.DamageIon" },
  kinetic: { label: "SW5E.DamageKinetic" }, lightning: { label: "SW5E.DamageLightning" },
  necrotic: { label: "SW5E.DamageNecrotic" }, poison: { label: "SW5E.DamagePoison" },
  psychic: { label: "SW5E.DamagePsychic" }, sonic: { label: "SW5E.DamageSonic" }
};

// Ship-scale damage-type interaction rules (Ch.9 Combat, "Damage and
// Destruction"). Used by StarshipActor#applyDamage.
SW5E.shipDamageRules = {
  ion: { hullMult: 0.5, canDestroy: false, hullResistant: true },
  lightning: { hullMult: 0.5, hullResistant: true },
  necrotic: { hullMult: 0.5, shieldMult: 0.5, hullResistant: true, shieldResistant: true },
  acid: { shieldMult: 0.5, shieldResistant: true },
  cold: { shieldMult: 0.5, shieldResistant: true },
  fire: { shieldMult: 0.5, shieldResistant: true },
  poison: { hullMult: 0, shieldMult: 0, immune: true },
  psychic: { hullMult: 0, shieldMult: 0, immune: true },
  sonic: { vacuumMult: 0 }
};

/* -------------------------------------------- */
/*  Character Weapon Categories                 */
/* -------------------------------------------- */

SW5E.weaponCategories = {
  blaster: "SW5E.WeaponCategoryBlaster",
  lightweapon: "SW5E.WeaponCategoryLightweapon",
  vibroweapon: "SW5E.WeaponCategoryVibroweapon"
};

SW5E.weaponProficiencyTiers = {
  simple: "SW5E.WeaponSimple",
  martial: "SW5E.WeaponMartial"
};

/* -------------------------------------------- */
/*  Armor (character)                            */
/* -------------------------------------------- */

SW5E.armorTypes = {
  light: "SW5E.ArmorLight",
  medium: "SW5E.ArmorMedium",
  heavy: "SW5E.ArmorHeavy",
  shield: "SW5E.ArmorShieldGenerator"
};

/* -------------------------------------------- */
/*  Casting                                      */
/* -------------------------------------------- */

SW5E.powerSchools = {
  lightside: "SW5E.PowerLightSide",
  darkside: "SW5E.PowerDarkSide",
  universal: "SW5E.PowerUniversal",
  tech: "SW5E.PowerTech"
};

// Force powers keyed to alignment: light=wis, dark=cha, universal=caster's choice.
SW5E.forceAlignmentAbility = { lightside: "wis", darkside: "cha", universal: null, tech: "int" };

// Casting a power of level N costs N+1 points (0-cost at-will).
SW5E.powerPointCosts = { 0: 0, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10 };

// The four power-casting progression tiers a class (ClassData.casterProgression)
// can advance at, applying to whichever pool ClassData.castingSchool names
// ("force" or "tech"). Verified against the official sw5e-foundry Foundry
// system's own CONFIG.SW5E.powerProgression (github.com/sw5e-foundry/sw5e) --
// note that tier is a real three-quarters progression, not the "twothirds"
// label this project used before the Character Wizard's powers/maneuvers-known
// automation was added.
SW5E.casterProgressionTiers = {
  none: "SW5E.CasterProgNone",
  half: "SW5E.CasterProgHalf",
  threequarters: "SW5E.CasterProgThreeQuarters",
  full: "SW5E.CasterProgFull"
};

/**
 * Max powers known, by which pool (force/tech) and progression tier, indexed
 * by class level (index 0 unused). Copied verbatim from the official
 * sw5e-foundry system's CONFIG.SW5E.powersKnown (module/config.mjs), renaming
 * its "3/4" tier key to "threequarters" to match this project's naming and
 * dropping its "arch" tier (partial multiclass-only casting; no base class in
 * this compendium uses it).
 */
SW5E.powersKnown = {
  force: {
    full: [0, 9, 11, 13, 15, 17, 19, 21, 23, 25, 26, 28, 29, 31, 32, 34, 35, 37, 38, 39, 40],
    threequarters: [0, 7, 9, 11, 13, 15, 17, 18, 19, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 34, 35],
    half: [0, 5, 7, 9, 10, 12, 13, 14, 15, 17, 18, 19, 20, 22, 23, 24, 25, 27, 28, 29, 30]
  },
  tech: {
    full: [0, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    threequarters: [0, 0, 0, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
    half: [0, 0, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  }
};

/**
 * Highest power level a caster of a given pool/tier/class-level can cast.
 * Same source and tier-renaming as SW5E.powersKnown above.
 */
SW5E.powerMaxLevel = {
  full: [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 9, 9],
  threequarters: [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 7, 7],
  half: [0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5]
};

/**
 * Base Force/Tech point pool granted per class level at each progression
 * tier -- multiplied by the class's levels, then summed across every class
 * that shares a castingSchool for a multiclass caster. Same source as above.
 * Per the official system's own rule, the Tech pool total is halved after
 * summing (Tech Points are consistently the smaller pool in published SW5e).
 */
SW5E.powerPointsBase = { half: 2, threequarters: 3, full: 4 };

/**
 * Ability score(s) whose modifier adds to a pool's point maximum -- the
 * higher of the two for Force (a class's castingAbility picks which one it
 * actually uses), Intelligence alone for Tech.
 */
SW5E.powerPointsBonusAbility = { force: ["wis", "cha"], tech: ["int"] };

/**
 * Maneuvers known at a given *effective* maneuver level (a class's levels x
 * its maneuverProgression, rounded -- 1 for "full" i.e. Scholar, 0.5 for
 * "half" i.e. Fighter). Copied verbatim from the official system's
 * CONFIG.SW5E.maneuversKnownProgression.
 */
SW5E.maneuversKnownProgression = [0, 1, 2, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24];

/** Superiority dice granted at a given effective maneuver level, same source/indexing as above. */
SW5E.superiorityDiceQuantProgression = [0, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12];

/** Superiority die size at a given effective maneuver level (index 0 = no dice yet), same source/indexing as above. */
SW5E.superiorityDieSizeProgression = [
  "", "d4", "d4", "d4", "d4", "d6", "d6", "d6", "d6",
  "d8", "d8", "d8", "d8", "d10", "d10", "d10", "d10", "d12", "d12", "d12", "d12"
];

/* -------------------------------------------- */
/*  Classes                                      */
/* -------------------------------------------- */

/* -------------------------------------------- */
/*  Currency                                     */
/* -------------------------------------------- */

SW5E.currency = { credits: "SW5E.CurrencyCredits" };

/* -------------------------------------------- */
/*  Cover                                        */
/* -------------------------------------------- */

SW5E.cover = {
  none: { label: "SW5E.CoverNone", bonus: 0 },
  quarter: { label: "SW5E.CoverQuarter", bonus: 2 },
  half: { label: "SW5E.CoverHalf", bonus: 3 },
  threeQuarters: { label: "SW5E.CoverThreeQuarters", bonus: 5 }
};

/* -------------------------------------------- */
/*  Rest Types                                   */
/* -------------------------------------------- */

SW5E.restTypes = { short: "SW5E.RestShort", long: "SW5E.RestLong" };

/* -------------------------------------------- */
/*  Item Rarity (Enhanced Items)                 */
/* -------------------------------------------- */

SW5E.itemRarity = {
  standard: "SW5E.RarityStandard",
  premium: "SW5E.RarityPremium",
  prototype: "SW5E.RarityPrototype",
  advanced: "SW5E.RarityAdvanced",
  legendary: "SW5E.RarityLegendary",
  artifact: "SW5E.RarityArtifact"
};

/* -------------------------------------------- */
/*  Modification Categories                      */
/* -------------------------------------------- */

SW5E.modificationCategories = {
  engineering: { label: "SW5E.ModCategoryEngineering", baseCost: 3500, repeatable: true },
  operation: { label: "SW5E.ModCategoryOperation", baseCost: 3500, repeatable: false },
  suite: { label: "SW5E.ModCategorySuite", baseCost: 5000, repeatable: true },
  universal: { label: "SW5E.ModCategoryUniversal", baseCost: 4000, repeatable: false },
  weapon: { label: "SW5E.ModCategoryWeapon", baseCost: 3000, repeatable: true }
};

SW5E.modificationGrades = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };

/* -------------------------------------------- */
/*  Ship Actions (universal, Ch.9 Combat)        */
/* -------------------------------------------- */

SW5E.shipActions = {
  boost: { label: "SW5E.ActionBoost" },
  detect: { label: "SW5E.ActionDetect" },
  direct: { label: "SW5E.ActionDirect" },
  fire: { label: "SW5E.ActionFire" },
  helm: { label: "SW5E.ActionHelm" },
  interfere: { label: "SW5E.ActionInterfere" },
  patch: { label: "SW5E.ActionPatch" },
  regenShields: { label: "SW5E.ActionRegenShields" }
};

SW5E.helmActions = {
  attackRun: "SW5E.HelmAttackRun",
  conceal: "SW5E.HelmConceal",
  dogfight: "SW5E.HelmDogfight",
  evade: "SW5E.HelmEvade",
  fly: "SW5E.HelmFly",
  harass: "SW5E.HelmHarass",
  hardTurn: "SW5E.HelmHardTurn",
  ram: "SW5E.HelmRam"
};
