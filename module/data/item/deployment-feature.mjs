import { makeDescriptionSchema, makeSourceSchema } from "./base.mjs";
const { StringField, NumberField } = foundry.data.fields;

/** A named class-feature-like ability granted by a Deployment rank (e.g. "Uncanny Dodge", "Reroute Power"). */
export default class DeploymentFeatureData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: makeDescriptionSchema(),
      source: makeSourceSchema(),
      deployment: new StringField({ required: true, initial: "pilot" }),
      rank: new NumberField({ required: true, integer: true, min: 1, max: 5, initial: 1 })
    };
  }
}
