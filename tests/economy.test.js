import test from "node:test";
import assert from "node:assert/strict";

import { CHEST_COST, CHEST_ODDS, PERMANENT_WEAPONS, weaponMaxLevelForMaps, weaponUpgradeCost } from "../src/config/economy-config.js";
import { buyWeapon, chestCost, openChest, rollChestRarity, shopWeaponPrice, upgradeCharacterStat, upgradeWeapon } from "../src/systems/economy.js";
import { defaultProgress } from "../src/systems/progression.js";
import { WEAPON_DEFINITIONS } from "../src/config/weapons.js";

test("chest rarity boundaries match the configured odds", () => {
  const cases = [
    [0, "Common"], [0.249999, "Common"], [0.25, "Uncommon"],
    [0.499999, "Uncommon"], [0.5, "Rare"], [0.749999, "Rare"],
    [0.75, "Epic"], [0.899999, "Epic"], [0.9, "Legendary"],
    [0.979999, "Legendary"], [0.98, "Mythical"], [0.998999, "Mythical"], [0.999, "Secret"],
  ];
  for (const [roll, rarity] of cases) assert.equal(rollChestRarity(() => roll), rarity);
  assert.equal(CHEST_ODDS.reduce((sum, entry) => sum + entry.chance, 0), 1);
});

test("deterministic chest distribution tracks exact configured probabilities", () => {
  const counts = Object.fromEntries(CHEST_ODDS.map((entry) => [entry.rarity, 0]));
  for (let index = 0; index < 100000; index += 1) {
    counts[rollChestRarity(() => (index + 0.5) / 100000)] += 1;
  }
  for (const entry of CHEST_ODDS) assert.equal(counts[entry.rarity], entry.chance * 100000);
});

test("purchases and upgrades never create negative balances", () => {
  const progress = defaultProgress();
  assert.equal(buyWeapon(progress, "tennis-balls"), false);
  assert.equal(upgradeWeapon(progress, "apples"), false);
  assert.equal(upgradeCharacterStat(progress, "health"), false);
  assert.equal(openChest(progress, () => 0), null);
  assert.equal(progress.coins, 0);
});

test("Regeneration unlocks after Golf Course and has only one level", () => {
  const progress = defaultProgress();
  progress.coins = 1000;
  assert.equal(upgradeCharacterStat(progress, "regeneration", 10), false);
  progress.unlockedMaps.push("aquatic-garden");
  assert.equal(upgradeCharacterStat(progress, "regeneration", 10), true);
  assert.equal(progress.characterStats.regeneration, 1);
  assert.equal(upgradeCharacterStat(progress, "regeneration", 10), false);
});

test("weapon chest costs 2,000 coins", () => {
  assert.equal(CHEST_COST, 2000);
});

test("weapon chest price rises by 200 per purchase and caps at 10,000", () => {
  const progress = defaultProgress();
  progress.coins = 100000;
  assert.equal(chestCost(progress), 2000);
  assert.ok(openChest(progress, () => 0));
  assert.equal(chestCost(progress), 2200);
  progress.chestPurchases = 40;
  assert.equal(chestCost(progress), 10000);
  progress.chestPurchases = 400;
  assert.equal(chestCost(progress), 10000);
});

test("shop weapon prices are fixed by rarity", () => {
  assert.equal(shopWeaponPrice({ rarity: "Common" }), 1000);
  assert.equal(shopWeaponPrice({ rarity: "Uncommon" }), 3000);
  assert.equal(shopWeaponPrice({ rarity: "Rare" }), 10000);
  assert.equal(shopWeaponPrice({ rarity: "Epic" }), 20000);
  assert.equal(shopWeaponPrice({ rarity: "Legendary" }), 60000);
  assert.equal(shopWeaponPrice({ rarity: "Mythical" }), null);
});

