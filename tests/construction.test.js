import test from "node:test";
import assert from "node:assert/strict";

import { MAP_SLOTS, mapById } from "../src/config/map-config.js";
import { ConstructionWorker, TrafficConeEnemy, RunawayTire, BrickCarrier, SafetyVestEnemy } from "../src/entities/construction-enemies.js";
import { ExcavatorBoss } from "../src/entities/excavator-boss.js";

test("Construction Site follows School Field and uses a 100-enemy cap", () => {
  const map = mapById("construction-site");
  assert.equal(MAP_SLOTS.at(-3).id, "construction-site");
  assert.equal(map.world.width / 1280, 1.8);
  assert.equal(map.world.height / 720, 1.6);
  assert.equal(map.enemyCap, 100);
  assert.equal(map.boss.health, 12000);
  assert.deepEqual(map.constructionSpawnWeights, {
    worker: 1.5 / 11, cone: 3 / 11, tire: 1.5 / 11, brickCarrier: 1 / 11, safetyVest: 4 / 11,
  });
  assert.ok(Math.abs(Object.values(map.constructionSpawnWeights).reduce((sum, weight) => sum + weight, 0) - 1) < Number.EPSILON);
});

test("Construction Site enemy roster exposes the specified health pools", () => {
  assert.equal(new ConstructionWorker({ x: 0, y: 0 }).health, 500);
  assert.equal(new TrafficConeEnemy({ x: 0, y: 0 }).health, 250);
  assert.equal(new RunawayTire({ x: 30, y: 30, world: { width: 500, height: 500 } }).health, 300);
  assert.equal(new BrickCarrier({ x: 0, y: 0 }).health, 800);
  assert.equal(new SafetyVestEnemy({ x: 0, y: 0 }).health, 150);
});

test("Traffic Cone plants for three seconds and Brick Carrier throws every four", () => {
  const cone = new TrafficConeEnemy({ x: 0, y: 0 });
  cone.update(3.1, { x: 100, y: 0 });
  assert.ok(cone.plantedTime > 2.9);
  const carrier = new BrickCarrier({ x: 0, y: 0 });
  const event = carrier.update(4.1, { x: 100, y: 50 });
  assert.equal(event.throwBrick.damage, 10);
  assert.equal(event.throwBrick.speed, 320);
  assert.deepEqual({ x: event.throwBrick.targetX, y: event.throwBrick.targetY }, { x: 100, y: 50 });
  assert.deepEqual(carrier.deathBrickBurst, { count: 10, range: 150, speed: 380, enemyDamage: 50, playerDamage: 10 });
});

test("Safety Vests never attach to other Safety Vests", () => {
  const first = new SafetyVestEnemy({ x: 0, y: 0 });
  const second = new SafetyVestEnemy({ x: 1, y: 0 });
  first.update(0.1, { x: 100, y: 0 }, [], [first, second]);
  assert.equal(first.attachedTo, null);
  assert.equal(second.shield, 0);
});

test("Excavator enters its faster broken phase below 3000 health", () => {
  const config = { name: "The Excavator", health: 12000, speed: 52 };
  const boss = new ExcavatorBoss({ x: 200, y: 200, config, world: { width: 1000, height: 800 } });
  boss.health = 2999; boss.slamTimer = 0; boss.dirtTimer = 0;
  const events = boss.update(0.01, { x: 500, y: 400 });
  assert.equal(events.broken, true);
  assert.equal(boss.slamTimer, 3);
  assert.equal(boss.dirtTimer, 4);
});

test("Excavator uses only the two-second support and ten-second crew summons", () => {
  const boss = new ExcavatorBoss({ x: 200, y: 200, config: { name: "The Excavator", health: 12000, speed: 52 }, world: { width: 1000, height: 800 } });
  const support = boss.update(2.01, { x: 500, y: 400 });
  assert.ok(["safety-vest", "cone", "tire"].includes(support.spawnSupport));
  assert.equal(support.spawnCrew, undefined);
  assert.equal(support.constructionCrew, undefined);
  const crew = boss.update(8, { x: 500, y: 400 });
  assert.equal(crew.spawnCrew, true);
  assert.equal(crew.constructionCrew, undefined);
});
