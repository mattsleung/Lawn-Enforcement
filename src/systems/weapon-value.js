import { weaponById } from "../config/weapons.js";

export const UNTRADEABLE_WEAPONS = new Set(["weedwacker-9000", "apples"]);
export const SYSTEM_SELL_RATE = 0.75;
const RARITY_BASE = { Common: 900, Uncommon: 2600, Rare: 8500, Epic: 30000, Legendary: 95000, Mythical: 290000, Secret: 900000, Developer: 520000 };
const SEASON_ENDS = { "Lawn Enforcement": Date.UTC(2026, 9, 1) };

function identityFactor(id) {
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return 0.9 + ((hash >>> 0) % 31) / 100;
}

export function estimateWeaponValue(weaponOrId, market = {}, now = Date.now()) {
  const weapon = typeof weaponOrId === "string" ? weaponById(weaponOrId) : weaponOrId;
  if (!weapon) return 0;
  const base = RARITY_BASE[weapon.rarity] ?? 250;
  const circulation = Math.max(1, Number(market.circulation) || 1000);
  const scarcity = Math.max(0.5, Math.min(9, (1000 / circulation) ** 0.72));
  const trades = Math.max(0, Number(market.tradeCount) || 0);
  const marketAverage = Math.max(0, Number(market.averageTradePrice) || 0);
  const demand = Math.max(0.8, Math.min(1.8, 1 + (Number(market.recentOffers) || 0) / Math.max(20, circulation)));
  let limited = 1;
  if (weapon.limited) {
    const end = SEASON_ENDS[weapon.season] ?? now;
    const monthsAway = Math.max(0, now - end) / 2_629_800_000;
    limited = now < end ? 1.05 : Math.min(12, 1.4 + monthsAway * 0.32);
  }
  const modeled = base * identityFactor(weapon.id) * scarcity * demand * limited;
  const blended = trades > 2 && marketAverage > 0
    ? modeled * Math.max(0.25, 1 - Math.min(0.75, trades / 40)) + marketAverage * Math.min(0.75, trades / 40)
    : modeled;
  return Math.max(25, Math.round(blended / 5) * 5);
}

export function systemSellValue(weaponOrId, market = {}, now = Date.now()) {
  const weapon = typeof weaponOrId === "string" ? weaponById(weaponOrId) : weaponOrId;
  if (!weapon || UNTRADEABLE_WEAPONS.has(weapon.id) || weapon.developerOnly) return 0;
  return Math.floor(estimateWeaponValue(weapon, market, now) * SYSTEM_SELL_RATE);
}

export function formatMoney(value) {
  return `$${Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("en-US")}`;
}
