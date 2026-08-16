import { WEAPON_DEFINITIONS, weaponById } from "../config/weapons.js";
import { ENEMY_GLOSSARY } from "../config/glossary-config.js";
import { weaponMaxLevelForMaps } from "../config/economy-config.js";
import { MAPS_BY_ID, MAP_SLOTS } from "../config/map-config.js";

export const RUN_UPGRADES = Object.freeze([
  upgrade("new-sneakers", "New Sneakers", "Bronze", "+10% movement speed"),
  upgrade("sharp-blades", "Sharp Blades", "Bronze", "+10% weapon damage"),
  upgrade("tough-turf", "Tough Turf", "Bronze", "+25 max health and heal 25"),
  upgrade("quick-trigger", "Quick Trigger", "Bronze", "+12% attack speed"),
  upgrade("steady-hands", "Steady Hands", "Bronze", "+20% accuracy and recoil control"),
  upgrade("pancake-syrup", "Pancake Syrup", "Silver", "Leave syrup that slows enemies by 50%"),
  upgrade("autonomous-mower", "Autonomous Mower", "Silver", "Every 5s, chase the closest enemy and explode"),
  upgrade("battery-pack", "Battery Pack", "Silver", "Every 5s, ignite enemies for 5 damage per second"),
  upgrade("freeze-pulse", "Freeze Pulse", "Silver", "Every 5s, freeze nearby enemies for 2 seconds"),
  upgrade("scarecrow-pulse", "Scarecrow Pulse", "Silver", "Every 5s, push nearby enemies away"),
  upgrade("steel-toes", "Steel-Toed Boots", "Gold", "Take 25% less damage"),
  upgrade("explosive-projectiles", "Explosive Projectiles", "Gold", "All ranged projectiles explode on impact"),
  upgrade("second-wind", "Second Wind", "Gold", "Restore health to its current maximum"),
  upgrade("flamingo-tube", "Flamingo Tube", "Gold", "Every 5s, create a small knockback ring around the player", { minimumMapId: "lake-elizabeth" }),
  weaponUpgrade("weedwacker-range", "Long Handle", "Weedwacker: +40% range", "weedwacker-9000"),
  weaponUpgrade("vampire-fang-reach", "Bloodied Edge", "Vampire Fang: +35% range", "vampire-fang"),
  weaponUpgrade("shears-sharpening", "Sharpened Shears", "Garden Shears: +40% snip hitbox", "garden-shears"),
  weaponUpgrade("clipper-jaw", "Wide Jaw", "Hedge Clippers: +50% cutting angle", "hedge-clippers"),
  weaponUpgrade("barrow-bigger", "Bigger Barrow", "Wheelbarrow: +35% shove width", "wheelbarrow"),
  weaponUpgrade("shovel-impact", "Gravedigger", "Garden Shovel: +25% damage and +50% knockback", "garden-shovel"),
  weaponUpgrade("rake-tines", "Extra Tines", "Golden Rake: +40% branch width", "golden-rake"),
  weaponUpgrade("mower-deck", "Wide Deck", "Turbo Mower: +35% lane width", "turbo-mower"),
  weaponUpgrade("racket-reach", "Long Grip", "Tennis Racket: +30% swing range", "tennis-racket"),
  weaponUpgrade("apple-projectile", "Double Trouble", "Apples: +1 projectile", "apples"),
  weaponUpgrade("rainbow-apple-projectile", "Double Rainbow", "Rainbow Apple: +1 projectile", "rainbow-apples"),
  weaponUpgrade("party-hat-confetti", "Party Popper", "Party Hat: +3 confetti projectiles", "party-hat"),
  weaponUpgrade("sprayer-nozzle", "Wider Nozzle", "Garden Sprayer: +3 projectiles", "garden-sprayer"),
  weaponUpgrade("tennis-bounce", "Championship Felt", "Tennis Balls: +1 bounce", "tennis-balls"),
  weaponUpgrade("acorn-pierce", "Squirrel Special", "Acorn Slingshot: +1 pierce", "acorn-slingshot"),
  weaponUpgrade("nail-magazine", "Extended Magazine", "Nail Gun: +50% range", "nail-gun"),
  weaponUpgrade("salt-buckshot", "Buckshot", "Rock Salt Blaster: +2 pellets", "rock-salt-blaster"),
  weaponUpgrade("hose-pressure", "Pressure Nozzle", "Garden Hose: +35% stream reach", "garden-hose"),
  weaponUpgrade("bowling-spin", "Hook Shot", "Bowling Ball: +1 pierce", "bowling-ball"),
  weaponUpgrade("cola-blast", "Shaken Can", "Diet Cola Launcher: +40% blast radius", "diet-cola-launcher"),
  weaponUpgrade("leaf-gale", "Industrial Fan", "Leaf Blower: +50% pushback", "leaf-blower"),
  weaponUpgrade("storm-barrels", "Rain Dance", "Storm Sprinkler: +1 water bolt", "storm-sprinkler"),
  weaponUpgrade("flamethrower-nozzle", "Extended Nozzle", "Backyard Flamethrower: +35% flame reach", "backyard-flamethrower"),
  weaponUpgrade("plastic-ghost-haunting", "Extended Haunting", "Plastic Ghost: +40% stream range and +20% stream width", "plastic-ghost"),
  weaponUpgrade("beach-ball-air", "Extra Air", "Beach Ball: +2 bounces before exploding", "beach-ball"),
  weaponUpgrade("shuriken-triple", "Triple Throw", "Shurikens: +1 additional projectile", "shurikens"),
  weaponUpgrade("gravity-core", "Dense Core", "Gravity Freezer: +35% portal radius", "gravity-freezer"),
  weaponUpgrade("firecracker-pack", "Extra Fuse", "Firecracker: +2 secondary projectiles", "firecracker"),
  weaponUpgrade("slushie-extra-large", "Extra Large", "Slushie: +40% explosion radius", "slushie"),
  weaponUpgrade("undefined-overflow", "Overflow Error", "Ordinance Undefined: +1 projectile and bounce", "ordinance-undefined"),
  weaponUpgrade("pebble-pocket", "Pocket Full of Rocks", "Pebble Shooter: +2 pebbles per burst", "pebble-shooter"),
  weaponUpgrade("extra-sprinklers", "Extra Sprinklers", "Sprinkler Mine: maximum active mines rises to 8", "sprinkler-mine"),
  weaponUpgrade("high-voltage", "High Voltage", "Bug Zapper: chain one additional enemy", "bug-zapper"),
  weaponUpgrade("oversized-lid", "Oversized Lid", "Trash Can Lid: +50% projectile size", "trash-can-lid"),
  weaponUpgrade("gnome-army", "Gnome Army", "Garden Gnome: place two decoys", "garden-gnome"),
  weaponUpgrade("family-size", "Family Size", "Fertilizer Bag: +40% cloud radius", "fertilizer-bag"),
  weaponUpgrade("twin-tornadoes", "Twin Tornadoes", "Leaf Tornado: launch two angled tornadoes", "leaf-tornado"),
  weaponUpgrade("expanded-field", "Expanded Field", "Polarity Gun: +40% pulse radius", "polarity-gun"),
  weaponUpgrade("double-luck", "Double Luck", "Horseshoe: throw two opposite-curving horseshoes", "horseshoe"),
  weaponUpgrade("overcharge", "Overcharge", "Jumper Cables: chain damage no longer falls off", "jumper-cables"),
  weaponUpgrade("lightning-network", "Lightning Network", "Lightning Rod: greatly extend rod connection range", "lightning-rod"),
  weaponUpgrade("double-reflection", "Double Reflection", "Garden Mirror: place two mirrors and increase capacity to 10", "garden-mirror"),
  weaponUpgrade("ding-dong", "Ding Dong", "Doorbell: each activation emits two sound waves", "doorbell"),
  weaponUpgrade("double-strike", "Double Strike", "Orbital Sprinkler: call a second strike at the same location", "orbital-sprinkler"),
]);

