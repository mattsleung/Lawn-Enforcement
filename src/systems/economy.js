import { CHARACTER_STAT_COSTS, CHEST_COST, CHEST_ODDS, PERMANENT_WEAPONS, weaponMaxLevelForMaps, weaponUpgradeCost } from "../config/economy-config.js";

export function rollChestRarity(random = Math.random) {
  const roll = random() * 1000;
  let boundary = 0;
  for (const entry of CHEST_ODDS) {
    boundary += Math.round(entry.chance * 1000);
    if (roll < boundary) return entry.rarity;
  }
  return "Secret";
}

export function dailyDealForDate(dateKey) {
  const total = [...dateKey].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return total % 2 === 0
    ? PERMANENT_WEAPONS.find((weapon) => weapon.id === "garden-hose")
    : PERMANENT_WEAPONS.find((weapon) => weapon.id === "leaf-blower");
}

export function buyWeapon(progress, weaponId, priceOverride = null) {
  const weapon = PERMANENT_WEAPONS.find((entry) => entry.id === weaponId);
  const price = priceOverride ?? weapon?.price;
  if (!weapon || price == null || progress.coins < price || progress.ownedWeapons.includes(weaponId)) return false;
  progress.coins -= price;
  progress.ownedWeapons.push(weaponId);
  progress.weaponLevels[weaponId] = 1;
  return true;
}

export function upgradeWeapon(progress, weaponId, maxLevel = weaponMaxLevelForMaps(progress.unlockedMaps)) {
  const level = progress.weaponLevels[weaponId] ?? 0;
  if (!progress.ownedWeapons.includes(weaponId) || level < 1 || level >= maxLevel) return false;
  const cost = weaponUpgradeCost(level);
  if (progress.coins < cost) return false;
  progress.coins -= cost;
  progress.weaponLevels[weaponId] = level + 1;
  return true;
}

export function upgradeCharacterStat(progress, stat, maxLevel = 5) {
  const level = progress.characterStats[stat] ?? 0;
  if (!(stat in progress.characterStats) || level >= maxLevel || level >= CHARACTER_STAT_COSTS.length) return false;
  const cost = CHARACTER_STAT_COSTS[level];
  if (progress.coins < cost) return false;
  progress.coins -= cost;
  progress.characterStats[stat] = level + 1;
  return true;
}

export function openChest(progress, random = Math.random) {
  if (progress.coins < CHEST_COST) return null;
  progress.coins -= CHEST_COST;
  const rarity = rollChestRarity(random);
  const candidates = PERMANENT_WEAPONS.filter((weapon) => weapon.rarity === rarity);
  const weapon = candidates[Math.floor(random() * candidates.length)];
  if (progress.ownedWeapons.includes(weapon.id)) {
    progress.coins += weapon.duplicateValue;
    return { weapon, rarity, duplicate: true, coinsReturned: weapon.duplicateValue };
  }
  progress.ownedWeapons.push(weapon.id);
  progress.weaponLevels[weapon.id] = 1;
  return { weapon, rarity, duplicate: false, coinsReturned: 0 };
}
