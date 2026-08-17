import test from "node:test";
import assert from "node:assert/strict";
import { MAP_SLOTS, mapById } from "../src/config/map-config.js";
import { AngryCorn, PopcornEnemy, MiniTractor } from "../src/entities/corn-farm-enemies.js";
import { CombineBoss } from "../src/entities/combine-boss.js";

test("Corn Farm follows Chicken Farm with crop enemies and a 100-enemy cap", () => {
  const map = mapById("corn-farm");
  assert.equal(MAP_SLOTS.at(-1).id, "corn-farm");
  assert.equal(map.enemyCap, 100);
  assert.equal(map.boss.type, "combine");
  assert.equal(map.boss.health, 18000);
});

test("Corn Farm enemies expose their requested health and attacks", () => {
  assert.equal(new AngryCorn({ x: 0, y: 0 }).health, 350);
  assert.equal(new PopcornEnemy({ x: 0, y: 0 }).health, 100);
  assert.equal(new MiniTractor({ x: 0, y: 0, world: { width: 1000, height: 800 } }).health, 1000);
  const corn = new AngryCorn({ x: 0, y: 0 }); corn.fireTimer = 0; corn.update(.01, { x: 100, y: 0 });
  assert.equal(corn.update(.6, { x: 100, y: 0 }).cornFan.count, 3);
});

test("Combine enters overdrive below 5000 health", () => {
  const boss = new CombineBoss({ x: 0, y: 0, config: mapById("corn-farm").boss, world: mapById("corn-farm").world });
  boss.health = 4999; boss.runTimer = 0; boss.cannonTimer = 0; boss.dumpTimer = 0;
  const events = boss.update(.01, { x: 200, y: 0 });
  assert.equal(boss.overdrive, true);
  assert.equal(events.cornFan.count, 7);
  assert.ok(events.cornDump);
  assert.equal(boss.runTimer, 5);
});