function upgrade(id, name, rarity, description, options = {}) {
  return Object.freeze({ id, name, rarity, description, ...options });
}

function weaponUpgrade(id, name, description, weaponId) {
  return Object.freeze({ id, name, rarity: "Gold", description, weaponId });
}

export const REPEATABLE_GOLD_UPGRADES = Object.freeze(new Set(["second-wind"]));

export function eligibleRunUpgrades(equippedWeaponIds = ["weedwacker-9000", "apples"], mapId = "backyard") {
  const equipped = new Set(equippedWeaponIds);
  const currentMapIndex = MAP_SLOTS.findIndex((map) => map.id === mapId);
  return RUN_UPGRADES.filter((upgrade) => {
    if (upgrade.weaponId && !equipped.has(upgrade.weaponId)) return false;
    if (!upgrade.minimumMapId) return true;
    const requiredMapIndex = MAP_SLOTS.findIndex((map) => map.id === upgrade.minimumMapId);
    return currentMapIndex >= 0 && requiredMapIndex >= 0 && currentMapIndex >= requiredMapIndex;
  });
}

export function chooseRunUpgrades(random = Math.random, count = 3, excludedIds = new Set(), equippedWeaponIds, mapId = "backyard") {
  const available = eligibleRunUpgrades(equippedWeaponIds, mapId).filter((upgrade) => !excludedIds.has(upgrade.id));
  const choices = [];
  while (choices.length < Math.min(count, available.length)) {
    const index = Math.floor(random() * available.length);
    choices.push(available.splice(index, 1)[0]);
  }
  return choices;
}

