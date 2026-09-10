import { makeDescriptionSchema, makeSourceSchema } from "./base.mjs";
const { StringField, NumberField } = foundry.data.fields;

/** A named feature granted by a specific Archetype at a specific class level (e.g. "Fast and Agile", 3rd level). */
export default class ArchetypeFeatureData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      archetypeName: new StringField({ required: true, blank: true, initial: "" }),
      className: new StringField({ required: false, blank: true, initial: "" }),
      level: new NumberField({ required: true, integer: true, min: 1, max: 20, initial: 3 })
    };
  }
}
