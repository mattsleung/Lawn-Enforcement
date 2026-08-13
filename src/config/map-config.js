import { VIEWPORT, WORLD } from "./game-config.js";

export const FIRST_MAP = Object.freeze({
  id: "backyard",
  name: "The Backyard",
  world: WORLD,
  lawnColors: Object.freeze({ primary: "#61712f", secondary: "#596a2b" }),
  houseSide: "bottom",
  normalEnemyType: "gnome",
  gopherSpawnChance: 0,
  gopherSpawnTime: Number.POSITIVE_INFINITY,
  bossSpawnTime: 60,
  victoryCoinBonus: 500,
  bossThrownEnemy: "gnome",
  unlocks: "frontyard",
  boss: Object.freeze({
    type: "king-gnomulus",
    name: "King Gnomulus",
    health: 1500,
    damage: 50,
    speed: 58,
    thrownGnomeCooldown: 4,
    thrownGnomeSpeed: 430,
    throwWindupDuration: 0.65,
    summonCooldown: 4,
  }),
});

export const FRONTYARD_MAP = Object.freeze({
  id: "frontyard",
  name: "The Frontyard",
  world: Object.freeze({
    width: VIEWPORT.designWidth * 1.25,
    height: VIEWPORT.designHeight * 1.4,
    gridSize: 80,
  }),
  lawnColors: Object.freeze({ primary: "#6d7c35", secondary: "#64742f" }),
  houseSide: "top",
  normalEnemyType: "mixed",
  gopherSpawnChance: 0.25,
  gopherSpawnTime: 0,
  bossSpawnTime: 60,
  victoryCoinBonus: 1000,
  bossThrownEnemy: "gopher",
  unlocks: "garden",
  boss: FIRST_MAP.boss,
});

export const GARDEN_MAP = Object.freeze({
  id: "garden",
  name: "The Community Garden",
  world: Object.freeze({
    width: VIEWPORT.designWidth * 1.6,
    height: VIEWPORT.designHeight * 1.6,
    gridSize: 72,
  }),
  lawnColors: Object.freeze({ primary: "#67733a", secondary: "#5e6934" }),
  houseSide: null,
  normalEnemyType: "weed",
  gopherSpawnChance: 0,
  gopherSpawnTime: Number.POSITIVE_INFINITY,
  bossSpawnTime: 90,
  victoryCoinBonus: 1500,
  bossThrownEnemy: null,
  unlocks: "public-park",
  boss: Object.freeze({
    type: "dandelion",
    name: "Dandelion",
    health: 800,
    damage: 0,
    speed: 34,
    sporeCooldown: 0.5,
    aimedSporeCooldown: 0.5,
    sporeSpeed: 280,
    sporeDamage: 20,
    sporeLifetime: 1.6,
    shieldThreshold: 100,
    shieldStrength: 200,
    shieldCooldown: 5,
    maxShieldActivations: 5,
    healthRegeneration: 15,
  }),
});

export const PUBLIC_PARK_MAP = Object.freeze({
  id: "public-park",
  name: "The Public Park",
  world: Object.freeze({
    width: VIEWPORT.designWidth * 1.8,
    height: VIEWPORT.designHeight * 1.5,
    gridSize: 96,
  }),
  lawnColors: Object.freeze({ primary: "#6f8a42", secondary: "#66803c" }),
  houseSide: null,
  normalEnemyType: "park",
  gopherSpawnChance: 0,
  gopherSpawnTime: Number.POSITIVE_INFINITY,
  bossSpawnTime: 120,
  victoryCoinBonus: 2000,
  bossThrownEnemy: null,
  unlocks: "lake-elizabeth",
  obstacles: Object.freeze([
    Object.freeze({ x: 180, y: 180, width: 190, height: 34, kind: "bench" }),
    Object.freeze({ x: 1050, y: 240, width: 210, height: 34, kind: "bench" }),
    Object.freeze({ x: 550, y: 420, width: 220, height: 38, kind: "picnic-table" }),
    Object.freeze({ x: 150, y: 760, width: 430, height: 260, kind: "playground" }),
    Object.freeze({ x: 1180, y: 720, width: 300, height: 180, kind: "trees" }),
    Object.freeze({ x: 1480, y: 260, width: 160, height: 300, kind: "trees" }),
  ]),
  boss: Object.freeze({
    type: "groundskeeper",
    name: "The Groundskeeper",
    health: 2000,
    damage: 50,
    speed: 440,
    mowCooldown: 5,
    clippingCooldown: 1,
    shieldStrength: 200,
    shieldRegeneration: 10,
  }),
});

