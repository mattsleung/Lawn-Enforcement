import test from "node:test";
import assert from "node:assert/strict";

import { Camera } from "../src/core/camera.js";
import { Game, wrapCenteredText } from "../src/core/game.js";
import { PLAYER, VIEWPORT, WORLD } from "../src/config/game-config.js";
import { FIRST_MAP, FRONTYARD_MAP, GARDEN_MAP, GOLF_COURSE_MAP, LAKE_ELIZABETH_MAP, MAP_SLOTS, PUBLIC_PARK_MAP, mapById } from "../src/config/map-config.js";
import { Player } from "../src/entities/player.js";

test("Backyard is slightly smaller and Frontyard is slightly taller", () => {
  assert.equal(WORLD.width, VIEWPORT.designWidth * 1.65);
  assert.equal(WORLD.height, VIEWPORT.designHeight * 1.65);
  assert.equal(FRONTYARD_MAP.world.width, VIEWPORT.designWidth * 1.25);
  assert.equal(FRONTYARD_MAP.world.height, VIEWPORT.designHeight * 1.4);
});

test("The Frontyard is a distinct smaller second map", () => {
  assert.equal(FRONTYARD_MAP.name, "The Frontyard");
  assert.ok(FRONTYARD_MAP.world.width < FIRST_MAP.world.width);
  assert.ok(FRONTYARD_MAP.world.height < FIRST_MAP.world.height);
  assert.equal(FIRST_MAP.houseSide, "bottom");
  assert.equal(FRONTYARD_MAP.houseSide, "top");
  assert.equal(FIRST_MAP.gopherSpawnChance, 0);
  assert.equal(FRONTYARD_MAP.gopherSpawnChance, 0.25);
  assert.equal(FRONTYARD_MAP.gopherSpawnTime, 0);
  assert.equal(FIRST_MAP.victoryCoinBonus, 500);
  assert.equal(FRONTYARD_MAP.victoryCoinBonus, 1000);
  assert.equal(FRONTYARD_MAP.victoryCoinBonus - FIRST_MAP.victoryCoinBonus, 500);
  assert.equal(FIRST_MAP.bossThrownEnemy, "gnome");
  assert.equal(FRONTYARD_MAP.bossThrownEnemy, "gopher");
  assert.equal(FRONTYARD_MAP.unlocks, "garden");
  assert.equal(mapById("frontyard"), FRONTYARD_MAP);
});

test("Bestiary descriptions wrap within their card width", () => {
  const lines = [];
  const context = {
    measureText: (value) => ({ width: value.length * 6 }),
    fillText: (value) => lines.push(value),
  };
  wrapCenteredText(context, "A very long bestiary description that must wrap instead of spilling outside its card.", 0, 0, 120, 13, 3);
  assert.ok(lines.length > 1);
  assert.ok(lines.length <= 3);
  assert.ok(lines.every((line) => context.measureText(line).width <= 120));
});

test("Community Garden is the third map and uses weed waves", () => {
  assert.equal(MAP_SLOTS[2], GARDEN_MAP);
  assert.equal(GARDEN_MAP.name, "The Community Garden");
  assert.equal(GARDEN_MAP.normalEnemyType, "weed");
  assert.equal(GARDEN_MAP.bossSpawnTime, 90);
  assert.equal(GARDEN_MAP.boss.type, "dandelion");
  assert.equal(GARDEN_MAP.boss.health, 800);
  assert.equal(GARDEN_MAP.boss.sporeCooldown, 0.5);
  assert.equal(GARDEN_MAP.boss.aimedSporeCooldown, 0.5);
  assert.equal(GARDEN_MAP.boss.healthRegeneration, 15);
  assert.equal(GARDEN_MAP.bossSpawnTime, 90);
  assert.equal(GARDEN_MAP.victoryCoinBonus, 1500);
  assert.equal(mapById("garden"), GARDEN_MAP);
});

test("Public Park uses the Groundskeeper boss", () => {
  assert.equal(PUBLIC_PARK_MAP.boss.type, "groundskeeper");
  assert.equal(PUBLIC_PARK_MAP.boss.health, 2000);
  assert.equal(PUBLIC_PARK_MAP.bossSpawnTime, 120);
  assert.equal(PUBLIC_PARK_MAP.boss.mowCooldown, 5);
  assert.equal(PUBLIC_PARK_MAP.boss.clippingCooldown, 1);
  assert.equal(PUBLIC_PARK_MAP.boss.shieldRegeneration, 10);
});

test("Public Park is a large obstacle-filled fourth map", () => {
  assert.equal(MAP_SLOTS[3], PUBLIC_PARK_MAP);
  assert.equal(PUBLIC_PARK_MAP.world.width, VIEWPORT.designWidth * 1.8);
  assert.equal(PUBLIC_PARK_MAP.world.height, VIEWPORT.designHeight * 1.5);
  assert.equal(PUBLIC_PARK_MAP.normalEnemyType, "park");
  assert.ok(PUBLIC_PARK_MAP.obstacles.length >= 5);
  assert.ok(PUBLIC_PARK_MAP.obstacles.every((obstacle) => obstacle.width > 0 && obstacle.height > 0));
  assert.equal(GARDEN_MAP.unlocks, "public-park");
  assert.equal(mapById("public-park"), PUBLIC_PARK_MAP);
});

