const { StringField } = foundry.data.fields;

/** Links a "starship" CombatantGroup to the Starship actor whose crew it represents. */
export default class StarshipGroupData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      shipUuid: new StringField({ required: false, blank: true, initial: "" })
    };
  }
}
