import test from "node:test";
import assert from "node:assert/strict";

import { Player } from "../src/entities/player.js";
import { applyRunWeaponBonuses, WEAPON_DEFINITIONS, weaponById, weaponsForSlot } from "../src/config/weapons.js";
import {
  applyRunUpgrade,
  chooseRunUpgrades,
  defaultProgress,
  eligibleRunUpgrades,
  loadBankCoins,
  loadProgress,
  REPEATABLE_GOLD_UPGRADES,
  RUN_UPGRADES,
  saveBankCoins,
  saveProgress,
  unlockAllMaps,
  unlockAllWeapons,
  xpRequiredForLevel,
} from "../src/systems/progression.js";
import { isDeveloperHost } from "../src/core/game.js";

test("developer unlocks are restricted to loopback hosts", () => {
  assert.equal(isDeveloperHost({ hostname: "localhost" }), true);
  assert.equal(isDeveloperHost({ hostname: "127.0.0.1" }), true);
  assert.equal(isDeveloperHost({ hostname: "mattsleung.github.io" }), false);
  assert.equal(isDeveloperHost({ hostname: "lawn-enforcement.example" }), false);
});

test("run XP requirements rise each level", () => {
  assert.equal(xpRequiredForLevel(1), 30);
  assert.equal(xpRequiredForLevel(2), 50);
  assert.equal(xpRequiredForLevel(3), 70);
  assert.equal(xpRequiredForLevel(4), 95);
  assert.equal(xpRequiredForLevel(5), 120);
  assert.equal(xpRequiredForLevel(6), 150);
  assert.equal(xpRequiredForLevel(7), 180);
});

test("run upgrades improve the intended player stats", () => {
  const player = new Player();
  player.health = 70;
  const initialSpeed = player.speed;
  assert.equal(applyRunUpgrade(player, "sharp-blades"), true);
  assert.equal(player.damageMultiplier, 1.1);
  assert.equal(applyRunUpgrade(player, "new-sneakers"), true);
  assert.equal(player.speed, initialSpeed * 1.1);
  assert.equal(applyRunUpgrade(player, "tough-turf"), true);
  assert.equal(player.maxHealth, 125);
  assert.equal(player.health, 95);
  assert.equal(applyRunUpgrade(player, "steady-hands"), true);
  assert.equal(player.accuracy, 1.2);
  assert.equal(applyRunUpgrade(player, "quick-trigger"), true);
  assert.equal(player.cooldownMultiplier, 0.88);
  assert.equal(applyRunUpgrade(player, "missing"), false);
});

test("Silver run upgrades unlock five distinct passive abilities", () => {
  const player = new Player();
  for (const id of ["pancake-syrup", "autonomous-mower", "battery-pack", "freeze-pulse", "scarecrow-pulse"]) {
    assert.equal(applyRunUpgrade(player, id), true);
  }
  assert.equal(player.syrupTrail, true);
  assert.equal(player.autonomousMower, true);
  assert.equal(player.batteryPack, true);
  assert.equal(player.freezePulse, true);
  assert.equal(player.scarecrowPulse, true);
});

test("the five Bronze upgrades are stats and the five Silver upgrades are abilities", () => {
  const starterPool = eligibleRunUpgrades();
  assert.deepEqual(
    starterPool.filter((upgrade) => upgrade.rarity === "Bronze").map((upgrade) => upgrade.id),
    ["new-sneakers", "sharp-blades", "tough-turf", "quick-trigger", "steady-hands"],
  );
  assert.deepEqual(
    starterPool.filter((upgrade) => upgrade.rarity === "Silver").map((upgrade) => upgrade.id),
    ["pancake-syrup", "autonomous-mower", "battery-pack", "freeze-pulse", "scarecrow-pulse"],
  );
});

