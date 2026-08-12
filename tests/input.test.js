import test from "node:test";
import assert from "node:assert/strict";

import { Input } from "../src/core/input.js";

test("X requests one immediate boss spawn without repeating", () => {
  const input = Object.create(Input.prototype);
  input.rebindingAction = null;
  input.keybinds = { melee: "Digit1", ranged: "Digit2" };
  input.keys = new Set();
  input.bossSpawnRequested = false;
  input.upgradeChoiceRequested = null;
  input.weaponSlotRequested = null;
  input.menuActionRequested = null;
  input.restartRequested = false;
  input.pauseRequested = false;
  input.confirmRequested = false;

  let prevented = false;
  input.handleKeyDown({ code: "KeyX", repeat: false, preventDefault: () => { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(input.consumeBossSpawnRequest(), true);
  assert.equal(input.consumeBossSpawnRequest(), false);

  input.handleKeyDown({ code: "KeyX", repeat: true, preventDefault: () => {} });
  assert.equal(input.consumeBossSpawnRequest(), false);
});
