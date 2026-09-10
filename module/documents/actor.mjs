import { SW5E } from "../config.mjs";
import SW5eD20Roll from "../dice/d20-roll.mjs";
import SW5eDamageRoll from "../dice/damage-roll.mjs";

/**
 * The single Actor document class for all three sub-types (character, npc,
 * starship). Sub-type-specific behavior branches on `this.type` — this
 * mirrors the pattern the official dnd5e system uses (one Actor5e class),
 * since Foundry registers one CONFIG.Actor.documentClass per system.
 */
export default class SW5eActor extends Actor {
  /* -------------------------------------------- */
  /*  Roll Data                                    */
  /* -------------------------------------------- */

  getRollData() {
    const data = { ...this.system };
    data.prof = this.system.attributes?.prof ?? 0;
    if (this.type === "starship") {
      // Ship maneuver/deployment-feature formulas use the bare tokens
      // "@powerDie"/"@techDie" (see shipmaneuver source content) expecting
      // them to resolve to an actual die roll (e.g. "1d6"), not the die's
      // face count as a flat number -- so these must be dice-formula
      // strings, not the numeric die size that `system.power.die` /
      // `system.techDie.size` store for display purposes elsewhere.
      const powerDieSize = this.system.power?.die;
      data.powerDie = powerDieSize ? `1d${powerDieSize}` : "0";
      const techDieSize = this.system.techDie?.size;
      data.techDie = techDieSize ? `1d${techDieSize}` : "0";
    }
    return data;
  }

  /* -------------------------------------------- */
  /*  Character-scale rolls                        */
  /* -------------------------------------------- */

