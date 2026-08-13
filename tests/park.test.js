import test from "node:test";
import assert from "node:assert/strict";

import { AcornProjectile } from "../src/entities/acorn-projectile.js";
import { AcornSquirrel } from "../src/entities/acorn-squirrel.js";
import { Squirrel } from "../src/entities/squirrel.js";
import { GroundskeeperBoss } from "../src/entities/groundskeeper-boss.js";
import { Game } from "../src/core/game.js";
import { PondfatherBoss } from "../src/entities/pondfather-boss.js";
import { Goose } from "../src/entities/goose.js";

test("Squirrel has fast burst behavior and park rewards", () => {
  const squirrel = new Squirrel({ x: 0, y: 0, random: () => 0 });
  assert.equal(squirrel.health, 80);
  assert.equal(squirrel.damage, 4);
  assert.equal(squirrel.coinValue, 2);
  assert.equal(squirrel.xpValue, 20);
  squirrel.burstTimer = 0;
  squirrel.update(0.1, { x: 1000, y: 0 });
  assert.ok(squirrel.x > 17);
});

test("Acorn Squirrel throws at a snapshotted player position then repositions", () => {
  const squirrel = new AcornSquirrel({ x: 0, y: 0 });
  assert.equal(squirrel.health, 120);
  squirrel.throwCooldown = 0;
  const event = squirrel.update(0.01, { x: 200, y: 0 });
  assert.deepEqual(event.throwAcorn, { x: 200, y: 0, speed: 360 });
  assert.ok(squirrel.repositionTime > 0);
});

test("Acorn projectile carries damage and expires at world bounds", () => {
  const projectile = new AcornProjectile({ x: 50, y: 50, velocityX: 100, velocityY: 0 });
  assert.equal(projectile.damage, 12);
  projectile.update(1, { width: 1000, height: 1000 });
  assert.equal(projectile.active, true);
  projectile.update(2, { width: 1000, height: 1000 });
  assert.equal(projectile.active, false);
});

test("Groundskeeper warns, charges, and crushes obstacles", () => {
  const boss = new GroundskeeperBoss({ x: 100, y: 100, world: { width: 1000, height: 800 }, config: {
    name: "The Groundskeeper", health: 2000, damage: 50, speed: 440, mowCooldown: 5, clippingCooldown: 1,
  } });
  boss.mowTimer = 0;
  boss.update(0.01, { x: 500, y: 100 }, []);
  assert.equal(boss.warningTime, 1);
  boss.update(1.01, { x: 500, y: 100 }, [{ x: 350, y: 70, width: 80, height: 60 }]);
  assert.ok(boss.chargeTime > 0);
  const events = boss.update(0.5, { x: 500, y: 100 }, [{ x: 350, y: 70, width: 80, height: 60 }]);
  assert.equal(events.crushObstacles.length, 1);
});

test("Groundskeeper clipping fan centers on the player", () => {
  const boss = new GroundskeeperBoss({ x: 0, y: 0, world: { width: 1000, height: 800 }, config: {
    name: "The Groundskeeper", health: 2000, damage: 50, speed: 220, mowCooldown: 5, clippingCooldown: 1,
  } });
  boss.clippingTimer = 0;
  const events = boss.update(0.01, { x: 0, y: 500 }, []);
  assert.ok(events.fireClippings);
  assert.ok(Math.abs(Math.round(events.fireClippings.directionX * 100)) <= 0);
  assert.equal(Math.round(events.fireClippings.directionY * 100), 100);
});

test("Groundskeeper regenerates ten shield per second", () => {
  const boss = new GroundskeeperBoss({ x: 0, y: 0, world: { width: 1000, height: 800 }, config: {
    name: "The Groundskeeper", health: 2000, damage: 50, speed: 220, mowCooldown: 5, clippingCooldown: 1,
    shieldStrength: 200, shieldRegeneration: 10,
  } });
  boss.shield = 0;
  boss.update(1, { x: 500, y: 500 }, []);
  assert.equal(boss.shield, 10);
  boss.takeDamage(15);
  assert.equal(boss.health, 1995);
  assert.equal(boss.shield, 0);
});

test("Boss presence triples damage dealt to minions", () => {
  const game = Object.create(Game.prototype);
  game.bossSpawned = true;
  game.boss = { active: true };
  const minion = new Squirrel({ x: 0, y: 0 });
  game.damageEnemy(minion, 10);
  assert.equal(minion.health, 50);
});

test("Boss-spawned minions keep normal damage", () => {
  const game = Object.create(Game.prototype);
  game.bossSpawned = true;
  game.boss = { active: true };
  const minion = new Squirrel({ x: 0, y: 0 });
  minion.bossMinion = true;
  game.damageEnemy(minion, 10);
  assert.equal(minion.health, 70);
});

test("Goose has 40 health, 250 speed, and lake rewards", () => {
  const goose = new Goose({ x: 0, y: 0 });
  assert.equal(goose.health, 40);
  assert.equal(goose.speed, 250);
  assert.equal(goose.coinValue, 1);
  assert.equal(goose.xpValue, 10);
});

test("Pondfather starts in water, divebombs, then summons geese", () => {
  const boss = new PondfatherBoss({ x: 500, y: 500, world: { width: 1000, height: 800 }, config: { name: "The Pondfather", health: 2500, shieldRegeneration: 50 } });
  assert.equal(boss.shieldRegeneration, 50);
  boss.regenTime = 5;
  boss.update(0.01, { x: 700, y: 500 });
  assert.equal(boss.phase, "warning");
  const dive = boss.update(1.01, { x: 700, y: 500 });
  assert.ok(dive.divebomb);
  boss.update(3.01, { x: 700, y: 500 });
  const spawn = boss.update(0.01, { x: 700, y: 500 });
  assert.equal(spawn.throwMinions.length, 2);
  assert.equal(boss.shield, 200);
});
