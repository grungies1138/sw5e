/**
 * A "starship" CombatantGroup collects every crewmember Combatant serving
 * aboard one ship (and, optionally, a Combatant for the ship's own token)
 * under a single shared initiative — the group's initiative is kept in sync
 * with the LOWEST initiative among its members by the "updateCombatant" hook
 * registered in sw5e.mjs, per SotG Ch.9: "the lowest initiative on each ship
 * sets the initiative for that ship."
 */
export default class SW5eCombatantGroup extends CombatantGroup {
  /** The Starship actor this group represents, if one has been linked. */
  get ship() {
    const uuid = this.system?.shipUuid;
    return uuid ? fromUuidSync?.(uuid) : null;
  }

  /** Recompute this group's initiative as the minimum of its members' initiative values. */
  async recalculateInitiative() {
    const values = this.members.map(m => m.initiative).filter(v => v !== null && v !== undefined);
    if (!values.length) return;
    const lowest = Math.min(...values);
    if (lowest !== this.initiative) await this.update({ initiative: lowest });
  }
}