export function xpRequiredForLevel(level) {
  const steps = Math.max(0, Math.floor(level || 1) - 1);
  // Repeat each XP increase twice, then grow that increase by five: 30, 50,
  // 70, 95, 120, 150, 180, ...
  let requirement = 30;
  for (let index = 0; index < steps; index += 1) {
    requirement += 20 + Math.floor(index / 2) * 5;
  }
  return requirement;
}

export function applyRunUpgrade(player, upgradeId) {
  const actions = {
    "pancake-syrup": () => { player.syrupTrail = true; },
    "new-sneakers": () => { player.speed *= 1.1; },
    "sharp-blades": () => { player.damageMultiplier *= 1.1; },
    "tough-turf": () => {
      player.maxHealth = cappedMaxHealth(player, player.maxHealth + 25);
      player.health = Math.min(player.maxHealth, player.health + 25);
    },
    "quick-trigger": () => { player.cooldownMultiplier *= 0.88; },
    "steady-hands": () => { player.accuracy *= 1.2; },
    "autonomous-mower": () => { player.autonomousMower = true; },
    "battery-pack": () => { player.batteryPack = true; },
    "freeze-pulse": () => { player.freezePulse = true; },
    "scarecrow-pulse": () => { player.scarecrowPulse = true; },
    "flamingo-tube": () => { player.flamingoTube = true; },
    "apple-projectile": () => addWeaponBonus(player, "apples", { projectileCountAdd: 1 }),
    "rainbow-apple-projectile": () => addWeaponBonus(player, "rainbow-apples", { projectileCountAdd: 1 }),
    "party-hat-confetti": () => addWeaponBonus(player, "party-hat", { projectileCountAdd: 3 }),
    "sprayer-nozzle": () => addWeaponBonus(player, "garden-sprayer", { projectileCountAdd: 3 }),
    "steel-toes": () => { player.damageTakenMultiplier *= 0.75; },
    "weedwacker-range": () => addWeaponBonus(player, "weedwacker-9000", { rangeMultiplier: 1.4 }),
    "shears-sharpening": () => addWeaponBonus(player, "garden-shears", { widthMultiplier: 1.4 }),
    "clipper-jaw": () => addWeaponBonus(player, "hedge-clippers", { arcMultiplier: 1.5 }),
    "barrow-bigger": () => addWeaponBonus(player, "wheelbarrow", { widthMultiplier: 1.35 }),
    "shovel-impact": () => addWeaponBonus(player, "garden-shovel", { damageMultiplier: 1.25, knockbackMultiplier: 1.5 }),
    "rake-tines": () => addWeaponBonus(player, "golden-rake", { widthMultiplier: 1.4 }),
    "mower-deck": () => addWeaponBonus(player, "turbo-mower", { widthMultiplier: 1.35 }),
    "racket-reach": () => addWeaponBonus(player, "tennis-racket", { rangeMultiplier: 1.3 }),
    "tennis-bounce": () => addWeaponBonus(player, "tennis-balls", { bouncesAdd: 1 }),
    "acorn-pierce": () => addWeaponBonus(player, "acorn-slingshot", { piercesAdd: 1 }),
    "nail-magazine": () => addWeaponBonus(player, "nail-gun", { lifetimeMultiplier: 1.5 }),
    "salt-buckshot": () => addWeaponBonus(player, "rock-salt-blaster", { projectileCountAdd: 2 }),
    "hose-pressure": () => addWeaponBonus(player, "garden-hose", { lifetimeMultiplier: 1.35 }),
    "bowling-spin": () => addWeaponBonus(player, "bowling-ball", { piercesAdd: 1 }),
    "cola-blast": () => addWeaponBonus(player, "diet-cola-launcher", { splashRadiusMultiplier: 1.4 }),
    "leaf-gale": () => addWeaponBonus(player, "leaf-blower", { knockbackMultiplier: 1.5 }),
    "storm-barrels": () => addWeaponBonus(player, "storm-sprinkler", { projectileCountAdd: 1 }),
    "flamethrower-nozzle": () => addWeaponBonus(player, "backyard-flamethrower", { lifetimeMultiplier: 1.35 }),
    "plastic-ghost-haunting": () => addWeaponBonus(player, "plastic-ghost", { lifetimeMultiplier: 1.4, projectileRadiusMultiplier: 1.2 }),
    "beach-ball-air": () => addWeaponBonus(player, "beach-ball", { bouncesAdd: 2 }),
    "shuriken-triple": () => addWeaponBonus(player, "shurikens", { projectileCountAdd: 1 }),
    "gravity-core": () => addWeaponBonus(player, "gravity-freezer", { splashRadiusMultiplier: 1.35 }),
    "firecracker-pack": () => addWeaponBonus(player, "firecracker", { splitCountAdd: 2 }),
    "slushie-extra-large": () => addWeaponBonus(player, "slushie", { splashRadiusMultiplier: 1.4 }),
    "undefined-overflow": () => addWeaponBonus(player, "ordinance-undefined", { projectileCountAdd: 1, bouncesAdd: 1 }),
    "pebble-pocket": () => addWeaponBonus(player, "pebble-shooter", { burstCountAdd: 2 }),
    "extra-sprinklers": () => addWeaponBonus(player, "sprinkler-mine", { maxMinesAdd: 3 }),
    "high-voltage": () => addWeaponBonus(player, "bug-zapper", { chainCountAdd: 1 }),
    "oversized-lid": () => addWeaponBonus(player, "trash-can-lid", { projectileRadiusMultiplier: 1.5 }),
    "gnome-army": () => addWeaponBonus(player, "garden-gnome", { decoyCountAdd: 1 }),
    "family-size": () => addWeaponBonus(player, "fertilizer-bag", { fertilizerCloudRadiusMultiplier: 1.4 }),
    "twin-tornadoes": () => addWeaponBonus(player, "leaf-tornado", { projectileCountAdd: 1 }),
    "expanded-field": () => addWeaponBonus(player, "polarity-gun", { polarityRadiusMultiplier: 1.4 }),
    "double-luck": () => addWeaponBonus(player, "horseshoe", { projectileCountAdd: 1 }),
    "overcharge": () => addWeaponBonus(player, "jumper-cables", { chainFalloffMultiplier: 0 }),
    "lightning-network": () => addWeaponBonus(player, "lightning-rod", { rodChainRangeMultiplier: 2 }),
    "double-reflection": () => addWeaponBonus(player, "garden-mirror", { mirrorMaxAdd: 5, projectileCountAdd: 1 }),
    "ding-dong": () => addWeaponBonus(player, "doorbell", { doorbellRingCountAdd: 1 }),
    "double-strike": () => addWeaponBonus(player, "orbital-sprinkler", { orbitalSecondStrike: true }),
    "explosive-projectiles": () => { player.rangedExplosion = true; },
    "second-wind": () => {
      player.health = player.maxHealth;
    },
    "vampire-fang-reach": () => addWeaponBonus(player, "vampire-fang", { rangeMultiplier: 1.35 }),
  };
  if (!actions[upgradeId]) return false;
  actions[upgradeId]();
  return true;
}

