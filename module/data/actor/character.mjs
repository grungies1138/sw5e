import { SW5E } from "../../config.mjs";
import {
  makeAbilitiesSchema, makeCurrencySchema, makeBiographySchema,
  makeResourceSchema, makeMovementSchema
} from "../shared.mjs";

const { SchemaField, NumberField, StringField, BooleanField, ArrayField, DocumentUUIDField } = foundry.data.fields;

/**
 * System data for a Player Character.
 */
export default class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      abilities: makeAbilitiesSchema(),
      attributes: new SchemaField({
        hp: makeResourceSchema({ initialMax: 10 }),
        ac: new SchemaField({
          flat: new NumberField({ required: false, integer: true, nullable: true, initial: null }),
          calc: new StringField({ required: true, initial: "default" }),
          formula: new StringField({ required: false, blank: true, initial: "" })
        }),
        init: new SchemaField({
          bonus: new NumberField({ required: true, integer: true, initial: 0 })
        }),
        movement: makeMovementSchema(),
        death: new SchemaField({
          success: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          failure: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        exhaustion: new NumberField({ required: true, integer: true, min: 0, max: 6, initial: 0 })
      }),
      resources: new SchemaField({
        force: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          temp: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
          // known.value is derived live each prepareDerivedData from actually-owned
          // Force power items (never stale); known.max is written by the Character
          // Wizard from SW5E.powersKnown, same as maxPowerLevel from SW5E.powerMaxLevel.
          known: new SchemaField({
            value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
            max: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
          }),
          maxPowerLevel: new NumberField({ required: false, integer: true, min: 0, max: 9, initial: 0 })
        }),
        tech: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          temp: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
          known: new SchemaField({
            value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
            max: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
          }),
          maxPowerLevel: new NumberField({ required: false, integer: true, min: 0, max: 9, initial: 0 })
        }),
        superiority: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          max: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
          die: new StringField({ required: false, initial: "d6" }),
          // known.value is derived live from actually-owned Maneuver items;
          // known.max is written by the Character Wizard from SW5E.maneuversKnownProgression.
          known: new SchemaField({
            value: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
            max: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
          })
        })
      }),
      details: new SchemaField({
        biography: makeBiographySchema(),
        species: new StringField({ required: false, blank: true, initial: "" }),
        background: new StringField({ required: false, blank: true, initial: "" }),
        alignment: new StringField({ required: false, blank: true, initial: "" }), // light / dark / neutral, flavor only
        xp: new SchemaField({
          value: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
        }),
        level: new NumberField({ required: true, integer: true, min: 0, initial: 1 })
      }),
      skills: (() => {
        const obj = {};
        for (const key of Object.keys(SW5E.skills)) {
          obj[key] = new SchemaField({
            value: new NumberField({ required: true, initial: 0, choices: [0, 0.5, 1, 2] }), // 0 none, .5 half-prof, 1 prof, 2 expertise
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

  /* -------------------------------------------- */

  prepareBaseData() {
    for (const key of Object.keys(this.abilities)) {
      const abl = this.abilities[key];
      abl.mod = Math.floor((abl.value - 10) / 2);
    }
  }

  /* -------------------------------------------- */

  prepareDerivedData() {
    const rollData = this.parent.getRollData?.() ?? {};
    this.attributes.prof = Math.floor((this.details.level - 1) / 4) + 2;

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

    // Armor Class
    const dex = this.abilities.dex?.mod ?? 0;
    if (this.attributes.ac.calc === "flat" && this.attributes.ac.flat != null) {
      this.attributes.ac.value = this.attributes.ac.flat;
    } else {
      this.attributes.ac.value = 10 + dex;
    }

    this.attributes.init.total = (this.abilities.dex?.mod ?? 0) + this.attributes.init.bonus;

    // Encumbrance-lite: carrying capacity = Str score x 15 (SW5e keeps 5e's baseline multiplier)
    this.attributes.encumbrance = {
      max: (this.abilities.str?.value ?? 10) * 15
    };

    // Powers/maneuvers known -- the *current* count is always derived live
    // from actually-owned items (never stale even if items are added/removed
    // by hand); only known.max/maxPowerLevel are populated by the Character
    // Wizard, from SW5E.powersKnown/powerMaxLevel/maneuversKnownProgression.
    const items = this.parent.items ?? [];
    this.resources.force.known.value = items.filter(i => i.type === "power" && i.system.school !== "tech").length;
    this.resources.tech.known.value = items.filter(i => i.type === "power" && i.system.school === "tech").length;
    this.resources.superiority.known.value = items.filter(i => i.type === "maneuver").length;
  }
}
