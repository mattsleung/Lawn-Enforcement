import test from "node:test";
import assert from "node:assert/strict";

import { GOLF_COURSE_MAP, GARDEN_MAP, LAKE_ELIZABETH_MAP } from "../src/config/map-config.js";
import { Game } from "../src/core/game.js";
import { GolfBombProjectile } from "../src/entities/golf-bomb-projectile.js";
import { GolfBallProjectile } from "../src/entities/golf-ball-projectile.js";
import { Golfer } from "../src/entities/golfer.js";
import { Player } from "../src/entities/player.js";
import { ProGolferBoss } from "../src/entities/pro-golfer-boss.js";
import { GroundskeeperBoss } from "../src/entities/groundskeeper-boss.js";
import { Squirrel } from "../src/entities/squirrel.js";
import { AcornSquirrel } from "../src/entities/acorn-squirrel.js";

test("Golf Course matches the Community Garden size and follows Lake Elizabeth", () => {
  assert.equal(GOLF_COURSE_MAP.world.width, GARDEN_MAP.world.width);
  assert.equal(GOLF_COURSE_MAP.world.height, GARDEN_MAP.world.height);
  assert.equal(LAKE_ELIZABETH_MAP.unlocks, "golf-course");
  assert.equal(GOLF_COURSE_MAP.normalEnemyType, "golf");
  assert.ok(GOLF_COURSE_MAP.obstacles.some((obstacle) => obstacle.kind === "sand-bunker"));
  assert.ok(GOLF_COURSE_MAP.obstacles.some((obstacle) => obstacle.kind === "golf-hole"));
  assert.equal(GOLF_COURSE_MAP.bosses[1].health, 3500);
});

test("Golfer has 300 health, uses an extended range, re-aims for two seconds, and then fires", () => {
  const golfer = new Golfer({ x: 100, y: 0 });
  assert.equal(golfer.health, 300);
  assert.equal(golfer.coinValue, 3);
  assert.equal(golfer.xpValue, 30);
  assert.equal(golfer.stopDistance, 300);
  assert.equal(golfer.speed, 260);
  const target = { x: 500, y: 0 };
  assert.equal(golfer.update(0.37, target).fireGolfBall, undefined);
  golfer.update(0.01, target);
  assert.equal(golfer.waitTime, 2);
  const startingAngle = golfer.aimAngle;
  assert.equal(golfer.update(1, target).fireGolfBall, undefined);
  assert.notEqual(golfer.aimAngle, startingAngle);
  assert.equal(golfer.update(1.01, target).fireGolfBall, undefined);
  const event = golfer.update(1.01, target);
  assert.deepEqual(event.fireGolfBall, { x: golfer.x, y: golfer.y, targetX: 500, targetY: 0, speed: 900, damage: 8, range: 500 });
});

test("Golfer balls stop exactly at the golfer stopping range", () => {
  const ball = new GolfBallProjectile({ x: 100, y: 100, velocityX: 100, velocityY: 0, maxDistance: 500 });
  ball.update(5, { width: 1000, height: 800 });
  assert.equal(ball.active, false);
  assert.deepEqual({ x: ball.x, y: ball.y }, { x: 600, y: 100 });
});

test("Golf Course sand bunkers halve player movement", () => {
  const player = new Player();
  player.x = 100; player.y = 100;
  player.update(1, { x: 1, y: 0 }, { x: 500, y: 100 }, { width: 1000, height: 800 }, [
    { x: 50, y: 50, width: 300, height: 200, kind: "sand-bunker", solid: false },
  ]);
  assert.equal(player.x, 255);
});

test("Pro Golfer alternates regular, fan, and bomb attacks", () => {
  const boss = new ProGolferBoss({ x: 500, y: 500, world: { width: 1000, height: 800 }, config: {
    name: "The Pro Golfer", health: 3500, speed: 320, attackCooldown: 3, attackPauseDuration: 0.5,
  } });
  const target = { x: 100, y: 500 };
  boss.attackTimer = 0;
  boss.update(0.01, target);
  assert.equal(boss.update(0.5, target).attack.type, "regular");
  boss.attackTimer = 0; boss.update(0.01, target);
  assert.equal(boss.update(0.5, target).attack.type, "fan");
  boss.attackTimer = 0; boss.update(0.01, target);
  assert.equal(boss.update(0.5, target).attack.type, "bomb");
});