function addWeaponBonus(player, weaponId, changes) {
  player.weaponBonuses ??= {};
  const current = player.weaponBonuses[weaponId] ?? {};
  player.weaponBonuses[weaponId] = { ...current, ...changes };
}

function cappedMaxHealth(player, proposedMaxHealth) {
  const cap = player.maxHealthCap ?? player.maxHealth * 2;
  return Math.min(cap, proposedMaxHealth);
}

export function loadBankCoins(storage) {
  return loadProgress(storage).coins;
}

export function saveBankCoins(storage, coins) {
  const progress = loadProgress(storage);
  return saveProgress(storage, { ...progress, coins });
}

export function loadProgress(storage) {
  const fallback = defaultProgress();
  if (!storage) return fallback;
  try {
    const parsed = JSON.parse(storage.getItem("lawn-enforcement-save-v1") ?? "{}");
    const coins = Number.isFinite(parsed.coins) && parsed.coins >= 0 ? Math.floor(parsed.coins) : 0;
    const unlockedMaps = Array.isArray(parsed.unlockedMaps)
      ? [...new Set(["backyard", ...parsed.unlockedMaps
          .filter((id) => typeof id === "string")
          .map(migrateMapId)
          .filter((id) => MAPS_BY_ID[id])])]
      : ["backyard"];
    const ownedWeapons = Array.isArray(parsed.ownedWeapons)
      ? [...new Set(["weedwacker-9000", "apples", ...parsed.ownedWeapons
          .filter((id) => typeof id === "string")
          .map(migrateWeaponId)
          .filter((id) => weaponById(id))])]
      : [...fallback.ownedWeapons];
    const weaponLevels = isRecord(parsed.weaponLevels) ? parsed.weaponLevels : {};
    const characterStats = isRecord(parsed.characterStats) ? parsed.characterStats : {};
    const settings = isRecord(parsed.settings) ? parsed.settings : {};
    const keybinds = isRecord(parsed.keybinds) ? parsed.keybinds : {};
    const defeatedEnemies = isRecord(parsed.defeatedEnemies) ? parsed.defeatedEnemies : {};
    const dailyQuests = isRecord(parsed.dailyQuests) && Array.isArray(parsed.dailyQuests.quests)
      ? parsed.dailyQuests
      : fallback.dailyQuests;
    const season = isRecord(parsed.season) && Array.isArray(parsed.season.quests)
      ? parsed.season
      : fallback.season;
    const weaponMaxLevel = weaponMaxLevelForMaps(unlockedMaps);
    return {
      version: 2,
      coins,
      chestPurchases: clampInteger(parsed.chestPurchases, 0, Number.MAX_SAFE_INTEGER, 0),
      unlockedMaps,
      ownedWeapons,
      weaponLevels: Object.fromEntries(ownedWeapons
        .map((id) => [id, clampInteger(
          weaponLevels[id] ?? (id === "diet-cola-launcher" ? weaponLevels["fertilizer-cannon"] : undefined) ?? fallback.weaponLevels[id],
          1,
          weaponMaxLevel,
          1,
        )])),
      characterStats: Object.fromEntries(Object.keys(fallback.characterStats)
        .map((stat) => [stat, clampInteger(characterStats[stat], 0, 10, 0)])),
      shieldUnlocked: parsed.shieldUnlocked === true,
      settings: Object.fromEntries(Object.keys(fallback.settings)
        .map((setting) => [setting, typeof settings[setting] === "boolean" ? settings[setting] : fallback.settings[setting]])),
      keybinds: Object.fromEntries(Object.keys(fallback.keybinds)
        .map((action) => [action, typeof keybinds[action] === "string" ? keybinds[action] : fallback.keybinds[action]])),
      defeatedEnemies: Object.fromEntries(ENEMY_GLOSSARY
        .map((enemy) => [enemy.id, clampInteger(defeatedEnemies[enemy.id], 0, Number.MAX_SAFE_INTEGER, 0)])),
      dailyQuests,
      season,
      equippedWeapons: {
        melee: validEquippedWeapon(parsed.equippedWeapons?.melee, "melee", ownedWeapons) ?? fallback.equippedWeapons.melee,
        ranged: validEquippedWeapon(parsed.equippedWeapons?.ranged, "ranged", ownedWeapons) ?? fallback.equippedWeapons.ranged,
      },
    };
  } catch {
    return fallback;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validEquippedWeapon(id, slot, ownedWeapons) {
  const migratedId = typeof id === "string" ? migrateWeaponId(id) : null;
  const weapon = weaponById(migratedId);
  return weapon && ownedWeapons.includes(migratedId) ? migratedId : null;
}

function migrateWeaponId(id) {
  return id === "fertilizer-cannon" ? "diet-cola-launcher" : id;
}

function migrateMapId(id) {
  return id === "cul-de-sac" ? "frontyard" : id;
}

function clampInteger(value, minimum, maximum, fallback) {
  return Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, Math.floor(value))) : fallback;
}