test("Diet Cola Launcher is a 25,000-coin Legendary shop purchase", () => {
  const weapon = PERMANENT_WEAPONS.find((entry) => entry.id === "diet-cola-launcher");
  assert.equal(weapon.name, "Diet Cola Launcher");
  assert.equal(weapon.rarity, "Legendary");
  assert.equal(weapon.price, 25000);
  const progress = defaultProgress();
  progress.coins = 25000;
  assert.equal(buyWeapon(progress, weapon.id), true);
  assert.equal(progress.coins, 0);
  assert.equal(progress.ownedWeapons.includes(weapon.id), true);
});

test("Developer weapons cannot be purchased or obtained from chests", () => {
  const progress = defaultProgress();
  progress.coins = 100000;
  assert.equal(buyWeapon(progress, "ordinance-undefined"), false);
  const ordinance = PERMANENT_WEAPONS.find((weapon) => weapon.id === "ordinance-undefined");
  assert.equal(ordinance.rarity, "Developer");
  assert.equal(ordinance.developerOnly, true);
  assert.equal(openChest(progress, () => 0.9995).weapon.id !== ordinance.id, true);
});

test("Limited weapons cannot be obtained from chests", () => {
  const limitedWeapons = PERMANENT_WEAPONS.filter((weapon) => weapon.limited);
  assert.ok(limitedWeapons.length >= 2);

  for (const rarityRoll of [0, 0.91]) {
    for (let candidateRoll = 0; candidateRoll < 1; candidateRoll += 0.01) {
      const progress = defaultProgress();
      progress.coins = 2000;
      const randomValues = [rarityRoll, candidateRoll];
      const result = openChest(progress, () => randomValues.shift());
      assert.notEqual(result.weapon.limited, true, `${result.weapon.name} must not be Limited`);
    }
  }
});

test("duplicate chest weapons convert to their configured coin value", () => {
  const progress = defaultProgress();
  progress.coins = 2000;
  progress.ownedWeapons.push(...WEAPON_DEFINITIONS.filter((weapon) => weapon.rarity === "Rare").map((weapon) => weapon.id));
  const randomValues = [0.6, 0.7];
  const result = openChest(progress, () => randomValues.shift());
  assert.equal(result.duplicate, true);
  assert.equal(result.duplicate, true);
  assert.equal(progress.coins, result.weapon.duplicateValue);
});

test("weapon upgrade costs increase by progressively larger amounts", () => {
  const costs = [1, 2, 3, 4, 5, 6].map(weaponUpgradeCost);
  assert.deepEqual(costs, [100, 250, 500, 900, 1500, 2200]);
  const increases = costs.slice(1).map((cost, index) => cost - costs[index]);
  assert.deepEqual(increases, [150, 250, 400, 600, 700]);
});

test("every owned weapon can be upgraded independently to level 5", () => {
  const progress = defaultProgress();
  progress.coins = 100000;
  progress.ownedWeapons = PERMANENT_WEAPONS.map((weapon) => weapon.id);
  progress.weaponLevels = Object.fromEntries(progress.ownedWeapons.map((id) => [id, 1]));

  for (const weapon of PERMANENT_WEAPONS) {
    for (let level = 2; level <= 5; level += 1) {
      assert.equal(upgradeWeapon(progress, weapon.id), true, `${weapon.name} should reach level ${level}`);
      assert.equal(progress.weaponLevels[weapon.id], level);
    }
    assert.equal(upgradeWeapon(progress, weapon.id), false, `${weapon.name} should stop at level 5`);
  }
});

test("each additional unlocked map raises every weapon level cap by one", () => {
  const progress = defaultProgress();
  progress.coins = 10000;
  progress.weaponLevels.apples = 5;

  assert.equal(weaponMaxLevelForMaps(progress.unlockedMaps), 5);
  assert.equal(upgradeWeapon(progress, "apples"), false);

  progress.unlockedMaps.push("frontyard");
  assert.equal(weaponMaxLevelForMaps(progress.unlockedMaps), 6);
  const expectedCost = weaponUpgradeCost(5);
  assert.equal(upgradeWeapon(progress, "apples"), true);
  assert.equal(progress.weaponLevels.apples, 6);
  assert.equal(progress.coins, 10000 - expectedCost);
  assert.equal(upgradeWeapon(progress, "apples"), false);
});
