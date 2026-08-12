const MELEE = "melee";
const RANGED = "ranged";

export const WEAPON_DEFINITIONS = Object.freeze([
  meleeWeapon({
    id: "weedwacker-9000", name: "Weedwacker 9000", rarity: "Common", price: 0,
    duplicateValue: 40, damage: 23.8, cooldown: 0.48, range: 73.8, arc: Math.PI,
    shape: "arc", color: "#dcc45f", description: "Wide 180° sweep for crowd control.", levelTenFeature: "Reinforced line: +20% range", levelTenRangeMultiplier: 1.2,
  }),
  meleeWeapon({
    id: "hedge-clippers", name: "Hedge Clippers", rarity: "Uncommon", price: 720,
    duplicateValue: 90, damage: 36.4, cooldown: 0.62, range: 132, arc: Math.PI / 4,
    shape: "arc", color: "#b9c8a5", description: "Long, powerful 45° precision cut.", levelTenFeature: "Precision cut: +25% critical damage",
    levelTenDamageMultiplier: 1.25,
  }),
  meleeWeapon({
    id: "garden-shovel", name: "Garden Shovel", rarity: "Rare", price: null,
    duplicateValue: 170, damage: 50.4, cooldown: 0.82, range: 154, width: 34,
    shape: "thrust", color: "#9ca8ad", knockback: 22, description: "Narrow heavy thrust that shoves enemies.",
    levelTenFeature: "Heavy spade: doubles knockback", levelTenKnockbackMultiplier: 2,
  }),
  meleeWeapon({
    id: "golden-rake", name: "Golden Rake", rarity: "Legendary", price: null,
    duplicateValue: 440, damage: 44.8, cooldown: 0.76, range: 146, width: 132,
    shape: "rake", color: "#f0c84d", description: "Extends forward, then branches into rake tines.", levelTenFeature: "Extra tines: +45% branch width",
    levelTenWidthMultiplier: 1.45,
  }),
  meleeWeapon({
    id: "turbo-mower", name: "Turbo Mower", rarity: "Mythical", price: null,
    duplicateValue: 800, damage: 21, cooldown: 0.2, range: 108, width: 76,
    shape: "lane", color: "#df5b42", knockback: 22, description: "Rapid rectangular mowing lane with heavy pushback.",
    levelTenFeature: "Mulch drive: pierces armor and +30% width", levelTenWidthMultiplier: 1.3,
  }),
  meleeWeapon({
    id: "tennis-racket", name: "Tennis Racket", rarity: "Rare", price: null,
    duplicateValue: 170, damage: 40, cooldown: 0.58, range: 116, arc: Math.PI * 0.65,
    shape: "arc", color: "#d8e85f", knockback: 8,
    description: "Fast sword-like forehand swing with a focused cutting arc.",
    levelTenFeature: "Match winner: +25% swing range", levelTenRangeMultiplier: 1.25,
  }),
  rangedWeapon({
    id: "apples", name: "Apples", rarity: "Common", price: 0, duplicateValue: 40,
    damage: 20, cooldown: 1, projectileSpeed: 680, projectileLifetime: 1.5,
    projectileKind: "apple", color: "#b83b32", description: "Reliable unlimited fruit; explosive at level 10.",
    levelTenFeature: "Overripe core: explodes and slows enemies",
    recoil: 0.045, levelTenModifiers: { explosive: true, splashRadius: 72, slowDuration: 2 },
  }),
  rangedWeapon({
    id: "tennis-balls", name: "Tennis Balls", rarity: "Rare", price: 450,
    duplicateValue: 60, damage: 13, cooldown: 1, projectileSpeed: 820,
    projectileLifetime: 1.6, projectileKind: "tennis-ball", color: "#d8e85f", bounces: 2, description: "Low damage ball ricochets between two extra enemies.",
    recoil: 0.04, levelTenFeature: "Match point: +2 bounces", levelTenModifiers: { bounces: 4 },
  }),
  rangedWeapon({
    id: "acorn-slingshot", name: "Acorn Slingshot", rarity: "Uncommon", price: 870,
    duplicateValue: 100, damage: 38, cooldown: 1, projectileSpeed: 920,
    projectileLifetime: 1.35, projectileKind: "acorn", color: "#7b4b2b", pierces: 1, description: "Hard-hitting acorn passes through two targets.",
    recoil: 0.055, levelTenFeature: "Hard shell: +2 pierces", levelTenModifiers: { pierces: 3 },
  }),
  rangedWeapon({
    id: "garden-hose", name: "Garden Hose", rarity: "Rare", price: 1320,
    duplicateValue: 160, damage: 4, cooldown: 0.075, projectileSpeed: 980,
    projectileLifetime: 0.48, projectileKind: "water", color: "#63cbe8", spread: 0.035, description: "Short steady stream with frequent light hits.",
    recoil: 0.012, levelTenFeature: "High pressure: slows targets", levelTenModifiers: { slowDuration: 0.5 },
  }),
  rangedWeapon({
    id: "bowling-ball", name: "Bowling Ball", rarity: "Rare", price: null,
    duplicateValue: 170, damage: 60, cooldown: 1.35, projectileSpeed: 280,
    projectileLifetime: 1.3, projectileKind: "bowling-ball", projectileRadius: 12,
    color: "#3e3156", pierces: 1, knockback: 6, recoil: 0.06,
    description: "A slow medium-range ball that rolls through one extra enemy.",
    levelTenFeature: "Clean strike: pierces one additional enemy",
    levelTenModifiers: { pierces: 2 },
  }),
  rangedWeapon({
    id: "diet-cola-launcher", name: "Diet Cola Launcher", rarity: "Legendary", price: 25000,
    duplicateValue: 440, damage: 42, cooldown: 0.72, projectileSpeed: 570,
    projectileLifetime: 1.7, projectileKind: "diet-cola", color: "#b63b32",
    explosive: true, splashRadius: 58, splashDamageMultiplier: 0.45, description: "Launches shaken cola bottles that burst across a group.",
    recoil: 0.07, levelTenFeature: "Menthol reaction: +55% blast radius", levelTenModifiers: { splashRadius: 90 },
  }),
  rangedWeapon({
    id: "leaf-blower", name: "Leaf Blower", rarity: "Epic", price: 2160,
    duplicateValue: 260, damage: 4, cooldown: 0.06, projectileSpeed: 900,
    projectileLifetime: 0.4, projectileKind: "gust", color: "#d6d0aa", spread: 0.11,
    knockback: 18, recoil: 0.014, description: "Weak steady gust repeatedly pushes enemies back.", levelTenFeature: "Gale force: doubles pushback",
    levelTenModifiers: { knockback: 36 },
  }),
  rangedWeapon({
    id: "storm-sprinkler", name: "Storm Sprinkler", rarity: "Mythical", price: null,
    duplicateValue: 800, damage: 6, cooldown: 0.052, projectileSpeed: 1120,
    projectileLifetime: 0.72, projectileKind: "storm-water", color: "#78e4ff", spread: 0.18,
    recoil: 0.018, description: "Inaccurate water minigun with extreme fire rate.", levelTenFeature: "Cloudburst: fires two water bolts", levelTenModifiers: { projectileCount: 2 },
  }),
  rangedWeapon({
    id: "backyard-flamethrower", name: "Backyard Flamethrower", rarity: "Secret", price: null,
    duplicateValue: 2000, damage: 10, cooldown: 0.09, projectileSpeed: 460,
    projectileLifetime: 0.38, projectileKind: "flame", color: "#f27a32", spread: 0.12,
    fireDamagePerSecond: 10, fireDuration: 5, fireMaxStacks: 2, recoil: 0.018,
    description: "Short flame stream builds up to two five-second burn stacks.",
    levelTenFeature: "Blue flame: burn damage rises to 15 per second",
    levelTenModifiers: { fireDamagePerSecond: 15 },
  }),
  rangedWeapon({
    id: "ordinance-undefined", name: "Ordinance Undefined", rarity: "Secret", price: null,
    duplicateValue: 2000, damage: 10.85, cooldown: 0.24, projectileSpeed: 1040,
    projectileLifetime: 1.1, projectileKind: "undefined", color: "#e05cff", bounces: 2,
    pierces: 1, explosive: true, splashRadius: 44, knockback: 10, spread: 0.08, recoil: 0.035, description: "Illegal bouncing, piercing, explosive yard energy.",
    levelTenFeature: "Code violation: +2 projectiles", levelTenModifiers: { projectileCount: 3 },
  }),
]);

