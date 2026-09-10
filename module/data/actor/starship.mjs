import { SW5E } from "../../config.mjs";
import { makeAbilitiesSchema, makeCurrencySchema, makeBiographySchema } from "../shared.mjs";

const {
  SchemaField, NumberField, StringField, BooleanField, ArrayField,
  DocumentUUIDField, TypedObjectField
} = foundry.data.fields;

/**
 * Average damage of a dice-formula string (e.g. "3d12", "2d10+4"), rounding
 * each die's average *up* to match this file's own `avgDie` convention
 * (`Math.floor(faces / 2) + 1`) so Ship Rating stays internally consistent
 * with the Hull/Shield Point math above. Used only by {@link StarshipData#prepareDerivedData}'s
 * Ship Rating calculation — see README "Ship Rating" for the full writeup.
 */
function averageDamageFormula(formula) {
  if (!formula) return 0;
  const terms = String(formula).replace(/\s+/g, "").match(/[+-]?[^+-]+/g) ?? [];
  let total = 0;
  for (const term of terms) {
    const sign = term.startsWith("-") ? -1 : 1;
    const body = term.replace(/^[+-]/, "");
    const dieMatch = body.match(/^(\d*)d(\d+)$/i);
    if (dieMatch) {
      const count = Number(dieMatch[1] || 1);
      const faces = Number(dieMatch[2]);
      total += sign * count * (Math.floor(faces / 2) + 1);
    } else if (/^\d+$/.test(body)) {
      total += sign * Number(body);
    }
  }
  return total;
}

/**
 * System data for a Starship (also reused, per SotG's own Introduction
 * chapter, for ground vehicles — a Tiny starship *is* a speeder bike, just
 * reflavored; see `groundScale` on SW5E.starshipSizes and the x10/÷10
 * damage-conversion rule implemented in {@link StarshipActor#applyDamage}).
 *
 * This is the deep, mechanically-complete half of the system: routed power
 * dice across five subsystems, six crew deployment roles, proper Hull/Shield
 * Point math (including shield-type capacity/regen multipliers), the System
 * Damage & Slowed condition tracks, destruction saving throws, and the
 * Tier/Role starship-construction chassis. Every numeric rule below is
 * transcribed from the live SotG rulebook (see README "Rules Sources").
 */
