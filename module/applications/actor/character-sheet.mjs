import { SW5E } from "../../config.mjs";
import { confirmDelete } from "../utils.mjs";
import SW5eCharacterWizard from "./character-wizard.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class SW5eCharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw5e", "sheet", "actor", "character"],
    position: { width: 760, height: 880 },
    window: { resizable: true },
    actions: {
      rollAbility: SW5eCharacterSheet.#onRollAbility,
      rollSave: SW5eCharacterSheet.#onRollSave,
      rollSkill: SW5eCharacterSheet.#onRollSkill,
      rollDeathSave: SW5eCharacterSheet.#onRollDeathSave,
      shortRest: SW5eCharacterSheet.#onShortRest,
      longRest: SW5eCharacterSheet.#onLongRest,
      itemRoll: SW5eCharacterSheet.#onItemRoll,
      itemEdit: SW5eCharacterSheet.#onItemEdit,
      itemDelete: SW5eCharacterSheet.#onItemDelete,
      itemCreate: SW5eCharacterSheet.#onItemCreate,
      openWizard: SW5eCharacterSheet.#onOpenWizard
    },
    form: { handler: SW5eCharacterSheet.#onSubmit, submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    header: { template: "systems/sw5e/templates/actor/parts/character-header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    main: { template: "systems/sw5e/templates/actor/parts/character-main.hbs", scrollable: [""] },
    inventory: { template: "systems/sw5e/templates/actor/parts/character-inventory.hbs", scrollable: [""] },
    powers: { template: "systems/sw5e/templates/actor/parts/character-powers.hbs", scrollable: [""] },
    features: { template: "systems/sw5e/templates/actor/parts/character-features.hbs", scrollable: [""] },
    biography: { template: "systems/sw5e/templates/actor/parts/biography.hbs" }
  };

  tabGroups = { primary: "main" };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    context.actor = actor;
    context.system = actor.system;
    context.config = SW5E;
    context.tabs = {
      main: this.#tab("main", "SW5E.TabMain"),
      inventory: this.#tab("inventory", "SW5E.TabInventory"),
      powers: this.#tab("powers", "SW5E.TabPowers"),
      features: this.#tab("features", "SW5E.TabFeatures"),
      biography: this.#tab("biography", "SW5E.TabBiography")
    };
    context.items = {
      weapons: actor.items.filter(i => i.type === "weapon"),
      armor: actor.items.filter(i => i.type === "armor" || i.type === "shield"),
      gear: actor.items.filter(i => i.type === "gear"),
      forcePowers: actor.items.filter(i => i.type === "power" && i.system.school !== "tech"),
      techPowers: actor.items.filter(i => i.type === "power" && i.system.school === "tech"),
      maneuvers: actor.items.filter(i => i.type === "maneuver"),
      feats: actor.items.filter(i => i.type === "feat"),
      customizationOptions: actor.items.filter(i => i.type === "customizationOption"),
      classes: actor.items.filter(i => i.type === "class"),
      archetypes: actor.items.filter(i => i.type === "archetype"),
      species: actor.items.filter(i => i.type === "species"),
      backgrounds: actor.items.filter(i => i.type === "background")
    };
    return context;
  }

  #tab(id, label) {
    return { id, group: "primary", label, active: this.tabGroups.primary === id, cssClass: this.tabGroups.primary === id ? "active" : "" };
  }

  static async #onRollAbility(event, target) { await this.actor.rollAbilityCheck(target.dataset.ability); }
  static async #onRollSave(event, target) { await this.actor.rollAbilitySave(target.dataset.ability); }
  static async #onRollSkill(event, target) { await this.actor.rollSkill(target.dataset.skill); }
  static async #onRollDeathSave(event, target) { await this.actor.rollDeathSave(); }
  static async #onShortRest(event, target) { await this.actor.rest({ long: false }); }
  static async #onLongRest(event, target) { await this.actor.rest({ long: true }); }

  static async #onItemRoll(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!item) return;
    if (item.type === "power") await item.rollPower();
    else if (item.isWeapon) { await item.rollAttack(); await item.rollDamage(); }
    else {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        content: `<h3>${item.name}</h3><p>${item.system.description?.chat || item.system.description?.value || ""}</p>`
      });
    }
  }

  static async #onItemEdit(event, target) { this.actor.items.get(target.dataset.itemId)?.sheet?.render(true); }
  static async #onItemDelete(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!(await confirmDelete(item?.name))) return;
    await this.actor.deleteEmbeddedDocuments("Item", [target.dataset.itemId]);
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type || "gear";
    await this.actor.createEmbeddedDocuments("Item", [{ name: game.i18n.localize("SW5E.NewItem"), type }]);
  }

  static async #onSubmit(event, form, formData) { await this.document.update(formData.object); }

  static #onOpenWizard(event, target) { new SW5eCharacterWizard(this.actor).render(true); }

  _onChangeTab(event, tabsElement, tab) {
    super._onChangeTab?.(event, tabsElement, tab);
    this.tabGroups.primary = tab;
  }
}
