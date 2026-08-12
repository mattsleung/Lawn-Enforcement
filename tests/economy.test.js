import test from "node:test";
import assert from "node:assert/strict";

import { CHEST_COST, CHEST_ODDS, PERMANENT_WEAPONS, weaponMaxLevelForMaps, weaponUpgradeCost } from "../src/config/economy-config.js";
import { buyWeapon, openChest, rollChestRarity, upgradeCharacterStat, upgradeWeapon } from "../src/systems/economy.js";
import { defaultProgress } from "../src/systems/progression.js";

test("chest rarity boundaries match the configured odds", () => {
  const cases = [
    [0, "Uncommon"], [0.199999, "Uncommon"], [0.2, "Rare"],
    [0.599999, "Rare"], [0.6, "Epic"], [0.899999, "Epic"],
    [0.9, "Legendary"], [0.979999, "Legendary"],
    [0.98, "Mythical"], [0.998999, "Mythical"], [0.999, "Secret"],
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

test("weapon chest costs 1,000 coins", () => {
  assert.equal(CHEST_COST, 1000);
});

test("Diet Cola Launcher is a 40,000-coin Legendary shop purchase", () => {
  const weapon = PERMANENT_WEAPONS.find((entry) => entry.id === "diet-cola-launcher");
  assert.equal(weapon.name, "Diet Cola Launcher");
  assert.equal(weapon.rarity, "Legendary");
  assert.equal(weapon.price, 40000);
  const progress = defaultProgress();
  progress.coins = 40000;
  assert.equal(buyWeapon(progress, weapon.id), true);
  assert.equal(progress.coins, 0);
  assert.equal(progress.ownedWeapons.includes(weapon.id), true);
});

test("duplicate chest weapons convert to their configured coin value", () => {
  const progress = defaultProgress();
  progress.coins = 1000;
  progress.ownedWeapons.push("garden-hose");
  const randomValues = [0.2, 0.7];
  const result = openChest(progress, () => randomValues.shift());
  assert.equal(result.duplicate, true);
  assert.equal(result.weapon.id, "garden-hose");
  assert.equal(progress.coins, 160);
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
