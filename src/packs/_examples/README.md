# Compendium Source Examples

These are reference documents only (not compiled into any pack — this
folder's name doesn't match any pack in `system.json`). They show the exact
JSON envelope every compendium source document should follow.

Common envelope for every document (Actor or Item):

```json
{
  "name": "Display Name",
  "type": "weapon",
  "img": "icons/svg/sword.svg",
  "system": { },
  "effects": [],
  "folder": null,
  "sort": 0,
  "ownership": { "default": 0 },
  "flags": {}
}
```

Do **not** include `_id` — `scripts/build-packs.mjs` assigns a stable random
16-character id to any source document missing one (and rewrites the file in
place so ids stay stable across rebuilds).

Only use these known-safe core icon paths (all ship with Foundry itself, so
they always resolve): `icons/svg/sword.svg`, `icons/svg/shield.svg`,
`icons/svg/pistol.svg`, `icons/svg/explosion.svg`, `icons/svg/lightning.svg`,
`icons/svg/aura.svg`, `icons/svg/book.svg`, `icons/svg/circle.svg`,
`icons/svg/upgrade.svg`, `icons/svg/anchor.svg`, `icons/svg/target.svg`,
`icons/svg/statue.svg`, `icons/svg/mystery-man.svg`, `icons/svg/item-bag.svg`,
`icons/svg/heal.svg`, `icons/svg/radiation.svg`, `icons/svg/cog.svg`,
`icons/svg/wing.svg`, `icons/svg/castle.svg`, `icons/svg/car.svg`,
`icons/svg/combat.svg`, `icons/svg/skull.svg`, `icons/svg/eye.svg`.
