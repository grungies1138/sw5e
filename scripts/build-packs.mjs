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

/** Walk every *.json file directly inside a pack source directory and ensure it has a stable `_id`. */
function assignIds(dir) {
  const used = new Set();
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
  let assigned = 0;
  for (const file of files) {
    const full = path.join(dir, file);
    const raw = fs.readFileSync(full, "utf8");
    const doc = JSON.parse(raw);
    if (!doc._id) {
      let id = randomId();
      while (used.has(id)) id = randomId();
      doc._id = id;
      used.add(id);
      assigned++;
      const ordered = { _id: doc._id, ...doc };
      fs.writeFileSync(full, JSON.stringify(ordered, null, 2) + "\n");
    } else {
      used.add(doc._id);
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

  const dirs = fs.readdirSync(SRC_PACKS, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith("_"))
    .map(d => d.name);

  console.log(`Found ${dirs.length} pack source directories.`);

  for (const name of dirs) {
    const srcDir = path.join(SRC_PACKS, name);
    const { total, assigned } = assignIds(srcDir);
    console.log(`  [${name}] ${total} documents (${assigned} newly assigned ids)`);

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
