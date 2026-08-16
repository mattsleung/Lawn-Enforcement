import test from "node:test";
import assert from "node:assert/strict";

import { Game } from "../src/core/game.js";
import { CommonWeed } from "../src/entities/common-weed.js";
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

test("one-percent magnet drops attract every coin and XP pickup", () => {
  const game = Object.create(Game.prototype);
  game.pickups = [];
  game.progress = { defeatedEnemies: { "common-weed": 0 } };
  game.random = () => 0.009;
  const weed = new CommonWeed({ x: 100, y: 100 });
  weed.coinDropChance = 0;
  weed.xpDropChance = 0;
  game.damageEnemy(weed, 10);
  assert.equal(game.pickups.filter((pickup) => pickup.type === "magnet").length, 1);

  game.pickups = [
    new Pickup({ x: 500, y: 500, type: "coin" }),
    new Pickup({ x: 700, y: 700, type: "xp", amount: 10 }),
    new Pickup({ x: 100, y: 100, type: "magnet" }),
  ];
  game.runCoins = 0;
  game.runXp = 0;
  game.levelXp = 0;
  game.xpToNextLevel = 30;
  game.screenState = "defeat";
  game.pickups[2].active = false;
  game.collectPickup(game.pickups[2]);
  assert.equal(game.magnetActive, true);
  assert.equal(game.runCoins, 0);
  assert.equal(game.runXp, 0);

  const player = { x: 0, y: 0, radius: 20, pickupRadius: 90 };
  const distantCoin = game.pickups[0];
  const initialDistance = Math.hypot(distantCoin.x, distantCoin.y);
  distantCoin.update(0.1, player, { attractAll: game.magnetActive });
  assert.ok(Math.abs(Math.hypot(distantCoin.x, distantCoin.y) - (initialDistance - 86)) < 1e-9);
  assert.equal(distantCoin.active, true);
});
