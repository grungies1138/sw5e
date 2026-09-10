import { makeDescriptionSchema, makeSourceSchema } from "./base.mjs";
const { SchemaField, StringField, NumberField, ArrayField } = foundry.data.fields;

export default class ClassData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      levels: new NumberField({ required: true, integer: true, min: 1, max: 20, initial: 1 }),
      hitDice: new StringField({ required: true, initial: "d8" }),
      // Verified against the official sw5e-foundry system's own class data
      // (github.com/sw5e-foundry/sw5e): this project previously called
      // Sentinel's tier "twothirds" and used a "maneuver" value here for
      // Scholar, but the real tier is three-quarters casting, and maneuver
      // progression is its own separate axis (see maneuverProgression below)
      // -- Fighter has none of *this* progression but does get maneuvers.
      casterProgression: new StringField({ required: false, initial: "none", choices: ["none", "half", "threequarters", "full"] }),
      // Which point pool casterProgression above advances. "none" for a
      // class that casts no powers at all (even if it has maneuvers).
      castingSchool: new StringField({ required: false, initial: "none", choices: ["none", "force", "tech"] }),
      castingAbility: new StringField({ required: false, blank: true, initial: "" }),
      // Superiority/maneuver progression -- independent of power casting
      // (e.g. Fighter: half maneuver progression, no power casting at all).
      maneuverProgression: new StringField({ required: false, initial: "none", choices: ["none", "half", "full"] }),
      primaryAbility: new ArrayField(new StringField()),
      savingThrows: new ArrayField(new StringField()),
      skillChoices: new SchemaField({
        number: new NumberField({ required: false, integer: true, min: 0, initial: 2 }),
        options: new ArrayField(new StringField())
      }),
      archetypeLevel: new NumberField({ required: false, integer: true, initial: 3 }),
      // Levels at which this class grants an Ability Score Improvement (2
      // points: +2 to one ability, or +1/+1 to two -- or a Feat instead).
      // Verified against the official sw5e-foundry system's class advancement
      // data (github.com/sw5e-foundry/sw5e): every class uses the 5e-standard
      // 4/8/12/16/19 progression except Fighter (bonus ASIs at 6 and 14) and
      // Monk/Operative (bonus ASI at 10), matching their 5e Fighter/Monk/Rogue
      // analogues. Drives the Character Wizard's automatic ASI-vs-Feat step.
      asiLevels: new ArrayField(new NumberField({ required: true, integer: true, min: 1, max: 20 }))
    };
  }
}
