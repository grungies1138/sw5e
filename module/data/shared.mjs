/**
 * Shared schema fragments reused across multiple Actor/Item DataModels.
 * Keeping these in one place means a change to (for example) how ability
 * scores are structured only has to happen once.
 */

const {
  SchemaField, NumberField, StringField, BooleanField, ArrayField,
  HTMLField, ObjectField, FilePathField, DocumentUUIDField
} = foundry.data.fields;

export const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

/**
 * Build the six-ability `SchemaField` shared by characters, NPCs, and
 * starships alike — SotG is explicit that starships use the same six
 * ability scores as characters (Str for Ram/Boost, Dex for Maneuvering/AC,
 * Con for Patch/Hull, Int for Astrogation/Probe, Wis for Scan, Cha for
 * Interfere/Disruption DC).
 * @returns {SchemaField}
 */
export function makeAbilitiesSchema() {
  const obj = {};
  for (const key of ABILITY_KEYS) {
    obj[key] = new SchemaField({
      value: new NumberField({ required: true, integer: true, min: 0, initial: 10 }),
      proficient: new NumberField({ required: true, initial: 0, min: 0, max: 2 }),
      max: new NumberField({ required: false, integer: true, initial: null, nullable: true }),
      bonuses: new SchemaField({
        check: new StringField({ required: false, blank: true, initial: "" }),
        save: new StringField({ required: false, blank: true, initial: "" })
      })
    });
  }
  return new SchemaField(obj);
}

export function makeCurrencySchema() {
  return new SchemaField({
    credits: new NumberField({ required: true, integer: true, min: 0, initial: 0 })
  });
}

export function makeBiographySchema() {
  return new SchemaField({
    value: new HTMLField({ required: false, initial: "" }),
    public: new HTMLField({ required: false, initial: "" })
  });
}

/**
 * A generic {value, min, max, temp, tempmax} resource pool shape, used for
 * Hit Points, Hull Points, Shield Points, Force Points, Tech Points, etc.
 */
export function makeResourceSchema({ initialMax = 0 } = {}) {
  return new SchemaField({
    value: new NumberField({ required: true, integer: true, initial: initialMax }),
    min: new NumberField({ required: true, integer: true, initial: 0 }),
    max: new NumberField({ required: true, integer: true, initial: initialMax }),
    temp: new NumberField({ required: false, integer: true, initial: 0 }),
    tempmax: new NumberField({ required: false, integer: true, initial: 0 })
  });
}

export function makeMovementSchema() {
  return new SchemaField({
    walk: new NumberField({ required: true, integer: true, min: 0, initial: 30 }),
    fly: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    swim: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    climb: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    burrow: new NumberField({ required: true, integer: true, min: 0, initial: 0 }),
    units: new StringField({ required: true, initial: "ft" }),
    hover: new BooleanField({ required: false, initial: false })
  });
}

export function makeDamagePartsField() {
  return new ArrayField(new SchemaField({
    formula: new StringField({ required: true, blank: true, initial: "" }),
    type: new StringField({ required: false, blank: true, initial: "" })
  }));
}

export function makeSourceSchema() {
  return new SchemaField({
    book: new StringField({ required: false, blank: true, initial: "" }),
    page: new StringField({ required: false, blank: true, initial: "" }),
    custom: new StringField({ required: false, blank: true, initial: "" })
  });
}