export const WEAPONS_BY_ID = Object.freeze(Object.fromEntries(
  WEAPON_DEFINITIONS.map((weapon) => [weapon.id, weapon]),
));

export const RARITY_ORDER = Object.freeze(["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythical", "Secret"]);
export const WEAPONS_SORTED_BY_RARITY = Object.freeze([...WEAPON_DEFINITIONS].sort((left, right) => {
  const rarityDifference = RARITY_ORDER.indexOf(left.rarity) - RARITY_ORDER.indexOf(right.rarity);
  if (rarityDifference !== 0) return rarityDifference;
  const slotDifference = left.slot.localeCompare(right.slot);
  return slotDifference || left.name.localeCompare(right.name);
}));

export const WEAPONS = Object.freeze({
  melee: WEAPONS_BY_ID["weedwacker-9000"],
  ranged: WEAPONS_BY_ID.apples,
});

export function weaponById(id) {
  return WEAPONS_BY_ID[id] ?? null;
}

export function weaponsForSlot(slot) {
  const normalized = slot === 1 ? MELEE : slot === 2 ? RANGED : slot;
  return WEAPONS_SORTED_BY_RARITY.filter((weapon) => weapon.slot === normalized);
}

export function weaponForSlot(slot, equippedWeapons = null) {
  const slotName = slot === 2 ? RANGED : MELEE;
  return weaponById(equippedWeapons?.[slotName]) ?? WEAPONS[slotName];
}

