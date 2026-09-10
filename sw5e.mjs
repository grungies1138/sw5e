import { SW5E } from "./module/config.mjs";

import CharacterData from "./module/data/actor/character.mjs";
import NpcData from "./module/data/actor/npc.mjs";
import StarshipData from "./module/data/actor/starship.mjs";
import StarshipGroupData from "./module/data/combatant-group/starship.mjs";

import SpeciesData from "./module/data/item/species.mjs";
import BackgroundData from "./module/data/item/background.mjs";
import FeatData from "./module/data/item/feat.mjs";
import ClassData from "./module/data/item/class.mjs";
import ArchetypeData from "./module/data/item/archetype.mjs";
import ArchetypeFeatureData from "./module/data/item/archetype-feature.mjs";
import DeploymentFeatureData from "./module/data/item/deployment-feature.mjs";
import PowerData from "./module/data/item/power.mjs";
import ManeuverData from "./module/data/item/maneuver.mjs";
import ShipManeuverData from "./module/data/item/shipmaneuver.mjs";
import WeaponData from "./module/data/item/weapon.mjs";
import ArmorData from "./module/data/item/armor.mjs";
import ShieldData from "./module/data/item/shield.mjs";
import GearData from "./module/data/item/gear.mjs";
import StarshipModData from "./module/data/item/starshipmod.mjs";
import StarshipWeaponData from "./module/data/item/starshipweapon.mjs";
import StarshipEquipmentData from "./module/data/item/starship-equipment.mjs";
import CustomizationOptionData from "./module/data/item/customization-option.mjs";

import SW5eActor from "./module/documents/actor.mjs";
import SW5eItem from "./module/documents/item.mjs";
import SW5eCombat from "./module/documents/combat.mjs";
import SW5eCombatant from "./module/documents/combatant.mjs";
import SW5eCombatantGroup from "./module/documents/combatant-group.mjs";

import SW5eD20Roll from "./module/dice/d20-roll.mjs";
import SW5eDamageRoll from "./module/dice/damage-roll.mjs";

import SW5eCharacterSheet from "./module/applications/actor/character-sheet.mjs";
import SW5eNpcSheet from "./module/applications/actor/npc-sheet.mjs";
import SW5eStarshipSheet from "./module/applications/actor/starship-sheet.mjs";
import SW5eItemSheet from "./module/applications/item/item-sheet.mjs";

globalThis.SW5E = SW5E;

