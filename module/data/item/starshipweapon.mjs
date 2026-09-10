import { SW5E } from "../../config.mjs";
import { makeDescriptionSchema, makeSourceSchema, makePriceSchema, makeDamagePartsField } from "./base.mjs";

const { SchemaField, StringField, NumberField, BooleanField, ArrayField } = foundry.data.fields;

/**
 * A starship weapon. Most entries are `role: "standalone"` — a complete,
 * self-contained weapon with its own damage (the vast majority of primary
 * and secondary batteries). SotG's own rules split tertiary/quaternary
 * ordnance into two separate catalog halves instead: a `role: "launcher"`
 * hardpoint item (Cluster Pod Launcher, Missile Launcher, Torpedo Launcher,
 * Bomb Deployer, and their Assault/Huge-ship variants — no inherent damage
 * of their own, just a reload capacity and an ammo family they accept) and
 * a `role: "ammo"` catalog entry for each type of ordnance that can be
 * loaded into one (Proton Torpedo, Concussion Missile, Bomblets, etc. —
 * these carry the actual damage/range/properties, and the rules give two
 * damage values per ammo type: one for a launcher on a Tiny-Large ship,
 * a bigger one — `damageHuge` — for a launcher on a Huge/Gargantuan ship).
 * `ammoFamily` is a plain matching label (e.g. "Torpedo Launcher") rather
 * than a document link, consistent with how every other reference-only
 * field in this system works — the player/GM matches launcher to ammo by
 * name and tracks what's loaded in `loadedAmmo`, same as manually applying
 * a chosen Background skill or Feat elsewhere in this system.
 */
export default class StarshipWeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      price: makePriceSchema(),
      category: new StringField({ required: true, initial: "primary", choices: Object.keys(SW5E.starshipWeaponCategories) }),
      hardpoint: new StringField({ required: true, initial: "fixed", choices: ["fixed", "turret"] }),
      equipped: new BooleanField({ required: false, initial: true }),
      role: new StringField({ required: true, initial: "standalone", choices: ["standalone", "launcher", "ammo"] }),
      ammoFamily: new StringField({ required: false, blank: true, initial: "" }), // launcher: what ammo it takes; ammo: what launcher it fits
      loadedAmmo: new StringField({ required: false, blank: true, initial: "" }), // launcher only: name of the currently-chambered ammo item
      attackBonus: new NumberField({ required: false, integer: true, initial: 0 }),
      damage: new SchemaField({ parts: makeDamagePartsField() }),
      damageHuge: new SchemaField({ parts: makeDamagePartsField() }), // ammo only: damage when loaded into a Huge/Gargantuan-ship launcher
      range: new SchemaField({
        value: new NumberField({ required: false, integer: true, nullable: true, initial: null }),
        long: new NumberField({ required: false, integer: true, nullable: true, initial: null }),
        units: new StringField({ required: false, initial: "ft" })
      }),
      properties: new ArrayField(new StringField()), // keys into SW5E.starshipWeaponProperties
      ammo: new SchemaField({
        value: new NumberField({ required: false, integer: true, min: 0, nullable: true, initial: null }),
        max: new NumberField({ required: false, integer: true, min: 0, nullable: true, initial: null })
      }),
      constitution: new NumberField({ required: false, integer: true, nullable: true, initial: null }) // the weapon's own "Con" install requirement
    };
  }
}
