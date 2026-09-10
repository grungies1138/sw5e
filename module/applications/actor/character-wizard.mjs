import { SW5E } from "../../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

/** Ability-score point-buy cost table (5e/SW5e standard: 27 points, scores 8-15). */
const POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const POINT_BUY_BUDGET = 27;
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

/**
 * Every class the actor has (or will have) once the pending Class & Level
 * change is applied, with `levels` reflecting the pending value rather than
 * the currently-stored one. Each class's mechanical fields (castingSchool,
 * casterProgression, castingAbility, maneuverProgression) are re-read from
 * the *current* sw5e.classes compendium doc rather than trusted from the
 * embedded Item, so a class item created before this project's data model
 * gained these fields doesn't silently read as "none" from stale/missing data.
 */
function effectiveClasses(actor, allClasses, touchedItemId, touchedNewLevel, pendingNewClassDoc) {
  const result = [];
  for (const item of actor.items.filter(i => i.type === "class")) {
    const doc = allClasses.find(c => c.name === item.name);
    const levels = (touchedItemId && item.id === touchedItemId) ? touchedNewLevel : item.system.levels;
    result.push({ name: item.name, levels, sys: doc?.system ?? item.system });
  }
  if (pendingNewClassDoc && !result.some(r => r.name === pendingNewClassDoc.name)) {
    result.push({ name: pendingNewClassDoc.name, levels: touchedNewLevel, sys: pendingNewClassDoc.system });
  }
  return result;
}

/**
 * Powers-known / point-pool-base / max-castable-level for one pool ("force"
 * or "tech"), summed across every contributing class -- the same algorithm
 * (including the multiclass "combined caster level" rule) as the official
 * sw5e-foundry system's Actor#_prepareBasePowercasting, driven by the
 * verified SW5E.powersKnown/powerMaxLevel/powerPointsBase tables.
 */
function computePowerProgression(classes, school) {
  const relevant = classes.filter(c => c.sys.castingSchool === school && c.sys.casterProgression && c.sys.casterProgression !== "none");
  if (!relevant.length) return { knownMax: 0, pointsBase: 0, maxPowerLevel: 0, castingAbility: null };
  let knownMax = 0, pointsBase = 0, casterLevelSum = 0, dominant = null;
  for (const c of relevant) {
    const tier = c.sys.casterProgression;
    knownMax += SW5E.powersKnown[school]?.[tier]?.[c.levels] ?? 0;
    pointsBase += c.levels * (SW5E.powerPointsBase[tier] ?? 0);
    casterLevelSum += c.levels * ((SW5E.powerMaxLevel[tier]?.[20] ?? 0) / 9);
    if (!dominant || c.levels > dominant.levels) dominant = c;
  }
  casterLevelSum = Math.round(casterLevelSum);
  const maxPowerLevel = relevant.length === 1
    ? (SW5E.powerMaxLevel[dominant.sys.casterProgression]?.[dominant.levels] ?? 0)
    : (SW5E.powerMaxLevel.full?.[Math.min(20, Math.max(0, casterLevelSum))] ?? 0);
  if (school === "tech") pointsBase = Math.round(pointsBase / 2); // Tech Points are consistently the smaller pool in published SW5e.
  return { knownMax, pointsBase, maxPowerLevel, castingAbility: dominant?.sys.castingAbility || null };
}

/**
 * Maneuvers-known / superiority-dice-max / superiority-die-size for the
 * whole actor, summed across every contributing class via each class's own
 * "effective maneuver level" (levels x its maneuverProgression multiplier,
 * 1/0.5/0 for full/half/none) -- the same algorithm as the official system's
 * Actor#_prepareBaseSuperiority, driven by the verified
 * SW5E.maneuversKnownProgression/superiorityDice*Progression tables.
 */
