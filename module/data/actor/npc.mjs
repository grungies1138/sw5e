import { SW5E } from "../../config.mjs";
import { makeAbilitiesSchema, makeCurrencySchema, makeBiographySchema, makeResourceSchema, makeMovementSchema } from "../shared.mjs";

const { SchemaField, NumberField, StringField, ArrayField } = foundry.data.fields;

/**
 * System data for an NPC (character-scale). NPC "Challenge Rating" is
 * inherited unmodified from core 5e math — SW5e only flags the *starship*
 * encounter-rating system as unfinished (see StarshipData), not the
 * character-scale one.
 */
export default class NpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      abilities: makeAbilitiesSchema(),
      attributes: new SchemaField({
        hp: makeResourceSchema({ initialMax: 10 }),
        ac: new SchemaField({
          flat: new NumberField({ required: false, integer: true, nullable: true, initial: 10 }),
          calc: new StringField({ required: true, initial: "flat" }),
          formula: new StringField({ required: false, blank: true, initial: "" })
        }),
        init: new SchemaField({ bonus: new NumberField({ required: true, integer: true, initial: 0 }) }),
        movement: makeMovementSchema(),
        prof: new NumberField({ required: true, integer: true, initial: 2 })
      }),
      details: new SchemaField({
        biography: makeBiographySchema(),
        type: new StringField({ required: false, blank: true, initial: "" }),
        cr: new NumberField({ required: true, initial: 0, min: 0 }),
        xp: new SchemaField({ value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }) }),
        source: new StringField({ required: false, blank: true, initial: "" })
      }),
      skills: (() => {
        const obj = {};
        for (const key of Object.keys(SW5E.skills)) {
          obj[key] = new SchemaField({
            value: new NumberField({ required: true, initial: 0, choices: [0, 0.5, 1, 2] }),
            ability: new StringField({ required: true, initial: SW5E.skills[key].ability }),
            bonus: new StringField({ required: false, blank: true, initial: "" })
          });
        }
        return new SchemaField(obj);
      })(),
      traits: new SchemaField({
        size: new StringField({ required: true, initial: "med" }),
        di: new SchemaField({ value: new ArrayField(new StringField()), custom: new StringField({ blank: true, initial: "" }) }),
        dr: new SchemaField({ value: new ArrayField(new StringField()), custom: new StringField({ blank: true, initial: "" }) }),
        dv: new SchemaField({ value: new ArrayField(new StringField()), custom: new StringField({ blank: true, initial: "" }) }),
        languages: new SchemaField({ value: new ArrayField(new StringField()), custom: new StringField({ blank: true, initial: "" }) })
      }),
      currency: makeCurrencySchema()
    };
  }

  prepareBaseData() {
    for (const key of Object.keys(this.abilities)) {
      const abl = this.abilities[key];
      abl.mod = Math.floor((abl.value - 10) / 2);
    }
  }

  prepareDerivedData() {
    for (const key of Object.keys(this.abilities)) {
      const abl = this.abilities[key];
      abl.save = abl.mod + (abl.proficient ? this.attributes.prof : 0);
    }
    for (const key of Object.keys(this.skills)) {
      const skl = this.skills[key];
      const abl = this.abilities[skl.ability];
      const profMult = skl.value === 0.5 ? 0.5 : (skl.value >= 1 ? skl.value : 0);
      skl.mod = (abl?.mod ?? 0) + Math.floor(this.attributes.prof * profMult);
    }
    if (this.attributes.ac.calc === "flat" && this.attributes.ac.flat != null) {
      this.attributes.ac.value = this.attributes.ac.flat;
    } else {
      this.attributes.ac.value = 10 + (this.abilities.dex?.mod ?? 0);
    }
    this.attributes.init.total = (this.abilities.dex?.mod ?? 0) + this.attributes.init.bonus;
  }
}
