/**
 * A d20-based Roll subclass with advantage/disadvantage support. Registered
 * in CONFIG.Dice.rolls (see sw5e.mjs's "init" hook) so Roll.fromData() can
 * rehydrate stored rolls of this class by name -- NOT as a bare
 * CONFIG.Dice.SW5eD20Roll property, which nothing sets. Other code that
 * needs to construct one directly should import this class instead of
 * reading it off CONFIG.Dice.
 */
export default class SW5eD20Roll extends Roll {
  /**
   * @param {string} formula
   * @param {object} data
   * @param {object} [options]
   * @param {"normal"|"advantage"|"disadvantage"} [options.mode="normal"]
   */
  constructor(formula, data = {}, options = {}) {
    super(formula, data, options);
    this.options.mode ??= "normal";
  }

  /** Build the base die term (2d20kh / 2d20kl / 1d20) for the requested mode. */
  static buildFormula(mode = "normal", bonusFormula = "") {
    let die;
    switch (mode) {
      case "advantage": die = "2d20kh"; break;
      case "disadvantage": die = "2d20kl"; break;
      default: die = "1d20";
    }
    return bonusFormula ? `${die} + ${bonusFormula}` : die;
  }

  static async prompt({ formula, data = {}, flavor = "", mode = "normal", speaker = null } = {}) {
    const roll = new this(this.buildFormula(mode, formula), data, { mode });
    await roll.evaluate();
    await roll.toMessage({ speaker: speaker ?? ChatMessage.getSpeaker(), flavor });
    return roll;
  }
}
