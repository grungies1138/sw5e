import { SW5E } from "../../config.mjs";
import { confirmDelete } from "../utils.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * The Starship character sheet — the centerpiece of this system. Surfaces
 * the routed power-dice pools (central + five subsystems), the six crew
 * deployment slots, the universal Ship Actions, and the Hull/Shield/System
 * Damage tracks all in one place.
 */
export default class SW5eStarshipSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["sw5e", "sheet", "actor", "starship"],
    position: { width: 820, height: 920 },
    window: { resizable: true },
    actions: {
      startTurn: SW5eStarshipSheet.#onStartTurn,
      boost: SW5eStarshipSheet.#onBoost,
      detect: SW5eStarshipSheet.#onDetect,
      patch: SW5eStarshipSheet.#onPatch,
      regenShields: SW5eStarshipSheet.#onRegenShields,
      interfere: SW5eStarshipSheet.#onInterfere,
      helm: SW5eStarshipSheet.#onHelm,
      fire: SW5eStarshipSheet.#onFire,
      destructionSave: SW5eStarshipSheet.#onDestructionSave,
      useManeuver: SW5eStarshipSheet.#onUseManeuver,
      addCrew: SW5eStarshipSheet.#onAddCrew,
      removeCrew: SW5eStarshipSheet.#onRemoveCrew,
      claimSeat: SW5eStarshipSheet.#onClaimSeat,
      releaseSeat: SW5eStarshipSheet.#onReleaseSeat,
      reroute: SW5eStarshipSheet.#onReroute,
      itemEdit: SW5eStarshipSheet.#onItemEdit,
      itemDelete: SW5eStarshipSheet.#onItemDelete
    },
    form: { handler: SW5eStarshipSheet.#onSubmit, submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    header: { template: "systems/sw5e/templates/actor/parts/starship-header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    main: { template: "systems/sw5e/templates/actor/parts/starship-main.hbs", scrollable: [""] },
    power: { template: "systems/sw5e/templates/actor/parts/starship-power.hbs", scrollable: [""] },
    crew: { template: "systems/sw5e/templates/actor/parts/starship-crew.hbs", scrollable: [""] },
    actions: { template: "systems/sw5e/templates/actor/parts/starship-actions.hbs", scrollable: [""] },
    inventory: { template: "systems/sw5e/templates/actor/parts/starship-inventory.hbs", scrollable: [""] },
    biography: { template: "systems/sw5e/templates/actor/parts/biography.hbs", scrollable: [""] }
  };

  tabGroups = { primary: "main" };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    context.actor = actor;
    context.system = actor.system;
    context.config = SW5E;
    context.source = actor.toObject().system;

    context.tabs = {
      main: this.#tab("main", "SW5E.TabMain"),
      power: this.#tab("power", "SW5E.TabPower"),
      crew: this.#tab("crew", "SW5E.TabCrew"),
      actions: this.#tab("actions", "SW5E.TabActions"),
      inventory: this.#tab("inventory", "SW5E.TabInventory"),
      biography: this.#tab("biography", "SW5E.TabBiography")
    };

    context.weapons = actor.items.filter(i => i.type === "starshipweapon");
    context.mods = actor.items.filter(i => i.type === "starshipmod");
    context.equipment = actor.items.filter(i => i.type === "starshipequipment");
    context.maneuversByDeployment = {};
    for (const key of Object.keys(SW5E.deployments)) {
      context.maneuversByDeployment[key] = actor.items.filter(i => i.type === "shipmaneuver" && i.system.deployment === key);
    }
    context.crew = actor.system.crew.map((c, idx) => {
      const linkedActor = c.actorUuid ? actor.resolveCrewActor(c) : null;
      return {
        ...c,
        idx,
        deploymentLabel: SW5E.deployments[c.deployment]?.label,
        linkedActor,
        displayName: linkedActor ? linkedActor.name : c.name,
        linkedProf: linkedActor ? (linkedActor.system.attributes?.prof ?? 0) : null
      };
    });
    return context;
  }

  #tab(id, label) {
    return { id, group: "primary", label, active: this.tabGroups.primary === id, cssClass: this.tabGroups.primary === id ? "active" : "" };
  }

  /* -------------------------------------------- */
  /*  Action Handlers                              */
  /* -------------------------------------------- */

  static async #onStartTurn(event, target) { await this.actor.startShipTurn(); }
  static async #onBoost(event, target) { await this.actor.rollBoost(target.dataset.system); }
  static async #onDetect(event, target) { await this.actor.rollDetect(target.dataset.probe === "true"); }
  static async #onPatch(event, target) { await this.actor.rollPatch(); }
  static async #onRegenShields(event, target) { await this.actor.rollRegenerateShields(); }
  static async #onInterfere(event, target) { await this.actor.rollInterfere(); }
  static async #onHelm(event, target) { await this.actor.helmAction(target.dataset.sub); }
  static async #onFire(event, target) { await this.actor.fireWeapon(target.dataset.itemId); }
  static async #onDestructionSave(event, target) { await this.actor.rollDestructionSave(); }

  static async #onUseManeuver(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    await item?.useShipManeuver();
  }

  static async #onAddCrew(event, target) {
    const crew = foundry.utils.deepClone(this.actor.system.crew);
    crew.push({ actorUuid: null, name: game.i18n.localize("SW5E.NewCrewMember"), deployment: "pilot", rank: 1, isHelm: false });
    await this.actor.update({ "system.crew": crew });
  }

  static async #onRemoveCrew(event, target) {
    const idx = Number(target.dataset.idx);
    const crew = foundry.utils.deepClone(this.actor.system.crew);
    crew.splice(idx, 1);
    await this.actor.update({ "system.crew": crew });
  }

  /** Link this crew seat to the acting user's assigned character (`game.user.character`). */
  static async #onClaimSeat(event, target) {
    const idx = Number(target.dataset.idx);
    const character = game.user.character;
    if (!character) {
      ui.notifications?.warn(game.i18n.localize("SW5E.WarnNoAssignedCharacter"));
      return;
    }
    const crew = foundry.utils.deepClone(this.actor.system.crew);
    if (!crew[idx]) return;
    crew[idx].actorUuid = character.uuid;
    crew[idx].name = character.name;
    await this.actor.update({ "system.crew": crew });
  }

  /** Unlink this crew seat, reverting it to a manually-named entry. */
  static async #onReleaseSeat(event, target) {
    const idx = Number(target.dataset.idx);
    const crew = foundry.utils.deepClone(this.actor.system.crew);
    if (!crew[idx]) return;
    crew[idx].actorUuid = null;
    await this.actor.update({ "system.crew": crew });
  }

  static async #onReroute(event, target) {
    const sys = target.dataset.system;
    const active = this.actor.system.power.reroute.active && this.actor.system.power.reroute.target === sys;
    await this.actor.update({
      "system.power.reroute.active": !active,
      "system.power.reroute.target": active ? "" : sys
    });
  }

  static async #onItemEdit(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    item?.sheet?.render(true);
  }

  static async #onItemDelete(event, target) {
    const item = this.actor.items.get(target.dataset.itemId);
    if (!(await confirmDelete(item?.name))) return;
    await this.actor.deleteEmbeddedDocuments("Item", [target.dataset.itemId]);
  }

  static async #onSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }

  /** @override */
  _onChangeTab(event, tabsElement, tab) {
    super._onChangeTab?.(event, tabsElement, tab);
    this.tabGroups.primary = tab;
  }
}