export default class StarshipData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      abilities: makeAbilitiesSchema(),

      details: new SchemaField({
        biography: makeBiographySchema(),
        size: new StringField({ required: true, initial: "small", choices: Object.keys(SW5E.starshipSizes) }),
        tier: new NumberField({ required: true, integer: true, min: 0, max: 5, initial: 0 }),
        role: new StringField({ required: false, blank: true, initial: "" }),
        roleSpecialization: new StringField({ required: false, blank: true, initial: "" }),
        roleMastery: new StringField({ required: false, blank: true, initial: "" }),
        isSpaceStation: new BooleanField({ required: false, initial: false }),
        source: new StringField({ required: false, blank: true, initial: "" })
      }),

      /* ---------------------------------------- */
      /*  Hull Points                              */
      /* ---------------------------------------- */
      hull: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 10 }),
        temp: new NumberField({ required: false, integer: true, initial: 0 }),
        bonuses: new SchemaField({ max: new NumberField({ required: false, integer: true, initial: 0 }) }),
        dice: new SchemaField({
          spent: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        })
      }),

      /* ---------------------------------------- */
      /*  Shield Points                            */
      /* ---------------------------------------- */
      shield: new SchemaField({
        equipped: new BooleanField({ required: false, initial: true }),
        type: new StringField({ required: true, initial: "directional", choices: Object.keys(SW5E.shieldTypes) }),
        value: new NumberField({ required: true, integer: true, initial: 0 }),
        bonuses: new SchemaField({ max: new NumberField({ required: false, integer: true, initial: 0 }) }),
        dice: new SchemaField({
          spent: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        depleted: new BooleanField({ required: false, initial: false })
      }),

      /* ---------------------------------------- */
      /*  Movement / Defense                       */
      /* ---------------------------------------- */
      attributes: new SchemaField({
        speed: new SchemaField({
          fly: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          turn: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          temp: new NumberField({ required: false, integer: true, initial: 0 }) // this-turn Boost/Fly bonuses
        }),
        ac: new SchemaField({
          armor: new StringField({ required: true, initial: "lightweight", choices: Object.keys(SW5E.starshipArmor) }),
          bonus: new NumberField({ required: false, integer: true, initial: 0 })
        }),
        hardpoints: new SchemaField({
          used: new NumberField({ required: false, integer: true, min: 0, initial: 0 })
        }),
        modSlots: new SchemaField({
          bonus: new NumberField({ required: false, integer: true, initial: 0 })
        })
      }),

      /* ---------------------------------------- */
      /*  Reactor / Coupling / Power Dice           */
      /* ---------------------------------------- */
      power: new SchemaField({
        reactor: new StringField({ required: true, initial: "fuelCell", choices: Object.keys(SW5E.reactors) }),
        coupling: new StringField({ required: true, initial: "direct", choices: Object.keys(SW5E.powerCouplings) }),
        central: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        systems: (() => {
          const obj = {};
          for (const key of Object.keys(SW5E.powerSystems)) {
            obj[key] = new SchemaField({
              value: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
            });
          }
          return new SchemaField(obj);
        })(),
        reroute: new SchemaField({
          active: new BooleanField({ required: false, initial: false }),
          target: new StringField({ required: false, blank: true, initial: "" }),
          efficient: new BooleanField({ required: false, initial: false })
        })
      }),

      /* ---------------------------------------- */
      /*  Tech Die (Mechanic)                       */
      /* ---------------------------------------- */
      techDie: new SchemaField({
        size: new NumberField({ required: true, integer: true, initial: 4 }), // die faces, volatile per Creative Thinking
        volatility: new NumberField({ required: false, integer: true, initial: 0 }) // transient +/- die-step until end of next turn
      }),

      /* ---------------------------------------- */
      /*  Hyperdrive                                */
      /* ---------------------------------------- */
      hyperdrive: new SchemaField({
        class: new StringField({ required: false, blank: true, initial: "" }),
        backupClass: new StringField({ required: false, blank: true, initial: "" }),
        equations: new NumberField({ required: false, integer: true, min: 0, max: 10, initial: 10 })
      }),

      /* ---------------------------------------- */
      /*  Cargo / Consumables                       */
      /* ---------------------------------------- */
      cargo: new SchemaField({
        capacity: new NumberField({ required: false, initial: 0 }), // tons
        value: new NumberField({ required: false, initial: 0 })
      }),
      fuel: new SchemaField({
        capacity: new NumberField({ required: false, integer: true, initial: 0 }),
        value: new NumberField({ required: false, integer: true, initial: 0 })
      }),
      suites: new ArrayField(new SchemaField({
        type: new StringField({ required: true, initial: "" }),
        capacity: new NumberField({ required: true, integer: true, initial: 0 })
      })),

      /* ---------------------------------------- */
      /*  Crew / Deployments                        */
      /* ---------------------------------------- */
      crew: new ArrayField(new SchemaField({
        actorUuid: new DocumentUUIDField({ required: false, nullable: true, initial: null }),
        name: new StringField({ required: false, blank: true, initial: "" }),
        deployment: new StringField({ required: true, initial: "pilot", choices: Object.keys(SW5E.deployments) }),
        rank: new NumberField({ required: false, integer: true, min: 0, max: 5, initial: 1 }),
        isHelm: new BooleanField({ required: false, initial: false })
      })),
      crewMinOverride: new NumberField({ required: false, integer: true, nullable: true, initial: null }),

      /* ---------------------------------------- */
      /*  Conditions                                 */
      /* ---------------------------------------- */
      conditions: new SchemaField({
        systemDamage: new NumberField({ required: true, integer: true, min: 0, max: 6, initial: 0 }),
        slowed: new NumberField({ required: true, integer: true, min: 0, max: 4, initial: 0 }),
        disabled: new BooleanField({ required: false, initial: false }),
        destroyed: new BooleanField({ required: false, initial: false })
      }),
      destructionSaves: new SchemaField({
        successes: new NumberField({ required: true, integer: true, min: 0, max: 3, initial: 0 }),
        failures: new NumberField({ required: true, integer: true, min: 0, max: 3, initial: 0 })
      }),

      /* ---------------------------------------- */
      /*  Ephemeral per-round combat state           */
      /* ---------------------------------------- */
      combat: new SchemaField({
        boostCount: new SchemaField({
          engines: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
          shields: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
          weapons: new NumberField({ required: false, integer: true, min: 0, initial: 0 })
        }),
        firedThisRound: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        regenShieldsUsed: new BooleanField({ required: false, initial: false }),
        helmUsedThisRound: new BooleanField({ required: false, initial: false }),
        evasive: new BooleanField({ required: false, initial: false })
      }),

      currency: makeCurrencySchema()
    };
  }

  /* -------------------------------------------- */
  /*  Data Preparation                             */
  /* -------------------------------------------- */

  prepareBaseData() {
    for (const key of Object.keys(this.abilities)) {
      const abl = this.abilities[key];
      abl.mod = Math.floor((abl.value - 10) / 2);
    }
  }

  /* -------------------------------------------- */

  prepareDerivedData() {
    const sizeConfig = SW5E.starshipSizes[this.details.size] ?? SW5E.starshipSizes.small;
    const tier = this.details.tier;
    const con = this.abilities.con?.mod ?? 0;
    const str = this.abilities.str?.mod ?? 0;
    const dex = this.abilities.dex?.mod ?? 0;

    // Hull/Shield dice count grows by `diceGrowth` per tier from the size's Tier-0 base.
    const hullDiceCount = sizeConfig.hullDice0 + sizeConfig.diceGrowth * tier;
    const shieldDiceCount = sizeConfig.shieldDice0 + sizeConfig.diceGrowth * tier;
    const die = sizeConfig.die;
    const avgDie = Math.floor(die / 2) + 1;
    const stationBonus = this.details.isSpaceStation ? 2 : 0;

    this.hull.dice.max = hullDiceCount;
    this.hull.dice.available = Math.max(0, hullDiceCount - this.hull.dice.spent);
    this.hull.die = die;
    // First Hull Die is guaranteed max; remaining dice use the average (a
    // manual "Roll Hull Dice" reroll is available via the Actor document's
    // rollHullDice() for tables that want variance).
    this.hull.max = sizeConfig.firstDieFace + con
      + Math.max(0, hullDiceCount - 1) * (avgDie + con + stationBonus)
      + con * 0 // (kept for readability; Con already applied per-die above)
      + this.hull.bonuses.max;
    if (this.conditions.systemDamage >= 4) this.hull.max = Math.floor(this.hull.max / 2);
    this.hull.value = Math.clamp(this.hull.value, 0, this.hull.max + (this.hull.temp ?? 0));

    // Shields are optional (not every ship mounts a generator).
    const shieldTypeConfig = SW5E.shieldTypes[this.shield.type] ?? SW5E.shieldTypes.directional;
    if (this.shield.equipped) {
      const baseSP = sizeConfig.firstDieFace + str + Math.max(0, shieldDiceCount - 1) * (avgDie + str);
      this.shield.dice.max = shieldDiceCount;
      this.shield.dice.available = Math.max(0, shieldDiceCount - this.shield.dice.spent);
      this.shield.die = die;
      this.shield.max = Math.round(baseSP * shieldTypeConfig.capMult) + this.shield.bonuses.max;
      this.shield.regenRate = Math.round(die * shieldTypeConfig.regenMult);
      if (this.conditions.systemDamage >= 4) {
        this.shield.max = Math.floor(this.shield.max / 2);
        this.shield.regenRate = Math.floor(this.shield.regenRate / 2);
      }
      this.shield.value = Math.clamp(this.shield.value, 0, this.shield.max);
    } else {
      this.shield.max = 0;
      this.shield.value = 0;
      this.shield.regenRate = 0;
    }

    // Armor Class: 10 + Dex + cumulative tier AC bonus + armor DR-type bonus + manual bonus.
    const armorConfig = SW5E.starshipArmor[this.attributes.ac.armor] ?? SW5E.starshipArmor.lightweight;
    let acDex = dex;
    if (armorConfig.dexCap !== null) acDex = Math.min(acDex, armorConfig.dexCap);
    const tierAC = SW5E.starshipTiers[tier]?.ac ?? 0;
    this.attributes.ac.value = 10 + acDex + tierAC + this.attributes.ac.bonus - (this.details.isSpaceStation ? 2 : 0);
    this.attributes.ac.dr = armorConfig.dr;

    // Speed/Turning — base values are set at construction (Role choice); this
    // just layers on this-turn Boost/Fly bonuses and Slowed penalties.
    const slowedPenalty = SW5E.slowedSpeedPenalty[this.conditions.slowed] ?? 0;
    this.attributes.speed.flyTotal = Math.max(0, this.attributes.speed.fly + (this.attributes.speed.temp ?? 0)
      - (Number.isFinite(slowedPenalty) ? slowedPenalty : this.attributes.speed.fly));
    this.attributes.speed.canTurn = this.attributes.speed.turn <= this.attributes.speed.flyTotal;

    // Power Dice: die size by tier, pool capacities by coupling type.
    this.power.die = SW5E.powerDieByTier[tier] ?? null;
    const coupling = SW5E.powerCouplings[this.power.coupling] ?? SW5E.powerCouplings.direct;
    this.power.central.max = coupling.central;
    for (const key of Object.keys(this.power.systems)) {
      this.power.systems[key].max = coupling.perSystem;
    }
    this.power.reactor_config = SW5E.reactors[this.power.reactor];

    // Reroute Power (Mechanic 3rd/4th rank): affects derived multipliers other
    // code (attack/damage/speed/regen calculations) should read.
    // NOTE: `power.reroute.efficient` is tracked but not yet wired to a
    // different multiplier here -- the rerouted system always doubles. The
    // "efficient" variant (rerouting from two systems into one at a reduced
    // penalty) isn't implemented; treat this as a placeholder until that
    // interaction is worked out against the source rules.
    this.power.multipliers = { engines: 1, shields: 1, weapons: 1 };
    if (this.power.reroute.active && this.power.reroute.target) {
      this.power.multipliers[this.power.reroute.target] = 2;
    }

    // Modification slots consumed by owned starshipmod items.
    const modSlotsBase = sizeConfig.modSlots + this.attributes.modSlots.bonus;
    let used = 0;
    for (const item of this.parent.items ?? []) {
      if (item.type === "starshipmod" && item.system?.equipped !== false) used += item.system?.slots ?? 1;
    }
    this.attributes.modSlots.max = modSlotsBase;
    this.attributes.modSlots.used = used;

    // Crew complement / skeleton-crew system-damage penalty.
    const crewCount = this.crew.length;
    const minCrew = this.crewMinOverride ?? sizeConfig.crewMin;
    this.attributes.crew = { count: crewCount, min: minCrew, max: sizeConfig.crewMax };
    let skeletonExtra = 0;
    if (minCrew > 0 && crewCount < minCrew) {
      const fraction = crewCount / minCrew;
      for (const row of SW5E.skeletonCrewPenalty) {
        if (fraction <= row.fraction) skeletonExtra = row.extraDamage;
      }
    }
    this.attributes.skeletonCrewPenalty = skeletonExtra;
    this.effectiveSystemDamage = Math.min(6, this.conditions.systemDamage + skeletonExtra);

    // Hardpoint fire-rate cap: Str mod (min +1) x size hardpoint modifier.
    this.attributes.maxFireActions = Math.ceil(Math.max(1, str) * sizeConfig.hardpointMod);

    // Cargo/fuel defaults from size table when not manually overridden.
    if (!this.cargo.capacity) this.cargo.capacity = sizeConfig.cargo;

    // Convenience flags read by roll/derived logic elsewhere.
    this.effects = {
      disadvantageOnChecks: this.effectiveSystemDamage >= 1,
      disadvantageOnAttacksAndSaves: this.effectiveSystemDamage >= 3,
      systemsCatastrophicFailure: this.effectiveSystemDamage >= 6
    };

    /* ---------------------------------------- */
    /*  Ship Rating (an original Challenge-      */
    /*  Rating analogue — see README)            */
    /* ---------------------------------------- */
    // SotG's own Generating Encounters chapter explicitly leaves this system
    // unwritten ("needs to be rewritten... For the time being, have your GM
    // use common sense"), so there's no published formula to transcribe.
    // This is an original design, not sourced from sw5e.com.
    const effectiveHP = this.hull.max + this.shield.max;
    const baselineAC = 12 + (SW5E.starshipTiers[tier]?.ac ?? 0);
    const acAdjust = Math.clamp(1 + 0.05 * (this.attributes.ac.value - baselineAC), 0.5, 1.5);
    const defensiveRating = (effectiveHP * acAdjust) / 15;

    let averageDamage = 0;
    for (const item of this.parent.items ?? []) {
      if (item.type !== "starshipweapon" || item.system?.equipped === false) continue;
      for (const part of item.system?.damage?.parts ?? []) averageDamage += averageDamageFormula(part.formula);
    }
    const offensiveRating = averageDamage / 3;

    const rawRating = (defensiveRating + offensiveRating) / 2;
    this.rating = {
      value: Math.max(0, Math.round(rawRating * 2) / 2),
      defensive: Math.round(defensiveRating * 10) / 10,
      offensive: Math.round(offensiveRating * 10) / 10,
      effectiveHP,
      averageDamage: Math.round(averageDamage * 10) / 10
    };
  }

  /* -------------------------------------------- */

  /** Total power dice currently stored (central + all systems). */
  get totalPowerDice() {
    let total = this.power.central.value ?? 0;
    for (const key of Object.keys(this.power.systems)) total += this.power.systems[key].value ?? 0;
    return total;
  }
}
