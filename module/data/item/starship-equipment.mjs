import { makeDescriptionSchema, makeSourceSchema, makePriceSchema } from "./base.mjs";
const { StringField, BooleanField } = foundry.data.fields;

/**
 * Catch-all for the non-modification-slot starship equipment categories
 * that every ship picks exactly one of: Reactor, Power Coupling, Hyperdrive,
 * Armor, and Shield Generator. `configKey` points into the matching
 * SW5E.reactors / SW5E.powerCouplings / SW5E.hyperdriveClasses /
 * SW5E.starshipArmor / SW5E.shieldTypes table.
 */
export default class StarshipEquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      price: makePriceSchema(),
      kind: new StringField({ required: true, initial: "reactor", choices: ["reactor", "coupling", "hyperdrive", "armor", "shieldGenerator"] }),
      configKey: new StringField({ required: true, initial: "" }),
      equipped: new BooleanField({ required: false, initial: true })
    };
  }
}
