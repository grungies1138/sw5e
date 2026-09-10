import { SW5E } from "../../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

export default class SW5eItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw5e", "sheet", "item"],
    position: { width: 560, height: 620 },
    window: { resizable: true },
    form: { handler: SW5eItemSheet.#onSubmit, submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    header: { template: "systems/sw5e/templates/item/parts/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    details: { template: "systems/sw5e/templates/item/parts/details.hbs" },
    description: { template: "systems/sw5e/templates/item/parts/description.hbs" }
  };

  tabGroups = { primary: "details" };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.config = SW5E;
    context.isGM = game.user.isGM;
    context.tabs = {
      details: { id: "details", group: "primary", label: "SW5E.TabDetails", active: this.tabGroups.primary === "details" },
      description: { id: "description", group: "primary", label: "SW5E.TabDescription", active: this.tabGroups.primary === "description" }
    };
    return context;
  }

  static async #onSubmit(event, form, formData) { await this.document.update(formData.object); }

  _onChangeTab(event, tabsElement, tab) {
    super._onChangeTab?.(event, tabsElement, tab);
    this.tabGroups.primary = tab;
  }
}
