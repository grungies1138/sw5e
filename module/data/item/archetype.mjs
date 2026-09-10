import { makeDescriptionSchema, makeSourceSchema } from "./base.mjs";
const { StringField } = foundry.data.fields;

export default class ArchetypeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      className: new StringField({ required: false, blank: true, initial: "" })
    };
  }
}