test("Flamingo Tube becomes available starting in Lake Elizabeth", () => {
  const backyard = eligibleRunUpgrades(["weedwacker-9000", "apples"], "backyard");
  const lake = eligibleRunUpgrades(["weedwacker-9000", "apples"], "lake-elizabeth");
  const golf = eligibleRunUpgrades(["weedwacker-9000", "apples"], "golf-course");
  assert.equal(backyard.some((upgrade) => upgrade.id === "flamingo-tube"), false);
  assert.equal(lake.some((upgrade) => upgrade.id === "flamingo-tube"), true);
  assert.equal(golf.some((upgrade) => upgrade.id === "flamingo-tube"), true);
  assert.equal(lake.filter((upgrade) => upgrade.rarity === "Gold").length, 6);
});

test("run upgrades cannot raise maximum health above twice its round-start value", () => {
  const player = new Player();
  for (let index = 0; index < 5; index += 1) {
    applyRunUpgrade(player, "second-wind");
    applyRunUpgrade(player, "tough-turf");
  }
  assert.equal(player.roundStartingMaxHealth, 100);
  assert.equal(player.maxHealthCap, 200);
  assert.equal(player.maxHealth, 200);
  assert.equal(player.health, 200);
});

test("Second Wind fully heals without changing maximum health", () => {
  const player = new Player();
  player.maxHealth = 150;
  player.health = 17;
  applyRunUpgrade(player, "second-wind");
  assert.equal(player.maxHealth, 150);
  assert.equal(player.health, 150);
});

test("each equipped loadout receives five unique upgrades per rarity", () => {
  const equippedPool = eligibleRunUpgrades(["weedwacker-9000", "apples"]);
  assert.equal(equippedPool.length, 15);
  for (const rarity of ["Bronze", "Silver", "Gold"]) {
    assert.equal(equippedPool.filter((upgrade) => upgrade.rarity === rarity).length, 5);
  }
  const choices = chooseRunUpgrades(() => 0, 3);
  assert.equal(new Set(choices.map((choice) => choice.id)).size, 3);
});

test("every melee and ranged loadout keeps the fifteen-upgrade run pool", () => {
  for (const melee of weaponsForSlot("melee")) {
    for (const ranged of weaponsForSlot("ranged")) {
      const pool = eligibleRunUpgrades([melee.id, ranged.id]);
      assert.equal(pool.length, 15, `${melee.id} and ${ranged.id}`);
      assert.equal(pool.filter((upgrade) => upgrade.rarity === "Gold").length, 5);
    }
  }
});

test("weapon-specific Gold choices follow the equipped loadout", () => {
  const pool = eligibleRunUpgrades(["golden-rake", "tennis-balls"]);
  const weaponUpgradeIds = pool.filter((upgrade) => upgrade.weaponId).map((upgrade) => upgrade.id);
  assert.deepEqual(weaponUpgradeIds, ["rake-tines", "tennis-bounce"]);
  assert.equal(pool.some((upgrade) => upgrade.id === "weedwacker-range"), false);
  assert.equal(pool.some((upgrade) => upgrade.id === "apple-projectile"), false);
});

test("Plastic Ghost Extended Haunting is only offered when equipped", () => {
  const equippedPool = eligibleRunUpgrades(["weedwacker-9000", "plastic-ghost"]);
  const unequippedPool = eligibleRunUpgrades(["weedwacker-9000", "apples"]);
  assert.equal(equippedPool.some((upgrade) => upgrade.id === "plastic-ghost-haunting"), true);
  assert.equal(unequippedPool.some((upgrade) => upgrade.id === "plastic-ghost-haunting"), false);
});

test("unlockAllWeapons grants every non-Limited weapon at level one without changing rarity", () => {
  const progress = defaultProgress();
  unlockAllWeapons(progress);
  assert.deepEqual(new Set(progress.ownedWeapons), new Set(WEAPON_DEFINITIONS.filter((weapon) => !weapon.limited).map((weapon) => weapon.id)));
  assert.equal(progress.weaponLevels["plastic-ghost"], 1);
  assert.equal(weaponById("plastic-ghost").rarity, "Secret");
});

test("unlockAllMaps grants every current map", () => {
  const progress = defaultProgress();
  unlockAllMaps(progress);
  assert.deepEqual(progress.unlockedMaps, [
    "backyard",
    "frontyard",
    "garden",
    "public-park",
    "lake-elizabeth",
    "golf-course",
    "aquatic-garden",
    "redwood-trail",
    "school-field",
    "construction-site",
    "chicken-farm",
    "corn-farm",
  ]);
});

