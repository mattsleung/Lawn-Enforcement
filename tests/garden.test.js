import test from "node:test";
import assert from "node:assert/strict";

import { GARDEN_MAP } from "../src/config/map-config.js";
import { Game } from "../src/core/game.js";
import { CommonWeed } from "../src/entities/common-weed.js";
import { DandelionBoss } from "../src/entities/dandelion-boss.js";
import { SporeProjectile } from "../src/entities/spore-projectile.js";

test("Common Weed grows once early, once near the end of life, and expires after five seconds", () => {
  const weed = new CommonWeed({ x: 0, y: 0 });
  assert.equal(weed.maxHealth, 10);
  assert.equal(weed.update(0.39, { x: 100, y: 0 }).copyWeed, undefined);
  assert.deepEqual(weed.update(0.02, { x: 100, y: 0 }).copyWeed, { x: 48, y: 0 });
  assert.equal(weed.update(1, { x: 100, y: 0 }).copyWeed, undefined);
  assert.deepEqual(weed.update(3.2, { x: 100, y: 0 }).copyWeed, { x: 48, y: 0 });
  weed.update(0.4, { x: 100, y: 0 });
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

test("Dandelion boss weeds have 200 health, no expiry, and never reproduce", () => {
  const weed = new CommonWeed({ x: 0, y: 0, bossMode: true });
  assert.equal(weed.maxHealth, 200);
  assert.equal(weed.health, 200);
  assert.equal(weed.lifetime, Number.POSITIVE_INFINITY);
  assert.deepEqual(weed.update(20, { x: 100, y: 0 }), {});
  assert.equal(weed.active, true);
});

test("Dandelion boss mode converts existing and spawned weeds", () => {
  const existing = new CommonWeed({ x: 100, y: 100 });
  const game = Object.create(Game.prototype);
  game.currentMap = GARDEN_MAP;
  game.world = GARDEN_MAP.world;
  game.bossSpawned = false;
  game.bossIndex = 0;
  game.bossNextSpawnTimer = null;
  game.boss = null;
  game.bossIntroTime = 0;
  game.player = { x: 500, y: 500 };
  game.camera = { viewWidth: 1280, viewHeight: 720 };
  game.enemies = [existing];
  game.spawnBoss();
  assert.equal(existing.maxHealth, 200);
  game.spawnCommonWeedAt(200, 200);
  const spawned = game.enemies.at(-1);
  assert.equal(spawned.maxHealth, 200);
  assert.equal(spawned.bossMode, true);
});

test("Dandelion boss weeds separate until they no longer touch", () => {
  const first = new CommonWeed({ x: 200, y: 200, bossMode: true });
  const second = new CommonWeed({ x: 200, y: 200, bossMode: true });
  const game = Object.create(Game.prototype);
  game.world = { width: 1000, height: 800 };
  game.bossSpawned = true;
  game.boss = { active: true, enemyType: "dandelion" };
  game.enemies = [first, second];
  game.separateDandelionWeeds();
  assert.ok(Math.hypot(first.x - second.x, first.y - second.y) >= first.radius + second.radius);
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

test("Common Weeds drop one coin fifty percent of the time", () => {
  const game = Object.create(Game.prototype);
  game.pickups = [];
  game.progress = { defeatedEnemies: { "common-weed": 0 } };
  game.random = () => 0.49;
  game.damageEnemy(new CommonWeed({ x: 100, y: 100 }), 10);
  assert.equal(game.pickups.filter((pickup) => pickup.type === "coin").length, 1);

  game.pickups = [];
  game.random = () => 0.5;
  game.damageEnemy(new CommonWeed({ x: 100, y: 100 }), 10);
  assert.equal(game.pickups.filter((pickup) => pickup.type === "coin").length, 0);
});

test("Dandelion fires four spores every half second", () => {
  const boss = new DandelionBoss({ x: 200, y: 200, config: GARDEN_MAP.boss });
  assert.equal(boss.maxHealth, 800);
  assert.equal(boss.shieldStrength, 200);
  assert.equal(boss.update(0.49, { x: 400, y: 200 }).fireSpores, false);
  assert.equal(boss.update(0.02, { x: 400, y: 200 }).fireSpores, true);

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

test("Dandelion fires one non-tracking spore toward the player every half second", () => {
  const boss = new DandelionBoss({ x: 100, y: 100, config: GARDEN_MAP.boss });
  assert.equal(boss.update(0.49, { x: 400, y: 100 }).fireAimedSpore, false);
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

test("Dandelion shields immediately and regenerates health at 15 per second", () => {
  const boss = new DandelionBoss({ x: 0, y: 0, config: GARDEN_MAP.boss });
  assert.equal(boss.takeDamage(701), false);
  assert.equal(boss.health, 99);
  assert.equal(boss.shield, 200);
  boss.takeDamage(210);
  assert.equal(boss.health, 89);
  assert.equal(boss.shield, 0);
  const regenBoss = new DandelionBoss({ x: 0, y: 0, config: GARDEN_MAP.boss });
  regenBoss.health = 50;
  regenBoss.update(1, { x: 0, y: 0 });
  assert.equal(regenBoss.health, 65);
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