export function weaponLevelWithLoadoutBonus(weaponId, level, equippedWeapons = {}) {
  const tennisPairEquipped = equippedWeapons.melee === "tennis-racket"
    && equippedWeapons.ranged === "tennis-balls";
  const receivesBonus = weaponId === "tennis-racket" || weaponId === "tennis-balls";
  return Math.max(1, Math.floor(level || 1)) + Number(tennisPairEquipped && receivesBonus);
}

export function weaponStatsAtLevel(weapon, level) {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  const steps = safeLevel - 1;
  const stats = {
    ...weapon,
    level: safeLevel,
    damage: Number((weapon.damage * (1 + weapon.damagePerLevel * steps)).toFixed(2)),
    cooldown: weapon.cooldown * (1 - weapon.cooldownPerLevel * steps),
    range: weapon.range ? weapon.range * (1 + weapon.rangePerLevel * steps) : weapon.range,
    levelTenActive: safeLevel >= 10,
  };
  if (safeLevel < 10) return stats;
  return {
    ...stats,
    damage: Number((stats.damage * (weapon.levelTenDamageMultiplier ?? 1)).toFixed(2)),
    range: stats.range * (weapon.levelTenRangeMultiplier ?? 1),
    width: (stats.width ?? 0) * (weapon.levelTenWidthMultiplier ?? 1),
    knockback: (stats.knockback ?? 0) * (weapon.levelTenKnockbackMultiplier ?? 1),
    ...weapon.levelTenModifiers,
  };
}