  async rollAbilityCheck(abilityId, { mode = "normal" } = {}) {
    const abl = this.system.abilities?.[abilityId];
    if (!abl) return null;
    return SW5eD20Roll.prompt({
      formula: `${abl.mod}`,
      data: this.getRollData(),
      mode,
      flavor: game.i18n.format("SW5E.AbilityPromptCheck", { ability: game.i18n.localize(SW5E.abilities[abilityId]?.label ?? abilityId) }),
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  async rollAbilitySave(abilityId, { mode = "normal" } = {}) {
    const abl = this.system.abilities?.[abilityId];
    if (!abl) return null;
    return SW5eD20Roll.prompt({
      formula: `${abl.save}`,
      data: this.getRollData(),
      mode,
      flavor: game.i18n.format("SW5E.AbilityPromptSave", { ability: game.i18n.localize(SW5E.abilities[abilityId]?.label ?? abilityId) }),
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  async rollSkill(skillId, { mode = "normal" } = {}) {
    const skl = this.system.skills?.[skillId];
    if (!skl) return null;
    return SW5eD20Roll.prompt({
      formula: `${skl.mod}`,
      data: this.getRollData(),
      mode,
      flavor: game.i18n.format("SW5E.SkillPromptCheck", { skill: game.i18n.localize(SW5E.skills[skillId]?.label ?? skillId) }),
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
  }

  async rollDeathSave() {
    if (this.type !== "character") return null;
    const roll = new Roll("1d20");
    await roll.evaluate();
    const updates = {};
    if (roll.total === 1) updates["system.attributes.death.failure"] = Math.min(3, this.system.attributes.death.failure + 2);
    else if (roll.total === 20) { updates["system.attributes.hp.value"] = 1; updates["system.attributes.death.success"] = 0; updates["system.attributes.death.failure"] = 0; }
    else if (roll.total >= 10) updates["system.attributes.death.success"] = Math.min(3, this.system.attributes.death.success + 1);
    else updates["system.attributes.death.failure"] = Math.min(3, this.system.attributes.death.failure + 1);
    await this.update(updates);
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: game.i18n.localize("SW5E.DeathSave") });
    return roll;
  }

  /** Recover resources on a short or long rest. Force points recover ONLY on a long rest; Tech points on either (SW5e-specific asymmetry). */
  async rest({ long = true } = {}) {
    if (this.type !== "character") return;
    const updates = {};
    if (long) {
      updates["system.attributes.hp.value"] = this.system.attributes.hp.max;
      updates["system.resources.force.value"] = this.system.resources.force.max;
      updates["system.resources.tech.value"] = this.system.resources.tech.max;
    } else {
      updates["system.resources.tech.value"] = this.system.resources.tech.max;
    }
    await this.update(updates);
  }

  /* -------------------------------------------- */
  /*  STARSHIP: crew helpers                       */
  /* -------------------------------------------- */

  /** The highest deployment rank any assigned crew member holds in `deployment`. */
  deploymentRank(deployment) {
    if (this.type !== "starship") return 0;
    return this.system.crew
      .filter(c => c.deployment === deployment)
      .reduce((max, c) => Math.max(max, c.rank ?? 0), 0);
  }

  /** The crew entry holding the highest rank in `deployment` (null if no crew is assigned to that role). */
  assignedCrewFor(deployment) {
    if (this.type !== "starship") return null;
    return this.system.crew
      .filter(c => c.deployment === deployment)
      .reduce((best, c) => (!best || (c.rank ?? 0) > (best.rank ?? 0)) ? c : best, null);
  }

  /**
   * Resolve the player-character Actor linked to a crew entry via its
   * `actorUuid` ("Claim Seat"), if any. Returns null for an unlinked seat or
   * a stale/deleted UUID rather than throwing.
   */
  resolveCrewActor(crewEntry) {
    if (!crewEntry?.actorUuid) return null;
    try {
      return fromUuidSync(crewEntry.actorUuid) ?? null;
    } catch (err) {
      return null;
    }
  }

  /** Resolve the crew entry currently authorized to take the Helm action. */
  get helmCrew() {
    if (this.type !== "starship") return null;
    return this.system.crew.find(c => c.isHelm) ?? this.system.crew.find(c => c.deployment === "pilot") ?? null;
  }

  /**
   * Build the roll formula for a ship check: the ship's own ability modifier,
   * plus the acting crewmember's proficiency bonus IF they hold >=1 rank in
   * the check's associated deployment (SotG Ch.7: "ships have no PB of their
   * own — the crewmember's own PB applies only if they have a deployment rank").
   */
  async rollShipCheck(shipSkillId, { mode = "normal", crewProfBonus = null, dc = null } = {}) {
    if (this.type !== "starship") return null;
    const skl = SW5E.shipSkills[shipSkillId];
    if (!skl) return null;
    const abilityMod = this.system.abilities?.[skl.ability]?.mod ?? 0;
    let prof = crewProfBonus;
    if (prof === null) {
      if (skl.deployment === "any") {
        prof = 0;
      } else {
        // Prefer the real proficiency bonus of whichever player character has
        // "claimed" this deployment's seat; fall back to the flat +2 baseline
        // used when a seat is filled by rank alone (no linked character).
        const crewEntry = this.assignedCrewFor(skl.deployment);
        const crewActor = this.resolveCrewActor(crewEntry);
        if (crewActor) prof = crewActor.system.attributes?.prof ?? 0;
        else prof = (crewEntry?.rank ?? 0) >= 1 ? 2 : 0;
      }
    }
    const disadv = this.system.effects?.disadvantageOnChecks ? "disadvantage" : mode;
    const roll = await SW5eD20Roll.prompt({
      formula: `${abilityMod + prof}`,
      data: this.getRollData(),
      mode: disadv,
      flavor: game.i18n.format("SW5E.ShipSkillPromptCheck", { skill: game.i18n.localize(skl.label) }) + (dc ? ` (DC ${dc})` : ""),
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
    return roll;
  }

  /* -------------------------------------------- */
  /*  STARSHIP: power dice management               */
  /* -------------------------------------------- */

  /** Spend one power die from `system`'s own pool, falling back to the central pool. Returns true if a die was found & spent. */
  spendPowerDie(system) {
    if (this.type !== "starship") return false;
    const sys = this.system.power.systems[system];
    if (sys && sys.value > 0) {
      this.update({ [`system.power.systems.${system}.value`]: sys.value - 1 });
      return true;
    }
    if (this.system.power.central.value > 0) {
      this.update({ "system.power.central.value": this.system.power.central.value - 1 });
      return true;
    }
    return false;
  }

  /** Add power dice to a specific system pool (or "central"), respecting capacity. */
  async addPowerDie(location, amount = 1) {
    if (this.type !== "starship") return 0;
    if (location === "central") {
      const cur = this.system.power.central.value, max = this.system.power.central.max;
      const added = Math.max(0, Math.min(amount, max - cur));
      if (added) await this.update({ "system.power.central.value": cur + added });
      return added;
    }
    const sys = this.system.power.systems[location];
    if (!sys) return 0;
    const added = Math.max(0, Math.min(amount, sys.max - sys.value));
    if (added) await this.update({ [`system.power.systems.${location}.value`]: sys.value + added });
    return added;
  }

  /** Move `amount` power dice from one location to another (Mechanic's Power Distribution technique). */
  async reroutePowerDie(from, to, amount = 1) {
    if (this.type !== "starship") return 0;
    const getVal = loc => loc === "central" ? this.system.power.central.value : this.system.power.systems[loc]?.value ?? 0;
    const available = Math.min(amount, getVal(from));
    if (available <= 0) return 0;
    const path = loc => loc === "central" ? "system.power.central.value" : `system.power.systems.${loc}.value`;
    await this.update({ [path(from)]: getVal(from) - available });
    const added = await this.addPowerDie(to, available);
    return added;
  }

  /* -------------------------------------------- */
  /*  STARSHIP: start-of-turn upkeep                */
  /* -------------------------------------------- */

  /** Reactor regen, passive shield regen, and per-round tracker reset. Call at the start of the ship's turn. */
  async startShipTurn() {
    if (this.type !== "starship") return;
    const updates = {
      "system.combat.boostCount.engines": 0, "system.combat.boostCount.shields": 0, "system.combat.boostCount.weapons": 0,
      "system.combat.firedThisRound": 0, "system.combat.regenShieldsUsed": false, "system.combat.helmUsedThisRound": false
    };
    await this.update(updates);

    // Reactor power-die regen -> central pool by convention (crew reroutes from there).
    const formula = this.system.power.reactor_config?.formula ?? "1";
    const roll = new Roll(formula);
    await roll.evaluate();
    if (roll.total > 0) await this.addPowerDie("central", roll.total);
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: game.i18n.localize("SW5E.ReactorRegenFlavor") });

    // Passive shield regen: spend one Shield Die (not rolled) for the flat regen rate, only if shields aren't fully depleted.
    if (this.system.shield.equipped && !this.system.shield.depleted && this.system.shield.dice.available > 0 && this.system.shield.value < this.system.shield.max) {
      const gained = Math.min(this.system.shield.regenRate, this.system.shield.max - this.system.shield.value);
      await this.update({
        "system.shield.value": this.system.shield.value + gained,
        "system.shield.dice.spent": this.system.shield.dice.spent + 1
      });
    }
  }

  /* -------------------------------------------- */
  /*  STARSHIP: universal Ship Actions (Ch.9)      */
  /* -------------------------------------------- */

  /** Boost — Str(Boost) check, DC10 +5 cumulative per repeat use of the SAME system this round. */
  async rollBoost(system) {
    if (this.type !== "starship") return null;
    const count = this.system.combat.boostCount[system] ?? 0;
    const dc = 10 + 5 * count;
    const roll = await this.rollShipCheck("boo", { dc });
    await this.update({ [`system.combat.boostCount.${system}`]: count + 1 });
    if ((roll?.total ?? 0) < dc) {
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: game.i18n.localize("SW5E.BoostFail") });
      return roll;
    }
    if (system === "engines") {
      await this.update({ "system.attributes.speed.temp": (this.system.attributes.speed.temp ?? 0) + 50 });
    } else if (system === "shields" && this.system.shield.equipped) {
      const die = new Roll(`1d${this.system.shield.die ?? 6}`);
      await die.evaluate();
      await this.update({ "system.shield.value": Math.min(this.system.shield.max, this.system.shield.value + die.total) });
      await die.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: game.i18n.localize("SW5E.BoostShieldsTemp") });
    } else if (system === "weapons") {
      await this.setFlag("sw5e", "weaponsBoosted", true);
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: game.i18n.localize("SW5E.BoostWeaponsAdvantage") });
    }
    return roll;
  }

