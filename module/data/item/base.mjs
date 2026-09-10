const { SchemaField, HTMLField, StringField, NumberField, BooleanField, ArrayField } = foundry.data.fields;

/** Shared by virtually every Item sub-type. */
export function makeDescriptionSchema() {
  return new SchemaField({
    value: new HTMLField({ required: false, initial: "" }),
    chat: new HTMLField({ required: false, initial: "" })
  });
}

export function makeSourceSchema() {
  return new StringField({ required: false, blank: true, initial: "" });
}

export function makePriceSchema() {
  return new SchemaField({
    value: new NumberField({ required: false, integer: true, min: 0, initial: 0 }),
    denomination: new StringField({ required: false, initial: "credits" })
  });
}

export function makeActivationSchema() {
  return new SchemaField({
    type: new StringField({ required: false, initial: "action", choices: ["action", "bonus", "reaction", "special", "none"] }),
    cost: new NumberField({ required: false, integer: true, min: 0, initial: 1 })
  });
}

export function makeDamagePartsField() {
  return new ArrayField(new SchemaField({
    formula: new StringField({ required: true, blank: true, initial: "" }),
    type: new StringField({ required: false, blank: true, initial: "" })
  }));
}
