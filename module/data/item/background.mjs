import { makeDescriptionSchema, makeSourceSchema } from "./base.mjs";
const { SchemaField, StringField, NumberField, ArrayField } = foundry.data.fields;

export default class BackgroundData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      // SW5e backgrounds grant proficiency in a fixed NUMBER of skills chosen
      // from a larger list of OPTIONS (e.g. "choose two from Deception,
      // Investigation, Lore, and Persuasion") rather than a fixed pair. This
      // system doesn't yet model the in-play pick for the player, so the
      // options are surfaced as reference text on the item sheet and the
      // player manually toggles their chosen skills as proficient on their
      // character sheet, same as they already do for every other skill.
      skillProficiencies: new SchemaField({
        number: new NumberField({ required: false, integer: true, min: 0, initial: 2 }),
        options: new ArrayField(new StringField())
      }),
      toolProficiencies: new ArrayField(new StringField()),
      // SW5e-specific addition (per "What's Different"): every background
      // also grants a choice of feat, typically drawn from an 8-option table
      // rather than a single fixed feat. As with skillProficiencies, the
      // options are reference text; the player adds whichever Feat item they
      // pick separately.
      grantedFeat: new SchemaField({
        number: new NumberField({ required: false, integer: true, min: 0, initial: 1 }),
        options: new ArrayField(new StringField())
      }),
      equipment: new StringField({ required: false, blank: true, initial: "" })
    };
  }
}
