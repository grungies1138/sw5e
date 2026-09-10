import { SW5E } from "../../config.mjs";
import { makeDescriptionSchema, makeSourceSchema } from "./base.mjs";

const { SchemaField, StringField, NumberField, BooleanField } = foundry.data.fields;

/**
 * A deployment "maneuver" — SW5e's collective term (per-deployment flavor
 * name: Tactic/Gambit/Technique/Stratagem/Disruption/Collaboration) for the
 * small pool of named tricks each crew role learns (2 at rank 1, +1 per rank
 * to 5 at rank 5). Mechanically identical across deployments: spend the
 * relevant Power Die (or, for the Mechanic, roll the Tech Die — which is NOT
 * expended), apply the named effect.
 */
export default class ShipManeuverData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      deployment: new StringField({ required: true, initial: "pilot", choices: Object.keys(SW5E.deployments) }),
      rankRequired: new NumberField({ required: true, integer: true, min: 1, max: 5, initial: 1 }),
      activation: new StringField({ required: false, initial: "action", choices: ["action", "bonus", "reaction", "special"] }),
      expendsPowerDie: new BooleanField({ required: false, initial: true }), // false for the Mechanic's Tech Die (not expended)
      formula: new StringField({ required: false, blank: true, initial: "" }) // e.g. "@powerDie" — resolved against actor roll data
    };
  }

  /** The power system pool this maneuver draws from (null for the Mechanic, who uses the Tech Die instead). */
  get powerSystem() {
    return SW5E.deployments[this.deployment]?.powerSystem ?? null;
  }
}
