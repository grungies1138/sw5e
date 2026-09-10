import { makeDescriptionSchema, makeSourceSchema, makeActivationSchema } from "./base.mjs";
const { SchemaField, StringField, NumberField, ArrayField } = foundry.data.fields;

export default class FeatData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      requirements: new StringField({ required: false, blank: true, initial: "" }),
      activation: makeActivationSchema(),
      // Reference-only, mirrors the choose-N-of-M pattern used for Background
      // skillProficiencies/grantedFeat: which ability score(s) this feat lets
      // its owner increase, and how many. Not auto-applied to the actor.
      abilityScoreIncrease: new SchemaField({
        number: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        options: new ArrayField(new StringField())
      })
    };
  }
}
