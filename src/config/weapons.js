const MELEE = "melee";
const RANGED = "ranged";
const GENERAL_DAMAGE_MULTIPLIER = 1.1;
const SECRET_DAMAGE_MULTIPLIER = 1.2;
const SECRET_COOLDOWN_MULTIPLIER = 0.85;

export const WEAPON_DEFINITIONS = Object.freeze([
  meleeWeapon({
    id: "weedwacker-9000", name: "Weedwacker 9000", rarity: "Common", price: 0,
    duplicateValue: 40, damage: 26.18, cooldown: 0.48, range: 73.8, arc: Math.PI,
    shape: "arc", color: "#dcc45f", description: "Wide 180° sweep for crowd control.", levelTenFeature: "Reinforced line: +20% range", levelTenRangeMultiplier: 1.2,
  }),
  meleeWeapon({
    id: "vampire-fang", name: "Vampire Fang", rarity: "Secret", price: null,
    duplicateValue: 2000, damage: 4.5, cooldown: 0.18, range: 110, arc: Math.PI / 2,
    shape: "arc", color: "#c94b73", lifesteal: 0.01,
    description: "A rapid 90° bite that restores 1% of damage dealt.",
    levelTenFeature: "Blood rush: +25% range", levelTenRangeMultiplier: 1.25,
  }),
  meleeWeapon({
    id: "garden-shears", name: "Garden Shears", rarity: "Common", price: 240,
    duplicateValue: 40, damage: 9.24, cooldown: 0.22, range: 104, width: 18,
    shape: "snip", color: "#c8d5d0", description: "Tiny, rapid snips directly in front of the player.",
    levelTenFeature: "Double Snip: 50% chance to attack again immediately",
    levelTenModifiers: { extraAttackChance: 0.5 },
  }),
  meleeWeapon({
    id: "hedge-clippers", name: "Hedge Clippers", rarity: "Uncommon", price: 800,
    duplicateValue: 90, damage: 36.4, cooldown: 0.62, range: 132, arc: Math.PI / 4,
    shape: "arc", color: "#b9c8a5", description: "Long, powerful 45° precision cut.", levelTenFeature: "Precision cut: +25% critical damage",
    levelTenDamageMultiplier: 1.25,
  }),
  meleeWeapon({
    id: "wheelbarrow", name: "Wheelbarrow", rarity: "Uncommon", price: 820,
    duplicateValue: 90, damage: 11.2, cooldown: 1.05, range: 128, width: 132,
    shape: "wheelbarrow", color: "#b7a36d", knockback: 110,
    description: "A wide, slow shove that clears a path with extreme knockback.",
    levelTenFeature: "Full Load: knocked enemies damage other enemies they hit",
    levelTenModifiers: { knockbackCollisionDamage: 8 },
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
    id: "gravity-freezer", name: "Gravity Freezer", rarity: "Epic", price: 4200,
    duplicateValue: 260, damage: 18, cooldown: 5, projectileSpeed: 560, projectileLifetime: 2,
    projectileKind: "gravity-portal", color: "#9e8cff", projectileRadius: 14, explosive: true,
    splashRadius: 150, splashDamageMultiplier: 0.8, freezeDuration: 1, gravityPull: 520, detonateOnExpiry: true,
    description: "Opens a gravity portal that pulls enemies inward, then freezes them on detonation.",
    levelTenFeature: "Deep Freeze: +35% portal radius", levelTenModifiers: { splashRadius: 151 },
  }),
  rangedWeapon({
    id: "firecracker", name: "Firecracker", rarity: "Epic", price: 4600,
    duplicateValue: 260, damage: 150, cooldown: 5, projectileSpeed: 620, projectileLifetime: 0.8,
    projectileKind: "firecracker", color: "#f06c42", projectileRadius: 10, explosive: true,
    splashRadius: 48, splashDamageMultiplier: 0.7, fireDamagePerSecond: 20, fireDuration: 5,
    fireMaxStacks: 1, splitCount: 20, splitDamage: 20, splitRadius: 30, detonateOnExpiry: true, endSpeedMultiplier: 0.1, speedCurve: "fast-slowdown",
    description: "Explodes for heavy fire damage, then splits into five burning projectiles.",
    levelTenFeature: "Grand Finale: +2 secondary firecrackers", levelTenModifiers: { splitCount: 22 },
  }),
  rangedWeapon({
    id: "beach-ball", name: "Beach Ball", rarity: "Epic", price: 5000,
    duplicateValue: 170, damage: 38, cooldown: 2, projectileSpeed: 650, projectileLifetime: 3.8,
    projectileKind: "beach-ball", color: "#f2a84b", projectileRadius: 18, bounces: 5,
    spread: 0.08, recoil: 0.08, explosive: true, splashRadius: 92, splashDamageMultiplier: 0.7,
    boundaryBounces: true, allowRepeatBounces: true, levelTenFeature: "Bigger Splash: +50% final explosion damage and radius",
    levelTenModifiers: { bounces: 5, splashDamageMultiplier: 1.05, splashRadius: 132 },
    description: "A huge slow ball that ricochets five times before exploding.",
  }),
  rangedWeapon({
    id: "shurikens", name: "Shurikens", rarity: "Secret", price: null,
    duplicateValue: 2000, damage: 14, cooldown: 0.42, projectileSpeed: 1280, projectileLifetime: 1.4,
    projectileKind: "shuriken", color: "#d9e5ed", projectileRadius: 5, pierces: 3,
    perfectAccuracy: true, spread: 0, recoil: 0,
    description: "Perfectly accurate, rapid blades that pierce three enemies in line.",
    levelTenFeature: "Shadow Clone: throws two nearly parallel shurikens", levelTenModifiers: { projectileCount: 2, fanSpacing: 0.018 },
  }),
  rangedWeapon({
    id: "apples", name: "Apples", rarity: "Common", price: 0, duplicateValue: 40,
    damage: 35.2, cooldown: 1, projectileSpeed: 680, projectileLifetime: 1.5,
    projectileKind: "apple", color: "#b83b32", description: "Reliable unlimited fruit; explosive at level 10.",
    levelTenFeature: "Overripe core: explodes and slows enemies",
    recoil: 0.045, levelTenModifiers: { explosive: true, splashRadius: 72, slowDuration: 2 },
  }),
  rangedWeapon({
    id: "rainbow-apples", name: "Rainbow Apple", rarity: "Common", limited: true, seasonOnly: true,
    price: null, duplicateValue: 40, damage: 35.2, cooldown: 1, projectileSpeed: 680, projectileLifetime: 1.5,
    projectileKind: "rainbow-apple", color: "#ff5f74", description: "A color-changing seasonal apple with the same reliable throw.",
    levelTenFeature: "Overripe core: explodes and slows enemies", recoil: 0.045,
    levelTenModifiers: { explosive: true, splashRadius: 72, slowDuration: 2 },
  }),
  rangedWeapon({
    id: "party-hat", name: "Party Hat", rarity: "Mythical", limited: true, seasonOnly: true,
    price: null, duplicateValue: 440, damage: 21, cooldown: 0.8, projectileSpeed: 760, projectileLifetime: 0.72,
    projectileKind: "confetti", color: "#ff5f74", projectileCount: 7, fanSpacing: 0.12, spread: 0.04,
    projectileRadius: 5, recoil: 0.07, description: "Blasts a wide cone of brightly colored confetti.",
    levelTenFeature: "Grand Finale: fires three additional confetti pieces",
    levelTenModifiers: { projectileCount: 10 },
  }),
  rangedWeapon({
    id: "pebble-shooter", name: "Pebble Shooter", rarity: "Common", price: 240, duplicateValue: 40,
    damage: 19.2, cooldown: 0.76, projectileSpeed: 1250, projectileLifetime: 0.82,
    projectileKind: "pebble", color: "#b6a98d", projectileRadius: 5, burstCount: 3,
    burstInterval: 0.025, burstSpacing: 0.012, spread: 0.002, recoil: 0.01,
    description: "A fast, accurate three-pebble burst with a short reset between volleys.",
    levelTenFeature: "Four-Round Burst: fires four pebbles per burst",
    levelTenModifiers: { burstCount: 4 },
  }),
  rangedWeapon({
    id: "sprinkler-mine", name: "Sprinkler Mine", rarity: "Uncommon", price: 900, duplicateValue: 100,
    damage: 100, cooldown: 2, projectileSpeed: 0, projectileLifetime: 0,
    projectileKind: "sprinkler-mine", color: "#62c7d2", projectileRadius: 10,
    maxMines: 5, mineTriggerRadius: 34, mineWarningDuration: 0.18, mineExplosionRadius: 90, freezeDuration: 2,
    description: "Drops delayed mines that burst when enemies enter their trigger radius.",
    levelTenFeature: "Improved Explosives: +30% mine explosion radius",
    levelTenModifiers: { mineExplosionRadius: 117 },
  }),
  rangedWeapon({
    id: "bug-zapper", name: "Bug Zapper", rarity: "Rare", price: 1800, duplicateValue: 170,
    damage: 28, cooldown: 3, projectileSpeed: 0, projectileLifetime: 0,
    projectileKind: "bug-zapper", color: "#f4df63", projectileRadius: 12,
    zapperRange: 230, zapperDuration: 8, zapCooldown: 0.75, chainCount: 2, chainDamageMultiplier: 0.45,
    description: "Deploys a temporary zapper that automatically strikes the nearest enemy.",
    levelTenFeature: "Chain Lightning: each zap jumps to one additional enemy",
    levelTenModifiers: { chainCount: 3 },
  }),
  rangedWeapon({
    id: "trash-can-lid", name: "Trash Can Lid", rarity: "Legendary", price: 1000, duplicateValue: 440,
    damage: 30, cooldown: 1.3, projectileSpeed: 760, projectileLifetime: 3.2,
    projectileKind: "trash-can-lid", color: "#9ca6a7", projectileRadius: 14, pierces: 99,
    boomerangRange: 280, returnSpeed: 680, returnDamageMultiplier: 1,
    description: "A spinning lid that passes through enemies outward, then returns to you.",
    levelTenFeature: "Reinforced Lid: returning hits deal +50% damage",
    levelTenModifiers: { returnDamageMultiplier: 1.5 },
  }),
  rangedWeapon({
    id: "garden-gnome", name: "Garden Gnome", rarity: "Rare", price: 2200, duplicateValue: 170,
    damage: 70, cooldown: 3.5, projectileSpeed: 0, projectileLifetime: 0,
    projectileKind: "garden-gnome", color: "#d46a49", projectileRadius: 18,
    decoyHealth: 140, decoyDuration: 8, decoyExplosionDamage: 70, decoyExplosionRadius: 90, decoyCount: 1,
    description: "Places a decoy gnome that attracts minions before exploding.",
    levelTenFeature: "Last Laugh: +50% final explosion damage and +20% radius",
    levelTenModifiers: { decoyExplosionDamage: 105, decoyExplosionRadius: 108 },
  }),
  rangedWeapon({
    id: "fertilizer-bag", name: "Fertilizer Bag", rarity: "Epic", price: 1700, duplicateValue: 260,
    damage: 12, cooldown: 1.5, projectileSpeed: 620, projectileLifetime: 1.05,
    projectileKind: "fertilizer-bag", color: "#9f783d", projectileRadius: 11, detonateOnExpiry: true,
    fertilizerCloudRadius: 90, fertilizerCloudDuration: 4, fertilizerTickInterval: 0.5,
    description: "Throws a bag that bursts into a lingering damaging fertilizer cloud.",
    levelTenFeature: "Premium Fertilizer: clouds last 50% longer",
    levelTenModifiers: { fertilizerCloudDuration: 6 },
  }),
  rangedWeapon({
    id: "leaf-tornado", name: "Leaf Tornado", rarity: "Mythical", price: null, duplicateValue: 800,
    damage: 8, cooldown: 1.2, projectileSpeed: 260, projectileLifetime: 4, projectileKind: "leaf-tornado", color: "#b6c957", projectileRadius: 34,
    tornadoPullRadius: 132, tornadoPullForce: 360, tornadoTickInterval: 0.35,
    description: "Sends a swirling leaf cyclone forward that pulls in and wears down enemies.",
    levelTenFeature: "Bigger Storm: +30% tornado size and pull radius",
    levelTenModifiers: { projectileRadius: 44, tornadoPullRadius: 150 },
  }),
  rangedWeapon({
    id: "polarity-gun", name: "Polarity Gun", rarity: "Uncommon", price: 1200, duplicateValue: 100,
    damage: 42, cooldown: 1.15, projectileSpeed: 600, projectileLifetime: 1.2, projectileKind: "polarity", color: "#c18cff", projectileRadius: 9,
    polarityRadius: 94, polarityForce: 240, freezeDuration: 1, spread: 0.02, playerKickback: 14,
    description: "Alternates magnetic pull and push blasts that reposition nearby enemies.",
    levelTenFeature: "Strong Polarity: +40% push and pull force", levelTenModifiers: { polarityForce: 336 },
  }),
  rangedWeapon({
    id: "horseshoe", name: "Horseshoe", rarity: "Uncommon", price: 1300, duplicateValue: 100,
    damage: 32, cooldown: 1.3, projectileSpeed: 620, projectileLifetime: 2.8, projectileKind: "horseshoe", color: "#c9cbd0", projectileRadius: 14, pierces: 3,
    horseshoeRange: 250, horseshoeArc: 1.7,
    description: "Throws a spinning lucky horseshoe that curves around before returning.",
    levelTenFeature: "Lucky Horseshoe: +30% flight arc", levelTenModifiers: { horseshoeArc: 2.2 },
  }),
  rangedWeapon({
    id: "jumper-cables", name: "Jumper Cables", rarity: "Epic", price: 2400, duplicateValue: 260,
    damage: 48, cooldown: 1.6, projectileSpeed: 0, projectileLifetime: 0, projectileKind: "jumper-cables", color: "#5ee6ff", projectileRadius: 8,
    chainRange: 170, maxChainJumps: 8, chainFalloff: 0.8,
    description: "An electric chain leaps between nearby enemies with fading damage.",
    levelTenFeature: "Superconductor: +2 maximum chain jumps", levelTenModifiers: { maxChainJumps: 10 },
  }),
  rangedWeapon({
    id: "lightning-rod", name: "Lightning Rod", rarity: "Rare", price: 2600, duplicateValue: 170,
    damage: 38, cooldown: 2.2, projectileSpeed: 0, projectileLifetime: 0, projectileKind: "lightning-rod", color: "#e9edff", projectileRadius: 12,
    rodDuration: 15, rodStrikeInterval: 2.5, rodRadius: 82, rodChainRange: 100, rodChainCount: 10, rodMax: 3,
    description: "Places a rod that calls down repeated lightning strikes around itself.",
    levelTenFeature: "Conductive Rod: lightning strikes arrive more frequently", levelTenModifiers: { rodStrikeInterval: 1.7 },
  }),
  rangedWeapon({
    id: "garden-mirror", name: "Garden Mirror", rarity: "Rare", price: 2500, duplicateValue: 170,
    damage: 1, cooldown: 2.8, projectileSpeed: 0, projectileLifetime: 0, projectileKind: "garden-mirror", color: "#9fdff2", projectileRadius: 18,
    mirrorDuration: 12, mirrorMax: 5, mirrorDamageMultiplier: 1.25,
    description: "Places a reflective mirror that redirects ranged shots toward nearby enemies.",
    levelTenFeature: "Polished Glass: reflected projectiles deal +25% damage", levelTenModifiers: { mirrorDamageMultiplier: 1.25 },
  }),
  rangedWeapon({
    id: "doorbell", name: "Doorbell", rarity: "Uncommon", price: 1100, duplicateValue: 100,
    damage: 24, cooldown: 2.4, projectileSpeed: 0, projectileLifetime: 0, projectileKind: "doorbell", color: "#e3bb65", projectileRadius: 12,
    doorbellDuration: 12, doorbellInterval: 2.8, doorbellRadius: 120, doorbellRingCount: 1, doorbellOuterMultiplier: 1.5,
    description: "Places a bell that sends expanding sound waves through enemies.",
    levelTenFeature: "Extra Loud: larger waves and stronger outer-edge damage", levelTenModifiers: { doorbellRadius: 145, doorbellOuterMultiplier: 1.8 },
  }),
  rangedWeapon({
    id: "orbital-sprinkler", name: "Orbital Sprinkler", rarity: "Legendary", price: 6500, duplicateValue: 440,
    damage: 30, cooldown: 4.5, projectileSpeed: 0, projectileLifetime: 0, projectileKind: "orbital-sprinkler", color: "#71d9ff", projectileRadius: 12,
    orbitalDelay: 0.8, orbitalRadius: 110, radialCount: 12, radialDamage: 24, radialSpeed: 520, radialLifetime: 0.9, orbitalSecondStrike: false, playerKickback: 0,
    description: "Marks a location for a delayed orbital water blast and radial spray.",
    levelTenFeature: "Heavy Rain: more radial bolts and a larger water strike", levelTenModifiers: { radialCount: 18, orbitalRadius: 135 },
  }),
  rangedWeapon({
    id: "garden-sprayer", name: "Garden Sprayer", rarity: "Common", price: 300, duplicateValue: 40,
    damage: 12.32, cooldown: 0.92, projectileSpeed: 620, projectileLifetime: 0.82,
    projectileKind: "water", color: "#63cbe8", projectileCount: 6, fanSpacing: 0.22,
    spread: 0.08, recoil: 0.035,
    description: "A wide six-droplet water cone for forgiving crowd control.",
    levelTenFeature: "High Pressure: +2 droplets; center two pierce one enemy",
    levelTenModifiers: { projectileCount: 8, centerPierceCount: 2 },
  }),
  rangedWeapon({
    id: "tennis-balls", name: "Tennis Balls", rarity: "Rare", price: 800,
    duplicateValue: 60, damage: 15, cooldown: 1, projectileSpeed: 820,
    projectileLifetime: 1.6, projectileKind: "tennis-ball", color: "#d8e85f", bounces: 2, description: "Low damage ball ricochets between two extra enemies.",
    recoil: 0.04, levelTenFeature: "Match point: +2 bounces", levelTenModifiers: { bounces: 4 },
  }),
  rangedWeapon({
    id: "acorn-slingshot", name: "Acorn Slingshot", rarity: "Uncommon", price: 800,
    duplicateValue: 100, damage: 38, cooldown: 1, projectileSpeed: 920,
    projectileLifetime: 1.35, projectileKind: "acorn", color: "#7b4b2b", pierces: 1, description: "Hard-hitting acorn passes through two targets.",
    recoil: 0.055, levelTenFeature: "Hard shell: +2 pierces", levelTenModifiers: { pierces: 3 },
  }),
  rangedWeapon({
    id: "nail-gun", name: "Nail Gun", rarity: "Rare", price: 960, duplicateValue: 100,
    damage: 14, cooldown: 0.22, projectileSpeed: 1120, projectileLifetime: 1.25,
    projectileKind: "nail", color: "#c5c9c8", recoil: 0, perfectAccuracy: true,
    description: "A precise rapid-fire tool with fast nails and reliable range.",
    levelTenFeature: "Hardened Nails: +2 pierce", levelTenModifiers: { pierces: 2 },
  }),
  rangedWeapon({
    id: "rock-salt-blaster", name: "Rock Salt Blaster", rarity: "Epic", price: 1800, duplicateValue: 170,
    damage: 32, cooldown: 1.25, projectileSpeed: 900, projectileLifetime: 1,
    projectileKind: "rock-salt", color: "#e7d7a5", projectileCount: 5, fanSpacing: 0.045, playerKickback: 30,
    spread: 0.015, endSpeedMultiplier: 0.1, speedCurve: "fast-slowdown", knockback: 6, recoil: 0.15,
    description: "A tight five-pellet blast with heavy damage, pushback, and recoil.",
    levelTenFeature: "Double Barrel: fires two rounds per attack at -25% damage",
    levelTenDamageMultiplier: 0.75, levelTenModifiers: { rounds: 2 },
  }),
  rangedWeapon({
    id: "garden-hose", name: "Garden Hose", rarity: "Rare", price: 1320,
    duplicateValue: 160, damage: 4, cooldown: 0.075, projectileSpeed: 980,
    projectileLifetime: 0.48, projectileKind: "water", color: "#63cbe8", spread: 0.035, description: "Short steady stream with frequent light hits.",
    recoil: 0.012, levelTenFeature: "High pressure: slows targets", levelTenModifiers: { slowDuration: 0.5 },
  }),
  rangedWeapon({
    id: "bowling-ball", name: "Bowling Ball", rarity: "Uncommon", price: null,
    duplicateValue: 170, damage: 60, cooldown: 1.35, projectileSpeed: 280,
    projectileLifetime: 1.3, projectileKind: "bowling-ball", projectileRadius: 12,
    color: "#3e3156", pierces: 1, knockback: 6, recoil: 0.06,
    description: "A slow medium-range ball that rolls through one extra enemy.",
    levelTenFeature: "Clean strike: pierces one additional enemy",
    levelTenModifiers: { pierces: 2 },
  }),
  rangedWeapon({
    id: "diet-cola-launcher", name: "Diet Cola Launcher", rarity: "Legendary", price: 25000,
    duplicateValue: 440, damage: 50, cooldown: 0.72, projectileSpeed: 570,
    projectileLifetime: 1.7, projectileKind: "diet-cola", color: "#b63b32",
    explosive: true, splashRadius: 58, splashDamageMultiplier: 0.45, description: "Launches shaken cola bottles that burst across a group.",
    recoil: 0.07, levelTenFeature: "Menthol reaction: +55% blast radius", levelTenModifiers: { splashRadius: 90 },
  }),
  rangedWeapon({
    id: "slushie", name: "Slushie", rarity: "Rare", price: 2800,
    duplicateValue: 160, damage: 28, cooldown: 1, projectileSpeed: 640, projectileLifetime: 1.15,
    projectileKind: "slushie", color: "#81d9ef", projectileRadius: 10, explosive: true,
    splashRadius: 62, splashDamageMultiplier: 0.72, freezeDuration: 1,
    description: "A chilled cup that bursts into a freezing crowd-control splash.",
    levelTenFeature: "Brain Freeze: leaves a three-second icy puddle",
    levelTenModifiers: { puddleDuration: 3, puddleRadius: 42 },
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
    id: "backyard-flamethrower", name: "Backyard Flamethrower", rarity: "Rare", price: null,
    duplicateValue: 2000, damage: 10, cooldown: 0.11, projectileSpeed: 460,
    projectileLifetime: 0.38, projectileKind: "flame", color: "#f27a32", spread: 0.12,
    fireDamagePerSecond: 10, fireDuration: 5, fireMaxStacks: 2, recoil: 0.018,
    description: "Short flame stream builds up to two five-second burn stacks.",
    levelTenFeature: "Blue flame: burn damage rises to 15 per second",
    levelTenModifiers: { fireDamagePerSecond: 15 },
  }),
  rangedWeapon({
    id: "plastic-ghost", name: "Plastic Ghost", rarity: "Secret", price: null,
    duplicateValue: 2000, damage: 2.048, cooldown: 0.09765625, projectileSpeed: 760,
    projectileLifetime: 1, projectileKind: "plastic-ghost", color: "#b9f4ed",
    projectileRadius: 9, pierces: 1, projectileCount: 2, spread: 1, recoil: 0.018, lifesteal: 0.0075,
    description: "A broad ghost stream that sustains you through every enemy it touches.",
    levelTenFeature: "Ectoplasmic Reach: +30% stream range",
    levelTenProjectileLifetimeMultiplier: 1.3,
  }),
  rangedWeapon({
    id: "ordinance-undefined", name: "Ordinance Undefined", rarity: "Developer", price: null,
    developerOnly: true, duplicateValue: 2000, damage: 8.88832, cooldown: 0.5859375, projectileSpeed: 1040,
    projectileLifetime: 1.1, projectileKind: "undefined", color: "#e05cff", projectileCount: 2, bounces: 2,
    burstRounds: 2, burstInterval: 0.045,
    pierces: 1, explosive: true, splashRadius: 44, knockback: 10, spread: 0.08, recoil: 0.035, description: "Fires two illegal rapid bursts of bouncing, piercing, explosive yard energy.",
    levelTenFeature: "Code violation: +2 projectiles", levelTenModifiers: { projectileCount: 3 },
  }),
]);

