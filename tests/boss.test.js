import test from "node:test";
import assert from "node:assert/strict";

import { FIRST_MAP, FRONTYARD_MAP } from "../src/config/map-config.js";
import { Game, safeBossSpawnPoint } from "../src/core/game.js";
import { Boss } from "../src/entities/boss.js";
import { CommonWeed } from "../src/entities/common-weed.js";
import { Gopher } from "../src/entities/gopher.js";
import { ThrownGnome } from "../src/entities/thrown-gnome.js";

test("first-map boss throws toward a snapshot instead of tracking the player", () => {
  const boss = new Boss({ x: 100, y: 100, config: FIRST_MAP.boss });
  const player = { x: 120, y: 100 };
  boss.throwTimer = 0;

  assert.equal(boss.update(0.01, player).throwGnome, null);
  player.x = 500;
  const thrown = boss.update(FIRST_MAP.boss.throwWindupDuration, player).throwGnome;
  assert.deepEqual({ x: thrown.x, y: thrown.y }, { x: 120, y: 100 });
  assert.equal(thrown.speed, 430);
});

test("boss abilities use separate four-second timers", () => {
  const boss = new Boss({ x: 100, y: 100, config: FIRST_MAP.boss });
  boss.summonTimer = 0;
  const events = boss.update(0.01, { x: 400, y: 100 });
  assert.equal(events.summonGnomes, true);
  assert.equal(boss.summonTimer, FIRST_MAP.boss.summonCooldown - 0.01);
  assert.equal(FIRST_MAP.boss.summonCooldown, 4);
  assert.equal(FIRST_MAP.boss.thrownGnomeCooldown, 4);
  assert.equal(FIRST_MAP.bossSpawnTime, 60);
});

test("boss spawn placement moves an unsafe spawn away from the player", () => {
  const point = safeBossSpawnPoint({ desiredX: 500, desiredY: 400, player: { x: 500, y: 400 }, world: { width: 1000, height: 800 } });
  assert.ok(Math.hypot(point.x - 500, point.y - 400) >= 320);
});

test("restricted boss spawns stay inside their feature while avoiding the player", () => {
  const pond = { x: 300, y: 200, width: 600, height: 400 };
  const point = safeBossSpawnPoint({ desiredX: 600, desiredY: 400, player: { x: 600, y: 400 }, world: { width: 1200, height: 800 }, bounds: pond });
  assert.ok(point.x >= pond.x + 80 && point.x <= pond.x + pond.width - 80);
  assert.ok(point.y >= pond.y + 80 && point.y <= pond.y + pond.height - 80);
  assert.ok(Math.hypot(point.x - 600, point.y - 400) > 0);
});

test("thrown gnome stops exactly at its fixed landing position", () => {
  const thrown = new ThrownGnome({ x: 0, y: 0, targetX: 100, targetY: 50, speed: 500 });
  thrown.update(1);
  assert.deepEqual({ x: thrown.x, y: thrown.y }, { x: 100, y: 50 });
  assert.equal(thrown.arrived, true);
});

test("Frontyard throw becomes an above-ground gopher on landing", () => {
  const thrown = new ThrownGnome({
    x: 0, y: 0, targetX: 20, targetY: 30, speed: 500,
    enemyType: FRONTYARD_MAP.bossThrownEnemy,
  });
  thrown.update(1);
  assert.equal(thrown.enemyType, "gopher");

  const game = Object.create(Game.prototype);
  game.enemies = [];
  game.spawnLandedEnemy(thrown.enemyType, thrown.x, thrown.y);
  assert.equal(game.enemies[0] instanceof Gopher, true);
  assert.equal(game.enemies[0].burrowed, false);
});

test("Lily Queen launches half of its Strongweeds at the player", () => {
  const game = Object.create(Game.prototype);
  game.player = { x: 500, y: 400 };
  game.random = () => 0.4;
  game.thrownGnomes = [];
  game.enemies = [];
  game.spawnLilyQueenStrongweed({ x: 100, y: 100, strongweedLaunchChance: 0.5, strongweedLaunchSpeed: 900 });
  assert.equal(game.thrownGnomes.length, 1);
  assert.equal(game.thrownGnomes[0].enemyType, "strongweed");
  assert.equal(game.thrownGnomes[0].speed, 900);
  assert.equal(game.thrownGnomes[0].damage, 20);
  assert.deepEqual({ x: game.thrownGnomes[0].targetX, y: game.thrownGnomes[0].targetY }, { x: 500, y: 400 });

  game.random = () => 0.9;
  game.thrownGnomes = [];
  game.spawnStrongweedAt = (x, y) => game.enemies.push(new CommonWeed({ x, y, bossMode: true }));
  game.spawnLilyQueenStrongweed({ x: 100, y: 100, strongweedLaunchChance: 0.5 });
  assert.equal(game.thrownGnomes.length, 0);
  assert.equal(game.enemies.length, 1);
});

test("first-map boss has a fixed health pool and reports defeat once", () => {
  const boss = new Boss({ x: 0, y: 0, config: FIRST_MAP.boss });
  assert.equal(boss.health, 1500);
  assert.equal(boss.damage, 50);
  assert.equal(boss.takeDamage(1499), false);
  assert.equal(boss.takeDamage(1), true);
  assert.equal(boss.takeDamage(1), false);
});

test("boss arrival slows simulation for one real-time second", () => {
  const game = Object.create(Game.prototype);
  game.bossIntroTime = 1;
  let simulatedTime = 0;
  for (let frame = 0; frame < 60; frame += 1) {
    simulatedTime += game.applyBossIntroSlowdown(1 / 60);
  }
  assert.ok(Math.abs(simulatedTime - 0.2) < 1e-9);
  assert.ok(game.bossIntroTime < 1e-9);
  assert.equal(game.applyBossIntroSlowdown(1 / 60), 1 / 60);
});
