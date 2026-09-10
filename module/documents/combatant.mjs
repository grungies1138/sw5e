import SW5eD20Roll from "../dice/d20-roll.mjs";

/**
 * A single crewmember (or solo combatant) in initiative. When a Combatant
 * belongs to a starship's CombatantGroup, its individual initiative still
 * gets rolled normally (SotG: "every PC on a ship rolls initiative
 * normally") — it's the GROUP's initiative (the lowest among its members)
 * that actually determines when the ship's turn comes up; see
 * SW5eCombat#_sortCombatants and the "updateCombatant" hook in sw5e.mjs.
 */
export default class SW5eCombatant extends Combatant {
  getInitiativeRoll(formula) {
    if (this.actor) {
      const dex = this.actor.system?.abilities?.dex?.mod ?? 0;
      const bonus = this.actor.system?.attributes?.init?.bonus ?? 0;
      return new SW5eD20Roll(`1d20 + ${dex + bonus}`, this.actor.getRollData?.() ?? {});
    }
    return new SW5eD20Roll(formula ?? "1d20", {});
  }

  /** Convenience: the deployment role this crewmember is assigned to on their ship, if any (set via a flag by the Starship sheet). */
  get deployment() {
    return this.getFlag("sw5e", "deployment") ?? null;
  }
}
