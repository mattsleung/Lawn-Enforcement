import test from "node:test";
import assert from "node:assert/strict";

import { Gopher } from "../src/entities/gopher.js";

test("gopher is slow, has 250 health, and respects 50% slow", () => {
  const normal = new Gopher({ x: 0, y: 0, random: () => 0 });
  const slowed = new Gopher({ x: 0, y: 0, random: () => 0 });
  normal.burrowed = false;
  slowed.burrowed = false;
  normal.weaveTime = 0;
  slowed.weaveTime = 0;
  slowed.slowTime = 2;
  const target = { x: 500, y: 0 };
  normal.update(1, target);
  slowed.update(1, target);
  assert.equal(normal.maxHealth, 250);
  assert.equal(normal.speed, 58);
  assert.ok(Math.abs(slowed.x - normal.x * 0.5) < 0.001);
  assert.ok(Math.abs(slowed.y - normal.y * 0.5) < 0.001);
});

test("gopher begins underground and fully heals after a two-second re-burrow", () => {
  const gopher = new Gopher({ x: 0, y: 0, random: () => 0 });
  assert.equal(gopher.burrowed, true);
  assert.equal(gopher.targetable, false);
  assert.equal(gopher.takeDamage(50), false);
  gopher.update(0.5, { x: 1000, y: 0 });
  assert.equal(gopher.x, gopher.speed);
  gopher.update(1.5, { x: 1000, y: 0 });
  assert.equal(gopher.burrowed, false);
  gopher.health = 40;
  gopher.nextBurrowTime = 0;
  gopher.update(0.01, { x: 100, y: 0 });
  assert.equal(gopher.burrowed, true);
  assert.equal(gopher.health, 40);
  gopher.update(2, { x: 100, y: 0 });
  assert.equal(gopher.burrowed, false);
  assert.equal(gopher.health, 250);
});

test("underground gophers move at twice their above-ground speed", () => {
  const underground = new Gopher({ x: 0, y: 0, random: () => 0 });
  const aboveGround = new Gopher({ x: 0, y: 0, random: () => 0 });
  aboveGround.burrowed = false;
  underground.update(0.5, { x: 1000, y: 0 });
  aboveGround.update(0.5, { x: 1000, y: 0 });
  assert.equal(underground.x, aboveGround.x * 2);
});

test("underground gophers leave one-second fading hole trails", () => {
  const gopher = new Gopher({ x: 0, y: 0, random: () => 0 });
  gopher.update(0.2, { x: 1000, y: 0 });
  assert.ok(gopher.holeTrail.length > 0);
  assert.equal(gopher.holeTrail[0].lifetime, 1);
  gopher.burrowed = false;
  gopher.update(0.5, { x: 1000, y: 0 });
  assert.equal(gopher.holeTrail[0].lifetime, 0.5);
  gopher.update(0.5, { x: 1000, y: 0 });
  assert.equal(gopher.holeTrail.length, 0);
});
