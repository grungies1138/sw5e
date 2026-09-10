/**
 * Build script: assigns a stable random Foundry-style document id to any
 * source JSON document missing one, then compiles every `src/packs/<name>`
 * directory of individual JSON documents into the compiled LevelDB
 * compendium pack at `packs/<name>` that system.json actually references.
 *
 * Usage: node scripts/build-packs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_PACKS = path.join(ROOT, "src", "packs");
const OUT_PACKS = path.join(ROOT, "packs");

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function randomId(length = 16) {
  let id = "";
  for (let i = 0; i < length; i++) id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  return id;
}

// Foundry's LevelDB compendium keys are prefixed by the collection name for
// the pack's document type (e.g. "!items!<id>"), not the type itself --
// this is the standard, version-stable mapping (see CONST.COMPENDIUM_DOCUMENT_TYPES
// in Foundry's own source). Extend this if a future pack uses another type.
const COLLECTION_BY_DOC_TYPE = {
  Actor: "actors", Item: "items", JournalEntry: "journal", Scene: "scenes",
  RollTable: "tables", Macro: "macros", Playlist: "playlists", Cards: "cards",
  Adventure: "adventures"
};

/**
 * Walk every *.json file directly inside a pack source directory and ensure
 * it has a stable `_id` AND a `_key` ("!<collection>!<id>"). `compilePack`
 * silently SKIPS any document missing `_key` with no warning or error --
 * every source doc in this project was hand-authored without one, so a
 * naive first run of this script silently produced empty compendiums for
 * every pack except the handful whose files had already picked up a `_key`
 * from some earlier export. Assigning it here, once, permanently fixes the
 * source files the same way `_id` assignment already does.
 */
function assignIds(dir, docType) {
  const used = new Set();
  const collection = COLLECTION_BY_DOC_TYPE[docType];
  if (!collection) throw new Error(`Unknown compendium document type "${docType}" for pack at ${dir}`);
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  let assigned = 0;
  for (const file of files) {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const doc = JSON.parse(raw);
    let changed = false;
    if (!doc._id) {
      let id = randomId();
      while (used.has(id)) id = randomId();
      doc._id = id;
      changed = true;
    }
    used.add(doc._id);
    const expectedKey = `!${collection}!${doc._id}`;
    if (doc._key !== expectedKey) {
      doc._key = expectedKey;
      changed = true;
    }
    if (changed) {
      assigned++;
      const ordered = { _id: doc._id, _key: doc._key, ...doc };
      fs.writeFileSync(full, JSON.stringify(ordered, null, 2) + "\n");
    }
  }
  return { total: files.length, assigned };
}

async function main() {
  if (!fs.existsSync(SRC_PACKS)) {
    console.error(`No src/packs directory found at ${SRC_PACKS}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT_PACKS, { recursive: true });

  const systemJson = JSON.parse(fs.readFileSync(path.join(ROOT, "system.json"), "utf8"));
  const docTypeByPack = new Map(systemJson.packs.map(p => [p.name, p.type]));

  const dirs = fs.readdirSync(SRC_PACKS, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith("_"))
    .map(d => d.name);

  console.log(`Found ${dirs.length} pack source directories.`);

  for (const name of dirs) {
    const docType = docTypeByPack.get(name);
    if (!docType) throw new Error(`No entry for pack "${name}" found in system.json's "packs" list`);
    const srcDir = path.join(SRC_PACKS, name);
    const { total, assigned } = assignIds(srcDir, docType);
    console.log(`  [${name}] ${total} documents (${assigned} newly assigned ids/keys)`);

    const outDir = path.join(OUT_PACKS, name);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });

    await compilePack(srcDir, outDir, { log: false });
    console.log(`  [${name}] compiled -> packs/${name}`);
  }

  console.log("\nAll packs compiled successfully.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