export const WEAPONS_BY_ID = Object.freeze(Object.fromEntries(
  WEAPON_DEFINITIONS.map((weapon) => [weapon.id, weapon]),
));

export const RARITY_ORDER = Object.freeze(["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythical", "Secret", "Developer"]);
export const WEAPONS_SORTED_BY_RARITY = Object.freeze([...WEAPON_DEFINITIONS].sort((left, right) => {
  const rarityDifference = RARITY_ORDER.indexOf(left.rarity) - RARITY_ORDER.indexOf(right.rarity);
  if (rarityDifference !== 0) return rarityDifference;
  const slotDifference = left.slot.localeCompare(right.slot);
  return slotDifference || left.name.localeCompare(right.name);
}));

export function weaponsVisibleInCollection(ownedWeaponIds = []) {
  const owned = new Set(ownedWeaponIds);
  return WEAPONS_SORTED_BY_RARITY.filter((weapon) => !weapon.limited || owned.has(weapon.id));
}

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
  const paired = (equippedWeapons.melee === "tennis-racket" && equippedWeapons.ranged === "tennis-balls")
    || (equippedWeapons.melee === "vampire-fang" && equippedWeapons.ranged === "plastic-ghost");
  const receivesBonus = (weaponId === "tennis-racket" || weaponId === "tennis-balls"
    || weaponId === "vampire-fang" || weaponId === "plastic-ghost");
  return Math.max(1, Math.floor(level || 1)) + (paired && receivesBonus ? (weaponId === "vampire-fang" || weaponId === "plastic-ghost" ? 2 : 1) : 0);
}

