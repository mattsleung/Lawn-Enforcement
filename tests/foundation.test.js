import test from "node:test";
import assert from "node:assert/strict";

import { Camera } from "../src/core/camera.js";
import { Game } from "../src/core/game.js";
import { PLAYER, VIEWPORT, WORLD } from "../src/config/game-config.js";
import { FIRST_MAP, FRONTYARD_MAP, GARDEN_MAP, MAP_SLOTS, mapById } from "../src/config/map-config.js";
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

test("Community Garden is the third map and uses weed waves", () => {
  assert.equal(MAP_SLOTS[2], GARDEN_MAP);
  assert.equal(GARDEN_MAP.name, "The Community Garden");
  assert.equal(GARDEN_MAP.normalEnemyType, "weed");
  assert.equal(GARDEN_MAP.bossSpawnTime, 90);
  assert.equal(GARDEN_MAP.boss.type, "dandelion");
  assert.equal(GARDEN_MAP.boss.health, 1000);
  assert.equal(GARDEN_MAP.victoryCoinBonus, 1500);
  assert.equal(mapById("garden"), GARDEN_MAP);
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
