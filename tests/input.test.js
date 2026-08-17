import test from "node:test";
import assert from "node:assert/strict";

import { Input, isEditableTarget } from "../src/core/input.js";

test("account fields receive typing without triggering game controls", () => {
  assert.equal(isEditableTarget({ tagName: "INPUT" }), true);
  assert.equal(isEditableTarget({ tagName: "TEXTAREA" }), true);
  assert.equal(isEditableTarget({ tagName: "CANVAS" }), false);

  const input = Object.create(Input.prototype);
  input.keys = new Set(["KeyW"]);
  input.handleKeyDown({ target: { tagName: "INPUT" }, code: "KeyS", repeat: false });
  assert.deepEqual([...input.keys], []);
});

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