test("chosen one-use Gold upgrades can be excluded while Second Wind remains repeatable", () => {
  const excluded = new Set([
    "apple-projectile",
    "steel-toes",
    "weedwacker-range",
    "explosive-projectiles",
  ]);
  const choices = chooseRunUpgrades(() => 0.99, 15, excluded);
  assert.equal(choices.some((upgrade) => excluded.has(upgrade.id)), false);
  assert.equal(choices.some((upgrade) => upgrade.id === "second-wind"), true);
  assert.deepEqual([...REPEATABLE_GOLD_UPGRADES], ["second-wind"]);
});

test("Gold weapon upgrades affect only their intended weapon behavior", () => {
  const player = new Player();
  applyRunUpgrade(player, "apple-projectile");
  assert.equal(player.weaponBonuses.apples.projectileCountAdd, 1);
  applyRunUpgrade(player, "weedwacker-range");
  assert.equal(player.weaponBonuses["weedwacker-9000"].rangeMultiplier, 1.4);
  applyRunUpgrade(player, "explosive-projectiles");
  assert.equal(player.rangedExplosion, true);
});

test("Vampire Fang Gold upgrade can be selected and increases its range", () => {
  const player = new Player();
  assert.equal(applyRunUpgrade(player, "vampire-fang-reach"), true);
  assert.equal(player.weaponBonuses["vampire-fang"].rangeMultiplier, 1.35);
  assert.equal(applyRunWeaponBonuses(weaponById("vampire-fang"), player).range, 110 * 1.35);
});

test("all weapon-specific Gold upgrades modify final weapon stats", () => {
  const cases = [
    ["weedwacker-range", "weedwacker-9000", "range", 1.4],
    ["shears-sharpening", "garden-shears", "width", 1.4],
    ["clipper-jaw", "hedge-clippers", "arc", 1.5],
    ["barrow-bigger", "wheelbarrow", "width", 1.35],
    ["shovel-impact", "garden-shovel", "damage", 1.25],
    ["rake-tines", "golden-rake", "width", 1.4],
    ["mower-deck", "turbo-mower", "width", 1.35],
    ["racket-reach", "tennis-racket", "range", 1.3],
    ["apple-projectile", "apples", "projectileCount", 2],
    ["sprayer-nozzle", "garden-sprayer", "projectileCount", 9],
    ["tennis-bounce", "tennis-balls", "bounces", 3],
    ["acorn-pierce", "acorn-slingshot", "pierces", 2],
    ["nail-magazine", "nail-gun", "projectileLifetime", 1.5],
    ["salt-buckshot", "rock-salt-blaster", "projectileCount", 7],
    ["hose-pressure", "garden-hose", "projectileLifetime", 1.35],
    ["bowling-spin", "bowling-ball", "pierces", 2],
    ["cola-blast", "diet-cola-launcher", "splashRadius", 1.4],
    ["leaf-gale", "leaf-blower", "knockback", 1.5],
    ["storm-barrels", "storm-sprinkler", "projectileCount", 2],
    ["flamethrower-nozzle", "backyard-flamethrower", "projectileLifetime", 1.35],
    ["plastic-ghost-haunting", "plastic-ghost", "projectileLifetime", 1.4],
    ["undefined-overflow", "ordinance-undefined", "projectileCount", 3],
  ];
  for (const [upgradeId, weaponId, stat, expected] of cases) {
    const player = new Player();
    const weapon = weaponById(weaponId);
    assert.equal(applyRunUpgrade(player, upgradeId), true);
    const modified = applyRunWeaponBonuses(weapon, player);
    const baseValue = weapon[stat] ?? 1;
    const expectedValue = Number.isInteger(expected) ? expected : baseValue * expected;
    assert.equal(modified[stat], expectedValue, `${upgradeId} modifies ${stat}`);
  }
});