test("Pro Golfer patrols clockwise on a fixed inset loop", () => {
  const boss = new ProGolferBoss({ x: 28, y: 28, world: { width: 1000, height: 800 }, config: {
    name: "The Pro Golfer", health: 3500, speed: 320, attackCooldown: 99,
  } });
  boss.update(0.5, { x: 500, y: 400 });
  assert.ok(boss.x > 28);
  assert.ok(boss.y > 28);
  boss.update(3, { x: 28, y: 28 });
  assert.ok(boss.x < 972);
  assert.ok(boss.y > 28);
});

test("Golf bomb shows a warning, then impacts once", () => {
  const bomb = new GolfBombProjectile({ x: 0, y: 0, targetX: 300, targetY: 240, warningDuration: 0.5, damage: 50 });
  bomb.update(0.49);
  assert.equal(bomb.active, true);
  bomb.update(0.02);
  assert.equal(bomb.active, false);
  assert.equal(bomb.impacted, true);
  assert.deepEqual({ x: bomb.x, y: bomb.y }, { x: 300, y: 240 });
});

test("Golf Course Groundskeeper neither crushes obstacles nor summons squirrels", () => {
  const boss = new GroundskeeperBoss({ x: 100, y: 100, world: { width: 1000, height: 800 }, config: GOLF_COURSE_MAP.boss });
  boss.mowTimer = 0;
  boss.update(0.01, { x: 500, y: 100 }, []);
  boss.update(1.01, { x: 500, y: 100 }, []);
  const events = boss.update(0.5, { x: 500, y: 100 }, [{ x: 350, y: 70, width: 80, height: 60 }]);
  assert.equal(events.crushObstacles.length, 0);
  assert.equal(boss.summonSquirrels, false);
});

test("Golf Course halves golfer rolls and adds squirrels and gophers after boss one", () => {
  const game = Object.create(Game.prototype);
  game.currentMap = GOLF_COURSE_MAP;
  game.world = GOLF_COURSE_MAP.world;
  game.player = { x: 800, y: 600 };
  game.camera = { viewWidth: 1280, viewHeight: 720 };
  game.enemies = [];
  game.random = () => 0.59;
  game.firstBossDefeated = false;
  game.spawnGolfEnemy(0);
  assert.equal(game.enemies[0].enemyType, "gopher");

  game.enemies = [];
  game.random = () => 0.1;
  game.spawnGolfEnemy(0);
  assert.equal(game.enemies[0].enemyType, "gopher");
  game.enemies = [];
  game.random = () => 0.65;
  game.spawnGolfEnemy(0);
  assert.equal(game.enemies[0].enemyType, "goose");

  game.enemies = [];
  game.random = () => 0.1;
  game.firstBossDefeated = true;
  game.spawnGolfEnemy(Math.PI / 2);
  assert.equal(game.enemies[0] instanceof Squirrel || game.enemies[0] instanceof AcornSquirrel, true);
  game.enemies = [];
  game.random = () => 0.3;
  game.spawnGolfEnemy(Math.PI / 2);
  assert.equal(game.enemies[0].enemyType, "gopher");
});

test("Golf bomb impact adds a temporary double-size bunker and damages the player", () => {
  const game = Object.create(Game.prototype);
  game.world = { width: 1000, height: 800 };
  game.activeObstacles = [];
  let damage = 0;
  game.player = { takeDamage: (amount) => { damage += amount; } };
  const bomb = new GolfBombProjectile({ x: 0, y: 0, targetX: 300, targetY: 240, warningDuration: 0, damage: 50 });
  bomb.update(0.01);
  game.handleGolfBombImpact(bomb);
  assert.equal(damage, 50);
  assert.deepEqual(game.activeObstacles[0], {
    x: 204, y: 144, width: 192, height: 192, kind: "sand-bunker", solid: false, lifetime: 20,
  });
});
