import test from "node:test";
import assert from "node:assert/strict";

import { GARDEN_MAP } from "../src/config/map-config.js";
import { Game } from "../src/core/game.js";
import { CommonWeed } from "../src/entities/common-weed.js";
import { DandelionBoss } from "../src/entities/dandelion-boss.js";
import { LilyPad } from "../src/entities/lily-pad.js";
import { SporeProjectile } from "../src/entities/spore-projectile.js";
import { Deer } from "../src/entities/deer.js";
import { Snail } from "../src/entities/snail.js";
import { SnailSpitProjectile } from "../src/entities/snail-spit-projectile.js";

test("Redwood snails move slightly faster and leave timed slime trails", () => {
  const snail = new Snail({ x: 0, y: 0 });
  assert.equal(snail.speed, 45);
  const event = snail.update(0.1, { x: 100, y: 0 });
  assert.deepEqual(event.slimeTrail, { x: 4.5, y: 0, radius: 30, lifetime: 5 });

  const game = Object.create(Game.prototype);
  game.slimeTerrain = [];
  game.addSlimePuddle(event.slimeTrail.x, event.slimeTrail.y, 30, 5, false, false);
  game.addSlimePuddle(event.slimeTrail.x + 6, event.slimeTrail.y, 30, 5, false, false);
  assert.equal(game.slimeTerrain.length, 2);
});

test("Redwood deer warning uses the same snapshotted vector as its charge", () => {
  const deer = new Deer({ x: 0, y: 0 });
  const originalTarget = { x: 100, y: 0 };
  deer.update(0.01, originalTarget);
  assert.equal(deer.state, "prepare");
  assert.deepEqual({ x: deer.chargeX, y: deer.chargeY }, { x: 1, y: 0 });
  deer.update(0.8, { x: 0, y: 100 });
  assert.equal(deer.state, "charge");
  assert.deepEqual({ x: deer.chargeX, y: deer.chargeY }, { x: 1, y: 0 });
});

test("Ancient Snail spit safely deactivates when it hits the player", () => {
  const spit = new SnailSpitProjectile({ x: 0, y: 0, velocityX: 1, velocityY: 0 });
  spit.hitPlayer();
  assert.equal(spit.active, false);
});

test("Common Weed grows once early, once near the end of life, and expires after four seconds", () => {
  const weed = new CommonWeed({ x: 0, y: 0 });
  assert.equal(weed.maxHealth, 10);
  assert.equal(weed.lifetime, 4);
  assert.equal(weed.update(0.39, { x: 100, y: 0 }).copyWeed, undefined);
  assert.deepEqual(weed.update(0.02, { x: 100, y: 0 }).copyWeed, { x: 48, y: 0 });
  assert.equal(weed.update(1, { x: 100, y: 0 }).copyWeed, undefined);
  assert.deepEqual(weed.update(2.2, { x: 100, y: 0 }).copyWeed, { x: 48, y: 0 });
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
  assert.equal(game.enemies[0].enemyType, "common-weed");
});

test("Common Weeds stop at 100 while Strongweeds stop at 300", () => {
  const game = Object.create(Game.prototype);
  game.currentMap = GARDEN_MAP;
  game.world = GARDEN_MAP.world;
  game.enemies = Array.from({ length: 100 }, (_, index) => new CommonWeed({ x: index, y: 100 }));
  game.spawnCommonWeedAt(200, 200);
  assert.equal(game.enemies.length, 100);

  game.enemies.push(...Array.from({ length: 300 }, (_, index) => new CommonWeed({ x: index, y: 200, bossMode: true })));
  game.spawnStrongweedAt(300, 300);
  assert.equal(game.enemies.length, 400);
});

test("Strongweeds have 150 health, no expiry, and never reproduce", () => {
  const weed = new CommonWeed({ x: 0, y: 0, bossMode: true });
  assert.equal(weed.enemyType, "strongweed");
  assert.equal(weed.radius, 15);
  assert.equal(weed.maxHealth, 150);
  assert.equal(weed.health, 150);
  assert.equal(weed.lifetime, Number.POSITIVE_INFINITY);
  assert.deepEqual(weed.update(20, { x: 100, y: 0 }), {});
  assert.equal(weed.active, true);
});

test("Strongweeds gently drift toward the player between random shuffles", () => {
  const weed = new CommonWeed({ x: 100, y: 100, bossMode: true });
  weed.shuffleTimer = 10; weed.shuffleVelocityX = 0; weed.shuffleVelocityY = 0;
  weed.update(1, { x: 300, y: 100 });
  assert.equal(weed.x, 115);
  assert.equal(weed.y, 100);
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
  assert.equal(existing.maxHealth, 150);
  assert.equal(existing.radius, 15);
  assert.equal(existing.enemyType, "strongweed");
  game.spawnCommonWeedAt(200, 200);
  const spawned = game.enemies.at(-1);
  assert.equal(spawned.maxHealth, 150);
  assert.equal(spawned.bossMode, true);
  assert.equal(spawned.enemyType, "strongweed");
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

test("Strongweeds separate even when no Dandelion boss is active", () => {
  const first = new CommonWeed({ x: 200, y: 200, bossMode: true });
  const second = new CommonWeed({ x: 200, y: 200, bossMode: true });
  const game = Object.create(Game.prototype);
  game.world = { width: 1000, height: 800 };
  game.bossSpawned = false;
  game.boss = null;
  game.enemies = [first, second];
  game.separateStrongweeds();
  assert.ok(Math.hypot(first.x - second.x, first.y - second.y) >= first.radius + second.radius);
});

test("Common Weeds and Strongweeds push away from each other", () => {
  const common = new CommonWeed({ x: 200, y: 200 });
  const strong = new CommonWeed({ x: 200, y: 200, bossMode: true });
  const game = Object.create(Game.prototype);
  game.world = { width: 1000, height: 800 };
  game.enemies = [common, strong];
  game.separateWeeds();
  assert.ok(Math.hypot(common.x - strong.x, common.y - strong.y) >= common.radius + strong.radius);
  assert.equal(common.radius, strong.radius);
});

test("Strongweed separation adds a small vertical variation", () => {
  const first = new CommonWeed({ x: 200, y: 200, bossMode: true });
  const second = new CommonWeed({ x: 200, y: 200, bossMode: true });
  const game = Object.create(Game.prototype);
  game.world = { width: 1000, height: 800 };
  game.random = () => 1;
  game.enemies = [first, second];
  game.separateStrongweeds();
  assert.notEqual(first.y, 200);
  assert.notEqual(second.y, 200);
  assert.ok(Math.hypot(first.x - second.x, first.y - second.y) >= first.radius + second.radius);
});

test("Aquatic Garden lilypads have 500 health and stop spawning after defeat", () => {
  const pad = new LilyPad({ x: 100, y: 100 });
  assert.equal(pad.maxHealth, 500);
  assert.equal(pad.health, 500);
  assert.equal(pad.takeDamage(499), false);
  assert.equal(pad.health, 1);
  assert.equal(pad.takeDamage(1), true);
  assert.deepEqual(pad.update(1, { x: 0, width: 1000 }), { spawnStrongweed: false });
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

test("defeated Common Weeds do not spawn Strongweeds", () => {
  const game = Object.create(Game.prototype);
  game.pickups = [];
  game.enemies = [];
  game.world = GARDEN_MAP.world;
  game.progress = { defeatedEnemies: { "common-weed": 0, strongweed: 0 } };
  game.random = () => 0;
  game.damageEnemy(new CommonWeed({ x: 100, y: 100 }), 10);
  assert.equal(game.enemies.length, 0);
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
