import { SW5E } from "../../config.mjs";
import { makeDescriptionSchema, makeSourceSchema, makeActivationSchema, makeDamagePartsField } from "./base.mjs";

const { SchemaField, StringField, NumberField, BooleanField, ArrayField } = foundry.data.fields;

/**
 * A Force or Tech "power" (SW5e's rename of a spell). Casting costs
 * `SW5E.powerPointCosts[level]` points from the caster's Force or Tech pool
 * — there are no per-level slots. Force powers recover only on a long rest;
 * Tech powers recover on either a short or long rest (see CharacterActor).
 */
export default class PowerData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      school: new StringField({ required: true, initial: "universal", choices: Object.keys(SW5E.powerSchools) }),
      level: new NumberField({ required: true, integer: true, min: 0, max: 9, initial: 0 }),
      activation: makeActivationSchema(),
      range: new SchemaField({
        value: new NumberField({ required: false, integer: true, nullable: true, initial: null }),
        units: new StringField({ required: false, initial: "ft" })
      }),
      duration: new SchemaField({
        value: new StringField({ required: false, blank: true, initial: "" }),
        units: new StringField({ required: false, initial: "inst" })
      }),
      concentration: new BooleanField({ required: false, initial: false }),
      requiresFocus: new BooleanField({ required: false, initial: false }), // Tech powers require a tech focus; Force powers do not
      damage: new SchemaField({ parts: makeDamagePartsField() }),
      save: new SchemaField({
        ability: new StringField({ required: false, blank: true, initial: "" }),
        scaling: new StringField({ required: false, initial: "power" })
      }),
      prepared: new BooleanField({ required: false, initial: true })
    };
  }

  /** For Force powers: which ability governs the save DC / attack bonus. Universal lets the caster choose. */
  get castingAbility() {
    if (this.school === "tech") return "int";
    return SW5E.forceAlignmentAbility[this.school] ?? null;
  }

  get pointCost() {
    return SW5E.powerPointCosts[this.level] ?? 0;
  }
}