test("the full upgrade catalog has one weapon-specific Gold upgrade per weapon", () => {
  const weaponUpgrades = RUN_UPGRADES.filter((upgrade) => upgrade.weaponId);
  assert.equal(weaponUpgrades.length, 55);
  assert.equal(new Set(weaponUpgrades.map((upgrade) => upgrade.weaponId)).size, 55);
});

test("new deployable weapon Gold upgrades alter their runtime behavior", () => {
  const cases = [
    ["rain-thunderstorm", "rain-cloud", "thunderstorm", true],
    ["pigeon-flock", "homing-pigeon", "projectileCount", 2],
    ["sprinkler-eight-way", "lawn-sprinkler", "sprinklerDirections", 8],
    ["plate-chain-reaction", "pressure-plate", "chainReaction", true],
  ];
  for (const [upgradeId, weaponId, property, expected] of cases) {
    const player = new Player();
    assert.equal(applyRunUpgrade(player, upgradeId), true);
    assert.equal(applyRunWeaponBonuses(weaponById(weaponId), player)[property], expected);
  }
  const player = new Player();
  applyRunUpgrade(player, "fart-extra-stinky");
  const fartGun = applyRunWeaponBonuses(weaponById("fart-gun"), player);
  assert.equal(fartGun.fertilizerCloudRadius, 78 * 1.5);
  assert.equal(fartGun.damage, 9 * 1.25);
});

test("new precision and control weapon Gold upgrades alter runtime behavior", () => {
  const cases = [
    ["surveyor-critical", "surveyor", "criticalMultiplier", 2],
    ["rc-two-pack", "remote-control-car", "rcCount", 2],
    ["umbrella-return", "garden-umbrella", "reflectProjectiles", true],
    ["vacuum-cannonball", "vacuum-cleaner", "humanCannonball", true],
  ];
  for (const [upgradeId, weaponId, property, expected] of cases) {
    const player = new Player();
    assert.equal(applyRunUpgrade(player, upgradeId), true);
    assert.equal(applyRunWeaponBonuses(weaponById(weaponId), player)[property], expected);
  }
});

test("banked coins save, load, and reject malformed data", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(loadBankCoins(storage), 0);
  assert.equal(saveBankCoins(storage, 17.9), true);
  assert.equal(loadBankCoins(storage), 17);
  values.set("lawn-enforcement-save-v1", "not-json");
  assert.equal(loadBankCoins(storage), 0);
});

test("map unlocks persist alongside coins", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  assert.equal(saveProgress(storage, { coins: 75, unlockedMaps: ["backyard", "cul-de-sac", "garden"] }), true);
  assert.equal(loadProgress(storage).coins, 75);
  assert.deepEqual(loadProgress(storage).unlockedMaps, ["backyard", "frontyard", "garden"]);
  assert.equal(saveBankCoins(storage, 90), true);
  assert.equal(loadProgress(storage).coins, 90);
  assert.deepEqual(loadProgress(storage).unlockedMaps, ["backyard", "frontyard", "garden"]);
});

