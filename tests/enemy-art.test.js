import test from "node:test";
import assert from "node:assert/strict";

import { ENEMY_GLOSSARY } from "../src/config/glossary-config.js";
import { bestiaryEnemyPreview } from "../src/core/game.js";

test("every bestiary entry uses its matching live enemy renderer", () => {
  for (const entry of ENEMY_GLOSSARY) {
    const preview = bestiaryEnemyPreview(entry.id);
    assert.ok(preview, `${entry.id} should resolve to a live enemy preview`);
    assert.equal(preview.enemyType, entry.id);
    assert.equal(typeof preview.render, "function");
    assert.equal(preview.active, true);
  }
});

test("unknown bestiary entries fail safely", () => {
  assert.equal(bestiaryEnemyPreview("not-a-real-enemy"), null);
});
