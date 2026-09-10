/** A damage Roll subclass supporting simple critical-hit doubling (double the dice, not the modifiers — per SotG, crits just double weapon damage dice). */
export default class SW5eDamageRoll extends Roll {
  constructor(formula, data = {}, options = {}) {
    const built = options.critical ? SW5eDamageRoll.doubleDice(formula) : formula;
    super(built, data, options);
  }

  /** Double every dice term (NdX -> 2NdX) in a formula, leaving flat modifiers alone. */
  static doubleDice(formula) {
    return formula.replace(/(\d+)d(\d+)/gi, (match, n, faces) => `${Number(n) * 2}d${faces}`);
  }
}