export function weaponStatsAtLevel(weapon, level) {
  const safeLevel = Math.max(1, Math.floor(level || 1));
  const steps = safeLevel - 1;
  const generalDamageMultiplier = weapon.id === "rock-salt-blaster" ? 1 : GENERAL_DAMAGE_MULTIPLIER;
  const secretDamageMultiplier = weapon.rarity === "Secret" ? SECRET_DAMAGE_MULTIPLIER : 1;
  const secretCooldownMultiplier = weapon.rarity === "Secret" ? SECRET_COOLDOWN_MULTIPLIER : 1;
  const stats = {
    ...weapon,
    level: safeLevel,
    damage: Number((weapon.damage * generalDamageMultiplier * secretDamageMultiplier * (1 + weapon.damagePerLevel * steps)).toFixed(2)),
    cooldown: weapon.cooldown * secretCooldownMultiplier * (1 - weapon.cooldownPerLevel * steps),
    range: weapon.range ? weapon.range * (1 + weapon.rangePerLevel * steps) : weapon.range,
    levelTenActive: safeLevel >= 10,
  };
  if (safeLevel < 10) return stats;
  return {
    ...stats,
    damage: Number((stats.damage * (weapon.levelTenDamageMultiplier ?? 1)).toFixed(2)),
    range: stats.range ? stats.range * (weapon.levelTenRangeMultiplier ?? 1) : stats.range,
    width: (stats.width ?? 0) * (weapon.levelTenWidthMultiplier ?? 1),
    knockback: (stats.knockback ?? 0) * (weapon.levelTenKnockbackMultiplier ?? 1),
    projectileLifetime: stats.projectileLifetime
      ? stats.projectileLifetime * (weapon.levelTenProjectileLifetimeMultiplier ?? 1)
      : stats.projectileLifetime,
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
    projectileSpeed: weapon.projectileSpeed * (bonus.projectileSpeedMultiplier ?? 1),
    fanSpacing: weapon.fanSpacing * (bonus.fanSpacingMultiplier ?? 1),
    projectileRadiusMultiplier: (weapon.projectileRadiusMultiplier ?? 1) * (bonus.projectileRadiusMultiplier ?? 1),
    splashRadius: (weapon.splashRadius ?? 0) * (bonus.splashRadiusMultiplier ?? 1),
    projectileCount: (weapon.projectileCount ?? 0) + (bonus.projectileCountAdd ?? 0),
    splitCount: (weapon.splitCount ?? 0) + (bonus.splitCountAdd ?? 0),
    burstCount: (weapon.burstCount ?? 0) + (bonus.burstCountAdd ?? 0),
    maxMines: (weapon.maxMines ?? 0) + (bonus.maxMinesAdd ?? 0),
    chainCount: (weapon.chainCount ?? 0) + (bonus.chainCountAdd ?? 0),
    decoyCount: (weapon.decoyCount ?? 0) + (bonus.decoyCountAdd ?? 0),
    returnDamageMultiplier: (weapon.returnDamageMultiplier ?? 1) * (bonus.returnDamageMultiplier ?? 1),
    fertilizerCloudRadius: (weapon.fertilizerCloudRadius ?? 0) * (bonus.fertilizerCloudRadiusMultiplier ?? 1),
    tornadoPullRadius: (weapon.tornadoPullRadius ?? 0) * (bonus.tornadoPullRadiusMultiplier ?? 1),
    tornadoPullForce: (weapon.tornadoPullForce ?? 0) * (bonus.tornadoPullForceMultiplier ?? 1),
    polarityRadius: (weapon.polarityRadius ?? 0) * (bonus.polarityRadiusMultiplier ?? 1),
    polarityForce: (weapon.polarityForce ?? 0) * (bonus.polarityForceMultiplier ?? 1),
    horseshoeRange: (weapon.horseshoeRange ?? 0) * (bonus.horseshoeRangeMultiplier ?? 1),
    horseshoeArc: (weapon.horseshoeArc ?? 0) * (bonus.horseshoeArcMultiplier ?? 1),
    maxChainJumps: (weapon.maxChainJumps ?? 0) + (bonus.maxChainJumpsAdd ?? 0),
    chainFalloff: bonus.chainFalloffMultiplier === 0 ? 1 : (weapon.chainFalloff ?? 1) * (bonus.chainFalloffMultiplier ?? 1),
    rodStrikeInterval: (weapon.rodStrikeInterval ?? 0) * (bonus.rodStrikeIntervalMultiplier ?? 1),
    rodChainRange: (weapon.rodChainRange ?? 0) * (bonus.rodChainRangeMultiplier ?? 1),
    rodChainCount: (weapon.rodChainCount ?? 0) + (bonus.rodChainCountAdd ?? 0),
    mirrorMax: (weapon.mirrorMax ?? 0) + (bonus.mirrorMaxAdd ?? 0),
    mirrorDamageMultiplier: (weapon.mirrorDamageMultiplier ?? 1) * (bonus.mirrorDamageMultiplier ?? 1),
    doorbellRadius: (weapon.doorbellRadius ?? 0) * (bonus.doorbellRadiusMultiplier ?? 1),
    doorbellRingCount: (weapon.doorbellRingCount ?? 0) + (bonus.doorbellRingCountAdd ?? 0),
    radialCount: (weapon.radialCount ?? 0) + (bonus.radialCountAdd ?? 0),
    orbitalRadius: (weapon.orbitalRadius ?? 0) * (bonus.orbitalRadiusMultiplier ?? 1),
    orbitalSecondStrike: weapon.orbitalSecondStrike || Boolean(bonus.orbitalSecondStrike),
    puddleDuration: weapon.puddleDuration ?? 0,
    puddleRadius: weapon.puddleRadius ?? 0,
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

  if (weapon.shape === "thrust" || weapon.shape === "snip") {
    return forwardDistance >= 10 && forwardDistance <= range + target.radius
      && sideDistance <= weapon.width / 2 + target.radius;
  }
  if (weapon.shape === "lane" || weapon.shape === "wheelbarrow") {
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
    cooldownPerLevel: 0.025, rangePerLevel: 0, knockback: 0, width: 0, ...config,
  });
}

function rangedWeapon(config) {
  return Object.freeze({
    slot: RANGED, slotNumber: 2, maxLevel: 10, damagePerLevel: 0.12,
    cooldownPerLevel: 0.025, projectileCount: 1, fanSpacing: 0.14, rounds: 1, centerPierceCount: 0, perfectAccuracy: false, spread: 0, bounces: 0,
    pierces: 0, knockback: 0, slowDuration: 0, explosive: false,
    splashRadius: 0, splashDamageMultiplier: 0.5, recoil: 0.04, projectileRadius: 7,
    endSpeedMultiplier: 1, lifesteal: 0, projectileRadiusMultiplier: 1,
    fireDamagePerSecond: 0, fireDuration: 0, fireMaxStacks: 1, freezeDuration: 0, ...config,
  });
}