  /** Detect — Wis(Scan) or Int(Probe) check. */
  async rollDetect(useProbe = false) {
    return this.rollShipCheck(useProbe ? "prb" : "scn");
  }

  /** Patch — repair Hull Points by expending a Hull Die. */
  async rollPatch() {
    if (this.type !== "starship") return null;
    if (this.system.hull.dice.available <= 0) {
      ui.notifications?.warn(game.i18n.localize("SW5E.WarnNoHullDice"));
      return null;
    }
    const missing = this.system.hull.max - this.system.hull.value;
    const dc = Math.max(10, Math.ceil(missing / 2));
    const roll = await this.rollShipCheck("pat", { dc });
    const success = (roll?.total ?? 0) >= dc;
    const die = this.system.hull.die ?? 6;
    let healRoll;
    if (success) healRoll = new Roll(`1d${die}`);
    else healRoll = new Roll(`{1d${die}, 1d${die}}kl`);
    await healRoll.evaluate();
    await this.update({
      "system.hull.value": Math.min(this.system.hull.max, this.system.hull.value + healRoll.total),
      "system.hull.dice.spent": this.system.hull.dice.spent + 1
    });
    await healRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: game.i18n.localize("SW5E.PatchHeal") });
    return roll;
  }

  /** Regenerate Shields — once per ship-turn, expend a Shield Die and roll it. */
  async rollRegenerateShields() {
    if (this.type !== "starship") return null;
    if (this.system.combat.regenShieldsUsed) {
      ui.notifications?.warn(game.i18n.localize("SW5E.WarnRegenShieldsUsed"));
      return null;
    }
    if (this.system.shield.dice.available <= 0) {
      ui.notifications?.warn(game.i18n.localize("SW5E.WarnNoShieldDice"));
      return null;
    }
    const missing = this.system.shield.max - this.system.shield.value;
    const dc = Math.max(10, Math.ceil(missing / 2));
    const roll = await this.rollShipCheck("boo", { dc });
    const success = (roll?.total ?? 0) >= dc;
    const die = this.system.shield.die ?? 6;
    let healRoll;
    if (success) healRoll = new Roll(`1d${die}`);
    else healRoll = new Roll(`{1d${die}, 1d${die}}kl`);
    await healRoll.evaluate();
    await this.update({
      "system.shield.value": Math.min(this.system.shield.max, this.system.shield.value + healRoll.total),
      "system.shield.dice.spent": this.system.shield.dice.spent + 1,
      "system.combat.regenShieldsUsed": true,
      "system.shield.depleted": false
    });
    await healRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: game.i18n.localize("SW5E.RegenShieldsHeal") });
    return roll;
  }

  /** Fire — attack roll with a mounted starship weapon, respecting the hardpoint fire-rate cap. */
  async fireWeapon(itemId, { mode = "normal" } = {}) {
    if (this.type !== "starship") return null;
    const item = this.items.get(itemId);
    if (!item || item.type !== "starshipweapon") return null;
    if (this.system.combat.firedThisRound >= this.system.attributes.maxFireActions) {
      ui.notifications?.warn(game.i18n.localize("SW5E.WarnFireCapReached"));
      return null;
    }
    const gunnerEntry = this.assignedCrewFor("gunner");
    const gunnerActor = this.resolveCrewActor(gunnerEntry);
    const prof = gunnerActor ? (gunnerActor.system.attributes?.prof ?? 0) : ((gunnerEntry?.rank ?? 0) >= 1 ? 2 : 0);
    const bonus = (item.system.attackBonus ?? 0) + (this.system.abilities.dex?.mod ?? 0) + prof;
    const boosted = this.getFlag("sw5e", "weaponsBoosted");
    const roll = await SW5eD20Roll.prompt({
      formula: `${bonus}`, data: this.getRollData(), mode,
      flavor: game.i18n.format("SW5E.AttackRollFlavor", { name: item.name }),
      speaker: ChatMessage.getSpeaker({ actor: this })
    });
    await this.update({ "system.combat.firedThisRound": this.system.combat.firedThisRound + 1 });
    if (boosted) await this.unsetFlag("sw5e", "weaponsBoosted");
    if (item.system.damage?.parts?.length) {
      const formula = item.system.damage.parts.map(p => p.formula).filter(Boolean).join(" + ");
      const dmgRoll = new SW5eDamageRoll(Roll.replaceFormulaData(formula, this.getRollData()), this.getRollData(), {});
      await dmgRoll.evaluate();
      await dmgRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: game.i18n.format("SW5E.DamageRollFlavor", { name: item.name }) });
    }
    return roll;
  }

  /** Helm — only the assigned Helm crewmember may act, once per round. */
  async helmAction(subaction) {
    if (this.type !== "starship") return null;
    if (this.system.combat.helmUsedThisRound) {
      ui.notifications?.warn(game.i18n.localize("SW5E.WarnHelmUsed"));
      return null;
    }
    await this.update({ "system.combat.helmUsedThisRound": true });
    switch (subaction) {
      case "hardTurn":
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: game.i18n.localize("SW5E.HelmHardTurnResult") });
        return null;
      case "evade": {
        await this.update({ "system.combat.evasive": true });
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: game.i18n.localize("SW5E.HelmEvadeResult") });
        return null;
      }
      case "fly": {
        await this.update({ "system.attributes.speed.temp": (this.system.attributes.speed.temp ?? 0) + this.system.attributes.speed.fly });
        await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: this }), content: game.i18n.localize("SW5E.HelmFlyResult") });
        return null;
      }
      case "ram": {
        const roll = await this.rollShipCheck("ram");
        const hullDiceCount = this.system.hull.dice.max ?? 1;
        const strMod = this.system.abilities.str?.mod ?? 0;
        const dmgRoll = new Roll(`${2 * hullDiceCount} + ${strMod}`);
        await dmgRoll.evaluate();
        await dmgRoll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: game.i18n.localize("SW5E.RamDamage") });
        return roll;
      }
      case "attackRun": case "conceal": case "dogfight": case "harass": {
        const skillMap = { attackRun: "pil", conceal: "con", dogfight: "man", harass: "man" };
        return this.rollShipCheck(skillMap[subaction] ?? "man");
      }
      default:
        return null;
    }
  }

  /** Interfere — Cha(Interfere) opposed check against a target's Wis(Scan) (compare manually to the target's roll). */
  async rollInterfere() {
    return this.rollShipCheck("int");
  }

  /* -------------------------------------------- */
  /*  STARSHIP: damage, system damage, destruction */
  /* -------------------------------------------- */

  /**
   * Apply damage to this starship, respecting shield-then-hull ordering,
   * Damage Reduction, and the per-damage-type hull/shield multipliers &
   * resistances/immunities from SW5E.shipDamageRules.
   */
  async applyDamage(amount, { type = null, critical = false, ignoreShields = false } = {}) {
    if (this.type !== "starship") return;
    let dmg = amount;
    const rule = type ? SW5E.shipDamageRules[type] : null;
    if (rule?.immune) return; // Poison/Psychic do no damage to ships at all.

    let toShield = 0, toHull = 0;
    if (this.system.shield.equipped && this.system.shield.value > 0 && !ignoreShields) {
      let shieldDmg = dmg;
      if (rule?.shieldMult != null) shieldDmg = Math.floor(shieldDmg * rule.shieldMult);
      toShield = Math.min(this.system.shield.value, shieldDmg);
      dmg = Math.max(0, dmg - toShield); // overflow past shields uses the *remaining raw* damage, per "shields absorb first"
    }
    if (dmg > 0) {
      const dr = this.system.attributes.ac.dr ?? 0;
      let hullDmg = Math.max(1, dmg - dr); // DR never reduces below 1 damage getting through
      if (rule?.hullMult != null) hullDmg = Math.max(rule.hullMult === 0 ? 0 : 1, Math.floor(hullDmg * rule.hullMult));
      toHull = hullDmg;
    }

    const updates = {};
    if (toShield) updates["system.shield.value"] = Math.max(0, this.system.shield.value - toShield);
    if (toShield && (this.system.shield.value - toShield) <= 0) updates["system.shield.depleted"] = true;

    if (toHull) {
      const wasAtZero = this.system.hull.value <= 0;
      const newHull = this.system.hull.value - toHull;
      if (wasAtZero) {
        // Any damage taken at 0 HP adds a System Damage level (+2 if critical); destruction if it meets/exceeds max.
        const canDestroy = rule?.canDestroy !== false;
        if (toHull >= this.system.hull.max && canDestroy) {
          updates["system.conditions.destroyed"] = true;
        }
        updates["system.conditions.systemDamage"] = Math.min(6, this.system.conditions.systemDamage + (critical ? 2 : 1));
      }
      updates["system.hull.value"] = Math.max(this.system.hull.max * -1, newHull);
    }
    if (Object.keys(updates).length) await this.update(updates);
  }

  /** Destruction Saving Throw — rolled at the start of turn while at 0 Hull Points. */
  async rollDestructionSave() {
    if (this.type !== "starship") return null;
    const roll = new Roll("1d20");
    await roll.evaluate();
    const updates = {};
    if (roll.total === 1) {
      updates["system.destructionSaves.failures"] = Math.min(3, this.system.destructionSaves.failures + 2);
    } else if (roll.total === 20) {
      updates["system.hull.value"] = 1;
      updates["system.destructionSaves.successes"] = 0;
      updates["system.destructionSaves.failures"] = 0;
    } else if (roll.total >= 10) {
      updates["system.destructionSaves.successes"] = Math.min(3, this.system.destructionSaves.successes + 1);
    } else {
      updates["system.destructionSaves.failures"] = Math.min(3, this.system.destructionSaves.failures + 1);
    }
    if ((updates["system.destructionSaves.failures"] ?? this.system.destructionSaves.failures) >= 3) {
      updates["system.conditions.systemDamage"] = Math.min(6, this.system.conditions.systemDamage + 1);
      updates["system.destructionSaves.failures"] = 0;
    }
    if ((updates["system.destructionSaves.successes"] ?? this.system.destructionSaves.successes) >= 3) {
      updates["system.conditions.disabled"] = true; // "stable"
    }
    await this.update(updates);
    await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor: this }), flavor: game.i18n.localize("SW5E.DestructionSave") });
    return roll;
  }
}