export function saveProgress(storage, progress) {
  if (!storage) return false;
  try {
    storage.setItem("lawn-enforcement-save-v1", JSON.stringify({
      version: 2,
      coins: Math.max(0, Math.floor(progress.coins)),
      chestPurchases: Math.max(0, Math.floor(progress.chestPurchases ?? 0)),
      unlockedMaps: [...new Set(progress.unlockedMaps ?? ["backyard"])],
      ownedWeapons: [...new Set(progress.ownedWeapons ?? ["weedwacker-9000", "apples"])],
      weaponLevels: progress.weaponLevels ?? { "weedwacker-9000": 1, apples: 1 },
      characterStats: progress.characterStats ?? { health: 0, damage: 0, speed: 0, attackSpeed: 0, accuracy: 0, shield: 0, regeneration: 0 },
      shieldUnlocked: progress.shieldUnlocked === true,
      settings: progress.settings ?? { sound: true, screenShake: true },
      keybinds: progress.keybinds ?? { melee: "Digit1", ranged: "Digit2" },
      equippedWeapons: progress.equippedWeapons ?? { melee: "weedwacker-9000", ranged: "apples" },
      defeatedEnemies: progress.defeatedEnemies ?? Object.fromEntries(ENEMY_GLOSSARY.map((enemy) => [enemy.id, 0])),
      dailyQuests: progress.dailyQuests ?? null,
      season: progress.season ?? null,
    }));
    return true;
  } catch {
    return false;
  }
}