test("Lake Elizabeth has a central lake and two timed bosses", () => {
  assert.equal(MAP_SLOTS[4], LAKE_ELIZABETH_MAP);
  assert.equal(LAKE_ELIZABETH_MAP.bossSpawnTime, 90);
  assert.equal(LAKE_ELIZABETH_MAP.bosses.length, 2);
  assert.equal(LAKE_ELIZABETH_MAP.bosses[1].type, "pondfather");
  assert.equal(LAKE_ELIZABETH_MAP.bosses[1].shieldRegeneration, 50);
  assert.ok(LAKE_ELIZABETH_MAP.obstacles.some((obstacle) => obstacle.kind === "lake" && obstacle.solid === true));
  assert.equal(mapById("lake-elizabeth"), LAKE_ELIZABETH_MAP);
});

test("Golf Course is the sixth map with a Groundskeeper and Pro Golfer", () => {
  assert.equal(MAP_SLOTS[5], GOLF_COURSE_MAP);
  assert.equal(GOLF_COURSE_MAP.bossSpawnTime, 90);
  assert.equal(GOLF_COURSE_MAP.bosses[0].type, "groundskeeper");
  assert.equal(GOLF_COURSE_MAP.bosses[0].canCrushObstacles, false);
  assert.equal(GOLF_COURSE_MAP.bosses[1].type, "pro-golfer");
  assert.equal(GOLF_COURSE_MAP.bosses[1].health, 3500);
  assert.equal(GOLF_COURSE_MAP.preBossGooseSpawnChance, 0.32);
  assert.equal(GOLF_COURSE_MAP.preBossGopherSpawnChance, 0.60);
  assert.equal(GOLF_COURSE_MAP.golferSpawnChance, 0.20);
  assert.equal(GOLF_COURSE_MAP.postBossSquirrelSpawnChance, 0.16);
  assert.equal(GOLF_COURSE_MAP.postBossGopherSpawnChance, 0.16);
  assert.equal(mapById("golf-course"), GOLF_COURSE_MAP);
});

test("yard fences span the full map beside the house edge", () => {
  for (const map of [FIRST_MAP, FRONTYARD_MAP]) {
    const game = Object.create(Game.prototype);
    game.currentMap = map;
    game.world = map.world;
    game.camera = {
      x: 0,
      y: map.houseSide === "top" ? 0 : map.world.height - 720,
      viewWidth: 1280,
      viewHeight: 720,
    };
    const rectangles = [];
    const context = {
      fillStyle: "",
      fillRect: (...rectangle) => rectangles.push(rectangle),
    };
    game.renderFence(context);
    assert.ok(rectangles.some(([, , width]) => width === map.world.width));
  }
});

test("player starts in the center of the map", () => {
  assert.equal(PLAYER.startX, WORLD.width / 2);
  assert.equal(PLAYER.startY, WORLD.height / 2);
});

test("camera follows a target without leaving world bounds", () => {
  const camera = new Camera(1000, 600, WORLD.width, WORLD.height);

  camera.follow({ x: 0, y: 0 });
  assert.deepEqual({ x: camera.x, y: camera.y }, { x: 0, y: 0 });

  camera.follow({ x: WORLD.width, y: WORLD.height });
  assert.deepEqual(
    { x: camera.x, y: camera.y },
    { x: WORLD.width - 1000, y: WORLD.height - 600 },
  );
});

test("camera converts screen coordinates to world coordinates", () => {
  const camera = new Camera(1000, 600, WORLD.width, WORLD.height);
  const worldCenter = { x: WORLD.width / 2, y: WORLD.height / 2 };
  camera.follow(worldCenter);

  assert.deepEqual(
    camera.screenToWorld({ x: 500, y: 300 }),
    worldCenter,
  );
});

test("player movement is normalized and clamped to the map", () => {
  const player = new Player();
  player.update(1, { x: 1, y: 0 }, { x: WORLD.width, y: player.y });
  assert.equal(player.x, PLAYER.startX + PLAYER.speed);

  player.x = WORLD.width - player.radius;
  player.update(1, { x: 1, y: 0 }, { x: WORLD.width, y: player.y });
  assert.equal(player.x, WORLD.width - player.radius);
});

test("player walk animation advances only while moving", () => {
  const player = new Player();
  player.update(0.25, { x: 1, y: 0 }, { x: WORLD.width, y: player.y });
  assert.equal(player.isMoving, true);
  assert.equal(player.walkTime, 0.25);

  player.update(0.25, { x: 0, y: 0 }, { x: WORLD.width, y: player.y });
  assert.equal(player.isMoving, false);
  assert.equal(player.walkTime, 0);
});
