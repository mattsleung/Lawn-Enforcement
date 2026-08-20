import test from "node:test";
import assert from "node:assert/strict";

import { Camera } from "../src/core/camera.js";
import { Game, wrapCenteredText } from "../src/core/game.js";
import { PLAYER, VIEWPORT, WORLD } from "../src/config/game-config.js";
import { AQUATIC_GARDEN_MAP, FIRST_MAP, FRONTYARD_MAP, GARDEN_MAP, GOLF_COURSE_MAP, LAKE_ELIZABETH_MAP, MAP_SLOTS, PUBLIC_PARK_MAP, REDWOOD_TRAIL_MAP, SCHOOL_FIELD_MAP, mapById } from "../src/config/map-config.js";
import { RogueSoccerBall, Sprinter, Backpack, SchoolBasketball } from "../src/entities/school-field-enemies.js";
import { PeTeacherBoss } from "../src/entities/pe-teacher-boss.js";
import { BallLauncherBoss } from "../src/entities/ball-launcher-boss.js";
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

test("permanent regeneration restores one health every three seconds", () => {
  const player = new Player();
  player.health = 80;
  player.healthRegenAmount = 1;
  player.healthRegenInterval = 3;
  const movement = { x: 0, y: 0 };
  const aimPoint = { x: player.x + 10, y: player.y };
  player.update(2.99, movement, aimPoint, WORLD, []);
  assert.equal(player.health, 80);
  player.update(0.01, movement, aimPoint, WORLD, []);
  assert.equal(player.health, 81);
  player.health = player.maxHealth;
  player.update(3, movement, aimPoint, WORLD, []);
  assert.equal(player.health, player.maxHealth);
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

test("Aquatic Garden follows Golf Course with a river, lilypads, and Lily Queen", () => {
  assert.equal(MAP_SLOTS[6], AQUATIC_GARDEN_MAP);
  assert.equal(GOLF_COURSE_MAP.unlocks, "aquatic-garden");
  assert.equal(AQUATIC_GARDEN_MAP.world, GARDEN_MAP.world);
  assert.equal(AQUATIC_GARDEN_MAP.normalEnemyType, "aquatic-garden");
  assert.equal(AQUATIC_GARDEN_MAP.bossSpawnTime, 60);
  assert.equal(AQUATIC_GARDEN_MAP.nextBossSpawnDelay, 90);
  assert.equal(AQUATIC_GARDEN_MAP.lilypadCount, 3);
  assert.ok(AQUATIC_GARDEN_MAP.obstacles.some((obstacle) => obstacle.kind === "river" && obstacle.solid === false));
  assert.equal(AQUATIC_GARDEN_MAP.bosses[0].type, "dandelion");
  assert.equal(AQUATIC_GARDEN_MAP.bosses[1].type, "lily-queen");
  assert.equal(AQUATIC_GARDEN_MAP.bosses[1].health, 5000);
  assert.equal(AQUATIC_GARDEN_MAP.bosses[1].shieldRegeneration, 5);
  assert.equal(AQUATIC_GARDEN_MAP.bosses[1].strongweedLaunchChance, 0.5);
  assert.equal(mapById("aquatic-garden"), AQUATIC_GARDEN_MAP);
});

test("Redwood Trail gives the Ancient Snail a faster boss pace", () => {
  assert.equal(MAP_SLOTS[7], REDWOOD_TRAIL_MAP);
  assert.equal(REDWOOD_TRAIL_MAP.boss.type, "ancient-snail");
  assert.equal(REDWOOD_TRAIL_MAP.boss.speed, 30);
  assert.equal(REDWOOD_TRAIL_MAP.spawnIntervalMultiplier, 1.25);
});

test("School Field is an exclusive edge-spawn map with two sports bosses", () => {
  assert.equal(MAP_SLOTS[10], SCHOOL_FIELD_MAP);
  assert.equal(SCHOOL_FIELD_MAP.normalEnemyType, "school-field");
  assert.equal(SCHOOL_FIELD_MAP.bossSpawnTime, 120);
  assert.equal(SCHOOL_FIELD_MAP.bosses.length, 2);
  assert.equal(SCHOOL_FIELD_MAP.bosses[0].type, "pe-teacher");
  assert.equal(SCHOOL_FIELD_MAP.bosses[1].type, "ball-launcher");
  assert.equal(SCHOOL_FIELD_MAP.bosses[1].health, 10000);
  assert.equal(SCHOOL_FIELD_MAP.obstacles.filter((obstacle) => obstacle.kind === "running-track").length, 4);
  assert.equal(mapById("school-field"), SCHOOL_FIELD_MAP);
});

test("School Field enemies expose their distinct movement identities", () => {
  const target = { x: 500, y: 500, radius: 18 };
  const enemies = [
    new RogueSoccerBall({ x: 100, y: 500 }),
    new Sprinter({ x: 100, y: 500 }),
    new Backpack({ x: 100, y: 500 }),
    new SchoolBasketball({ x: 100, y: 500 }),
  ];
  for (const enemy of enemies) enemy.update(0.1, target);
  assert.deepEqual(enemies.map((enemy) => enemy.enemyType), ["rogue-soccer-ball", "sprinter", "backpack", "basketball"]);
  assert.deepEqual(enemies.map((enemy) => enemy.maxHealth), [200, 200, 550, 150]);
  const teacher = new PeTeacherBoss({ x: 300, y: 300, config: SCHOOL_FIELD_MAP.bosses[0], world: SCHOOL_FIELD_MAP.world });
  const launcher = new BallLauncherBoss({ x: 300, y: 300, config: SCHOOL_FIELD_MAP.bosses[1] });
  assert.equal(teacher.maxHealth, 8000);
  assert.equal(launcher.maxHealth, 10000);
});

test("Sprinters run the track and only chase when the player gets close", () => {
  const world = SCHOOL_FIELD_MAP.world;
  const sprinter = new Sprinter({ x: 100, y: 100, world, random: () => 0 });
  const startY = sprinter.y;
  sprinter.update(0.5, { x: world.width / 2, y: world.height / 2, radius: 18 });
  assert.equal(sprinter.chasing, false);
  assert.notEqual(sprinter.y, world.height / 2, "a distant player should not pull the sprinter into the center");
  assert.ok(sprinter.x >= 55 && sprinter.x <= world.width - 55);
  assert.notEqual(sprinter.y, startY);
  assert.equal(sprinter.trackSpeedMultiplier, 3);
  sprinter.update(0.01, { x: sprinter.x + 20, y: sprinter.y + 20, radius: 18 });
  assert.equal(sprinter.chasing, true);
  assert.equal(sprinter.chaseSpeedMultiplier, 2);
});

test("School Field stages sprinters and backpacks after the first boss", () => {
  const weights = SCHOOL_FIELD_MAP.schoolFieldSpawnWeights;
  assert.equal(weights.sprinter, 0.1823 / 4);
  assert.equal(weights.backpack, 0.1542 / 4);
  assert.ok(Math.abs(Object.values(weights).reduce((sum, value) => sum + value, 0) - 1) < 0.0001);
  assert.equal(SCHOOL_FIELD_MAP.schoolFieldPreBossSpawnWeights.sprinter, 0);
  assert.equal(SCHOOL_FIELD_MAP.schoolFieldPreBossSpawnWeights.backpack, 0);
});

test("PE Teacher can emit a dodgeball event without crashing the update", () => {
  const teacher = new PeTeacherBoss({ x: 300, y: 300, config: SCHOOL_FIELD_MAP.bosses[0], world: SCHOOL_FIELD_MAP.world });
  teacher.dodgeballTimer = 0;
  const events = teacher.update(0.01, { x: 500, y: 500, radius: 18 });
  assert.ok(events.throwDodgeball);
  assert.equal(events.throwDodgeball.x, teacher.x);
  assert.equal(events.throwDodgeball.targetX, 500);
  assert.equal(events.throwDodgeball.speed, SCHOOL_FIELD_MAP.bosses[0].dodgeballSpeed);
  assert.equal(events.throwDodgeball.damage, SCHOOL_FIELD_MAP.bosses[0].dodgeballDamage);
  const game = Object.create(Game.prototype);
  game.bossProjectiles = [];
  game.fireSchoolBall(events.throwDodgeball, "dodgeball");
  assert.equal(game.bossProjectiles.length, 1);
  assert.ok(Number.isFinite(game.bossProjectiles[0].velocityX));
  assert.ok(Number.isFinite(game.bossProjectiles[0].velocityY));
});

test("PE Teacher leaves the perimeter lap when it reaches the player", () => {
  const teacher = new PeTeacherBoss({ x: 300, y: 300, config: SCHOOL_FIELD_MAP.bosses[0], world: SCHOOL_FIELD_MAP.world });
  teacher.lapTime = 1;
  teacher.lapTimer = 0;
  teacher.update(0.01, { x: 350, y: 350, radius: 18 });
  assert.equal(teacher.lapTime, 0);
  assert.equal(teacher.lapTimer, teacher.lapCooldown);
});

test("Ball Launcher has five-percent basketball and soccer-ball enemy shots", () => {
  const game = Object.create(Game.prototype);
  game.enemies = [];
  game.world = SCHOOL_FIELD_MAP.world;
  game.currentMap = SCHOOL_FIELD_MAP;
  game.firstBossDefeated = true;
  game.random = () => 0.01;
  const event = { x: 500, y: 500, targetX: 700, targetY: 500 };
  assert.equal(game.fireBallLauncherShot(event, SCHOOL_FIELD_MAP.bosses[1]), "basketball-enemy");
  assert.equal(game.enemies.at(-1).enemyType, "basketball");
  game.random = () => 0.06;
  assert.equal(game.fireBallLauncherShot(event, SCHOOL_FIELD_MAP.bosses[1]), "soccer-ball-enemy");
  assert.equal(game.enemies.at(-1).enemyType, "rogue-soccer-ball");
  assert.equal(game.enemies.every((enemy) => enemy.bossMinion), true);
});

test("Rogue Soccer Ball cannot turn sharply and slows when juked", () => {
  const ball = new RogueSoccerBall({ x: 100, y: 500 });
  ball.update(0.1, { x: 500, y: 500, radius: 18 });
  const speedBeforeJuke = ball.currentSpeed;
  ball.update(0.1, { x: 100, y: 100, radius: 18 });
  assert.ok(ball.headingY > -0.5, "heading should turn gradually instead of snapping");
  assert.ok(ball.currentSpeed < speedBeforeJuke, "sharp jukes should decelerate the ball");
  assert.equal(ball.maxSpeed, 688);
});

test("Basketballs move faster with unpredictable steering", () => {
  const basketball = new SchoolBasketball({ x: 100, y: 500, random: () => 0 });
  basketball.update(0.1, { x: 500, y: 500, radius: 18 });
  assert.equal(basketball.speed, 280);
  assert.ok(basketball.steeringAngle < -1);
  assert.equal(basketball.jumpHeight, 32);
  assert.ok(basketball.y < 500, "steering should move the basketball off a straight approach");
});

test("Basketballs retarget toward the player after each visual bounce", () => {
  const basketball = new SchoolBasketball({ x: 100, y: 500, random: () => 0.5 });
  basketball.update(0.1, { x: 500, y: 500, radius: 18 });
  const firstDirection = basketball.travelAngle;
  // The first arc lands after roughly 0.4 seconds. The next update performs
  // the landing correction using the player's new position.
  basketball.update(0.3, { x: 100, y: 100, radius: 18 });
  basketball.update(0.01, { x: 100, y: 100, radius: 18 });
  assert.notEqual(basketball.travelAngle, firstDirection);
  assert.ok(basketball.travelAngle < -1, "the next jump should turn toward the repositioned player");
  assert.ok(basketball.targetSnapshot && basketball.targetSnapshot.y === 100);
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

test("camera eases toward a moving target when a frame delta is supplied", () => {
  const camera = new Camera(1000, 600, WORLD.width, WORLD.height);
  camera.follow({ x: 0, y: 0 });
  const target = { x: WORLD.width, y: WORLD.height };
  const maxX = WORLD.width - 1000;
  const maxY = WORLD.height - 600;
  camera.follow(target, 1 / 60);
  assert.ok(camera.x > 0 && camera.x < maxX);
  assert.ok(camera.y > 0 && camera.y < maxY);
  camera.follow(target);
  assert.deepEqual({ x: camera.x, y: camera.y }, { x: maxX, y: maxY });
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