export function defaultProgress() {
  return {
    version: 2,
    coins: 0,
    chestPurchases: 0,
    unlockedMaps: ["backyard"],
    ownedWeapons: ["weedwacker-9000", "apples"],
    weaponLevels: { "weedwacker-9000": 1, apples: 1 },
    characterStats: { health: 0, damage: 0, speed: 0, attackSpeed: 0, accuracy: 0, shield: 0, regeneration: 0 },
    shieldUnlocked: false,
    settings: { sound: true, screenShake: true, reducedMotion: false, tutorialSeen: false },
    keybinds: { melee: "Digit1", ranged: "Digit2" },
    equippedWeapons: { melee: "weedwacker-9000", ranged: "apples" },
    defeatedEnemies: Object.fromEntries(ENEMY_GLOSSARY.map((enemy) => [enemy.id, 0])),
    dailyQuests: null,
    season: null,
  };
}

export function unlockAllWeapons(progress) {
  const allWeaponIds = WEAPON_DEFINITIONS.filter((weapon) => !weapon.limited).map((weapon) => weapon.id);
  progress.ownedWeapons = [...new Set([...(progress.ownedWeapons ?? []), ...allWeaponIds])];
  progress.weaponLevels ??= {};
  for (const weaponId of progress.ownedWeapons) progress.weaponLevels[weaponId] ??= 1;
  return progress;
}

export function unlockSeasonWeapons(progress) {
  const seasonWeaponIds = WEAPON_DEFINITIONS.filter((weapon) => weapon.limited).map((weapon) => weapon.id);
  progress.ownedWeapons = [...new Set([...(progress.ownedWeapons ?? []), ...seasonWeaponIds])];
  progress.weaponLevels ??= {};
  for (const weaponId of seasonWeaponIds) progress.weaponLevels[weaponId] ??= 1;
  return progress;
}

export function unlockAllMaps(progress) {
  const allMapIds = MAP_SLOTS.map((map) => map.id);
  progress.unlockedMaps = [...new Set([...(progress.unlockedMaps ?? []), ...allMapIds])];
  return progress;
}