function computeManeuverProgression(classes) {
  let effLevel = 0;
  for (const c of classes) {
    const tier = c.sys.maneuverProgression;
    const mult = tier === "full" ? 1 : (tier === "half" ? 0.5 : 0);
    effLevel += c.levels * mult;
  }
  effLevel = Math.max(0, Math.min(20, Math.round(effLevel)));
  return {
    knownMax: SW5E.maneuversKnownProgression[effLevel] ?? 0,
    diceMax: SW5E.superiorityDiceQuantProgression[effLevel] ?? 0,
    die: SW5E.superiorityDieSizeProgression[effLevel] || ""
  };
}

/**
 * Character Creator / Level-Up Wizard.
 *
 * A guided, single-page form (opened from the character sheet header) that
 * walks a GM/player through building a new character or leveling up an
 * existing one. It auto-embeds whatever the compendium data says is
 * unconditional (the Species/Background/Class/Archetype items themselves,
 * their fixed ability/language/speed grants, and any Archetype Feature items
 * unlocked by the level being reached) and surfaces a form control for every
 * point the rules actually require a choice (ability scores, background
 * skill/feat picks, class starting-skill picks, archetype selection, the
 * Ability-Score-Improvement-vs-Feat choice at each of the class's ASI
 * levels, and which newly-unlocked Force/Tech Powers or Superiority
 * Maneuvers to learn). Powers-known/points, max castable power level, and
 * maneuvers-known/superiority-dice are all computed from the verified
 * SW5E.powersKnown/powerMaxLevel/powerPointsBase/maneuversKnownProgression/
 * superiorityDice*Progression tables (see config.mjs) -- sourced from the
 * official sw5e-foundry system, not invented for this project.
 *
 * Explicitly NOT automated (left exactly as manual as it is today,
 * documented rather than silently skipped): starting equipment, since a
 * Background's `equipment` field is free text, not structured items.
 */