test("glossary enemy defeat counts persist and reject malformed values", () => {
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
  const progress = loadProgress(storage);
  progress.defeatedEnemies.gnome = 17;
  progress.defeatedEnemies.gopher = 3;
  assert.equal(saveProgress(storage, progress), true);
  assert.deepEqual(loadProgress(storage).defeatedEnemies, {
    gnome: 17,
    gopher: 3,
    "king-gnomulus": 0,
    "common-weed": 0,
    strongweed: 0,
    squirrel: 0,
    "acorn-squirrel": 0,
    dandelion: 0,
    "lily-queen": 0,
    groundskeeper: 0,
    goose: 0,
    pondfather: 0,
    golfer: 0,
    "pro-golfer": 0,
    snail: 0,
    mosquito: 0,
    deer: 0,
    "ancient-snail": 0,
    "rogue-soccer-ball": 0,
    sprinter: 0,
    backpack: 0,
    basketball: 0,
    "pe-teacher": 0,
    "ball-launcher": 0,
    "construction-worker": 0,
    "traffic-cone": 0,
    "runaway-tire": 0,
    "brick-carrier": 0,
    "safety-vest": 0,
    excavator: 0,
    chicken: 0,
    "chicken-egg": 0,
    chick: 0,
    rooster: 0,
    "mother-hen": 0,
    "angry-corn": 0,
    popcorn: 0,
    "mini-tractor": 0,
    combine: 0,
  });
  values.set("lawn-enforcement-save-v1", JSON.stringify({
    defeatedEnemies: { gnome: -5, gopher: "many", "king-gnomulus": 2.9 },
  }));
  assert.deepEqual(loadProgress(storage).defeatedEnemies, {
    gnome: 0,
    gopher: 0,
    "king-gnomulus": 2,
    "common-weed": 0,
    strongweed: 0,
    squirrel: 0,
    "acorn-squirrel": 0,
    dandelion: 0,
    "lily-queen": 0,
    groundskeeper: 0,
    goose: 0,
    pondfather: 0,
    golfer: 0,
    "pro-golfer": 0,
    snail: 0,
    mosquito: 0,
    deer: 0,
    "ancient-snail": 0,
    "rogue-soccer-ball": 0,
    sprinter: 0,
    backpack: 0,
    basketball: 0,
    "pe-teacher": 0,
    "ball-launcher": 0,
    "construction-worker": 0,
    "traffic-cone": 0,
    "runaway-tire": 0,
    "brick-carrier": 0,
    "safety-vest": 0,
    excavator: 0,
    chicken: 0,
    "chicken-egg": 0,
    chick: 0,
    rooster: 0,
    "mother-hen": 0,
    "angry-corn": 0,
    popcorn: 0,
    "mini-tractor": 0,
    combine: 0,
  });
});

test("structurally invalid save fields safely fall back and clamp", () => {
  const storage = {
    getItem: () => JSON.stringify({
      coins: -50,
      weaponLevels: "invalid",
      characterStats: { health: 99, damage: -4 },
      settings: { sound: "yes" },
      keybinds: { melee: 1 },
    }),
  };
  const progress = loadProgress(storage);
  assert.equal(progress.coins, 0);
  assert.equal(progress.weaponLevels.apples, 1);
  assert.equal(progress.characterStats.health, 2);
  assert.equal(progress.characterStats.damage, 0);
  assert.equal(progress.characterStats.accuracy, 0);
  assert.equal(progress.settings.sound, true);
  assert.equal(progress.keybinds.melee, "Digit1");
});

test("saved loadouts allow any owned weapon in either slot", () => {
  const validStorage = {
    getItem: () => JSON.stringify({
      ownedWeapons: ["golden-rake", "garden-hose"],
      equippedWeapons: { melee: "golden-rake", ranged: "garden-hose" },
    }),
  };
  assert.deepEqual(loadProgress(validStorage).equippedWeapons, {
    melee: "golden-rake",
    ranged: "garden-hose",
  });
  assert.equal(loadProgress(validStorage).weaponLevels["golden-rake"], 1);

  const invalidStorage = {
    getItem: () => JSON.stringify({
      ownedWeapons: ["golden-rake", "garden-hose", "made-up-weapon"],
      equippedWeapons: { melee: "garden-hose", ranged: "made-up-weapon" },
    }),
  };
  const progress = loadProgress(invalidStorage);
  assert.deepEqual(progress.equippedWeapons, { melee: "garden-hose", ranged: "apples" });
  assert.equal(progress.ownedWeapons.includes("made-up-weapon"), false);
});

test("legacy Fertilizer Cannon saves migrate to the Diet Cola Launcher", () => {
  const storage = {
    getItem: () => JSON.stringify({
      ownedWeapons: ["fertilizer-cannon"],
      weaponLevels: { "fertilizer-cannon": 4 },
      equippedWeapons: { melee: "weedwacker-9000", ranged: "fertilizer-cannon" },
    }),
  };
  const progress = loadProgress(storage);
  assert.equal(progress.ownedWeapons.includes("fertilizer-cannon"), false);
  assert.equal(progress.ownedWeapons.includes("diet-cola-launcher"), true);
  assert.equal(progress.weaponLevels["diet-cola-launcher"], 4);
  assert.equal(progress.equippedWeapons.ranged, "diet-cola-launcher");
});