Hooks.once("init", () => {
  console.log("SW5E | Initializing the Star Wars 5e game system");

  game.sw5e = { config: SW5E };
  CONFIG.SW5E = SW5E;

  // Document classes
  CONFIG.Actor.documentClass = SW5eActor;
  CONFIG.Item.documentClass = SW5eItem;
  CONFIG.Combat.documentClass = SW5eCombat;
  CONFIG.Combatant.documentClass = SW5eCombatant;
  CONFIG.CombatantGroup.documentClass = SW5eCombatantGroup;

  // Dice -- must be registered in the CONFIG.Dice.rolls array (not as bare
  // properties on CONFIG.Dice) so Roll.fromData() can find these classes by
  // name when Foundry rehydrates stored rolls (e.g. re-rendering old chat
  // messages on world load). Without this, every previously-created
  // SW5eD20Roll/SW5eDamageRoll chat message throws "Unable to recreate ...
  // instance from provided data" on load.
  CONFIG.Dice.rolls.push(SW5eD20Roll, SW5eDamageRoll);

  // Actor DataModels
  CONFIG.Actor.dataModels.character = CharacterData;
  CONFIG.Actor.dataModels.npc = NpcData;
  CONFIG.Actor.dataModels.starship = StarshipData;
  CONFIG.Actor.trackableAttributes = {
    character: { bar: ["attributes.hp"], value: ["details.xp.value"] },
    npc: { bar: ["attributes.hp"], value: [] },
    starship: { bar: ["hull", "shield"], value: [] }
  };

  // CombatantGroup DataModels
  CONFIG.CombatantGroup.dataModels.starship = StarshipGroupData;

  // Item DataModels
  Object.assign(CONFIG.Item.dataModels, {
    species: SpeciesData,
    background: BackgroundData,
    feat: FeatData,
    class: ClassData,
    archetype: ArchetypeData,
    archetypeFeature: ArchetypeFeatureData,
    deploymentFeature: DeploymentFeatureData,
    power: PowerData,
    maneuver: ManeuverData,
    shipmaneuver: ShipManeuverData,
    weapon: WeaponData,
    armor: ArmorData,
    shield: ShieldData,
    gear: GearData,
    starshipmod: StarshipModData,
    starshipweapon: StarshipWeaponData,
    starshipequipment: StarshipEquipmentData,
    customizationOption: CustomizationOptionData
  });

  // Sheets
  DocumentSheetConfig.registerSheet(Actor, "sw5e", SW5eCharacterSheet, { types: ["character"], makeDefault: true, label: "SW5E.SheetClassCharacter" });
  DocumentSheetConfig.registerSheet(Actor, "sw5e", SW5eNpcSheet, { types: ["npc"], makeDefault: true, label: "SW5E.SheetClassNpc" });
  DocumentSheetConfig.registerSheet(Actor, "sw5e", SW5eStarshipSheet, { types: ["starship"], makeDefault: true, label: "SW5E.SheetClassStarship" });
  DocumentSheetConfig.registerSheet(Item, "sw5e", SW5eItemSheet, { makeDefault: true, label: "SW5E.SheetClassItem" });

  registerHandlebarsHelpers();
});

/* -------------------------------------------- */
/*  Preload Templates                            */
/* -------------------------------------------- */

Hooks.once("setup", async () => {
  const paths = [
    "systems/sw5e/templates/actor/parts/character-header.hbs",
    "systems/sw5e/templates/actor/parts/character-main.hbs",
    "systems/sw5e/templates/actor/parts/character-inventory.hbs",
    "systems/sw5e/templates/actor/parts/character-powers.hbs",
    "systems/sw5e/templates/actor/parts/character-features.hbs",
    "systems/sw5e/templates/actor/parts/npc-header.hbs",
    "systems/sw5e/templates/actor/parts/npc-main.hbs",
    "systems/sw5e/templates/actor/parts/npc-features.hbs",
    "systems/sw5e/templates/actor/parts/starship-header.hbs",
    "systems/sw5e/templates/actor/parts/starship-main.hbs",
    "systems/sw5e/templates/actor/parts/starship-power.hbs",
    "systems/sw5e/templates/actor/parts/starship-crew.hbs",
    "systems/sw5e/templates/actor/parts/starship-actions.hbs",
    "systems/sw5e/templates/actor/parts/starship-inventory.hbs",
    "systems/sw5e/templates/actor/parts/biography.hbs",
    "systems/sw5e/templates/item/parts/header.hbs",
    "systems/sw5e/templates/item/parts/details.hbs",
    "systems/sw5e/templates/item/parts/description.hbs",
    "systems/sw5e/templates/apps/character-wizard.hbs"
  ];
  await foundry.applications.handlebars.loadTemplates(paths);
});

/* -------------------------------------------- */
/*  Ship-Group Initiative Sync                   */
/* -------------------------------------------- */

Hooks.on("updateCombatant", (combatant, changes) => {
  if (!("initiative" in changes)) return;
  const group = combatant.group;
  if (group instanceof SW5eCombatantGroup) group.recalculateInitiative();
});

/* -------------------------------------------- */
/*  Restricted (GM-Only) Species                 */
/* -------------------------------------------- */

