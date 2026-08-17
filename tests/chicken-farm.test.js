import test from "node:test";
import assert from "node:assert/strict";
import { MAP_SLOTS, mapById } from "../src/config/map-config.js";
import { Chicken, Chick, ChickenEgg, Rooster } from "../src/entities/chicken-farm-enemies.js";
import { MotherHenBoss } from "../src/entities/mother-hen-boss.js";

test("Chicken Farm follows Construction Site and raises its enemy cap to 150", () => {
  const map = mapById("chicken-farm");
  assert.equal(MAP_SLOTS.at(-1).id, "chicken-farm");
  assert.equal(map.enemyCap, 150);
  assert.equal(map.chickenEggDeathChance, 0.5);
  assert.equal(map.boss.health, 15000);
});

test("Chicken Farm lifecycle enemies expose the requested health and timers", () => {
  assert.equal(new Chicken({x:0,y:0}).health, 150);
  const egg = new ChickenEgg({x:0,y:0}); assert.equal(egg.health, 100); assert.equal(egg.update(10.1,{x:100,y:0}).hatch, true);
  const chick = new Chick({x:0,y:0}); assert.equal(chick.health, 75); chick.age=20; assert.equal(chick.update(1.1,{x:100,y:0}).grow, true);
  const rooster = new Rooster({x:0,y:0}); assert.equal(rooster.health, 500); assert.equal(rooster.update(5.1,{x:100,y:0}).crow.duration, 3);
  assert.ok(new Chicken({x:0,y:0}).speed >= 140);
  assert.ok(new Chick({x:0,y:0}).speed >= 220);
  assert.ok(rooster.speed >= 100);
});

test("Mother Hen enrages below 4000 health and strengthens all three attacks", () => {
  const boss = new MotherHenBoss({x:0,y:0,config:{name:"Mother Hen",health:15000,speed:88},world:{width:1000,height:800}});
  boss.health=3999; boss.eggTimer=0; boss.rushTimer=0; boss.wingTimer=0;
  const warning=boss.update(.01,{x:100,y:0});
  assert.equal(warning.enraged,true); assert.equal(boss.eggTargets.length,4); assert.equal(warning.chickenRush,6); assert.ok(boss.wingTarget);
  const events=boss.update(.81,{x:900,y:700});
  assert.equal(events.tossEggs.length,4); assert.ok(events.wingBlast); assert.equal(boss.wingTimer,3);
});

test("Crow shields expire with the movement boost", () => {
  const chicken = new Chicken({x:0,y:0});
  chicken.speedBuffTime = 3; chicken.maxShield = 100; chicken.shield = 100; chicken.crowShieldActive = true;
  chicken.tick(3.1);
  assert.equal(chicken.shield, 0); assert.equal(chicken.maxShield, 0); assert.equal(chicken.crowShieldActive, false);
});