export default class SW5eCharacterWizard extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    const abilities = {};
    for (const key of Object.keys(SW5E.abilities)) abilities[key] = actor.system.abilities[key]?.value ?? 10;
    this.state = {
      abilityMethod: "manual",
      abilities,
      standardArray: { str: "", dex: "", con: "", int: "", wis: "", cha: "" },
      speciesUuid: "",
      backgroundUuid: "",
      bgSkill: {},
      bgFeat: {},
      classMode: actor.items.some(i => i.type === "class") ? "existing" : "new",
      classItemId: "",
      newClassUuid: "",
      targetLevel: 1,
      classSkill: {},
      archetypeUuid: "",
      asi: {},
      powerPick: { force: {}, tech: {} },
      maneuverPick: {}
    };
  }

  static DEFAULT_OPTIONS = {
    id: "sw5e-character-wizard-{id}",
    tag: "form",
    classes: ["sw5e", "sheet", "character-wizard"],
    position: { width: 640, height: 780 },
    window: { title: "SW5E.WizardTitle", resizable: true, contentClasses: ["sw5e-wizard-content"] },
    actions: {
      applyWizard: SW5eCharacterWizard.#onApply
    },
    form: { handler: SW5eCharacterWizard.#onFormChange, submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    body: { template: "systems/sw5e/templates/apps/character-wizard.hbs", scrollable: [""] }
  };

  get title() {
    return game.i18n.format("SW5E.WizardTitleFor", { name: this.actor.name });
  }

  /* -------------------------------------------- */
  /*  Pack helpers                                 */
  /* -------------------------------------------- */

  async #packDocs(name) {
    const pack = game.packs.get(`sw5e.${name}`);
    if (!pack) return [];
    return pack.getDocuments();
  }

  /* -------------------------------------------- */
  /*  Context                                      */
  /* -------------------------------------------- */

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const state = this.state;
    context.actor = actor;
    context.state = state;
    context.config = SW5E;

    const hasClasses = actor.items.some(i => i.type === "class");
    context.showAbilityScores = !hasClasses;
    context.pointBuyBudget = POINT_BUY_BUDGET;
    context.pointBuySpent = Object.values(state.abilities).reduce((sum, v) => sum + (POINT_BUY_COST[v] ?? 0), 0);
    context.standardArrayValues = STANDARD_ARRAY;

    /* ---- Species ---- */
    context.showSpecies = !actor.items.some(i => i.type === "species");
    if (context.showSpecies) {
      const all = await this.#packDocs("species");
      context.speciesOptions = all
        .filter(s => game.user.isGM || !s.system.restricted)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (state.speciesUuid) context.selectedSpecies = all.find(s => s.uuid === state.speciesUuid) ?? null;
    }

    /* ---- Background ---- */
    context.showBackground = !actor.items.some(i => i.type === "background");
    if (context.showBackground) {
      const all = await this.#packDocs("backgrounds");
      context.backgroundOptions = all.sort((a, b) => a.name.localeCompare(b.name));
      if (state.backgroundUuid) {
        const bg = all.find(b => b.uuid === state.backgroundUuid) ?? null;
        context.selectedBackground = bg;
        if (bg) {
          const allFeats = await this.#packDocs("feats");
          context.bgSkillOptions = (bg.system.skillProficiencies?.options ?? []).map(code => ({
            code, label: game.i18n.localize(SW5E.skills[code]?.label ?? code)
          }));
          context.bgFeatOptions = (bg.system.grantedFeat?.options ?? []).map(name => ({
            name, available: allFeats.some(f => f.name === name)
          }));
        }
      }
    }

    /* ---- Class & Level ---- */
    const classItems = actor.items.filter(i => i.type === "class");
    context.existingClasses = classItems;
    const allClasses = await this.#packDocs("classes");
    context.newClassOptions = allClasses
      .filter(c => !classItems.some(ci => ci.name === c.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    let classDoc = null; // the sw5e.classes compendium doc describing rules for the class being touched
    let classItem = null; // the embedded Item on the actor, if leveling an existing class
    let oldLevel = 0;
    if (state.classMode === "existing" && state.classItemId) {
      classItem = classItems.find(i => i.id === state.classItemId) ?? null;
      if (classItem) {
        oldLevel = classItem.system.levels;
        classDoc = allClasses.find(c => c.name === classItem.name) ?? null;
      }
    } else if (state.classMode === "new" && state.newClassUuid) {
      classDoc = allClasses.find(c => c.uuid === state.newClassUuid) ?? null;
      oldLevel = 0;
    }
    context.classDoc = classDoc;
    context.classItem = classItem;
    context.oldLevel = oldLevel;
    const targetLevel = Math.max(oldLevel + (state.classMode === "existing" ? 1 : 0), Number(state.targetLevel) || 1);
    context.targetLevel = targetLevel;

    context.showClassSkillChoice = !!classDoc && oldLevel === 0 && (classDoc.system.skillChoices?.number ?? 0) > 0;
    if (context.showClassSkillChoice) {
      context.classSkillOptions = (classDoc.system.skillChoices.options ?? []).map(code => ({
        code, label: game.i18n.localize(SW5E.skills[code]?.label ?? code)
      }));
      context.classSkillNumber = classDoc.system.skillChoices.number;
    }

    /* ---- Archetype ---- */
    context.showArchetype = false;
    if (classDoc && targetLevel >= (classDoc.system.archetypeLevel ?? 3)) {
      const alreadyHasArchetype = classItem
        ? actor.items.some(i => i.type === "archetype" && i.system.className === classItem.name)
        : false;
      if (!alreadyHasArchetype) {
        context.showArchetype = true;
        const allArchetypes = await this.#packDocs("archetypes");
        context.archetypeOptions = allArchetypes
          .filter(a => a.system.className === classDoc.name)
          .sort((a, b) => a.name.localeCompare(b.name));
      }
    }

    /* ---- Auto archetype features preview ---- */
    context.autoFeatures = [];
    let archetypeName = null;
    if (classItem) {
      const owned = actor.items.find(i => i.type === "archetype" && i.system.className === classItem.name);
      archetypeName = owned?.name ?? null;
    }
    if (!archetypeName && context.showArchetype && state.archetypeUuid) {
      const allArchetypes = await this.#packDocs("archetypes");
      archetypeName = allArchetypes.find(a => a.uuid === state.archetypeUuid)?.name ?? null;
    }
    if (classDoc && archetypeName) {
      const allFeatures = await this.#packDocs("archetypefeatures");
      const ownedNames = new Set(actor.items.filter(i => i.type === "archetypeFeature").map(i => i.name));
      context.autoFeatures = allFeatures
        .filter(f => f.system.archetypeName === archetypeName && f.system.className === classDoc.name
          && f.system.level > oldLevel && f.system.level <= targetLevel && !ownedNames.has(f.name))
        .sort((a, b) => a.system.level - b.system.level);
    }

    /* ---- ASI / Feat levels ---- */
    context.asiSteps = [];
    if (classDoc) {
      const resolved = classItem?.getFlag("sw5e", "resolvedAsi") ?? [];
      const crossed = (classDoc.system.asiLevels ?? []).filter(l => l > oldLevel && l <= targetLevel && !resolved.includes(l));
      const allFeats = await this.#packDocs("feats");
      context.allFeats = allFeats.sort((a, b) => a.name.localeCompare(b.name));
      for (const level of crossed) {
        const s = (state.asi[level] ??= { type: "asi", abilities: {} });
        const step = { level, type: s.type ?? "asi" };
        if (step.type === "feat" && s.featUuid) {
          const feat = allFeats.find(f => f.uuid === s.featUuid) ?? null;
          step.selectedFeat = feat;
          if (feat?.system.abilityScoreIncrease?.number > 0) {
            step.featAbilityOptions = feat.system.abilityScoreIncrease.options.map(a => ({
              code: a, label: game.i18n.localize(SW5E.abilities[a]?.label ?? a)
            }));
            step.featAbilityNumber = feat.system.abilityScoreIncrease.number;
          }
        }
        context.asiSteps.push(step);
      }
    }

    /* ---- Powers / Maneuvers known (this session's newly-unlocked slots) ---- */
    context.powerSteps = [];
    context.maneuverStep = null;
    {
      const pendingNewClassDoc = (!classItem && classDoc) ? classDoc : null;
      const eff = effectiveClasses(actor, allClasses, classItem?.id ?? null, targetLevel, pendingNewClassDoc);
      for (const school of ["force", "tech"]) {
        const prog = computePowerProgression(eff, school);
        if (!prog.knownMax && !eff.some(c => c.sys.castingSchool === school)) continue;
        const currentOwned = actor.system.resources[school]?.known?.value ?? 0;
        const newlyGained = Math.max(0, prog.knownMax - currentOwned);
        if (newlyGained <= 0) continue;
        const packName = school === "force" ? "forcepowers" : "techpowers";
        const allPowers = await this.#packDocs(packName);
        const ownedNames = new Set(actor.items.filter(i => i.type === "power").map(i => i.name));
        const options = allPowers
          .filter(p => p.system.level <= prog.maxPowerLevel && !ownedNames.has(p.name))
          .sort((a, b) => (a.system.level - b.system.level) || a.name.localeCompare(b.name));
        const picked = Object.values(state.powerPick?.[school] ?? {}).filter(Boolean).length;
        context.powerSteps.push({
          school, label: school === "force" ? "SW5E.ForcePowers" : "SW5E.TechPowers",
          newlyGained, maxPowerLevel: prog.maxPowerLevel, options, picked
        });
      }
      const manProg = computeManeuverProgression(eff);
      if (manProg.knownMax || eff.some(c => c.sys.maneuverProgression && c.sys.maneuverProgression !== "none")) {
        const currentManeuvers = actor.system.resources.superiority?.known?.value ?? 0;
        const newlyGainedManeuvers = Math.max(0, manProg.knownMax - currentManeuvers);
        if (newlyGainedManeuvers > 0) {
          const allManeuvers = await this.#packDocs("maneuvers");
          const ownedNames = new Set(actor.items.filter(i => i.type === "maneuver").map(i => i.name));
          const options = allManeuvers.filter(m => !ownedNames.has(m.name)).sort((a, b) => a.name.localeCompare(b.name));
          const picked = Object.values(state.maneuverPick ?? {}).filter(Boolean).length;
          context.maneuverStep = { newlyGained: newlyGainedManeuvers, options, picked };
        }
      }
    }

    return context;
  }

  /* -------------------------------------------- */
  /*  Form handling                                */
  /* -------------------------------------------- */

  static async #onFormChange(event, form, formData) {
    foundry.utils.mergeObject(this.state, formData.object, { insertKeys: true, insertValues: true });
    this.render();
  }

  /* -------------------------------------------- */
  /*  Apply                                        */
  /* -------------------------------------------- */

  static async #onApply(event, target) {
    const errors = [];
    const actor = this.actor;
    const state = this.state;
    const context = await this._prepareContext({});

    // ---- Resolve final ability scores ----
    const finalAbilities = {};
    for (const key of Object.keys(SW5E.abilities)) finalAbilities[key] = actor.system.abilities[key]?.value ?? 10;
    if (context.showAbilityScores) {
      if (state.abilityMethod === "pointBuy") {
        const spent = Object.values(state.abilities).reduce((sum, v) => sum + (POINT_BUY_COST[Number(v)] ?? 999), 0);
        if (spent > POINT_BUY_BUDGET) errors.push(game.i18n.format("SW5E.WizardErrorPointBuy", { spent, budget: POINT_BUY_BUDGET }));
        for (const key of Object.keys(SW5E.abilities)) finalAbilities[key] = Number(state.abilities[key]) || 8;
      } else if (state.abilityMethod === "standardArray") {
        const used = Object.values(state.standardArray).map(Number).filter(n => !Number.isNaN(n));
        const remaining = [...STANDARD_ARRAY];
        let valid = used.length === 6;
        for (const v of used) {
          const idx = remaining.indexOf(v);
          if (idx === -1) { valid = false; break; }
          remaining.splice(idx, 1);
        }
        if (!valid) errors.push(game.i18n.localize("SW5E.WizardErrorStandardArray"));
        for (const key of Object.keys(SW5E.abilities)) finalAbilities[key] = Number(state.standardArray[key]) || 10;
      } else {
        for (const key of Object.keys(SW5E.abilities)) finalAbilities[key] = Number(state.abilities[key]) || 10;
      }
    }

    // ---- Species ----
    let speciesDoc = null;
    if (context.showSpecies && state.speciesUuid) {
      speciesDoc = context.speciesOptions.find(s => s.uuid === state.speciesUuid) ?? null;
      if (speciesDoc) {
        for (const bonus of speciesDoc.system.abilityBonuses ?? []) {
          if (finalAbilities[bonus.ability] != null) finalAbilities[bonus.ability] += bonus.value;
        }
      }
    }

    // ---- Background skill/feat validation ----
    let backgroundDoc = null;
    const bgSkillsChosen = [];
    let bgFeatDoc = null;
    if (context.showBackground && state.backgroundUuid) {
      backgroundDoc = context.backgroundOptions.find(b => b.uuid === state.backgroundUuid) ?? null;
      if (backgroundDoc) {
        const need = backgroundDoc.system.skillProficiencies?.number ?? 0;
        for (const [code, checked] of Object.entries(state.bgSkill ?? {})) if (checked) bgSkillsChosen.push(code);
        if (bgSkillsChosen.length !== need) errors.push(game.i18n.format("SW5E.WizardErrorSkillCount", { need, got: bgSkillsChosen.length, source: backgroundDoc.name }));

        const featNeed = backgroundDoc.system.grantedFeat?.number ?? 0;
        const chosenFeats = Object.entries(state.bgFeat ?? {}).filter(([, v]) => v).map(([k]) => k);
        if (featNeed > 0) {
          if (chosenFeats.length !== featNeed) {
            errors.push(game.i18n.format("SW5E.WizardErrorFeatCount", { need: featNeed, got: chosenFeats.length, source: backgroundDoc.name }));
          } else {
            // The background only stores the chosen feat's NAME (its
            // grantedFeat.options are reference text, not UUIDs), so resolve
            // it against the feats compendium to get an embeddable document.
            const allFeatsForBg = await this.#packDocs("feats");
            bgFeatDoc = allFeatsForBg.find(f => f.name === chosenFeats[0]) ?? null;
            if (!bgFeatDoc) {
              errors.push(game.i18n.format("SW5E.WizardErrorFeatNotFound", { name: chosenFeats[0], source: backgroundDoc.name }));
            }
          }
        }
      }
    }

    // ---- Class / level ----
    let classDoc = context.classDoc;
    let classItem = context.classItem;
    const oldLevel = context.oldLevel;
    const targetLevel = context.targetLevel;
    const classSkillsChosen = [];
    if (classDoc) {
      if (context.showClassSkillChoice) {
        for (const [code, checked] of Object.entries(state.classSkill ?? {})) if (checked) classSkillsChosen.push(code);
        if (classSkillsChosen.length !== context.classSkillNumber) {
          errors.push(game.i18n.format("SW5E.WizardErrorSkillCount", { need: context.classSkillNumber, got: classSkillsChosen.length, source: classDoc.name }));
        }
      }
    } else if (state.classMode === "existing" && !state.classItemId) {
      // no class touched this pass -- fine, everything else can still apply
    } else if (state.classMode === "new" && state.newClassUuid && !classDoc) {
      errors.push(game.i18n.localize("SW5E.WizardErrorNoClass"));
    }

    // ---- Archetype ----
    let archetypeDoc = null;
    if (context.showArchetype) {
      if (!state.archetypeUuid) errors.push(game.i18n.format("SW5E.WizardErrorNoArchetype", { name: classDoc?.name ?? "" }));
      else archetypeDoc = context.archetypeOptions.find(a => a.uuid === state.archetypeUuid) ?? null;
    }

    // ---- ASI / Feat steps ----
    const resolvedAsiSteps = [];
    for (const step of context.asiSteps) {
      const s = state.asi[step.level] ?? {};
      if ((s.type ?? "asi") === "asi") {
        const alloc = {};
        let total = 0;
        for (const key of Object.keys(SW5E.abilities)) {
          const v = Number(s.abilities?.[key]) || 0;
          if (v > 0) { alloc[key] = v; total += v; }
        }
        if (total !== 2 || Object.values(alloc).some(v => v > 2)) {
          errors.push(game.i18n.format("SW5E.WizardErrorAsiPoints", { level: step.level }));
        }
        resolvedAsiSteps.push({ level: step.level, type: "asi", allocations: alloc });
      } else {
        const featUuid = s.featUuid;
        if (!featUuid) { errors.push(game.i18n.format("SW5E.WizardErrorNoFeat", { level: step.level })); continue; }
        const feat = context.allFeats.find(f => f.uuid === featUuid) ?? null;
        const abilityAlloc = [];
        if (feat?.system.abilityScoreIncrease?.number > 0) {
          for (const [code, checked] of Object.entries(s.abilities ?? {})) if (checked) abilityAlloc.push(code);
          if (abilityAlloc.length !== feat.system.abilityScoreIncrease.number) {
            errors.push(game.i18n.format("SW5E.WizardErrorFeatCount", { need: feat.system.abilityScoreIncrease.number, got: abilityAlloc.length, source: feat.name }));
          }
        }
        resolvedAsiSteps.push({ level: step.level, type: "feat", feat, abilityAlloc });
      }
    }

    // ---- Powers / Maneuvers picks ----
    const chosenPowers = [];
    for (const step of context.powerSteps) {
      const chosenIds = Object.entries(state.powerPick?.[step.school] ?? {}).filter(([, v]) => v).map(([id]) => id);
      if (chosenIds.length > step.newlyGained) {
        errors.push(game.i18n.format("SW5E.WizardErrorTooManyPicked", { need: step.newlyGained, got: chosenIds.length, source: game.i18n.localize(step.label) }));
      }
      for (const id of chosenIds) {
        const doc = step.options.find(p => p.id === id);
        if (doc) chosenPowers.push(doc);
      }
    }
    const chosenManeuvers = [];
    if (context.maneuverStep) {
      const chosenIds = Object.entries(state.maneuverPick ?? {}).filter(([, v]) => v).map(([id]) => id);
      if (chosenIds.length > context.maneuverStep.newlyGained) {
        errors.push(game.i18n.format("SW5E.WizardErrorTooManyPicked", { need: context.maneuverStep.newlyGained, got: chosenIds.length, source: game.i18n.localize("SW5E.Maneuvers") }));
      }
      for (const id of chosenIds) {
        const doc = context.maneuverStep.options.find(m => m.id === id);
        if (doc) chosenManeuvers.push(doc);
      }
    }

    if (errors.length) {
      for (const err of errors) ui.notifications.error(err);
      return;
    }

    // Apply any feat ability increases to finalAbilities too, before HP/derived math.
    for (const step of resolvedAsiSteps) {
      if (step.type === "asi") {
        for (const [k, v] of Object.entries(step.allocations)) finalAbilities[k] = Math.min(20, finalAbilities[k] + v);
      } else if (step.type === "feat") {
        for (const k of step.abilityAlloc) finalAbilities[k] = Math.min((finalAbilities[k] >= 20 ? finalAbilities[k] : 20), finalAbilities[k] + 1);
      }
    }

    const proceed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("SW5E.WizardApplyTitle") },
      content: `<p>${game.i18n.format("SW5E.WizardApplyConfirm", { name: actor.name })}</p>`,
      rejectClose: false,
      modal: true
    });
    if (!proceed) return;

    // ---- Build embeds ----
    const creates = [];
    if (speciesDoc) creates.push(speciesDoc.toObject());
    if (backgroundDoc) creates.push(backgroundDoc.toObject());
    if (bgFeatDoc) creates.push(bgFeatDoc.toObject());
    if (archetypeDoc) creates.push(archetypeDoc.toObject());
    for (const feature of context.autoFeatures) creates.push(feature.toObject());
    for (const step of resolvedAsiSteps) if (step.type === "feat" && step.feat) creates.push(step.feat.toObject());
    for (const power of chosenPowers) creates.push(power.toObject());
    for (const maneuver of chosenManeuvers) creates.push(maneuver.toObject());

    let newClassData = null;
    if (!classItem && classDoc) {
      newClassData = classDoc.toObject();
      newClassData.system.levels = targetLevel;
      newClassData.flags = foundry.utils.mergeObject(newClassData.flags ?? {}, {
        sw5e: { resolvedAsi: resolvedAsiSteps.map(s => s.level) }
      });
      creates.push(newClassData);
    }

    if (creates.length) await actor.createEmbeddedDocuments("Item", creates);

    if (classItem && classDoc) {
      const resolved = classItem.getFlag("sw5e", "resolvedAsi") ?? [];
      await actor.updateEmbeddedDocuments("Item", [{
        _id: classItem.id,
        "system.levels": targetLevel,
        "flags.sw5e.resolvedAsi": [...resolved, ...resolvedAsiSteps.map(s => s.level)]
      }]);
    }

    // ---- Actor-level updates ----
    const updates = {};
    for (const key of Object.keys(SW5E.abilities)) updates[`system.abilities.${key}.value`] = finalAbilities[key];

    if (speciesDoc) {
      const sp = speciesDoc.system;
      updates["system.traits.size"] = sp.size;
      updates["system.attributes.movement.walk"] = sp.speed.walk;
      updates["system.attributes.movement.fly"] = sp.speed.fly;
      updates["system.attributes.movement.swim"] = sp.speed.swim;
      updates["system.attributes.movement.climb"] = sp.speed.climb;
      if (sp.languages?.length) {
        const existing = actor.system.traits.languages.value ?? [];
        updates["system.traits.languages.value"] = Array.from(new Set([...existing, ...sp.languages]));
      }
    }

    for (const code of [...bgSkillsChosen, ...classSkillsChosen]) {
      const current = actor.system.skills[code]?.value ?? 0;
      if (current < 1) updates[`system.skills.${code}.value`] = 1;
    }

    if (oldLevel !== targetLevel || newClassData) {
      const priorTotal = actor.items.filter(i => i.type === "class").reduce((sum, i) => sum + i.system.levels, 0);
      const newTotal = priorTotal - oldLevel + targetLevel;
      updates["system.details.level"] = newTotal;

      // HP gain: full hit die on this actor's very first class level ever, average (floor(die/2)+1) per level thereafter, plus CON mod per level gained.
      const wasFirstEver = priorTotal === 0;
      const dieSize = Number((classDoc?.system.hitDice ?? "d8").replace("d", "")) || 8;
      const dieAvg = Math.floor(dieSize / 2) + 1;
      const conMod = Math.floor((finalAbilities.con - 10) / 2);
      let hpGain = 0;
      for (let lvl = oldLevel + 1; lvl <= targetLevel; lvl++) {
        const isVeryFirstLevel = wasFirstEver && lvl === 1;
        hpGain += (isVeryFirstLevel ? dieSize : dieAvg) + conMod;
      }
      updates["system.attributes.hp.max"] = (actor.system.attributes.hp.max ?? 0) + hpGain;
      updates["system.attributes.hp.value"] = (actor.system.attributes.hp.value ?? 0) + hpGain;
    }

    // ---- Powers / Maneuvers resource pools ----
    // Recomputed in full from every class the actor now has (not an
    // incremental delta) so these always reflect the true current roster,
    // matching how the official system itself derives them.
    if (oldLevel !== targetLevel || newClassData) {
      const allClasses = await this.#packDocs("classes");
      const pendingNewClassDoc = (!classItem && classDoc) ? classDoc : null;
      const eff = effectiveClasses(actor, allClasses, classItem?.id ?? null, targetLevel, pendingNewClassDoc);

      for (const school of ["force", "tech"]) {
        if (!eff.some(c => c.sys.castingSchool === school)) continue;
        const prog = computePowerProgression(eff, school);
        const abilityBonus = prog.castingAbility ? Math.floor(((finalAbilities[prog.castingAbility] ?? 10) - 10) / 2) : 0;
        updates[`system.resources.${school}.known.max`] = prog.knownMax;
        updates[`system.resources.${school}.max`] = Math.max(0, prog.pointsBase + abilityBonus);
        updates[`system.resources.${school}.maxPowerLevel`] = prog.maxPowerLevel;
      }

      if (eff.some(c => c.sys.maneuverProgression && c.sys.maneuverProgression !== "none")) {
        const manProg = computeManeuverProgression(eff);
        updates["system.resources.superiority.known.max"] = manProg.knownMax;
        updates["system.resources.superiority.max"] = manProg.diceMax;
        updates["system.resources.superiority.die"] = manProg.die;
      }
    }

    if (Object.keys(updates).length) await actor.update(updates);

    ui.notifications.info(game.i18n.format("SW5E.WizardApplied", { name: actor.name }));
    await this.close();
  }
}
