import { SW5E } from "../../config.mjs";
import { makeDescriptionSchema, makeSourceSchema, makePriceSchema, makeDamagePartsField } from "./base.mjs";

const { SchemaField, StringField, NumberField, BooleanField, ArrayField } = foundry.data.fields;

export default class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      price: makePriceSchema(),
      weight: new NumberField({ required: false, min: 0, initial: 0 }),
      quantity: new NumberField({ required: false, integer: true, min: 0, initial: 1 }),
      equipped: new BooleanField({ required: false, initial: false }),
      proficient: new BooleanField({ required: false, initial: true }),
      category: new StringField({ required: true, initial: "blaster", choices: Object.keys(SW5E.weaponCategories) }),
      proficiencyTier: new StringField({ required: true, initial: "simple", choices: Object.keys(SW5E.weaponProficiencyTiers) }),
      actionType: new StringField({ required: true, initial: "rwak", choices: ["mwak", "rwak"] }), // melee / ranged weapon attack
      ability: new StringField({ required: false, blank: true, initial: "" }), // override; blank = auto (finesse-aware)
      attackBonus: new NumberField({ required: false, integer: true, initial: 0 }),
      critThreshold: new NumberField({ required: false, integer: true, min: 1, max: 20, initial: 20 }),
      damage: new SchemaField({ parts: makeDamagePartsField(), versatile: new StringField({ required: false, blank: true, initial: "" }) }),
      range: new SchemaField({
        value: new NumberField({ required: false, integer: true, nullable: true, initial: null }),
        long: new NumberField({ required: false, integer: true, nullable: true, initial: null }),
        units: new StringField({ required: false, initial: "ft" })
      }),
      properties: new ArrayField(new StringField()), // finesse, heavy, light, reach, thrown, two-handed, versatile, burst, double, ...
      ammo: new SchemaField({
        type: new StringField({ required: false, blank: true, initial: "" }),
        value: new NumberField({ required: false, integer: true, min: 0, nullable: true, initial: null })
      })
    };
  }
}
