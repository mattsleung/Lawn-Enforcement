import test from "node:test";
import assert from "node:assert/strict";

import { Pickup } from "../src/entities/pickup.js";

test("pickups wait outside range, move toward the player, and collect on contact", () => {
  const player = { x: 0, y: 0, radius: 20, pickupRadius: 90 };
  const pickup = new Pickup({ x: 120, y: 0, type: "xp", amount: 10 });
  pickup.update(0.1, player);
  assert.equal(pickup.x, 120);
  assert.equal(pickup.active, true);

  pickup.x = 80;
  pickup.update(0.1, player);
  assert.equal(pickup.x, 37);
  pickup.update(0.1, player);
  assert.equal(pickup.active, false);
  assert.equal(pickup.amount, 10);
});
