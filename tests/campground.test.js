import test from "node:test";
import assert from "node:assert/strict";

import { MAP_SLOTS, mapById } from "../src/config/map-config.js";
import { Raccoon, Skunk, CampBear, CampOwl } from "../src/entities/campground-enemies.js";
import { CampgroundRangerBoss } from "../src/entities/campground-ranger-boss.js";
import { CampgroundProjectile } from "../src/entities/campground-projectile.js";

test("Campground follows Beach with four rotating fires and the global enemy cap", () => {
  const map = mapById("campground");
  assert.equal(MAP_SLOTS.at(-4), map);
  assert.equal(map.world.width / 1280, 1.8);
  assert.equal(map.world.height / 720, 1.8);
  assert.equal(map.enemyCap, 100);
  assert.equal(map.campfires.length, 4);
  assert.equal(map.campgroundSpawnWeights.skunk, .12);
  assert.equal(map.bossSpawnTime, 120);
  assert.equal(map.boss.health, 28000);
});

test("Campground enemies expose their specified health and behaviors", () => {
  const raccoon = new Raccoon({ x: 0, y: 0 });
  raccoon.turn = 10;
  raccoon.pause = 0;
  raccoon.offset = 0;
  raccoon.update(1, { x: 1000, y: 0 });
  assert.equal(raccoon.health, 650);
  assert.ok(raccoon.x > raccoon.speed);
  const skunk = new Skunk({ x: 0, y: 0 });
  assert.equal(skunk.health, 500);
  assert.equal(skunk.speed, 145);
  assert.equal(new CampBear({ x: 0, y: 0 }).health, 2000);
  assert.equal(new CampOwl({ x: 0, y: 0 }).health, 400);
});

test("Campground Ranger enters closed phase below 7000 health", () => {
  const map = mapById("campground");
  const boss = new CampgroundRangerBoss({ x: 400, y: 300, config: map.boss, world: map.world });
  boss.health = 6999;
  const events = boss.update(.01, { x: 500, y: 300 });
  assert.equal(boss.closed, true);
  assert.equal(events.campgroundClosed, true);
  assert.equal(boss.maxHealth, 28000);
});

test("Campground Ranger kicks fires every five seconds and lamps carry light", () => {
  const map = mapById("campground");
  const boss = new CampgroundRangerBoss({ x: 400, y: 300, config: map.boss, world: map.world });
  assert.equal(boss.kick, 5);
  assert.equal(boss.update(5.01, { x: 500, y: 300 }).campfireKick, true);
  const lamp = new CampgroundProjectile({ x: 0, y: 0, velocityX: 100, velocityY: 0, kind: "lamp", lightRadius: 280, lifetime: 5, bounces: 3 });
  assert.equal(lamp.lightRadius, 280);
  assert.equal(lamp.bounces, 3);
  assert.equal(lamp.lifetime, 5);
});
