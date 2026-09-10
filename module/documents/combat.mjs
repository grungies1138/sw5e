const DEPLOYMENT_TURN_PRIORITY = ["pilot", "gunner", "mechanic", "technician", "operator", "coordinator"];

/**
 * Sorts combatants by their effective (group-aware) initiative, then breaks
 * ties within a ship by a sensible deployment order (Helm first). Crews are
 * still free to actually resolve their individual actions in whatever order
 * they agree on at the table — this ordering only governs when the ship's
 * block of turns comes up in the wider encounter.
 */
export default class SW5eCombat extends Combat {
  _sortCombatants(a, b) {
    const ia = a.group?.initiative ?? a.initiative ?? -Infinity;
    const ib = b.group?.initiative ?? b.initiative ?? -Infinity;
    if (ia !== ib) return ib - ia;
    if (a.group && b.group && a.group.id === b.group.id) {
      const da = DEPLOYMENT_TURN_PRIORITY.indexOf(a.deployment ?? "");
      const db = DEPLOYMENT_TURN_PRIORITY.indexOf(b.deployment ?? "");
      if (da !== db) return (da === -1 ? 99 : da) - (db === -1 ? 99 : db);
    }
    return (a.initiative ?? 0) - (b.initiative ?? 0) || (a.id > b.id ? 1 : -1);
  }

  /** Advance to the next turn, running each ship's start-of-turn upkeep (reactor/shield regen, round-trackers) once per ship. */
  async nextTurn() {
    const result = await super.nextTurn();
    const combatant = this.combatant;
    const ship = combatant?.group?.ship ?? (combatant?.actor?.type === "starship" ? combatant.actor : null);
    if (ship?.startShipTurn) await ship.startShipTurn();
    return result;
  }
}
