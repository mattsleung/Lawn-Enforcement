import test from "node:test";
import assert from "node:assert/strict";

import { MAP_SLOTS, mapById } from "../src/config/map-config.js";
import { AUTO_FIRE_RECOIL, Game, shouldAutoFire } from "../src/core/game.js";
import { Cactus, Snapflower, SunflowerEnemy, VineEnemy } from "../src/entities/botanical-enemies.js";
import { QueenRoseBoss } from "../src/entities/queen-rose-boss.js";

test("Botanical Garden follows Construction Site and uses the global enemy cap", () => {
  const map = mapById("botanical-garden");
  assert.equal(MAP_SLOTS.at(-6).id, "botanical-garden");
  assert.equal(map.unlocks, "beach");
  assert.equal(map.enemyCap, 100);
  assert.equal(map.spawnIntervalMultiplier, 1.12);
  assert.equal(map.bossSpawnTime, 120);
  assert.equal(map.boss.health, 20000);
  assert.equal(map.obstacles.filter((entry) => entry.kind.endsWith("-bed")).length, 6);
});

test("Botanical enemies expose their requested health and timed attacks", () => {
  const target = { x: 100, y: 0 };
  const cactus = new Cactus({ x: 0, y: 0 });
  assert.equal(cactus.health, 700);
  cactus.update(4.01, target);
  assert.equal(cactus.update(.56, target).needleBurst, true);
  assert.equal(new Snapflower({ x: 0, y: 0 }).health, 400);
  assert.equal(new SunflowerEnemy({ x: 0, y: 0 }).health, 500);
  const vine = new VineEnemy({ x: 0, y: 0 });
  assert.equal(vine.health, 300);
  vine.update(5.01, target);
  const grown = vine.update(.61, target).groundVine;
  assert.deepEqual({ x2: grown.x2, y2: grown.y2, lifetime: grown.lifetime }, { x2: 100, y2: 0, lifetime: 3 });

  const distantVine = new VineEnemy({ x: 0, y: 0 });
  distantVine.update(5.01, { x: 1000, y: 0 });
  const capped = distantVine.update(.61, { x: 1000, y: 0 }).groundVine;
  assert.equal(Math.hypot(capped.x2 - capped.x1, capped.y2 - capped.y1), 260);
});

test("Cactus needles travel only slightly farther than a Brick Carrier death burst", () => {
  const game = Object.create(Game.prototype);
  game.bossProjectiles = [];
  game.fireCactusNeedles({ x: 100, y: 100 });
  assert.equal(game.bossProjectiles.length, 8);
  const needle = game.bossProjectiles[0];
  const travelDistance = Math.hypot(needle.velocityX, needle.velocityY) * needle.lifetime;
  assert.ok(travelDistance > 150);
  assert.ok(travelDistance < 200);
});

test("Queen Rose overlaps independent attacks and enters Full Bloom once", () => {
  const boss = new QueenRoseBoss({ x: 100, y: 100, config: { name: "Queen Rose", health: 20000 } });
  const events = boss.update(7.01);
  assert.equal(events.thornLines, 5);
  assert.equal(events.vineSweep, undefined);
  boss.takeDamage(15001);
  const bloom = boss.update(.01);
  assert.equal(bloom.fullBloom, true);
  assert.equal(boss.shield, 1000);
  assert.equal(boss.update(.01).fullBloom, undefined);
  boss.thornTimer = 0;
  const empowered = boss.update(.01);
  assert.equal(empowered.thornLines, 7);
  assert.equal(empowered.vineSweep, undefined);
});

test("beating Botanical Garden permanently unlocks dual-weapon Auto Fire", () => {
  const game = Object.create(Game.prototype);
  game.runRewardsBanked = false;
  game.runCoins = 0;
  game.bankCoins = 0;
  game.unlockedMaps = new Set(["botanical-garden"]);
  game.currentMap = mapById("botanical-garden");
  game.progress = { autoFireUnlocked: false };
  game.input = { pointer: { down: true } };
  game.savePermanentProgress = () => {};
  game.finishVictory();
  assert.equal(game.progress.autoFireUnlocked, true);
  assert.equal(shouldAutoFire(game.progress, true), true);
  assert.equal(shouldAutoFire(game.progress, false), false);
  assert.equal(AUTO_FIRE_RECOIL, 0.16);
});
