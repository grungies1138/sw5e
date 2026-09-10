# Star Wars 5e for Foundry VTT

An unofficial, from-scratch [Foundry Virtual Tabletop](https://foundryvtt.com)
game system implementing **Star Wars 5e** ([sw5e.com](https://sw5e.com)) — a
free fan conversion of 5th-edition rules to a Star Wars setting.

This system was built independently (not a fork of any existing SW5e
Foundry system), with **starship and vehicle combat as its centerpiece**:
routed power dice across five subsystems, six crew deployment roles with
full rank progressions, correct Hull/Shield Point math (including
shield-type capacity/regen multipliers), the System Damage & Slowed
condition tracks, destruction saving throws, crew-based ship initiative, and
the Tier/Role starship-construction chassis.

Targets **Foundry VTT v14** (built against the `foundry.applications`
ApplicationV2 API, DataModel/TypeDataModel schemas, and `CombatantGroup`).

## Installing for local testing

You need your own licensed Foundry VTT installation — this repo is just the
system files.

**Option A — Manifest URL (if you host this folder somewhere with a raw
`system.json` URL):** in Foundry's Setup screen, "Install System", paste the
URL to your hosted `system.json`.

**Option B — Manual local install (recommended for testing this build):**

1. Locate your Foundry **Data** folder:
   - Windows: `%localappdata%/FoundryVTT/Data`
   - macOS: `~/Library/Application Support/FoundryVTT/Data`
   - Linux: `~/.local/share/FoundryVTT/Data`
   - (Or wherever you configured `dataPath` when Foundry was first run.)
2. Copy this entire project folder into `Data/systems/`, and rename it
   `sw5e` (so the final path is `Data/systems/sw5e/system.json`).
3. Start (or restart) Foundry VTT. In **Setup → Game Systems**, "Star Wars
   5e" should now appear in the list.
4. Create a new World and select "Star Wars 5e" as its system.

If you received this project as a zip already named/structured for direct
drop-in, just unzip it straight into `Data/systems/` — no renaming needed.

### Rebuilding the compendium packs (only needed if you edit `src/packs/`)

The compiled LevelDB compendium packs in `packs/` are already built and
shipped — you do **not** need Node.js just to install and use the system.
Rebuild them only if you add/edit the human-readable JSON source documents
under `src/packs/`:

```bash
npm install
npm run build:packs
```

This uses `@foundryvtt/foundryvtt-cli` to compile every `src/packs/<name>/`
folder of individual JSON documents into the binary pack Foundry actually
loads from `packs/<name>`, auto-assigning a stable document `_id` to any
source file that doesn't already have one.

## What's implemented

**Actors:** Character, NPC, Starship (also used for ground vehicles — SW5e's
own rules explicitly reuse the starship chassis for vehicles, just at a
different scale; see "Ground Vehicles" below). The NPC sheet has a
**Features** tab (Traits/Actions/Reactions/Legendary Actions) alongside the
usual Main/Inventory/Biography tabs — see the Monsters/NPCs note below.

**The Starship sheet** (the system's centerpiece) has dedicated tabs for:
- **Main** — abilities, armor type, shield type, hyperdrive, hull/shield
  dice remaining, modification slot usage, cargo/fuel/credits.
- **Power** — reactor & power coupling selection, the central power-die pool
  plus all five subsystem pools (Engines/Shields/Weapons/Sensors/Comms),
  Reroute Power toggles, and the Mechanic's Tech Die.
- **Crew** — assign crewmembers to the six Deployment roles (Pilot, Gunner,
  Mechanic, Technician, Operator, Coordinator) with per-role rank, plus each
  role's full list of named maneuvers (Tactics/Gambits/Techniques/
  Stratagems/Disruptions/Collaborations) with one-click "Use" buttons that
  spend the correct resource (a Power Die from the right subsystem, or the
  Mechanic's un-expended Tech Die) and post the effect to chat. A player can
  **"Claim Seat"** on any crew slot to link it to their own assigned
  character (`game.user.character`): the seat's displayed name and its
  proficiency bonus (used for ship-skill checks, Fire attack rolls, and
  ability-mod overrides on future maneuver formulas) then sync live from
  that character instead of the manually-typed name/rank-only defaults.
  **Claiming a seat requires Owner permission on the ship Actor** — grant
  players Owner (not just Observer) on the starship if you want them to
  claim seats themselves; a GM can otherwise claim seats on a player's
  behalf from their own logged-in user.
- **Actions** — the universal Ship Actions from the Combat chapter: Boost
  (with the correct escalating DC for repeat uses), Detect, Patch (expends a
  Hull Die), Regenerate Shields (once per ship-turn, expends a Shield Die),
  Interfere, the Helm sub-actions (Attack Run/Conceal/Dogfight/Evade/Fly/
  Harass/Hard Turn/Ram — Ram and Hard Turn/Evade/Fly are fully mechanized;
  the rest prompt the correct ability check), and Fire (respecting the
  hardpoint fire-rate cap: Str mod, min +1, × a per-size hardpoint
  multiplier).
- A **"Begin Ship Turn"** button runs reactor power-die regeneration
  (reactor-type-specific formula), passive shield regeneration (expends a
  Shield Die for the flat regen rate), and resets all once-per-round trackers.
- Destruction Saving Throws, System Damage (6 cumulative levels) and Slowed
  (4 levels) are tracked and their mechanical effects (disadvantage,
  halved Hull/Shield max & regen, catastrophic failure) are baked into
  derived data.
- Damage application (`Actor#applyDamage`) applies shields-then-hull
  ordering, Damage Reduction, and the full set of per-damage-type
  hull/shield multipliers and resistances/immunities from the rules (Ion
  can't destroy — only disable; Poison/Psychic do nothing to ships; etc.).

**Ship-based initiative & combat:** a custom `CombatantGroup` sub-type links
a group of crew Combatants to their Starship; the group's initiative is kept
in sync with the *lowest* initiative among its crew (per the rule "the
lowest initiative on each ship sets the initiative for that ship"), and the
custom `Combat` subclass sorts the tracker by that group initiative with a
sensible Helm-first tie-break within a ship.

**Characters/NPCs:** ability scores & saves, the full SW5e skill list
(including the merged **Lore** skill and the new **Piloting**/**Technology**
skills), Force Points and Tech Points (Force recovers on a long rest only;
Tech recovers on a short *or* long rest — a deliberate asymmetry from core
5e), death saves, rests, and item-driven attack/damage/power rolls.

**Items:** Species (size/speed/darkvision plus structured ability-bonus,
language, and named-trait fields, all rendered on the item sheet), Background (with SW5e's "background grants a bonus
feat" rule), Class, Archetype, Archetype Feature (a named leveled ability
granted by a specific Archetype — e.g. "Fast and Agile" at 3rd level),
Feat (with a structured, choose-one ability-score-increase field for the
feats that grant one), Deployment Feature, Power (Force/Tech,
with the point-cost-by-level table baked in, plus range/duration/
concentration/save/damage fields populated per power), Maneuver, Ship
Maneuver, Weapon, Armor, Shield, Gear (incl. Enhanced Items/rarity),
Starship Modification, Starship Weapon, Starship Equipment
(reactor/coupling/hyperdrive/armor/shield-generator), and Customization
Option (Fighting Style/Mastery, Lightsaber Form, Weapon Focus/Supremacy,
and Class/Multiclass/Splashclass Improvement, distinguished by a
`category` field).

**Compendium content shipped:** 141 species (all 141 currently listed on
sw5e.com's Species page — 30 PHB + 111 Expanded Content), 10 classes + 145 archetypes
(135 currently listed on sw5e.com's Archetypes page — 40 PHB + 95 Expanded
Content — plus 10 earlier additions that predate the site's current
listing; see the archetypes note below) backed by 749 archetype features
(every named leveled ability for those 135 archetypes), 67
backgrounds (all 61 currently listed on sw5e.com's Backgrounds page — 20
PHB + 41 Expanded Content — plus 6 earlier additions that predate the
site's current listing; see the backgrounds note below), 138 feats (all
118 currently listed on sw5e.com's Feats page — 65 PHB + 43 Expanded
Content + 10 Wretched Hive — plus 20 earlier additions that predate the
site's current listing; see the feats note below), ~60
deployment features (all six roles × five ranks), 254 Force powers + 269
Tech powers (all 233 current Force powers and 231 of 232 current Tech
powers on sw5e.com's Powers page, plus 38 Force + 38 Tech earlier
additions that predate the site's current listing; see the powers note
below), 122 maneuvers (all 119 currently listed on sw5e.com's Maneuvers
page — 100 PHB + 19 Expanded Content — plus 3 earlier additions that
predate the site's current listing; see the maneuvers note below), 48 ship maneuvers
(every named Tactic/Gambit/Technique/Stratagem/Disruption/Collaboration),
219 character weapons (all 217 current site rows, modal duplicates merged,
plus 4 earlier additions), 14 personal armor/shields, 651 gear items (264
mundane-equipment site entries + 368 real Enhanced Items from sw5e.com's
Expanded Content section + 19 earlier invented Enhanced Items that predate
the site; see the Enhanced Items note below), 96
starship weapons, 285 starship modifications (all 257 currently listed on
sw5e.com's Modifications page across all 5 categories — Engineering,
Operation, Suite, Universal, and Weapon — plus 28 earlier additions that
predate the site's current listing; see the starship modifications note
below), 23 starship equipment options
(reactors/couplings/armor/shields/hyperdrive classes), 45 pre-built
sample starships spanning all six hull sizes, 271 NPC monster stat
blocks (every creature in sw5e.com's Scum & Villainy section), each with
its embedded attack/trait/action/reaction/legendary-action items — see the
Monsters/NPCs note below — and 130 Customization Options (32 Fighting
Styles, 32 Fighting Masteries, 20 Lightsaber Forms, 8 Weapon Focuses, 8
Weapon Supremacies, and 10 each of Class/Multiclass/Splashclass
Improvements; see the Customization Options note below). A `howto`
Journal Entry compendium now ships 17 complete character-build guides
(Boba Fett, Obi-Wan Kenobi, Han Solo, Leia Organa, Darth Vader, Wedge
Antilles, C-3PO, R2-D2, K-2SO, Yoda, Ahsoka Tano, Chewbacca, Chirrut
Imwe, Grand Admiral Thrawn, Din Djarin, General Grievous, and Admiral
Ackbar) — see the How-To Guides note below.

**Journal Entries:** a `howto` compendium of multi-page Journal Entries —
this system's first compendium pack of a document type other than Item or
Actor — each entry a complete, level-by-level build guide for an iconic
character concept, organized into an Overview, an Ability Scores &
Origins page, an Equipment Progression page, two Level-by-Level Guide
pages (1–10 and 11–20), and a closing Tactics/Roleplaying/20th-level
summary page. See the How-To Guides note below.

## What's a starter set, not exhaustive canon

This is a large ruleset. The following are intentionally a **solid,
representative starting point** rather than a byte-for-byte transcription of
every published entry — extend them the same way the shipped content is
structured (copy a JSON file in `src/packs/<category>/`, edit it, re-run
`npm run build:packs`):

- **Armor**: this pack now covers every one of the 26 armor/shield entries
  currently listed on sw5e.com's equipment data (14 base categories already
  shipped, plus 12 special-material variants added this pass: Beskar Weave
  Armor, Durafiber Battle Armor, Duranium Combat Suit, Durasteel
  Exoskeleton, Duravlex Fiber Armor, Fleximetal Fiber Armor, Laminanium
  Assault Armor, Neutronium Mesh, and Plastoid Composite Armor for body
  armor; Bone Light Shield, Crystadium Medium Shield, and Quadanium Heavy
  Shield for personal shields), each with freshly-written flavor text and
  every mechanical fact preserved (AC, Dex cap, Strength requirement,
  stealth disadvantage, cost, weight). Several of these variants carry
  qualitative properties (Regulated, Reactive, Rigid, Silent, Avoidant,
  Insulated, Reinforced, Obscured, Spiked, Absorptive, Charging, Imbalanced,
  Cumbersome) that didn't fit any existing structured field, so a
  `properties` text-array field was added to both the Armor and Shield item
  types (and, since the Weapon item type already had this exact field in
  its schema but never rendered it on the sheet, that pre-existing gap was
  fixed at the same time). The Shield item type also gained a `strength`
  field, since two of the new shields carry a Strength requirement the
  schema had nowhere to put.
- **Weapons** (character-scale): rebuilt from 22 items to 219, reconciled
  against sw5e.com's complete Weapons table (Ch.5 Equipment, 217 rows). The
  site lists two weapons — Bo-rifle and Saberstaff — twice each, once under
  each of their two modal weapon classifications (blaster/vibroweapon and
  lightweapon/vibroweapon respectively); this pack models each as a single
  dual-classified item rather than two entries, so 217 site rows become 215
  distinct new weapons, plus the 4 original pre-existing weapons that don't
  match any current site name (Force Pike, Heavy Blaster Pistol, Hold-Out
  Blaster, Ion Blaster Pistol) kept as extra options, for 219 total. Every
  weapon carries its exact site stats — category (blaster/lightweapon/
  vibroweapon), proficiency tier, damage dice and type, range, price,
  weight, and the full properties list (Auto, Burst, Reload, Strength
  requirement, Two-handed, Finesse, Reach, Versatile, Thrown, Double,
  Modal, Switch, and all the rest) — parsed straight from the site's data
  rather than retyped by hand, with ammunition type (power cell/slug
  cartridge) and thrown/ranged distance split out into their own
  structured `range`/`ammo` fields the same way the previous 22 items
  already worked. The 6 Exotic-tier weapons (Bo-rifle, Saberstaff, IWS,
  Neuronic whip, Radrifle, Sunsaber) are stored as `proficiencyTier:
  martial` (the schema only distinguishes simple/martial) with an
  `exotic` properties tag flagging the distinction. A handful of weapons
  with no fixed damage die (grenade launcher, rocket launcher, mortar
  launcher, torpedo launcher, net, bolas, flechette cannon, vapor
  projector, atlatl, wrist launcher) deal damage set by whatever
  ammunition is loaded, per the site's own "special" ammunition
  convention — matching how this pack's Ammunition/Explosive gear (grenades,
  mines, missiles, rockets) already carries its own damage separately.
- **Gear**: rebuilt from 25 items to 283, reconciled against every
  non-Weapon, non-Armor entry in sw5e.com's equipment data (264 entries
  across Ammunition, Explosives, Kits, Tools, Medical gear, Storage,
  Musical Instruments, Clothing, Gaming Sets, Communications, Data
  Recording and Storage, Spices, Alcoholic Beverages, Utility gear, and
  Life Support gear) plus the 19 original invented Enhanced Items
  (magic-item analogues like the Sith Alchemy Amulet and Resonant Kyber
  Shard) that predate the site and aren't part of its mundane equipment
  list, kept as-is. Each of the 264 site items carries its exact price and
  weight, and its own rules text as description where the site publishes
  one (ammunition and consumable effects, grenade/mine/mission-specific
  gear, tool and prosthetic notes); the roughly one-third of entries the
  site lists with no description (implements, kits, instruments, clothing,
  gaming sets) instead get a short original flavor line. All of it is
  `rarity: standard`, non-enhanced gear, distinct from the pre-existing 19
  invented Enhanced Items, which keep their own rarity tiers.
- **Enhanced Items** (real, site-published magic-item-equivalents, as
  distinct from the 19 invented ones above): added all 368 entries from
  sw5e.com's Expanded Content section, across 14 categories — Consumables:
  Ammunition Torpedoes (13), Explosive Charges (10); Adventuring Gear (25);
  Ammunition: Projector Canisters/Tanks (30), Missiles/Rockets (30),
  Darts/Snares (20), Mags/Clips (30), Cartridges/Cells (35),
  Calibrators/Collimators (30); Ship (9); Explosives: Grenades (60), Mines
  (55); Item Modifications: Lightweapon (10), Wristpad (11). This content
  lives on the site as one long authored markdown document rather than
  structured per-item rows, so it wasn't reachable through the same Vuex
  store queries used everywhere else in this project — it turned up in a
  Vue component's local `sourceData`, found by walking the component tree
  looking for a known item name. Each entry was parsed out by its `####`
  header (item name), the `_**Type** (subtype), **Rarity**_` line under it,
  and the prose description that follows, bounded by the next header of
  any level so a category's trailing summary table couldn't bleed into the
  last item's text. Like the 19 originals, every one of these is stored as
  `type: "gear"` with `isEnhanced: true` and `rarity` mapped from the
  site's Premium/Prototype/Advanced/Legendary/Artifact tiers, sourced as
  "Expanded Content — Enhanced Items", and reference-only: mechanical
  effects (e.g. "+1 to attack and damage rolls") are written into the
  description text, not wired up as automated bonuses.
- **Ship Maneuvers** (the Tactic/Gambit/Technique/Stratagem/Disruption/
  Collaboration options each starship deployment can learn): verified
  against sw5e.com's Customization Options chapter and confirmed already
  complete — all 48 named options across the 6 deployment pools are
  present and accounted for. (An early read of the source text miscounted
  a 49th "option" per pool; that entry — "Creative Thinking" for the
  Mechanic, "Tech Dice"/"Power Dice"/"Saving Throws" for the others — turned
  out to be rules-explainer prose preceding each alphabetical list, not an
  actual named option, so no new entries were needed.)
- **Starship Equipment** (reactors, power couplings, hyperdrives, shield
  generators, and ship-scale armor plating): verified against sw5e.com's
  equipment data and confirmed already complete — all 23 entries across the
  five equipment types match the system's fixed configuration lists exactly.
  Ship weapons and ammunition, which also live under this site data table,
  are covered separately below under Starship Weapons.
- **Classes**: verified against sw5e.com and confirmed already complete —
  all 10 classes (Berserker, Consular, Engineer, Fighter, Guardian, Monk,
  Operative, Scholar, Scout, Sentinel) are present with matching names.
- **Deployment Features** (the Tier 1/2/3 features each of the six starship
  Deployment roles grants — Coordinator, Gunner, Mechanic, Operator, Pilot,
  Technician): verified against sw5e.com and confirmed already complete —
  all 60 features are present and accounted for.
- **Starship Weapons**: rebuilt from 22 items to 96, reconciled against
  sw5e.com's complete "Weapons by Size" table (Ch.5 Equipment). The site
  splits ship armament into two halves that this pack now models
  faithfully instead of collapsing into one: 59 **standalone** weapons
  (52 of them matching a named site entry exactly — every Tiny-through-Large
  and Huge-through-Gargantuan Primary and Secondary cannon, railgun,
  turbolaser battery, and point-defense mount on the site's tables, plus 7
  original weapons kept from the previous pass that don't correspond to any
  site entry: Devastator Superlaser, Light Blaster Cannon, Mag-Pulse Cannon,
  Tractor Beam Projector, Cluster Mine Dispenser, EMP Charge Dispenser, and
  Homing Rocket Pod), 8 **launcher** hardpoints (Cluster Pod Launcher,
  Missile Launcher, Torpedo Launcher, and Bomb Deployer, plus their
  Huge/Gargantuan-scale Assault/Layer variants), and 29 **ammunition**
  catalog entries (19 Tertiary — the ordnance a Cluster Pod, Missile, or
  Torpedo Launcher can load — and 10 Quaternary bombs/mines a Bomb Deployer
  can drop), each carrying both its Tiny-through-Large damage and its
  Huge-through-Gargantuan damage as the site's own dual "X (Y)" notation
  requires.

  This split needed three new schema fields on the Starship Weapon item
  type: `role` (`standalone` / `launcher` / `ammo`), `ammoFamily` (a plain
  text label matching a launcher to the ammunition it accepts, e.g.
  "Torpedo Launcher" — the same manual-matching convention already used
  elsewhere in this system rather than a document link), and `loadedAmmo`
  (which ammo item a launcher currently has chambered). A launcher's
  `Ammo Remaining`/`Ammo Capacity` fields now track its magazine (the site's
  per-size reload value), while an ammunition entry's own damage field
  holds its Tiny-Large value and a new `damageHuge` field holds its
  Huge-Gargantuan value. Seven of the original 22 items were exact site
  matches whose numbers had drifted (wrong price, range, or missing
  properties) — these were corrected in place rather than replaced, and
  one (Heavy Turbolaser) was renamed to Heavy Turbolaser Battery to match
  the site's own name. A known limitation: the 6 example Starships below
  still have their pre-existing weapon loadouts from the old single-item
  model (an ammunition item equipped with no separate launcher); reworking
  those loadouts to the new launcher+ammo pairing is left for a future pass.
- **Starships**: sw5e.com publishes no roster of pre-built ship stat blocks —
  every NPC starship in this system is necessarily a GM-built example, put
  together from a hull size, weapons, and equipment the same way a player
  would. This pack now ships 45 examples across all six hull sizes (was 6):
  the original 6 invented-name ships (Whisper-Class Probe Droid, Talon-Class
  Attack Fighter, Bulldog-Class Gunship, Sentinel-Class Cruiser,
  Leviathan-Class Carrier, Ravager-Class Warship) plus 38 new ones built and
  named after iconic Star Wars starfighters, freighters, corvettes, frigates,
  and capital ships spanning the saga — original-trilogy mainstays (T-65B
  X-wing Starfighter, TIE/ln Space Superiority Fighter, BTL-A4 Y-wing
  Starfighter, RZ-1 A-wing Interceptor, TIE/in Interceptor, TIE/sa Bomber,
  YT-1300 Light Freighter, Firespray-31 Patrol Craft, Lambda-Class T-4a
  Shuttle, CR90 Corvette, EF76 Nebulon-B Frigate, Imperial I-Class Star
  Destroyer, MC80 Star Cruiser, Executor-Class Star Dreadnought), a few
  prequel-era additions for variety (Naboo N-1 Starfighter, LAAT/i Gunship,
  Consular-Class Cruiser, Venator-Class Star Destroyer), a dedicated round
  of freighters and other cargo haulers (YT-2400 Light Freighter, VCX-100
  Light Freighter, HWK-290 Light Freighter, YT-1210 Light Freighter,
  Ghtroc 720 Freighter, Razor Crest Gunship, Zeta-Class Cargo Shuttle,
  Wayfarer-Class Medium Transport, Gozanti-Class Cruiser, Action VI
  Transport, Baleen-Class Heavy Freighter, and Star Galleon-Class Bulk
  Freighter), and a further round of corvettes and frigates (Marauder-Class
  Corvette, Hammerhead Corvette, DP20 Corellian Gunship, Raider-I Class
  Corvette, Arquitens-Class Light Cruiser, MC30c Frigate, Assault Frigate
  Mark II, and Interdictor-Class Cruiser), and one further researched
  current-canon addition, the **Defender-Class Cruiser**: a Huge Mon
  Calamari-built New Republic patrol cruiser (as seen crewed by Hera
  Syndulla's fleet in *Ahsoka*, e.g. the ship *Vesper*), armed here with a
  Turbolaser Battery, a Tractor Beam Projector, and a Laser Cannon
  Point-Defense (Hull 95, Shield 129, AC 9/DR 6, Ship Rating 11.5). Unlike
  the invented-name ships, this one was looked up rather than recalled from
  memory, since it names a specific real vehicle from the franchise; its
  stat block is still an original build using this system's own rules, not
  copied from any sourcebook. Every stat on these — ability scores, hull and
  shield points, AC, speed, hyperdrive class, cargo/fuel capacity, and
  weapon loadout (drawn from this pack's own Starship Weapons catalog, or
  left unarmed for a few of the budget-line freighters) — is an original
  build using this system's own hull-size and Ship Rating rules, not copied
  from any sourcebook, and every flavor description is freshly written; only
  the ships' well-known names and general silhouette (fast one-man
  starfighter, wedge-shaped Star Destroyer, and so on) are drawn from the
  films, the same way this entire ruleset already borrows Star Wars species
  and Force-power names throughout. `npm run build:packs` picked up the new
  Actors' embedded weapon Items correctly thanks to the `assignIds()` fix
  described above; ship Ratings across the 39 new ships range from 0.5 (an
  unarmed Ghtroc 720 Freighter) up to 22 (Executor-Class Star Dreadnought).
- **Monsters/NPCs** (new): sw5e.com's "Scum & Villainy" section — the
  system's Monster-Manual-equivalent chapter — publishes 271 NPC stat
  blocks, and this pack now ships all 271 as ready-to-drop-in NPC Actors
  (`src/packs/npcs/`, registered as a new `npcs` Actor-type compendium in
  `system.json`), pulled directly from the site's own Vuex data store
  (`$store.state.monsters.monsters`) rather than parsed off the rendered
  page, so every ability score, save, skill, AC, HP, speed, resistance/
  immunity/vulnerability, sense, language, CR, and XP is the site's exact
  published number. Each monster's full set of Traits, Actions, Reactions,
  and Legendary Actions (903 total) is preserved as reference text — a
  weapon-style attack behavior becomes an embedded **Weapon** item with its
  damage/range/attack-bonus fields populated (1,279 embedded items across
  376 weapons + 903 feats), everything else (Multiattack, breath weapons,
  save-based abilities, passive traits) becomes an embedded **Feat** item
  with its description and an `activation.type` matching the stat block's
  own category (`none` for a Trait, `action`, `reaction`, or `special` for
  a Legendary Action). A weapon's printed "+X to hit" is reproduced exactly
  by solving for the ability (Str or Dex, whichever fits the printed number
  best) and a residual `attackBonus` on top of the actor's own ability
  mod + proficiency bonus — so the math stays "live" (raising the NPC's Str
  in the sheet updates its attack rolls) while matching the source exactly
  at import. Because the NPC actor sheet had no way to *see* Trait/Action/
  Reaction/Legendary Action items before this pass (only Weapons/Armor/Gear
  had a home in its Inventory tab), a new **Features** tab was added to the
  NPC sheet (`npc-features.hbs`) grouping embedded Feat items into Traits/
  Actions/Reactions/Legendary Actions sections, matching how a monster's
  stat block actually reads; clicking a non-weapon item's name now posts
  its description to chat, the same behavior the Character sheet's Feats
  list already had. A handful of fields with no dedicated slot in the NPC
  data model (senses, hit-dice formula, armor-type note, condition
  immunities, alignment) are folded into a short summary line at the top of
  the Biography tab instead of being dropped. Two known upstream data bugs
  in the site's own dataset were repaired rather than reproduced: **Cyborg
  Khagan**'s type/alignment fields were split by a stray comma inside a
  parenthetical ("humanoid (Villainous" / "kaleesh)") and are rejoined here
  as a single type with alignment reset to unaligned; **B'omarr Brain
  Walker** published a literal placeholder `"CR"` instead of a number,
  repaired to CR 3 based on its HP/AC/save-DC profile. Twenty-eight weapon
  attacks across the dataset had blank structured damage fields even though
  their prose clearly stated the damage (e.g. "Hit: 1d6+5 energy damage");
  25 of the 28 were recovered by parsing the damage die and type back out
  of that prose, leaving only 3 attacks (pure grapple/restrain effects with
  no damage at all) with an empty damage field, which is correct. CR is
  stored as a plain decimal (0.125/0.25/0.5 for 1/8, 1/4, 1/2) rather than
  the site's fraction notation, and XP is recomputed from CR via the
  standard 5e CR→XP table for consistency rather than trusting the site's
  own XP column verbatim (SW5e's NPC math is explicitly unmodified core 5e
  math, same as the rest of this data model). Every actor's `details.source`
  reads "Scum & Villainy".
- **Backgrounds**: this pack now covers every one of the 61 backgrounds
  currently listed on sw5e.com (20 PHB + 41 Expanded Content), each with its
  own flavor text, its real full skill-choice list (e.g. "choose two from
  Deception, Insight, Intimidation, and Lore"), its real 8-option feat table,
  tool proficiencies where the rules grant them, and starting equipment. The
  choice itself still isn't automated — the item sheet's Details tab shows
  the options as reference text ("Choose 2: ...", "Choose 1: ..."), and the
  player manually toggles their chosen skills as proficient on their
  character sheet and adds whichever Feat item they picked, the same way
  every other skill/feat pick already works on this system's character
  sheet. Six backgrounds from this system's original build — Consular's
  Acolyte, Fringer, Outlander, Squadron Pilot, Trader, and Wartorn — do not
  correspond to any name on the site's current listing (they may be from an
  older revision of the rules); since there's no current site data to expand
  them from, they keep their original single skill pair/single feat (just
  wrapped in the same choice-list format) rather than being removed. They're
  flagged here since they aren't part of the site's current 61.
- **Archetypes**: this pack now covers every one of the 135 archetypes
  currently listed on sw5e.com (40 PHB + 95 Expanded Content) across all 10
  classes, each with its own original flavor text and its full set of named,
  leveled features as separate Archetype Feature items linked back to it by
  name (e.g. Makashi Form's "Form Basics," "Channel the Force," and "The Way
  of the Ysalamiri" at 3rd level, "Force-Empowered Reflexes" at 7th, and so
  on through 20th). Feature text was rewritten from scratch rather than
  copied from the site, while every mechanical fact — dice, save DCs,
  ranges, durations, and use-counts — was preserved exactly. As with
  backgrounds, nothing here is automated: an Archetype Feature is a
  reference item the player reads and applies manually (same as Deployment
  Features already work), not a bonus the character sheet grants on its
  own. Ten archetypes from this system's original build — one per class
  (Juggernaut, Battlemind, Ordnance Specialist, Weapon Master, Aegis, Way of
  the Void, Infiltrator, Strategist, Pathfinder, Shadow Guard) — do not
  correspond to any name on the site's current listing and have no
  features authored for them; they're kept as extra options rather than
  removed, but are flagged here since they aren't part of the site's
  current 135. A handful of the 135 (the "(Companion)" variants, e.g.
  Beastmaster Approach (Companion)) are the site's own alternate builds of
  an archetype for tables using the Companion customization rules, kept as
  separate distinct options rather than merged into their base archetype.
- **Feats**: this pack now covers every one of the 118 feats currently
  listed on sw5e.com's Feats page (65 PHB + 43 Expanded Content + 10
  Wretched Hive), each with freshly-written flavor/rules text and, where the
  feat grants one, a structured `abilityScoreIncrease` field (which
  ability score(s) it lets you raise, and how many you choose from) so the
  Feat item sheet shows "Choose 1: Strength, Dexterity, ..." the same way
  Backgrounds show their skill/feat choices — reference text the player
  applies manually, not an auto-granted bonus. Twenty feats from this
  system's original build (Armored Resilience, Brawler, Danger Sense,
  Deadeye, Duelist, Force Adept, Force Sensitivity, Force Warning,
  Fortune's Favor, Gadgeteer, Indomitable, Multilingual, Overcharge,
  Quickdraw, Silver Tongue, Skirmisher, Streetwise, Tech Savant, Toughness,
  Weapon Specialist) do not correspond to any name on the site's current
  listing; they're kept as extra options rather than removed, but are
  flagged here since they aren't part of the site's current 118. (Two
  entries on the site's own Feats API — "Class Proficiencies" and "Fighting
  Styles and Masteries" — are rules-clarification text rather than
  player-facing feats; they're included anyway for parity with the site's
  own listing.)
- **Force/Tech Powers**: this pack now covers all 233 Force powers and 231
  of the 232 Tech powers currently listed on sw5e.com's Powers page (one
  Tech power, "Ion Blast", shares its name with a pre-existing legacy
  power and was left alone rather than overwritten — see below). Each power
  has freshly-written rules text plus fully populated mechanical fields:
  level, school (light/dark/universal side, or tech), activation
  (action/bonus/reaction, or "special" for the handful of 1-minute/1-hour/
  ritual-style casting times), range, duration, concentration, save
  (ability + DC scaling), and damage (dice formula + damage type, where the
  power deals damage at all). Data — level, casting time, range, duration,
  concentration, and light/dark/universal/tech alignment — came directly
  from sw5e.com's own structured power data; only the descriptive text and
  the damage/save extraction were authored fresh. Thirty-eight Force powers
  and thirty-eight Tech powers from this system's original build predate
  the site's current listing and are kept as extras; seventeen Force-power
  names and one Tech-power name ("Battle Meditation," "Battle
  Precognition," "Choke," "Crush," "Dominate Mind," "Drain Life," "Force
  Barrier," "Force Lightning," "Force Repulse," "Force Storm," "Mind
  Trick," "Rebuke," "Sever Force," "Stasis Field," "Telekinetic Storm,"
  "Wound," "Wrack," and "Ion Blast") happen to match a current sw5e.com
  power name; in those cases the pre-existing legacy version was left
  untouched rather than replaced, so their mechanical fields may be less
  complete than the newly-authored powers around them.
- **Starship Modifications**: this pack now covers every one of the 257
  modifications currently listed on sw5e.com's Modifications page, across
  all 5 categories (Engineering, Operation, Suite, Universal, Weapon) and
  grades 0–5, each with freshly-written rules text that preserves every
  mechanical fact from the site (dice, DCs, per-ship-size breakdowns,
  action costs, etc.). Category and grade came directly from the site's
  own data; price was computed from the site's published formula
  (category base cost × grade multiplier, grade 0/1 both ×1) since the
  site's per-item numbers assume a specific ship size that these template
  items don't carry — the price shown is the base reference cost before
  the GM applies the rules' own Starship Size Modification Cost multiplier
  (×0.5 Tiny, ×1 Small, ×2 Medium, ×5 Large, ×50 Huge, ×500 Gargantuan)
  for the ship the modification is actually being installed on.
  Twenty-eight modifications from this system's original build (Automated
  Damage Control, Auxiliary Thrusters, Barracks, Countermeasure Flares,
  Distributed Targeting Network, Emergency Beacon, Emergency Life Support,
  Emergency Power Cell, Escape Pod Bank, Extended Fuel Cells, Fire
  Suppression Grid, Fixed Hardpoint, Hardened Sensor Baffles, Improved Life
  Support, Jamming Suite, Living Quarters, Luxury Quarters, Medical Bay,
  Navigational Data Archive, Overcharged Capacitors, Redundant Power
  Relays, Reinforced Bulkheads, Reinforced Escape Vector, Reinforced
  Viewports, Scanner Suite Mk I, Scanner Suite Mk II, Sensor Ghost
  Projector, and Silent Running Baffles) do not correspond to any name on
  the site's current listing; they're kept as extra options rather than
  removed, but are flagged here since they aren't part of the site's
  current 257.
- **Maneuvers**: this pack now covers every one of the 119 maneuvers
  currently listed on sw5e.com's Maneuvers page (100 PHB + 19 Expanded
  Content), each with freshly-written rules text that preserves every
  mechanical fact from the site (superiority die effects, ability
  modifiers, saving throws, durations, conditions, etc.). Activation type
  (action/bonus action/reaction/special), saving-throw ability,
  prerequisite, and Maneuver Type (Physical/Mental/General, matching the
  site's own categorization) are all populated as structured fields —
  newly added to the Maneuver item sheet alongside this expansion, since
  the schema already had an `activation`/`savingThrow` field pair that the
  sheet never displayed, and neither a `prerequisite` nor a `type` field
  existed at all despite the site tracking both for every maneuver (most
  requiring a specific skill proficiency, a companion, or an earlier
  maneuver in the same "(Improved)"/"(Greater)" upgrade chain). One
  source-data typo was corrected in the process: the
  site lists "Call to Arms (Improved)" as its own prerequisite, which would
  make the maneuver permanently unobtainable; every other upgrade chain on
  the site requires the base maneuver instead, so this one was corrected
  to require "Call to Arms maneuver" to match. Three maneuvers from this
  system's original build (Ambush, Disarming Attack, Distracting Strike)
  do not correspond to any name on the site's current listing; they're
  kept as extra options rather than removed, but are flagged here since
  they aren't part of the site's current 119. Their Maneuver Type was
  hand-assigned by mechanical comparison to the closest site equivalent
  (Disarming Attack/Distracting Strike match the site's Disarming Blow and
  Distracting Blow; Ambush was classified the same way as the site's
  similar skill-check-boosting maneuvers).
- **Starship "Ship Rating"**: SotG's own Generating Encounters chapter
  explicitly leaves this unwritten ("needs to be rewritten... For the time
  being, have your GM use common sense"), so there was no published formula
  to transcribe. This system now implements an original Ship Rating
  formula instead — see the "Ship Rating" section below for the full
  writeup, including why it's an original design rather than a
  transcription of anything sw5e.com or a D&D 5e sourcebook publishes.
- **Named ship actions** like "Devastating Blast" / "All Power to Engines" /
  "Full Throttle": these specific names were **not found** in the live SW5e
  rules during research (they may come from an older site revision or a
  different homebrew document) — this system instead implements the
  actual current named-action vocabulary (Boost/Detect/Direct/Fire/Helm
  sub-options/Interfere/Patch/Regenerate Shields, plus every deployment's
  own named maneuvers).
- **Customization Options** (new; the character-side counterpart to Ship
  Maneuvers above): sw5e.com publishes a whole "Customization Options"
  system that let a character specialize past their base class/archetype —
  Fighting Styles, Fighting Masteries, Lightsaber Forms, Weapon Focuses,
  Weapon Supremacies, and per-class Class/Multiclass/Splashclass
  Improvements — and this system already had the generic "gateway" feats
  that reference it (Fighting Stylist, Weapon Focused, Class Improvement,
  and so on) but none of the 130 named options those feats actually unlock
  had ever been built. This pack now ships all 130, pulled directly from
  the site's own Vuex store the same way every other category in this
  project was sourced: 32 Fighting Styles, 32 Fighting Masteries, 20
  Lightsaber Forms (PHB), 8 Weapon Focuses and 8 Weapon Supremacies
  (Wretched Hive), and 10 Class Improvements + 10 Multiclass Improvements +
  10 Splashclass Improvements — one of each per class (Expanded Content).
  Rather than creating eight bespoke item types for eight fairly similar
  concepts, all 130 share one new `customizationOption` item type with a
  `category` field (an 8-value enum) distinguishing them, the same
  single-type-plus-category-field pattern Ship Maneuvers already uses for
  its six deployment-pool flavors. A `requirements` field holds each
  option's prerequisite (e.g. Aqinos Form's "The ability to cast tech
  powers"), parsed out of an inline `_**Prerequisite:** ..._` markdown
  line the site embeds at the top of some entries rather than left as
  visible prose in the description; a `className` field is populated only
  for the three per-class Improvement categories (e.g. "Berserker"), since
  those three are the one class's specific improvement rather than a
  freestanding named option. New UI was added on both ends: the Character
  sheet's Features tab gained a "Customization Options" fieldset (with its
  own `+` to add one), and the item sheet's Details tab gained the
  Category dropdown plus Requirements/Class Name fields, matching how
  every other reference-only item type on this system already works —
  the player reads the option and applies it manually, nothing here is
  automated.
- **How-To Guides**: a `howto` compendium of Journal Entries, each a
  complete step-by-step guide to building an iconic character concept from
  1st through 20th level using only this project's own compendium content
  — no new items, no homebrew stat changes, every choice traceable to a
  specific class table, archetype, feat, or item already shipped elsewhere
  in this system. This is the system's first compendium pack of a document
  type other than Item or Actor: a `JournalEntry` pack, registered in
  `system.json` the same way every Item/Actor pack already is, holding
  documents that embed their own child `JournalEntryPage` collection the
  way an Actor embeds `items` — which meant generalizing
  `scripts/build-packs.mjs`'s id/key-assignment step (previously
  hard-coded to Actor's `items` field) into a small per-doctype table of
  `{field, name}` so it now handles a JournalEntry's `pages` field too,
  without changing behavior for any existing Item/Actor pack. Each entry
  is organized as six Journal Entry pages (Overview, Ability Scores &
  Origins, Equipment Progression, two Level-by-Level Guide pages, and a
  closing Tactics/Roleplaying/20th-level-summary page) rather than one
  long page, so the in-app Journal sheet's own page navigation sidebar
  doubles as a table of contents. Seventeen guides ship so far:

  - **"How to Build: Boba Fett"** — Human Operative 20 (Sharpshooter
    Practice). Every mechanical fact in it — the Operative class table,
    Sharpshooter Practice's five archetype features, Sneak Attack
    progression, exploit and feat choices (Commander's/Fighter's/
    Skill's/Fate's/Freedom's Exploits; Weapon Focused/Deadeye/Class
    Improvement/Fighting Master feats), and the equipment (Beskar Weave
    Armor, Carbine Rifle, Wrist Launcher, Rocketpack, Cortosis-Weave
    Gauntlet) — was checked against this project's own class/archetype/
    feat/customization-option/item data and, for the Operative class
    table itself, cross-checked against sw5e.com's live class page. One
    genuine rules interaction the build turns up: a Carbine Rifle carries
    the Auto and Strength properties, which Operative's own weapon
    proficiency list explicitly excludes, so the guide routes proficiency
    with the character's own signature weapon through Human's "Human
    Versatility" trait instead of assuming it — the kind of rules
    cross-check this format is meant to surface.
  - **"How to Build: Obi-Wan Kenobi"** — Human Guardian 20 (Soresu Form),
    Jedi background. Guardian's own class table (Forcecasting, Guardian
    Aura, Guardian Focus, Extra Attack, Force-Empowered Strikes) was
    cross-checked against sw5e.com's live Guardian class page. Uses
    Formfighting Dabbler to pick up three extra lightsaber forms on top of
    Soresu (representing the character's documented shifts in dueling
    style across a long career) and three Guardian Auras (Protection,
    Presence, Warding) built entirely around defense.
  - **"How to Build: Han Solo"** — Human Scout 20 (Deadeye Technique),
    Smuggler background. Deadeye Technique's own 11th-level feature is
    literally named "Shoot First" — a direct, pre-existing mechanical
    match for this character that required no invention at all. Scout's
    core class table (Ranger's Quarry, Pathfinder, Scout Technique) was
    cross-checked against sw5e.com's live Scout class page.
  - **"How to Build: Leia Organa"** — Human Scholar 20 (Politician
    Pursuit), Noble background. Every Ability Score Improvement across
    the whole build is spent on the five-feat Force-Sensitivity chain
    (Force Sensitivity → Force-Sensitive → Improved → Greater → Master)
    instead of raw stats — a deliberate mechanical trade-off representing
    a character who is genuinely Force-sensitive but never had formal
    Jedi training, flagged explicitly at every level it happens.
  - **"How to Build: Darth Vader"** — Human Guardian 20 (Shien/Djem So
    Form), Sith background. Reuses the same Guardian chassis as Obi-Wan
    for his narrative opposite number. The Total Reconstruction feat is
    placed at a specific level (8th) as the build's deliberate turning
    point, granting the droid creature type alongside Human and modeling
    the character's post-injury cybernetic reconstruction mechanically,
    not just narratively.
  - **"How to Build: Wedge Antilles"** — Human Fighter 20 (Mounted
    Specialist), Squadron Pilot background. Squadron Pilot's own feat
    option list contains exactly one choice, Ace Pilot — a guaranteed,
    thematically perfect pick rather than a coincidence. Mounted
    Specialist's features (Born to the Saddle, Warding Maneuver, Hold the
    Line, Ferocious Charger, Vigilant Defender) are read onto a piloted
    starfighter the same way they'd read onto a mount. Fighter's core
    class table (Combat Superiority, Fighter Strategies, Action Surge,
    Indomitable) was cross-checked against sw5e.com's live Fighter class
    page.
  - **"How to Build: C-3PO"** — Class I Droid Scholar 20 (Explorer
    Pursuit), Servant background. Class I's own "Knowledge Protocol"
    trait (two skills keyed to Int/Wis/Cha) models a protocol droid's
    built-in expertise directly; the build deliberately declines every
    weapon option Scholar's equipment list offers, relying entirely on
    Critical Analysis, Sage Advice, and repeated picks of the Ambassador
    Discovery (extra languages) instead.
  - **"How to Build: R2-D2"** — Class II Droid Engineer 20 (Astrotech
    Engineering), Independent Droid background. Class II's "Integrated
    Engineering" trait (a specialist's kit built directly into the frame)
    is spent on astrotech's implements, which then doubles as this
    character's tech focus per Engineer's own Techcasting Focus rule —
    meaning he never needs a separate wristpad. Astrotech Engineering's
    features (Electronic Warfare Platform, Direct Controller, Systems
    Hijack, Electromagnetic Burst) were cross-checked against this
    project's own archetype feature data; Engineer's core class table was
    cross-checked against sw5e.com's live Engineer class page.
  - **"How to Build: K-2SO"** — Class IV Droid Fighter 20 (Praetorian
    Specialist), Independent Droid background. Praetorian Specialist's own
    flavor text opens with "bodyguards to the powerful" — as direct a
    match to a canon character's role as this whole series has produced.
    Class IV's "Martial Protocol" trait supplies the heavy blaster rifle
    and vibroblade proficiency directly; Armor Integration builds
    Composite Armor into the frame rather than worn gear.
  - **"How to Build: Yoda"** — Miraluka Consular 20 (Way of the Sage),
    Consular's Acolyte background. Yoda's own species is never named
    anywhere in canon, so this build uses Miraluka as its closest
    mechanical and thematic analog — a species that perceives the world
    entirely through the Force rather than physical sight, with ability
    bonuses that land exactly where a Consular wants them. Way of the
    Sage's healing chain (Disciple of Life, Preserve Life, Blessed
    Healer, Blessed by the Force, Supreme Healing) is built entirely
    around keeping a whole squad alive rather than dealing damage, and
    Miraluka's innate at-will *mind trick* frees up a known-power slot
    that would otherwise have to be spent on it.
  - **"How to Build: Ahsoka Tano"** — Togruta Sentinel 20 (Path of the
    Forceblade), Jedi background. Sentinel's own class flavor text opens
    by picturing a Togruta wielding a doublesaber and deflecting blaster
    fire — a direct match before a single mechanical choice is made. Path
    of the Forceblade's features (Phasethrow, Forceblade Bond, Twin Saber
    Throw, Disruptive Throw, Forceblade Mastery) model her signature
    reverse-grip, throw-and-recall dual-blade style precisely.
  - **"How to Build: Chewbacca"** — Wookiee Berserker 20 (Warchief
    Approach), Spacer background. Berserker's own class flavor text opens
    with a Wookiee hunter wielding a vibroaxe. Warchief Approach was
    chosen over Frenzied Approach and Juggernaut Approach specifically
    because its features (Commanding Rage, Inspiring Presence, Raid
    Planning, War Chant) are built around protecting and empowering
    allies rather than personal violence — the correct read of a
    character whose rage always serves the people around him.
  - **"How to Build: Chirrut Imwe"** — Human Monk 20 (Whills Order),
    Hermit background. Monk's own class flavor text opens with a
    vibrostaff-wielding warrior deflecting a hail of blaster bolts, and
    Deflect Missiles (3rd level) is a direct mechanical match for the
    character's signature film moment. Whills Order's own name is a
    verbatim match for his in-universe title, "Guardian of the Whills,"
    and its Flurry of Light feature explains mechanically how he fights
    equally well with a staff and a blaster pistol. Monk is also the only
    class in this project with a six-step Ability Score Improvement
    schedule (4th/8th/10th/12th/16th/19th) rather than the five-step
    schedule every other class uses.
  - **"How to Build: Grand Admiral Thrawn"** — Chiss Scholar 20 (Tactician
    Pursuit), Investigator background. Tactician Pursuit's own flavor
    text — "relying on preparation, turning cold study of strategy into
    decisive advantage before a shot is ever fired" — is close to a
    direct quote of the character's reputation. Strategist was considered
    first as an even more literal name match, but this compendium
    currently has no archetype-feature files defining its mechanics
    (unlike every other archetype used across all seventeen guides), so
    the guide documents that gap explicitly and builds with Tactician
    Pursuit instead.
  - **"How to Build: Din Djarin"** — Human Fighter 20 (Shield Specialist),
    Mandalorian background. Shield Specialist's wristpad Techcasting
    feature is the mechanical explanation for gadgets like a grapple line
    and a wrist-mounted flame projector, both modeled directly as known
    tech powers (Grapple Line, Flame Projector, Magnetic Hold). Weapon
    Master was considered first as a more literal name match for a
    gunslinger, but — like Strategist above — has no archetype-feature
    files in this compendium, so Shield Specialist is the pick that
    actually plays at the table.
  - **"How to Build: General Grievous"** — Kaleesh Fighter 20 (Blademaster
    Specialist), Barbarian background. Blademaster Specialist's own
    flavor text — a fighter who "abandons heavy armor entirely" and
    "reads the flow of battle and adapts on the fly" — reads as a direct
    description of a multi-armed cyborg juggling captured lightsabers.
    Its capstone, Bladestorm (18th level, one attack against every
    creature within reach), is the single most literal archetype-to-
    character mechanical match found anywhere in this series.
  - **"How to Build: Admiral Ackbar"** — Mon Calamari Scholar 20
    (Politician Pursuit), Soldier background. Politician Pursuit's
    features (Motivating Diplomat, Reassemble, Beguiling Presence) are
    reframed from backroom persuasion into fleet-command presence — an
    admiral steadying a formation rather than a deal-maker steadying a
    negotiation. Strategist was again the more literal name match and
    again lacks archetype-feature files in this compendium, so the same
    documented substitution applies here as for Thrawn.

  Every class's core table (Guardian, Scout, Scholar, Fighter, Engineer,
  Consular, Sentinel, Berserker, and Monk, in addition to Operative from
  the first guide) was cross-checked against its live sw5e.com class page
  while researching these guides, the same standard applied to every
  other category in this project. Two archetypes researched for this
  batch — Weapon Master (Fighter) and Strategist (Scholar) — turned out
  to have no archetype-feature files anywhere in this compendium, unlike
  every other archetype used across all seventeen guides; both gaps are
  called out explicitly in the affected guides rather than papered over
  with invented mechanics.
- **Species Portraits** (new): all 141 species items now ship with a
  portrait image (previously every one used Foundry's generic
  "mystery-man" placeholder). Images live under `assets/species/` and are
  referenced from each species item's `img` field as
  `systems/sw5e/assets/species/<slug>.<ext>`; filenames were matched to
  each species by name (case/hyphenation-insensitive, with a handful of
  singular/plural and abbreviation matches handled by hand — e.g. a
  "Zygerrians" file to the `zygerrian` species item, "Hutt" to
  `adolescent-hutt`, and the five "Droid-Class-*" files to the five droid
  class species).
- **Restricted (GM-Only) Species** (new): species items now support a
  `system.restricted` boolean, exposed as a checkbox on the item sheet
  (editable only by the GM) right next to the existing "Droid Creature
  Type" toggle. A restricted species stays fully visible and usable in
  the compendium — the GM can still hand-place it on any character or use
  it freely for NPCs — but a new `preCreateItem` hook (in `sw5e.mjs`)
  blocks any non-GM user from adding one to a character by any means
  (drag-and-drop from the compendium included), surfacing a warning
  notification instead. The restriction only gates adding a species going
  forward; it does not retroactively strip one a GM already placed, and a
  restricted species already on a sheet shows a small "RESTRICTED" tag in
  the Features tab so it's easy to spot. Twelve species currently ship
  flagged this way: Ewok, Geonosian, Massassi, Noghri, Rakata, Sith
  Pureblood, Clawdite, Taung, Tusken, Kushiban, Killik, and Jawa.
- **Species/Background Header Sync** (fix): the character sheet header's
  free-text "Species" and "Background" fields (`system.details.species` /
  `system.details.background`) previously had no connection at all to the
  actual embedded species/background Items shown in the Features tab —
  dragging a species onto a character updated the Features list but left
  the header blank or stale. New `createItem`/`deleteItem`/`updateItem`
  hooks in `sw5e.mjs` now keep the header text automatically in sync with
  whichever species/background Item(s) are actually on the actor (joined
  with " / " if more than one, for half-species builds), while leaving
  the field itself still manually editable afterward if a GM wants to
  override it.
- **Delete Buttons on Every Item Type** (fix): the actor sheet's remove
  (trash icon) control existed for most item lists, but two spots only had
  an edit link with no way to remove the item: the Features tab's
  Classes/Archetypes/Species/Backgrounds entries on the character sheet
  (`character-features.hbs`), and a starship's per-deployment maneuver
  list on the crew tab (`starship-crew.hbs`). Both now carry the same
  `itemDelete` trash-icon anchor already used elsewhere — no new code was
  needed, since the `itemDelete` action is already implemented identically
  on the character, NPC, and starship sheet classes.
- **Delete Confirmation Prompt** (new): every `itemDelete` trash-icon
  button across all three actor sheets (character, NPC, starship) now
  raises an "Are you sure?" `DialogV2.confirm` prompt naming the item
  before it's removed — a shared `confirmDelete()` helper in the new
  `module/applications/utils.mjs` is called from each sheet's
  `#onItemDelete` handler, so declining or closing the dialog cancels the
  deletion with the item left untouched.
- **Character Wizard** (new): a "Character Wizard" button in the character
  sheet header (`module/applications/actor/character-wizard.mjs`,
  `templates/apps/character-wizard.hbs`) opens a guided single-page form for
  both building a new character and leveling one up, that auto-adds whatever
  the compendium data says is unconditional and only asks for a choice where
  the rules actually require one:
  - **Ability scores** (new characters only): Manual entry, Standard Array
    (15/14/13/12/10/8), or Point Buy (27-point budget, standard 8-15 cost
    table), validated on Apply.
  - **Species**: pick one (GM-only/restricted species excluded for
    non-GMs); its ability bonuses, walk/fly/swim/climb speed, and languages
    are applied to the actor automatically — no species in this compendium
    currently has a "choice" ability bonus, so none needed a picker.
  - **Background**: pick one; its `skillProficiencies` choose-N-of-M and
    `grantedFeat` choose-N-of-M are presented as checkboxes (a granted-feat
    option with no matching Feat item in the compendium — e.g. "Improvised
    Ingenuity", "Negotiator" — shows disabled with a "not in compendium"
    note rather than silently vanishing). Starting `equipment` text is
    shown for reference only; it is not parsed into items.
  - **Class & level**: add a level to an existing class item or add a
    brand-new class (multiclass), with a target-level field. A class's
    `skillChoices` picker only appears the first time that class item is
    created. Crossing the class's `archetypeLevel` (always 3rd, verified
    against every class's own data) with no Archetype embedded yet prompts
    an Archetype pick, filtered to that class.
  - **Automatic Archetype Features**: once an archetype is known (existing
    or newly picked this session), any Archetype Feature item whose
    `archetypeName`/`className`/`level` fall in the newly-crossed range is
    embedded automatically — listed read-only for transparency, no
    additional input needed.
  - **Ability Score Improvement vs. Feat**: a new `asiLevels` field was
    added to `ClassData` (`module/data/item/class.mjs`) and populated for
    all 10 classes from the official sw5e-foundry system's own class
    advancement data (github.com/sw5e-foundry/sw5e) — the 5e-standard
    4/8/12/16/19 progression for most classes, with Fighter's bonus ASIs at
    6/14 and Monk's/Operative's bonus ASI at 10 (matching their 5e
    Fighter/Monk/Rogue analogues) all verified rather than assumed. Every
    class level crossed that lands on one of these gets a choice between
    a 2-point Ability Score Improvement (+2 to one ability or +1/+1 to two,
    capped at 20) or a Feat (with that feat's own ability-increase
    sub-choice, if it has one). Which levels have already been resolved is
    tracked per class item via a `flags.sw5e.resolvedAsi` array, so
    re-opening the wizard later never re-asks for the same level twice.
  - **HP**: increased automatically on any level gained — full hit die on
    the character's very first class level ever, the class's hit-die
    average (`floor(size/2)+1`, the 5e-standard rounding) per level after
    that, plus the (post-wizard) Constitution modifier per level gained.
  - **Force/Tech Powers and Superiority Maneuvers known**: `ClassData`
    gained two more fields, `castingSchool` ("none"/"force"/"tech", which
    pool `casterProgression` feeds) and `maneuverProgression`
    ("none"/"half"/"full", independent of power casting — Fighter casts no
    powers at all but *does* get half maneuver progression, same as its 5e
    Battle-Master-esque analogue). All of `SW5E.powersKnown`,
    `powerMaxLevel`, `powerPointsBase`, `maneuversKnownProgression`,
    `superiorityDiceQuantProgression`, and `superiorityDieSizeProgression`
    (`module/config.mjs`) were copied verbatim from the official
    sw5e-foundry system's own class-progression tables — including catching
    two real mislabels this project had carried before: Sentinel's tier was
    called `"twothirds"` (the real tier is three-quarters, renamed
    `"threequarters"`) and Scholar's was `casterProgression: "maneuver"`
    (Scholar casts no powers at all — full maneuver progression is its own
    axis, same fix as Fighter above). Wizard behavior: whenever a level-up
    crosses into more known powers/maneuvers than currently owned, it shows
    a checklist of not-yet-owned Powers (filtered to the newly-computed max
    castable level) or Maneuvers to pick up to that many of — picking fewer
    is allowed (nothing forces filling every slot the moment it unlocks).
    `CharacterData` gained matching `resources.force/tech.known.{value,max}`
    and `.maxPowerLevel`, and `resources.superiority.known.{value,max}`
    (`module/data/actor/character.mjs`) — the `.value` half of each is
    always derived live from the actor's actually-owned Power/Maneuver
    items (never goes stale even if items are added or removed by hand),
    while `.max`/`.maxPowerLevel` are (re)computed by the wizard from the
    actor's full current class roster every time it applies, exactly
    mirroring the official system's own multiclass "combined caster level"
    math rather than a simplified approximation. The Powers tab now shows
    an X/Y known count alongside the existing point totals for both power
    pools and for Maneuvers.
  - Explicitly **not** automated (documented rather than silently skipped,
    same policy as the Weapon Master/Strategist archetype gap elsewhere in
    this file): starting equipment as actual embedded items — a
    Background's `equipment` field is free text, not structured items, so
    it's still added by hand from the compendium exactly as before.

## Ship Rating

Chapter 10 (Generating Encounters) of SotG's own rules never got a working
Ship Rating system — the author's note in the live rules text says so
directly: "Encounter Creation and Ship Rating (analogous to Challenge
Rating for creatures) needs to be rewritten. It will require a decent
amount of math on my end, so it's not ready yet. For the time being, have
your GM use common sense to dictate what is an appropriate encounter."
Since there's nothing published to transcribe, this system implements an
original Rating formula instead — inspired by the general idea of a
numeric challenge-difficulty score (the same concept D&D 5e's Challenge
Rating uses for creatures), but with entirely original numbers and
breakpoints tuned to this system's own Hull/Shield/AC/weapon-damage math,
not copied from any published table.

**How it's computed**, automatically, for every Starship actor — PC-built
or NPC stat block alike — as a live derived `system.rating` value shown on
the sheet header next to Hull/Shield/AC/Speed:

- *Effective HP* is Hull Max + Shield Max: the total damage a ship can
  absorb before Hull Points start dropping toward destruction.
- *Defensive Rating* divides Effective HP by 15, then adjusts it up or
  down 5% per point the ship's actual Armor Class differs from a
  size-neutral baseline of 12 + its Tier's cumulative AC bonus (capped at
  ±50%) — a well-armored ship of its Tier counts as tougher than its raw
  HP alone suggests, and vice versa.
- *Offensive Rating* sums the average damage (each die rounded up, e.g.
  1d10 counts as 6 — the same rounding convention already used for this
  system's Hull/Shield Dice averages) of every currently-equipped Starship
  Weapon item on the ship, divided by 3. This intentionally ignores
  to-hit bonus, since a starship's actual attack roll is made by whichever
  crewmember is manning that hardpoint (their own ability score +
  proficiency), not a fixed value belonging to the ship itself — Offensive
  Rating instead represents the ship's raw broadside firepower if every
  mounted weapon fires in a round.
- *Ship Rating* is the average of the two, rounded to the nearest 0.5.

**Building encounters**: sum the Ship Rating of every ship on one side of
a fight. For multiple enemy ships acting in concert, multiply that sum by
a squadron multiplier — ×1 for a single ship, ×1.2 for two, ×1.5 for three
or four, ×2 for five to eight, ×2.5 for nine or more — since a coordinated
group is more dangerous than its Ratings simply added together. Compare
that Effective Encounter Rating to the party's combined Ship Rating: at or
below half, the fight is Easy; up to the full total, Standard; up to 1.5×,
Hard; above that, Deadly. These bands and the squadron multiplier are, like
the Rating formula itself, an original design rather than a transcription
of anything sw5e.com or a D&D 5e sourcebook publishes.

**Worked examples** from this pack's own 6 example starships (Ratings are
live-computed, not hand-entered — these are what the formula actually
produces once a ship's stats and weapon loadout are known):

| Ship | Effective HP | Avg. Damage | Ship Rating |
|---|---|---|---|
| Whisper-Class Probe Droid (unarmed recon drone) | 5 | 0 | 0 |
| Talon-Class Attack Fighter | 34 | 6 | 2 |
| Bulldog-Class Gunship | 76 | 12 | 4.5 |
| Leviathan-Class Carrier ("modest weapons batteries") | 181 | 11 | 7 |
| Sentinel-Class Cruiser | 147 | 39 | 11 |
| Ravager-Class Warship | 435 | 100 | 29 |

Five of these six ships (all but the Probe Droid, which is intentionally
unarmed per its own flavor text) were given a small representative weapon
loadout from this pack's Starship Weapons compendium — 1 to 4 weapons per
ship, matching its previously-recorded hardpoint count — specifically so
their Ship Rating would be non-zero and demonstrable; the loadouts
themselves are illustrative choices, not a transcription of any published
stat block.

## Ground Vehicles

SW5e does not have a separate ground-vehicle stat block system — its own
rules explicitly reuse the Starship chassis at a different scale (a Tiny
starship "is Huge on the ground scale," etc., with a ×10/÷10 damage
conversion between scales). Build a speeder, swoop, or walker as a
(typically Tiny or Small) Starship actor.

## Rules Sources

Mechanics were transcribed from a live read-through of the current rules at
sw5e.com (Starships of the Galaxy chapters 1–10 & Appendix A, and the
Player's Handbook chapters covering classes/species/casting/what's-
different), current as of the site's "Delta Squad" maintainership. Where the
live rules text was ambiguous, incomplete, or silent (flagged explicitly in
the design notes above), this system fills the gap with a clearly-labeled,
mechanically consistent default rather than guessing at "official" text.

## Development

```
sw5e/
├── system.json           # Foundry manifest (documentTypes, packs, etc.)
├── sw5e.mjs               # Entry point — registers everything
├── module/
│   ├── config.mjs         # SW5E.* reference data (all game-content tuning lives here)
│   ├── data/              # DataModel schemas (Actor/Item/CombatantGroup system data)
│   ├── documents/         # Actor/Item/Combat/Combatant/CombatantGroup subclasses
│   ├── applications/      # ApplicationV2 sheets
│   └── dice/              # Roll subclasses
├── templates/             # Handlebars sheet parts
├── styles/sw5e.css        # System styling (lands in the "system" CSS layer)
├── lang/en.json           # Localization
├── src/packs/             # Human-readable compendium source (one JSON doc per file)
├── packs/                 # Compiled LevelDB compendium packs (generated)
└── scripts/build-packs.mjs
```

No build step is required to *run* the system (it ships plain ES modules);
`npm run build:packs` is only needed after editing `src/packs/`.
