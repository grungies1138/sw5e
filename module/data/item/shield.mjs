import { makeDescriptionSchema, makeSourceSchema, makePriceSchema } from "./base.mjs";
const { SchemaField, StringField, NumberField, BooleanField, ArrayField } = foundry.data.fields;

/** A personal (character-scale) shield: light/medium/heavy tier, physical or generator variant. */
export default class ShieldData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      price: makePriceSchema(),
      weight: new NumberField({ required: false, min: 0, initial: 0 }),
      equipped: new BooleanField({ required: false, initial: false }),
      tier: new StringField({ required: true, initial: "light", choices: ["light", "medium", "heavy"] }),
      variant: new StringField({ required: true, initial: "physical", choices: ["physical", "generator"] }),
      acBonus: new NumberField({ required: true, integer: true, initial: 1 }),
      strength: new NumberField({ required: false, integer: true, nullable: true, initial: null }), // minimum Str score
      requiresFreeHand: new BooleanField({ required: false, initial: false }),
      obtrusive: new BooleanField({ required: false, initial: false }),
      properties: new ArrayField(new StringField()) // spiked (XdY), absorptive N, imbalanced, charging N, cumbersome, ...
    };
  }
}
