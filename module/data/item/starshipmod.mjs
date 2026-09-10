import { SW5E } from "../../config.mjs";
import { makeDescriptionSchema, makeSourceSchema, makePriceSchema } from "./base.mjs";
const { StringField, NumberField, BooleanField } = foundry.data.fields;

/** A Starship Modification — one of the 5 categories (Engineering/Operation/Suite/Universal/Weapon). */
export default class StarshipModData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      price: makePriceSchema(),
      category: new StringField({ required: true, initial: "universal", choices: Object.keys(SW5E.modificationCategories) }),
      grade: new NumberField({ required: true, integer: true, min: 0, max: 5, initial: 0 }),
      slots: new NumberField({ required: false, integer: true, min: 1, initial: 1 }),
      equipped: new BooleanField({ required: false, initial: true }),
      prerequisite: new StringField({ required: false, blank: true, initial: "" }),
      suiteCapacity: new NumberField({ required: false, integer: true, nullable: true, initial: null }) // for category:"suite"
    };
  }
}
