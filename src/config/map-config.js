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
  unlocks: null,
  boss: Object.freeze({
    type: "dandelion",
    name: "Dandelion",
    health: 1000,
    damage: 0,
    speed: 34,
    sporeCooldown: 10,
    aimedSporeCooldown: 2,
    sporeSpeed: 280,
    sporeDamage: 20,
    sporeLifetime: 1.6,
    shieldThreshold: 100,
    shieldStrength: 200,
    shieldCooldown: 5,
    maxShieldActivations: 5,
    healthRegeneration: 5,
  }),
});

export const MAP_SLOTS = Object.freeze([FIRST_MAP, FRONTYARD_MAP, GARDEN_MAP]);
export const MAPS_BY_ID = Object.freeze(Object.fromEntries(MAP_SLOTS.map((map) => [map.id, map])));

export function mapById(id) {
  return MAPS_BY_ID[id] ?? FIRST_MAP;
}
