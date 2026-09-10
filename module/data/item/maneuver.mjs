import { makeDescriptionSchema, makeSourceSchema, makeActivationSchema } from "./base.mjs";
const { StringField } = foundry.data.fields;

/** A character-scale combat Maneuver (Ch.13) — a shared pool usable by any class/archetype with superiority dice. */
export default class ManeuverData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      activation: makeActivationSchema(),
      savingThrow: new StringField({ required: false, blank: true, initial: "" }),
      prerequisite: new StringField({ required: false, blank: true, initial: "" }),
      type: new StringField({ required: true, initial: "general", choices: ["physical", "mental", "general"] })
    };
  }
}