export const LAKE_ELIZABETH_MAP = Object.freeze({
  id: "lake-elizabeth", name: "Lake Elizabeth",
  world: Object.freeze({ width: VIEWPORT.designWidth * 1.9, height: VIEWPORT.designHeight * 1.6, gridSize: 96 }),
  lawnColors: Object.freeze({ primary: "#66834b", secondary: "#5d7744" }), houseSide: null,
  normalEnemyType: "lake", gopherSpawnChance: 0.3, gopherSpawnTime: 0, bossSpawnTime: 90,
  victoryCoinBonus: 2500, bossThrownEnemy: "gnome", unlocks: "golf-course",
  obstacles: Object.freeze([{ x: 470, y: 260, width: 760, height: 600, kind: "lake", solid: true }]),
  bosses: Object.freeze([
    Object.freeze({ type: "king-gnomulus", name: "King Gnomulus", health: 1500, damage: 50, speed: 58, thrownGnomeCooldown: 4, thrownGnomeSpeed: 430, throwWindupDuration: .65, summonCooldown: 4 }),
    Object.freeze({ type: "pondfather", name: "The Pondfather", health: 2500, shieldStrength: 200, speed: 200, healthRegeneration: 15, shieldRegeneration: 50 }),
  ]),
  boss: Object.freeze({ type: "king-gnomulus", name: "King Gnomulus", health: 1500, damage: 50, speed: 58, thrownGnomeCooldown: 4, thrownGnomeSpeed: 430, throwWindupDuration: .65, summonCooldown: 4 }),
});

export const GOLF_COURSE_MAP = Object.freeze({
  id: "golf-course",
  name: "The Golf Course",
  world: Object.freeze({
    width: VIEWPORT.designWidth * 1.6,
    height: VIEWPORT.designHeight * 1.6,
    gridSize: 96,
  }),
  lawnColors: Object.freeze({ primary: "#63833d", secondary: "#587537" }),
  houseSide: null,
  normalEnemyType: "golf",
  gooseSpawnChance: 0.16,
  preBossGooseSpawnChance: 0.32,
  preBossGopherSpawnChance: 0.60,
  golferSpawnChance: 0.20,
  postBossSquirrelSpawnChance: 0.16,
  postBossGopherSpawnChance: 0.16,
  bossSpawnTime: 90,
  victoryCoinBonus: 3000,
  bossThrownEnemy: null,
  unlocks: null,
  obstacles: Object.freeze([
    Object.freeze({ x: 220, y: 210, width: 250, height: 120, kind: "sand-bunker", solid: false }),
    Object.freeze({ x: 1050, y: 180, width: 230, height: 105, kind: "sand-bunker", solid: false }),
    Object.freeze({ x: 630, y: 760, width: 290, height: 130, kind: "sand-bunker", solid: false }),
    Object.freeze({ x: 165, y: 640, width: 110, height: 140, kind: "trees", solid: true }),
    Object.freeze({ x: 1450, y: 690, width: 120, height: 150, kind: "trees", solid: true }),
    Object.freeze({ x: 1600, y: 210, width: 100, height: 130, kind: "trees", solid: true }),
    Object.freeze({ x: 900, y: 320, width: 36, height: 36, kind: "golf-hole", solid: false }),
    Object.freeze({ x: 1320, y: 840, width: 36, height: 36, kind: "golf-hole", solid: false }),
    Object.freeze({ x: 360, y: 1010, width: 36, height: 36, kind: "golf-hole", solid: false }),
  ]),
  bosses: Object.freeze([
    Object.freeze({ type: "groundskeeper", name: "The Groundskeeper", health: 2000, damage: 50, speed: 440, mowCooldown: 5, clippingCooldown: 1, shieldStrength: 200, shieldRegeneration: 10, canCrushObstacles: false, summonSquirrels: false }),
    Object.freeze({ type: "pro-golfer", name: "The Pro Golfer", health: 3500, damage: 30, speed: 320, attackCooldown: 3, attackPauseDuration: 0.55, regularDamage: 30, fanDamage: 20, ballSpeed: 700, fanBallSpeed: 420, bombDamage: 50, bombWarningDuration: 0.8 }),
  ]),
  boss: Object.freeze({ type: "groundskeeper", name: "The Groundskeeper", health: 2000, damage: 50, speed: 440, mowCooldown: 5, clippingCooldown: 1, shieldStrength: 200, shieldRegeneration: 10, canCrushObstacles: false, summonSquirrels: false }),
});

export const MAP_SLOTS = Object.freeze([FIRST_MAP, FRONTYARD_MAP, GARDEN_MAP, PUBLIC_PARK_MAP, LAKE_ELIZABETH_MAP, GOLF_COURSE_MAP]);
export const MAPS_BY_ID = Object.freeze(Object.fromEntries(MAP_SLOTS.map((map) => [map.id, map])));

export function mapById(id) {
  return MAPS_BY_ID[id] ?? FIRST_MAP;
}
