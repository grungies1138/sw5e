import { makeDescriptionSchema, makeSourceSchema } from "./base.mjs";
const { SchemaField, StringField, NumberField, ArrayField, BooleanField } = foundry.data.fields;

export default class SpeciesData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      size: new StringField({ required: true, initial: "med" }),
      speed: new SchemaField({
        walk: new NumberField({ required: true, integer: true, min: 0, initial: 30 }),
        fly: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        swim: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
        climb: new NumberField({ required: false, integer: true, min: 0, initial: 0 })
      }),
      abilityBonuses: new ArrayField(new SchemaField({
        ability: new StringField({ required: true, initial: "" }),
        value: new NumberField({ required: true, integer: true, initial: 1 })
      })),
      darkvision: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
      languages: new ArrayField(new StringField()),
      traits: new ArrayField(new SchemaField({
        name: new StringField({ required: true, initial: "" }),
        description: new StringField({ required: false, blank: true, initial: "" })
      })),
      isDroid: new BooleanField({ required: false, initial: false }),
      restricted: new BooleanField({ required: false, initial: false })
    };
  }
}
