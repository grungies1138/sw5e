# Contributing

## Branches

- `master` is the stable branch.
- `dev` is where ongoing work lands; open PRs against `dev`, which merges into `master` periodically.

## Compendium content

Compendium packs are authored as individual JSON files under `src/packs/<name>/`, one document per file — that's the source of truth, and it's what you should hand-edit.

The compiled LevelDB packs under `packs/` (what `system.json` and Foundry actually load) are generated from `src/packs/` via:

```bash
npm install
npm run build:packs
```

Both `src/packs/` and the compiled `packs/` are tracked in git so a fresh clone works immediately. If you edit anything under `src/packs/`, re-run the build and commit the resulting `packs/` changes in the same commit as your source edit — otherwise the two drift out of sync and Foundry keeps loading the stale compiled version.

`npm run build:packs` needs an exclusive file handle on each pack's directory, so close any running Foundry world using this system before rebuilding (or it'll fail, or in the worst case leave a pack's compiled output corrupted from the race).
