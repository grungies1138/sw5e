import { makeDescriptionSchema, makeSourceSchema } from "./base.mjs";
const { StringField } = foundry.data.fields;

/**
 * A named option from the PHB/Wretched Hives "Customization Options" chapter —
 * one of the choices a gateway feat (Fighting Stylist, Fighting Master,
 * Weapon Focused, Weapon Supremacist, Formfighting Dabbler, Class Improvement,
 * Multiclass Improvement, Splashclass Improvement) lets a character pick from.
 * Mechanically these are all just named passive text benefits; the `category`
 * field is what the site (and this pack) groups them by.
 */
export default class CustomizationOptionData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      category: new StringField({
        required: true,
        initial: "fightingStyle",
        choices: [
          "fightingStyle",
          "fightingMastery",
          "lightsaberForm",
          "weaponFocus",
          "weaponSupremacy",
          "classImprovement",
          "multiclassImprovement",
          "splashclassImprovement"
        ]
      }),
      // Free text: e.g. "At least 3 levels in berserker", "The ability to cast force powers".
      // Blank for the fighting styles/masteries/weapon focuses/supremacies, which have none.
      // Named to match FeatData's equivalent field.
      requirements: new StringField({ required: false, blank: true, initial: "" }),
      // Populated only for the three per-class Improvement categories (Berserker, Consular, ...).
      className: new StringField({ required: false, blank: true, initial: "" })
    };
  }
}
