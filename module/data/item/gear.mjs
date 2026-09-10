import { SW5E } from "../../config.mjs";
import { makeDescriptionSchema, makeSourceSchema, makePriceSchema } from "./base.mjs";
const { StringField, NumberField, BooleanField } = foundry.data.fields;

/** Generic gear / consumables / Enhanced Items (SW5e's "magic items" analogue). */
export default class GearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      price: makePriceSchema(),
      weight: new NumberField({ required: false, min: 0, initial: 0 }),
      quantity: new NumberField({ required: false, integer: true, min: 0, initial: 1 }),
      isEnhanced: new BooleanField({ required: false, initial: false }),
      rarity: new StringField({ required: false, initial: "standard", choices: Object.keys(SW5E.itemRarity) }),
      attuned: new BooleanField({ required: false, initial: false })
    };
  }
}
