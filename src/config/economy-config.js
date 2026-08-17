import { WEAPON_DEFINITIONS } from "./weapons.js";

export const CHEST_COST = 2000;
export const CHEST_COST_INCREASE = 200;
export const MAX_CHEST_COST = 10000;

export const SHOP_RARITY_PRICES = Object.freeze({
  Common: 1000,
  Uncommon: 3000,
  Rare: 10000,
  Epic: 20000,
  Legendary: 60000,
});

export const CHEST_ODDS = Object.freeze([
  Object.freeze({ rarity: "Common", chance: 0.25 }),
  Object.freeze({ rarity: "Uncommon", chance: 0.25 }),
  Object.freeze({ rarity: "Rare", chance: 0.25 }),
  Object.freeze({ rarity: "Epic", chance: 0.15 }),
  Object.freeze({ rarity: "Legendary", chance: 0.08 }),
  Object.freeze({ rarity: "Mythical", chance: 0.019 }),
  Object.freeze({ rarity: "Secret", chance: 0.001 }),
]);

export const PERMANENT_WEAPONS = WEAPON_DEFINITIONS;

export const CHARACTER_STAT_COSTS = Object.freeze([40, 80, 140, 220, 320, 450, 600, 780, 980, 1200]);
export const WEAPON_LEVEL_COSTS = Object.freeze([100, 250, 500, 900]);
export const BASE_WEAPON_MAX_LEVEL = 5;
export const CHARACTER_STAT_LEVELS_PER_MAP = 2;

export function characterStatMaxLevelForMaps(unlockedMaps = ["backyard"]) {
  const mapCount = unlockedMaps instanceof Set
    ? unlockedMaps.size
    : Array.isArray(unlockedMaps) ? new Set(unlockedMaps).size : 1;
  return Math.min(CHARACTER_STAT_COSTS.length, Math.max(1, mapCount) * CHARACTER_STAT_LEVELS_PER_MAP);
}

export function weaponMaxLevelForMaps(unlockedMaps = ["backyard"]) {
  const mapCount = unlockedMaps instanceof Set
    ? unlockedMaps.size
    : Array.isArray(unlockedMaps) ? new Set(unlockedMaps).size : 1;
  return BASE_WEAPON_MAX_LEVEL + Math.max(0, mapCount - 1);
}

export function weaponUpgradeCost(currentLevel) {
  const configuredCost = WEAPON_LEVEL_COSTS[currentLevel - 1];
  if (configuredCost != null) return configuredCost;
  const extraLevel = currentLevel - WEAPON_LEVEL_COSTS.length;
  return WEAPON_LEVEL_COSTS.at(-1) + extraLevel * 500 + extraLevel * (extraLevel + 1) * 50;
}
