import test from "node:test";
import assert from "node:assert/strict";

import { Game } from "../src/core/game.js";

test("all timed Silver abilities execute their gameplay effects", () => {
  const game = Object.create(Game.prototype);
  game.player = {
    x: 100,
    y: 100,
    autonomousMower: true,
    batteryPack: true,
    freezePulse: true,
    scarecrowPulse: true,
  };
  const enemy = {
    x: 120,
    y: 100,
    radius: 18,
    active: true,
    targetable: true,
    isBoss: false,
    receivedDamage: 0,
  };
  game.enemies = [enemy];
  game.abilityProjectiles = [];
  game.explosions = [];
  game.passiveCooldowns = { mower: 0, battery: 0, freeze: 0, scarecrow: 0 };
  game.damageEnemy = (target, damage) => { target.receivedDamage += damage; };

  game.updatePassiveAbilities(0.1);

  assert.equal(enemy.receivedDamage, 20);
  assert.equal(enemy.fireDamagePerSecond, 5);
  assert.equal(enemy.fireTime, 10);
  assert.equal(enemy.freezeTime, 2);
  assert.ok(enemy.x > 120, "mower or scarecrow pulse pushes the enemy away");
  assert.equal(game.abilityProjectiles.length, 0);
  assert.equal(game.explosions.length, 4);
  assert.deepEqual(game.passiveCooldowns, { mower: 5, battery: 5, freeze: 5, scarecrow: 5 });
});

test("timed abilities wait when their upgrades are not selected", () => {
  const game = Object.create(Game.prototype);
  game.player = { x: 0, y: 0 };
  game.enemies = [{ x: 10, y: 0, active: true, targetable: true }];
  game.abilityProjectiles = [];
  game.explosions = [];
  game.passiveCooldowns = { mower: 1, battery: 1, freeze: 1, scarecrow: 1 };

  game.updatePassiveAbilities(0.5);

  assert.deepEqual(game.passiveCooldowns, { mower: 1, battery: 1, freeze: 1, scarecrow: 1 });
  assert.equal(game.abilityProjectiles.length, 0);
  assert.equal(game.explosions.length, 0);
});
