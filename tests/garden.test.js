import test from "node:test";
import assert from "node:assert/strict";

import { GARDEN_MAP } from "../src/config/map-config.js";
import { Game } from "../src/core/game.js";
import { CommonWeed } from "../src/entities/common-weed.js";
import { DandelionBoss } from "../src/entities/dandelion-boss.js";
import { SporeProjectile } from "../src/entities/spore-projectile.js";

test("Common Weed has 10 health, clones once toward the player, and expires after five seconds", () => {
  const weed = new CommonWeed({ x: 0, y: 0 });
  assert.equal(weed.maxHealth, 10);
  assert.equal(weed.update(0.39, { x: 100, y: 0 }).copyWeed, undefined);
  assert.deepEqual(weed.update(0.02, { x: 100, y: 0 }).copyWeed, { x: 48, y: 0 });
  assert.equal(weed.update(1, { x: 100, y: 0 }).copyWeed, undefined);
  weed.update(3.6, { x: 100, y: 0 });
  assert.equal(weed.active, false);
});

test("a frozen Common Weed pauses its clone timer", () => {
  const weed = new CommonWeed({ x: 0, y: 0 });
  weed.freezeTime = 1;
  assert.equal(weed.update(0.4, { x: 100, y: 0 }).copyWeed, undefined);
  assert.equal(weed.copyTimer, 0.4);
  weed.freezeTime = 0;
  assert.deepEqual(weed.update(0.4, { x: 100, y: 0 }).copyWeed, { x: 48, y: 0 });
});

test("Garden normal spawns create Common Weeds", () => {
  const game = Object.create(Game.prototype);
  game.currentMap = GARDEN_MAP;
  game.world = GARDEN_MAP.world;
  game.player = { x: 500, y: 500 };
  game.camera = { viewWidth: 1280, viewHeight: 720 };
  game.enemies = [];
  game.runTime = 0;
  game.spawnNormalEnemy(0);
  assert.equal(game.enemies.length, 1);
  assert.equal(game.enemies[0] instanceof CommonWeed, true);
});

test("defeated Common Weeds drop one XP orb fifty percent of the time", () => {
  const game = Object.create(Game.prototype);
  game.pickups = [];
  game.progress = { defeatedEnemies: { "common-weed": 0 } };
  game.random = () => 0.49;
  const weed = new CommonWeed({ x: 100, y: 100 });
  game.damageEnemy(weed, 10);
  assert.equal(game.pickups.filter((pickup) => pickup.type === "xp").length, 1);
  assert.equal(game.pickups.find((pickup) => pickup.type === "xp").amount, 10);

  game.pickups = [];
  game.random = () => 0.5;
  game.damageEnemy(new CommonWeed({ x: 100, y: 100 }), 10);
  assert.equal(game.pickups.filter((pickup) => pickup.type === "xp").length, 0);
});

test("Dandelion fires four spores every ten seconds", () => {
  const boss = new DandelionBoss({ x: 200, y: 200, config: GARDEN_MAP.boss });
  assert.equal(boss.maxHealth, 1000);
  assert.equal(boss.shieldStrength, 200);
  assert.equal(boss.update(9.99, { x: 400, y: 200 }).fireSpores, false);
  assert.equal(boss.update(0.01, { x: 400, y: 200 }).fireSpores, true);

  const game = Object.create(Game.prototype);
  game.bossProjectiles = [];
  game.fireDandelionSpores(boss);
  assert.equal(game.bossProjectiles.length, 4);
  assert.deepEqual(
    game.bossProjectiles.map((spore) => Math.round(Math.hypot(spore.velocityX, spore.velocityY))),
    [280, 280, 280, 280],
  );
  assert.equal(game.bossProjectiles.every((spore) => spore.damage === 20), true);
});

test("Dandelion fires one non-tracking spore toward the player every two seconds", () => {
  const boss = new DandelionBoss({ x: 100, y: 100, config: GARDEN_MAP.boss });
  assert.equal(boss.update(1.99, { x: 400, y: 100 }).fireAimedSpore, false);
  assert.equal(boss.update(0.02, { x: 400, y: 100 }).fireAimedSpore, true);

  const game = Object.create(Game.prototype);
  game.player = { x: 100, y: 380 };
  game.bossProjectiles = [];
  boss.x = 100;
  boss.y = 100;
  game.fireDandelionAimedSpore(boss);
  assert.equal(game.bossProjectiles.length, 1);
  assert.equal(Math.round(game.bossProjectiles[0].velocityX), 0);
  assert.equal(Math.round(game.bossProjectiles[0].velocityY), 280);
});

test("Dandelion shields immediately, recharges in five seconds, and regenerates health", () => {
  const boss = new DandelionBoss({ x: 0, y: 0, config: GARDEN_MAP.boss });
  assert.equal(boss.takeDamage(901), false);
  assert.equal(boss.health, 99);
  assert.equal(boss.shield, 200);
  boss.takeDamage(210);
  assert.equal(boss.health, 89);
  assert.equal(boss.shield, 0);
  boss.update(2, { x: 0, y: 0 });
  assert.equal(boss.health, 99);
  assert.equal(boss.shield, 0);
  boss.takeDamage(50);
  assert.equal(boss.health, 49);
  boss.update(2.99, { x: 0, y: 0 });
  assert.equal(boss.shield, 0);
  boss.update(0.01, { x: 0, y: 0 });
  assert.equal(boss.health, 64);
  assert.equal(boss.shield, 200);
});

test("Dandelion can activate its shield at most five times", () => {
  const boss = new DandelionBoss({ x: 0, y: 0, config: GARDEN_MAP.boss });
  boss.health = 50;
  for (let activation = 1; activation <= 5; activation += 1) {
    boss.shield = 0;
    boss.shieldTimer = 0;
    boss.queueShield();
    assert.equal(boss.shield, 200);
    assert.equal(boss.shieldActivations, activation);
  }
  boss.shield = 0;
  boss.shieldTimer = 0;
  boss.queueShield();
  assert.equal(boss.shield, 0);
  assert.equal(boss.shieldActivations, 5);
});

test("spores stop on contact or expiry and are ready to grow one weed", () => {
  const spore = new SporeProjectile({ x: 50, y: 50, velocityX: 100, velocityY: 0, damage: 20, lifetime: 1 });
  spore.update(0.5, { width: 500, height: 500 });
  assert.deepEqual({ x: spore.x, y: spore.y, active: spore.active }, { x: 100, y: 50, active: true });
  spore.hitPlayer();
  assert.equal(spore.active, false);
  assert.equal(spore.damage, 20);
  assert.equal(spore.spawnedWeed, false);
});
