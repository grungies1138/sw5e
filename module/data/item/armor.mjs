import { SW5E } from "../../config.mjs";
import { makeDescriptionSchema, makeSourceSchema, makePriceSchema } from "./base.mjs";

const { SchemaField, StringField, NumberField, BooleanField, ArrayField } = foundry.data.fields;

export default class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      price: makePriceSchema(),
      weight: new NumberField({ required: false, min: 0, initial: 0 }),
      equipped: new BooleanField({ required: false, initial: false }),
      proficient: new BooleanField({ required: false, initial: true }),
      type: new StringField({ required: true, initial: "light", choices: Object.keys(SW5E.armorTypes) }),
      armor: new SchemaField({
        value: new NumberField({ required: true, integer: true, initial: 10 }),
        dex: new NumberField({ required: false, integer: true, nullable: true, initial: null })
      }),
      strength: new NumberField({ required: false, integer: true, nullable: true, initial: null }), // minimum Str score
      stealthDisadvantage: new BooleanField({ required: false, initial: false }),
      bulky: new BooleanField({ required: false, initial: false }),
      properties: new ArrayField(new StringField()) // regulated, reactive N, rigid, silent, avoidant N, insulated N, reinforced, obscured, charging N, spiked (XdY), absorptive N, imbalanced, cumbersome, ...
    };
  }
}
