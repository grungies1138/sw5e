import { SW5E } from "../../config.mjs";
import { confirmDelete } from "../utils.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export default class SW5eNpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw5e", "sheet", "actor", "npc"],
    position: { width: 680, height: 720 },
    window: { resizable: true },
    actions: {
      rollAbility: SW5eNpcSheet.#onRollAbility,
      rollSave: SW5eNpcSheet.#onRollSave,
      rollSkill: SW5eNpcSheet.#onRollSkill,
      itemRoll: SW5eNpcSheet.#onItemRoll,
      itemEdit: SW5eNpcSheet.#onItemEdit,
      itemDelete: SW5eNpcSheet.#onItemDelete,
      itemCreate: SW5eNpcSheet.#onItemCreate
    },
    form: { handler: SW5eNpcSheet.#onSubmit, submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    header: { template: "systems/sw5e/templates/actor/parts/npc-header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    main: { template: "systems/sw5e/templates/actor/parts/npc-main.hbs", scrollable: [""] },
    inventory: { template: "systems/sw5e/templates/actor/parts/character-inventory.hbs", scrollable: [""] },
    features: { template: "systems/sw5e/templates/actor/parts/npc-features.hbs", scrollable: [""] },
    biography: { template: "systems/sw5e/templates/actor/parts/biography.hbs", scrollable: [""] }
  };

  tabGroups = { primary: "main" };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.config = SW5E;
    context.tabs = {
      main: this.#tab("main", "SW5E.TabMain"),
      inventory: this.#tab("inventory", "SW5E.TabInventory"),
      features: this.#tab("features", "SW5E.TabFeatures"),
      biography: this.#tab("biography", "SW5E.TabBiography")
    };
    const feats = this.actor.items.filter(i => i.type === "feat");
    context.items = {
      weapons: this.actor.items.filter(i => i.type === "weapon"),
      gear: this.actor.items.filter(i => i.type === "gear"),
      feats,
      // Grouped for the Features tab so a monster's stat block reads the way
      // it does on the page: Traits (passive), Actions, Reactions, and
      // Legendary Actions, keyed off each feat's activation type.
      traits: feats.filter(i => i.system.activation?.type === "none"),
      actions: feats.filter(i => i.system.activation?.type === "action"),
      reactions: feats.filter(i => i.system.activation?.type === "reaction"),
      legendary: feats.filter(i => i.system.activation?.type === "special")
    };
    return context;
  }

  #tab(id, label) {
    return { id, group: "primary", label, active: this.tabGroups.primary === id, cssClass: this.tabGroups.primary === id ? "active" : "" };
  }

  static async #onRollAbility(event, target) { await this.actor.rollAbilityCheck(target.dataset.ability); }
  static async #onRollSave(event, target) { await this.actor.rollAbilitySave(target.dataset.ability); }
  static async #onRollSkill(event, target) { await this.actor.rollSkill(target.dataset.skill); }

  static async #onItemRoll(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!item) return;
    if (item.isWeapon) { await item.rollAttack(); await item.rollDamage(); }
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
    const type = target.dataset.type || "feat";
    await this.actor.createEmbeddedDocuments("Item", [{ name: game.i18n.localize("SW5E.NewItem"), type }]);
  }
  static async #onSubmit(event, form, formData) { await this.document.update(formData.object); }

  _onChangeTab(event, tabsElement, tab) {
    super._onChangeTab?.(event, tabsElement, tab);
    this.tabGroups.primary = tab;
  }
}
