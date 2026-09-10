import SW5eDamageRoll from "../dice/damage-roll.mjs";

export default class SW5eItem extends Item {
  /** Roll data merges the owning actor's roll data plus this item's own system data under `item`. */
  getRollData() {
    const rollData = this.actor?.getRollData?.() ?? {};
    rollData.item = { ...this.system };
    return rollData;
  }

  /* -------------------------------------------- */
  /*  Attack / Damage (character-scale weapons)    */
  /* -------------------------------------------- */

  get isWeapon() {
    return this.type === "weapon" || this.type === "starshipweapon";
  }

  async rollAttack({ mode = "normal" } = {}) {
    if (!this.isWeapon) return null;
    const { default: SW5eD20Roll } = await import("../dice/d20-roll.mjs");
    const rollData = this.getRollData();
    const abilityKey = this.system.ability
      || (this.system.actionType === "mwak" && (rollData.abilities?.str?.mod ?? 0) < (rollData.abilities?.dex?.mod ?? 0) ? "dex" : null)
      || (this.system.actionType === "mwak" ? "str" : "dex");
    const abilityMod = rollData.abilities?.[abilityKey]?.mod ?? 0;
    const prof = this.system.proficient ? (rollData.attributes?.prof ?? 0) : 0;
    const bonus = (this.system.attackBonus ?? 0) + abilityMod + prof;
    const roll = await SW5eD20Roll.prompt({
      formula: String(bonus),
      data: rollData,
      mode,
      flavor: game.i18n.format("SW5E.AttackRollFlavor", { name: this.name }),
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    });
    return roll;
  }

  async rollDamage({ critical = false, versatile = false } = {}) {
    if (!this.system.damage?.parts?.length) return null;
    const rollData = this.getRollData();
    const formula = (versatile && this.system.damage.versatile)
      ? this.system.damage.versatile
      : this.system.damage.parts.map(p => p.formula).filter(Boolean).join(" + ");
    if (!formula) return null;
    const roll = new SW5eDamageRoll(Roll.replaceFormulaData(formula, rollData), rollData, { critical });
    await roll.evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: game.i18n.format("SW5E.DamageRollFlavor", { name: this.name })
    });
    return roll;
  }

  /* -------------------------------------------- */
  /*  Powers (Force / Tech)                        */
  /* -------------------------------------------- */

  async rollPower() {
    if (this.type !== "power") return null;
    const actor = this.actor;
    if (!actor) return null;
    const pool = this.system.school === "tech" ? "tech" : "force";
    const cost = this.system.pointCost ?? 0;
    const resource = actor.system.resources?.[pool];
    if (resource && cost > resource.value) {
      ui.notifications?.warn(game.i18n.format("SW5E.WarnNotEnoughPoints", { pool: pool === "tech" ? "Tech" : "Force" }));
      return null;
    }
    if (resource && cost > 0) {
      await actor.update({ [`system.resources.${pool}.value`]: resource.value - cost });
    }
    const rollData = this.getRollData();
    let content = `<h3>${this.name}</h3><p>${this.system.description?.chat || this.system.description?.value || ""}</p>`;
    if (this.system.damage?.parts?.length) {
      const formula = this.system.damage.parts.map(p => p.formula).filter(Boolean).join(" + ");
      const roll = new Roll(Roll.replaceFormulaData(formula, rollData), rollData);
      await roll.evaluate();
      await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: this.name, rollMode: game.settings.get("core", "rollMode") });
      return roll;
    }
    await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
    return null;
  }

  /* -------------------------------------------- */
  /*  Ship Maneuvers (Tactics/Gambits/etc.)        */
  /* -------------------------------------------- */

  async useShipManeuver() {
    if (this.type !== "shipmaneuver") return null;
    const ship = this.actor;
    if (!ship || ship.type !== "starship") return null;
    const system = this.system.powerSystem;

    if (this.system.expendsPowerDie) {
      const spent = ship.spendPowerDie(system);
      if (!spent) {
        ui.notifications?.warn(game.i18n.localize("SW5E.WarnNoPowerDie"));
        return null;
      }
    }

    const dieSize = this.system.expendsPowerDie ? ship.system.power.die : ship.system.techDie.size;
    let roll = null;
    if (this.system.formula || dieSize) {
      const formula = this.system.formula || `1d${dieSize}`;
      const rollData = ship.getRollData();
      // If a player character has "claimed" this maneuver's deployment seat,
      // the maneuver's formula resolves against THEIR ability modifiers
      // rather than the ship's own -- e.g. a future "@abilities.int.mod"
      // token on a Technician maneuver should use the claimed technician's
      // Int mod, not the ship's. No shipped maneuver content references an
      // ability-mod token yet (all use @powerDie/@techDie only), so this is
      // forward-looking infrastructure for custom/future maneuvers.
      const crewEntry = ship.assignedCrewFor?.(this.system.deployment);
      const crewActor = ship.resolveCrewActor?.(crewEntry);
      if (crewActor?.system?.abilities) rollData.abilities = crewActor.system.abilities;
      roll = new Roll(Roll.replaceFormulaData(formula, rollData));
      await roll.evaluate();
    }
    const content = `<h3>${this.name}</h3><p>${this.system.description?.chat || this.system.description?.value || ""}</p>`;
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: ship }),
      content,
      rolls: roll ? [roll] : [],
      flavor: this.name
    });
    return roll;
  }
}