// A species item flagged system.restricted stays visible and usable in the
// compendium (for the GM's own NPCs, or to hand-place on a character), but
// cannot be dragged or otherwise added as a new embedded Item by anyone who
// isn't a GM. This only gates *adding* the item -- it doesn't touch or strip
// a restricted species a GM has already placed on a character.
Hooks.on("preCreateItem", (item, data, options, userId) => {
  if (game.user.isGM) return true;
  if (data.type !== "species") return true;
  if (!(data.system?.restricted ?? item.system?.restricted)) return true;

  ui.notifications.warn(
    game.i18n.format("SW5E.RestrictedSpeciesWarning", { species: data.name ?? item.name })
  );
  return false;
});

/* -------------------------------------------- */
/*  Species/Background Header Sync               */
/* -------------------------------------------- */

// The character sheet's header shows free-text "Species" and "Background"
// fields (system.details.species / system.details.background) separate from
// the embedded species/background Items that actually grant traits and
// features -- dropping one of those items onto a character updates the
// Features tab list, but previously left the header text untouched. These
// hooks keep the header in sync automatically: whenever a species or
// background Item is added to, removed from, or renamed on a Character, the
// matching header field is recomputed from the actor's current embedded
// items of that type (joined with " / " for the rare case of more than one,
// e.g. a half-species build). The header field stays a plain, editable text
// input, so a GM can still overwrite it by hand afterward if they want
// something the auto-sync wouldn't produce.
function syncActorDetailFromItems(actor, itemType) {
  if (!actor || actor.type !== "character") return;
  const value = actor.items.filter(i => i.type === itemType).map(i => i.name).join(" / ");
  if (actor.system.details[itemType] === value) return;
  actor.update({ [`system.details.${itemType}`]: value });
}

for (const hookName of ["createItem", "deleteItem"]) {
  Hooks.on(hookName, (item, options, userId) => {
    if (userId !== game.user.id) return;
    if (!["species", "background"].includes(item.type)) return;
    syncActorDetailFromItems(item.parent, item.type);
  });
}

Hooks.on("updateItem", (item, changes, options, userId) => {
  if (userId !== game.user.id) return;
  if (!("name" in changes)) return;
  if (!["species", "background"].includes(item.type)) return;
  syncActorDetailFromItems(item.parent, item.type);
});

/* -------------------------------------------- */
/*  Handlebars Helpers                           */
/* -------------------------------------------- */

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("sw5eLabel", key => game.i18n.localize(key ?? ""));
  Handlebars.registerHelper("sw5eSigned", value => {
    const n = Number(value) || 0;
    return n >= 0 ? `+${n}` : `${n}`;
  });
  Handlebars.registerHelper("sw5eEq", (a, b) => a === b);
  Handlebars.registerHelper("sw5eGte", (a, b) => Number(a) >= Number(b));
  Handlebars.registerHelper("concat", (...args) => args.slice(0, -1).join(""));
  Handlebars.registerHelper("sw5eSkillNames", codes =>
    (codes ?? []).map(c => game.i18n.localize(SW5E.skills[c]?.label ?? c)).join(", "));
  Handlebars.registerHelper("sw5eAbilityNames", codes =>
    (codes ?? []).map(c => game.i18n.localize(SW5E.abilities[c]?.label ?? c)).join(", "));
  Handlebars.registerHelper("sw5eAbilityBonuses", bonuses =>
    (bonuses ?? []).map(b => {
      const abbr = game.i18n.localize(SW5E.abilities[b.ability]?.abbreviation ?? b.ability);
      const n = Number(b.value) || 0;
      return `${abbr} ${n >= 0 ? "+" : ""}${n}`;
    }).join(", "));
  Handlebars.registerHelper("sw5eJoin", (list, sep) =>
    (list ?? []).join(typeof sep === "string" ? sep : ", "));
  Handlebars.registerHelper("sw5ePercent", (value, max) => {
    if (!max) return 0;
    return Math.round((Number(value) / Number(max)) * 100);
  });
}