export function applyRunWeaponBonuses(weapon, player) {
  const bonus = player.weaponBonuses?.[weapon.id];
  if (!bonus) return weapon;
  return {
    ...weapon,
    damage: weapon.damage * (bonus.damageMultiplier ?? 1),
    range: weapon.range ? weapon.range * (bonus.rangeMultiplier ?? 1) : weapon.range,
    width: weapon.width ? weapon.width * (bonus.widthMultiplier ?? 1) : weapon.width,
    arc: weapon.arc ? weapon.arc * (bonus.arcMultiplier ?? 1) : weapon.arc,
    knockback: (weapon.knockback ?? 0) * (bonus.knockbackMultiplier ?? 1),
    projectileLifetime: weapon.projectileLifetime
      ? weapon.projectileLifetime * (bonus.lifetimeMultiplier ?? 1)
      : weapon.projectileLifetime,
    splashRadius: (weapon.splashRadius ?? 0) * (bonus.splashRadiusMultiplier ?? 1),
    projectileCount: (weapon.projectileCount ?? 0) + (bonus.projectileCountAdd ?? 0),
    bounces: (weapon.bounces ?? 0) + (bonus.bouncesAdd ?? 0),
    pierces: (weapon.pierces ?? 0) + (bonus.piercesAdd ?? 0),
  };
}

export function isEnemyHitByMelee(attacker, target, weapon, rangeMultiplier = 1) {
  const range = weapon.range * rangeMultiplier;
  if (weapon.shape === "arc") {
    return isWithinMeleeArc(attacker, target, range, attacker.facing, weapon.arc);
  }

  const forwardX = Math.cos(attacker.facing);
  const forwardY = Math.sin(attacker.facing);
  const sideX = -forwardY;
  const sideY = forwardX;
  const offsetX = target.x - attacker.x;
  const offsetY = target.y - attacker.y;
  const forwardDistance = offsetX * forwardX + offsetY * forwardY;
  const sideDistance = Math.abs(offsetX * sideX + offsetY * sideY);

  if (weapon.shape === "thrust") {
    return forwardDistance >= 10 && forwardDistance <= range + target.radius
      && sideDistance <= weapon.width / 2 + target.radius;
  }
  if (weapon.shape === "lane") {
    return forwardDistance >= -target.radius && forwardDistance <= range + target.radius
      && sideDistance <= weapon.width / 2 + target.radius;
  }
  if (weapon.shape === "rake") {
    const stemHit = forwardDistance >= 18 && forwardDistance <= range + target.radius
      && sideDistance <= 12 + target.radius;
    const branchHit = Math.abs(forwardDistance - range) <= 16 + target.radius
      && sideDistance <= weapon.width / 2 + target.radius;
    return stemHit || branchHit;
  }
  return false;
}

export function isWithinMeleeArc(attacker, target, range, facing, arcRadians = Math.PI) {
  const offsetX = target.x - attacker.x;
  const offsetY = target.y - attacker.y;
  const distance = Math.hypot(offsetX, offsetY);
  if (distance > range + target.radius) return false;
  const targetAngle = Math.atan2(offsetY, offsetX);
  const difference = Math.atan2(Math.sin(targetAngle - facing), Math.cos(targetAngle - facing));
  return Math.abs(difference) <= arcRadians / 2;
}

function meleeWeapon(config) {
  return Object.freeze({
    slot: MELEE, slotNumber: 1, maxLevel: 10, damagePerLevel: 0.12,
    cooldownPerLevel: 0.025, rangePerLevel: 0, knockback: 0, ...config,
  });
}

function rangedWeapon(config) {
  return Object.freeze({
    slot: RANGED, slotNumber: 2, maxLevel: 10, damagePerLevel: 0.12,
    cooldownPerLevel: 0.025, projectileCount: 1, spread: 0, bounces: 0,
    pierces: 0, knockback: 0, slowDuration: 0, explosive: false,
    splashRadius: 0, splashDamageMultiplier: 0.5, recoil: 0.04, projectileRadius: 7,
    fireDamagePerSecond: 0, fireDuration: 0, fireMaxStacks: 1, freezeDuration: 0, ...config,
  });
}
