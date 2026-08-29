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
  unlocks: "public-park",
  boss: Object.freeze({
    type: "dandelion",
    name: "Dandelion",
    health: 800,
    damage: 0,
    speed: 34,
    sporeCooldown: 0.5,
    aimedSporeCooldown: 0.5,
    sporeSpeed: 280,
    sporeDamage: 20,
    sporeLifetime: 1.6,
    shieldThreshold: 100,
    shieldStrength: 200,
    shieldCooldown: 5,
    maxShieldActivations: 5,
    healthRegeneration: 15,
  }),
});

export const PUBLIC_PARK_MAP = Object.freeze({
  id: "public-park",
  name: "The Public Park",
  world: Object.freeze({
    width: VIEWPORT.designWidth * 1.8,
    height: VIEWPORT.designHeight * 1.5,
    gridSize: 96,
  }),
  lawnColors: Object.freeze({ primary: "#6f8a42", secondary: "#66803c" }),
  houseSide: null,
  normalEnemyType: "park",
  gopherSpawnChance: 0,
  gopherSpawnTime: Number.POSITIVE_INFINITY,
  bossSpawnTime: 120,
  victoryCoinBonus: 2000,
  bossThrownEnemy: null,
  unlocks: "lake-elizabeth",
  obstacles: Object.freeze([
    Object.freeze({ x: 180, y: 180, width: 190, height: 34, kind: "bench" }),
    Object.freeze({ x: 1050, y: 240, width: 210, height: 34, kind: "bench" }),
    Object.freeze({ x: 550, y: 420, width: 220, height: 38, kind: "picnic-table" }),
    Object.freeze({ x: 150, y: 760, width: 430, height: 260, kind: "playground" }),
    Object.freeze({ x: 1180, y: 720, width: 300, height: 180, kind: "trees" }),
    Object.freeze({ x: 1480, y: 260, width: 160, height: 300, kind: "trees" }),
  ]),
  boss: Object.freeze({
    type: "groundskeeper",
    name: "The Groundskeeper",
    health: 2000,
    damage: 50,
    speed: 440,
    mowCooldown: 5,
    clippingCooldown: 1,
    shieldStrength: 200,
    shieldRegeneration: 10,
  }),
});

export const LAKE_ELIZABETH_MAP = Object.freeze({
  id: "lake-elizabeth", name: "Lake Elizabeth",
  world: Object.freeze({ width: VIEWPORT.designWidth * 1.9, height: VIEWPORT.designHeight * 1.6, gridSize: 96 }),
  lawnColors: Object.freeze({ primary: "#66834b", secondary: "#5d7744" }), houseSide: null,
  normalEnemyType: "lake", gopherSpawnChance: 0.3, gopherSpawnTime: 0, bossSpawnTime: 90,
  victoryCoinBonus: 2500, bossThrownEnemy: "gnome", unlocks: "golf-course",
  obstacles: Object.freeze([{ x: 470, y: 260, width: 760, height: 600, kind: "lake", solid: true }]),
  bosses: Object.freeze([
    Object.freeze({ type: "king-gnomulus", name: "King Gnomulus", health: 1500, damage: 50, speed: 58, thrownGnomeCooldown: 4, thrownGnomeSpeed: 430, throwWindupDuration: .65, summonCooldown: 4 }),
    Object.freeze({ type: "pondfather", name: "The Pondfather", health: 2500, shieldStrength: 200, speed: 200, healthRegeneration: 15, shieldRegeneration: 50 }),
  ]),
  boss: Object.freeze({ type: "king-gnomulus", name: "King Gnomulus", health: 1500, damage: 50, speed: 58, thrownGnomeCooldown: 4, thrownGnomeSpeed: 430, throwWindupDuration: .65, summonCooldown: 4 }),
});

export const GOLF_COURSE_MAP = Object.freeze({
  id: "golf-course",
  name: "The Golf Course",
  world: Object.freeze({
    width: VIEWPORT.designWidth * 1.6,
    height: VIEWPORT.designHeight * 1.6,
    gridSize: 96,
  }),
  lawnColors: Object.freeze({ primary: "#63833d", secondary: "#587537" }),
  houseSide: null,
  normalEnemyType: "golf",
  gooseSpawnChance: 0.16,
  preBossGooseSpawnChance: 0.32,
  preBossGopherSpawnChance: 0.60,
  golferSpawnChance: 0.20,
  postBossSquirrelSpawnChance: 0.16,
  postBossGopherSpawnChance: 0.16,
  bossSpawnTime: 90,
  victoryCoinBonus: 3000,
  bossThrownEnemy: null,
  unlocks: "aquatic-garden",
  obstacles: Object.freeze([
    Object.freeze({ x: 220, y: 210, width: 250, height: 120, kind: "sand-bunker", solid: false }),
    Object.freeze({ x: 1050, y: 180, width: 230, height: 105, kind: "sand-bunker", solid: false }),
    Object.freeze({ x: 630, y: 760, width: 290, height: 130, kind: "sand-bunker", solid: false }),
    Object.freeze({ x: 165, y: 640, width: 110, height: 140, kind: "trees", solid: true }),
    Object.freeze({ x: 1450, y: 690, width: 120, height: 150, kind: "trees", solid: true }),
    Object.freeze({ x: 1600, y: 210, width: 100, height: 130, kind: "trees", solid: true }),
    Object.freeze({ x: 900, y: 320, width: 36, height: 36, kind: "golf-hole", solid: false }),
    Object.freeze({ x: 1320, y: 840, width: 36, height: 36, kind: "golf-hole", solid: false }),
    Object.freeze({ x: 360, y: 1010, width: 36, height: 36, kind: "golf-hole", solid: false }),
  ]),
  bosses: Object.freeze([
    Object.freeze({ type: "groundskeeper", name: "The Groundskeeper", health: 2000, damage: 50, speed: 440, mowCooldown: 5, clippingCooldown: 1, shieldStrength: 200, shieldRegeneration: 10, canCrushObstacles: false, summonSquirrels: false }),
    Object.freeze({ type: "pro-golfer", name: "The Pro Golfer", health: 3500, damage: 30, speed: 320, attackCooldown: 3, attackPauseDuration: 0.55, regularDamage: 30, fanDamage: 20, ballSpeed: 700, fanBallSpeed: 420, bombDamage: 50, bombWarningDuration: 0.8 }),
  ]),
  boss: Object.freeze({ type: "groundskeeper", name: "The Groundskeeper", health: 2000, damage: 50, speed: 440, mowCooldown: 5, clippingCooldown: 1, shieldStrength: 200, shieldRegeneration: 10, canCrushObstacles: false, summonSquirrels: false }),
});

export const AQUATIC_GARDEN_MAP = Object.freeze({
  id: "aquatic-garden",
  name: "Aquatic Garden",
  world: GARDEN_MAP.world,
  lawnColors: Object.freeze({ primary: "#64743b", secondary: "#5b6d35" }),
  houseSide: null,
  normalEnemyType: "aquatic-garden",
  gopherSpawnChance: 0,
  gopherSpawnTime: Number.POSITIVE_INFINITY,
  bossSpawnTime: 60,
  nextBossSpawnDelay: 90,
  victoryCoinBonus: 3500,
  bossThrownEnemy: null,
  unlocks: "redwood-trail",
  obstacles: Object.freeze([
    Object.freeze({ x: 0, y: GARDEN_MAP.world.height / 2 - 140, width: GARDEN_MAP.world.width, height: 280, kind: "river", solid: false }),
  ]),
  lilypadCount: 3,
  bosses: Object.freeze([
    Object.freeze({
      type: "dandelion", name: "Dandelion", health: 800, damage: 0, speed: 34,
      sporeCooldown: 0.5, aimedSporeCooldown: 0.5, sporeSpeed: 280, sporeDamage: 20, sporeLifetime: 1.6,
      shieldThreshold: 100, shieldStrength: 200, shieldCooldown: 5, maxShieldActivations: 5, healthRegeneration: 15,
    }),
    Object.freeze({
      type: "lily-queen", name: "Lily Queen", health: 5000, damage: 0, speed: 0,
      shieldStrength: 200, shieldRegeneration: 5, strongweedCooldown: 0.3, strongweedLaunchChance: 0.5, strongweedLaunchSpeed: 900, riverbankWeedCooldown: 1,
    }),
  ]),
  boss: Object.freeze({
    type: "dandelion", name: "Dandelion", health: 800, damage: 0, speed: 34,
    sporeCooldown: 0.5, aimedSporeCooldown: 0.5, sporeSpeed: 280, sporeDamage: 20, sporeLifetime: 1.6,
    shieldThreshold: 100, shieldStrength: 200, shieldCooldown: 5, maxShieldActivations: 5, healthRegeneration: 15,
  }),
});

export const REDWOOD_TRAIL_MAP = Object.freeze({
  id: "redwood-trail",
  name: "Redwood Trail",
  world: Object.freeze({
    width: VIEWPORT.designWidth * 1.8,
    height: VIEWPORT.designHeight * 1.8,
    gridSize: 96,
  }),
  lawnColors: Object.freeze({ primary: "#46683b", secondary: "#3d5d35" }),
  houseSide: null,
  normalEnemyType: "redwood-trail",
  gopherSpawnChance: 0,
  gopherSpawnTime: Number.POSITIVE_INFINITY,
  bossSpawnTime: 120,
  victoryCoinBonus: 4000,
  bossThrownEnemy: null,
  unlocks: "chicken-farm",
  spawnIntervalMultiplier: 1.25,
  obstacles: Object.freeze([
    Object.freeze({ x: 300, y: 260, width: 150, height: 220, kind: "redwood-trunk", solid: true }),
    Object.freeze({ x: 840, y: 180, width: 170, height: 220, kind: "redwood-trunk", solid: true }),
    Object.freeze({ x: 1510, y: 290, width: 145, height: 230, kind: "redwood-trunk", solid: true }),
    Object.freeze({ x: 520, y: 760, width: 180, height: 220, kind: "redwood-trunk", solid: true }),
    Object.freeze({ x: 1180, y: 700, width: 160, height: 250, kind: "redwood-trunk", solid: true }),
    Object.freeze({ x: 1830, y: 1000, width: 150, height: 220, kind: "redwood-trunk", solid: true }),
    Object.freeze({ x: 980, y: 1110, width: 180, height: 180, kind: "redwood-trunk", solid: true }),
  ]),
  redwoodSpawnWeights: Object.freeze({ snail: 0.5, mosquito: 0.34, deer: 0.16 }),
  boss: Object.freeze({
    type: "ancient-snail",
    name: "The Ancient Snail",
    health: 5000,
    shieldStrength: 2000,
    shieldRegeneration: 40,
    speed: 30,
    spitCooldown: 2,
    spitDamage: 35,
    spitSpeed: 360,
    spitLifetime: 4,
    spitSplashRadius: 42,
    shellSlamCooldown: 5,
    shellSlamDamage: 50,
    shellSlamRadius: 260,
    shellSlamPushback: 150,
    snailArmyCooldown: 3,
  }),
});

export const SCHOOL_FIELD_MAP = Object.freeze({
  id: "school-field",
  name: "School Field",
  world: Object.freeze({
    width: VIEWPORT.designWidth * 1.8,
    height: VIEWPORT.designHeight * 1.5,
    gridSize: 96,
  }),
  lawnColors: Object.freeze({ primary: "#6b9149", secondary: "#638643" }),
  houseSide: null,
  normalEnemyType: "school-field",
  // Sprinters and backpacks only enter the pool after the PE Teacher is
  // defeated. Their post-boss chances are one quarter of their old shares;
  // the remaining weight goes to the other School Field enemies.
  schoolFieldPreBossSpawnWeights: Object.freeze({ rogueSoccerBall: 0.2035, sprinter: 0, backpack: 0, basketball: 0.7965 }),
  schoolFieldSpawnWeights: Object.freeze({ rogueSoccerBall: 0.2035, sprinter: 0.045575, backpack: 0.03855, basketball: 0.712375 }),
  bossSpawnTime: 120,
  nextBossSpawnDelay: 60,
  victoryCoinBonus: 5000,
  bossThrownEnemy: null,
  unlocks: "construction-site",
  obstacles: Object.freeze([
    Object.freeze({ x: 0, y: 0, width: VIEWPORT.designWidth * 1.8, height: 110, kind: "running-track", solid: false, speedMultiplier: 1.2 }),
    Object.freeze({ x: 0, y: VIEWPORT.designHeight * 1.5 - 110, width: VIEWPORT.designWidth * 1.8, height: 110, kind: "running-track", solid: false, speedMultiplier: 1.2 }),
    Object.freeze({ x: 0, y: 0, width: 110, height: VIEWPORT.designHeight * 1.5, kind: "running-track", solid: false, speedMultiplier: 1.2 }),
    Object.freeze({ x: VIEWPORT.designWidth * 1.8 - 110, y: 0, width: 110, height: VIEWPORT.designHeight * 1.5, kind: "running-track", solid: false, speedMultiplier: 1.2 }),
    Object.freeze({ x: 260, y: 270, width: 170, height: 30, kind: "soccer-goal", solid: false }),
    Object.freeze({ x: 1500, y: 760, width: 170, height: 30, kind: "soccer-goal", solid: false }),
    Object.freeze({ x: 530, y: 560, width: 170, height: 28, kind: "bench", solid: true }),
    Object.freeze({ x: 1180, y: 450, width: 170, height: 28, kind: "bench", solid: true }),
  ]),
  bosses: Object.freeze([
    Object.freeze({ type: "pe-teacher", name: "The PE Teacher", health: 8000, speed: 340, dodgeballCooldown: 2, dodgeballSpeed: 520, dodgeballDamage: 28, dodgeballKnockback: 55, whistleCooldown: 3, whistleDamage: 35, whistleRadius: 240, whistleKnockback: 130, lapCooldown: 8 }),
    Object.freeze({ type: "ball-launcher", name: "The Ball Launcher", health: 10000, speed: 0, ballCooldown: 0.5, dumpCooldown: 5, ballDamage: 18, ballSpeed: 440, dumpDamage: 22, dumpSpeed: 360 }),
  ]),
  boss: Object.freeze({ type: "pe-teacher", name: "The PE Teacher", health: 8000, speed: 340, dodgeballCooldown: 2, dodgeballSpeed: 520, dodgeballDamage: 28, dodgeballKnockback: 55, whistleCooldown: 3, whistleDamage: 35, whistleRadius: 240, whistleKnockback: 130, lapCooldown: 8 }),
});

export const CONSTRUCTION_SITE_MAP = Object.freeze({
  id: "construction-site",
  name: "Construction Site",
  world: Object.freeze({ width: VIEWPORT.designWidth * 1.8, height: VIEWPORT.designHeight * 1.6, gridSize: 96 }),
  lawnColors: Object.freeze({ primary: "#896d47", secondary: "#7d6240" }),
  houseSide: null,
  normalEnemyType: "construction-site",
  enemyCap: 100,
  bossSpawnTime: 120,
  victoryCoinBonus: 5500,
  bossThrownEnemy: null,
  unlocks: "botanical-garden",
  debrisMinCooldown: 6,
  debrisMaxCooldown: 10,
  // Requested relative weights total 110 (20/30/15/15/30), so store their
  // normalized probabilities while preserving that exact ratio.
  constructionSpawnWeights: Object.freeze({ worker: 1.5 / 11, cone: 3 / 11, tire: 1.5 / 11, brickCarrier: 1 / 11, safetyVest: 4 / 11 }),
  obstacles: Object.freeze([
    Object.freeze({ x: 180, y: 190, width: 120, height: 60, kind: "dirt-pile", solid: false }),
    Object.freeze({ x: 710, y: 270, width: 150, height: 55, kind: "pipes", solid: false }),
    Object.freeze({ x: 1330, y: 210, width: 130, height: 65, kind: "pallets", solid: false }),
    Object.freeze({ x: 390, y: 760, width: 180, height: 35, kind: "barrier", solid: false }),
    Object.freeze({ x: 1120, y: 820, width: 190, height: 35, kind: "barrier", solid: false }),
  ]),
  boss: Object.freeze({ type: "excavator", name: "The Excavator", health: 12000, speed: 52, damage: 35 }),
});

export const BOTANICAL_GARDEN_MAP = Object.freeze({
  id: "botanical-garden",
  name: "Botanical Garden",
  world: Object.freeze({ width: VIEWPORT.designWidth * 1.8, height: VIEWPORT.designHeight * 1.7, gridSize: 96 }),
  lawnColors: Object.freeze({ primary: "#557f48", secondary: "#4d7442" }),
  houseSide: null,
  normalEnemyType: "botanical-garden",
  enemyCap: 100,
  spawnIntervalMultiplier: 1.12,
  bossSpawnTime: 120,
  victoryCoinBonus: 7500,
  bossThrownEnemy: null,
  unlocks: "beach",
  botanicalSpawnWeights: Object.freeze({ cactus: .28, snapflower: .32, sunflower: .18, vine: .22 }),
  obstacles: Object.freeze([
    Object.freeze({ x: 170, y: 170, width: 310, height: 180, kind: "sunflower-bed", solid: false }),
    Object.freeze({ x: 870, y: 130, width: 340, height: 190, kind: "rose-bed", solid: false }),
    Object.freeze({ x: 1580, y: 190, width: 330, height: 175, kind: "lavender-bed", solid: false }),
    Object.freeze({ x: 290, y: 760, width: 350, height: 190, kind: "lavender-bed", solid: false }),
    Object.freeze({ x: 990, y: 720, width: 330, height: 205, kind: "sunflower-bed", solid: false }),
    Object.freeze({ x: 1700, y: 760, width: 320, height: 185, kind: "rose-bed", solid: false }),
    Object.freeze({ x: 90, y: 510, width: 190, height: 28, kind: "hedge", solid: false }),
    Object.freeze({ x: 2020, y: 520, width: 190, height: 28, kind: "hedge", solid: false }),
    Object.freeze({ x: 660, y: 475, width: 80, height: 80, kind: "fountain", solid: false }),
    Object.freeze({ x: 1460, y: 465, width: 80, height: 80, kind: "statue", solid: false }),
    Object.freeze({ x: 470, y: 500, width: 150, height: 25, kind: "bench", solid: false }),
    Object.freeze({ x: 1670, y: 500, width: 150, height: 25, kind: "bench", solid: false }),
  ]),
  boss: Object.freeze({ type: "queen-rose", name: "Queen Rose", health: 20000, damage: 0, speed: 0 }),
});

export const CHICKEN_FARM_MAP = Object.freeze({
  id: "chicken-farm",
  name: "Chicken Farm",
  world: Object.freeze({ width: VIEWPORT.designWidth * 1.7, height: VIEWPORT.designHeight * 1.6, gridSize: 96 }),
  lawnColors: Object.freeze({ primary: "#7e9d4a", secondary: "#967544" }),
  houseSide: null,
  normalEnemyType: "chicken-farm",
  enemyCap: 150,
  chickenEggDeathChance: 0.5,
  bossSpawnTime: 120,
  victoryCoinBonus: 6000,
  bossThrownEnemy: null,
  unlocks: "corn-farm",
  obstacles: Object.freeze([
    Object.freeze({ x: 80, y: 90, width: 260, height: 150, kind: "barn", solid: true }),
    Object.freeze({ x: 1640, y: 120, width: 190, height: 115, kind: "chicken-coop", solid: true }),
    Object.freeze({ x: 180, y: 850, width: 130, height: 80, kind: "hay-bales", solid: true }),
    Object.freeze({ x: 1500, y: 800, width: 150, height: 90, kind: "hay-bales", solid: true }),
    Object.freeze({ x: 850, y: 130, width: 150, height: 55, kind: "feeding-area", solid: false }),
    Object.freeze({ x: 850, y: 930, width: 150, height: 55, kind: "feeding-area", solid: false }),
  ]),
  boss: Object.freeze({ type: "mother-hen", name: "Mother Hen", health: 15000, speed: 88, damage: 35 }),
});

export const CORN_FARM_MAP = Object.freeze({
  id: "corn-farm",
  name: "Corn Farm",
  world: Object.freeze({ width: VIEWPORT.designWidth * 1.8, height: VIEWPORT.designHeight * 1.6, gridSize: 96 }),
  lawnColors: Object.freeze({ primary: "#8a843d", secondary: "#756f34" }),
  houseSide: null,
  normalEnemyType: "corn-farm",
  enemyCap: 100,
  bossSpawnTime: 120,
  victoryCoinBonus: 6500,
  bossThrownEnemy: null,
  unlocks: "school-field",
  cornSpawnWeights: Object.freeze({ angryCorn: 0.44, popcorn: 0.50, miniTractor: 0.06 }),
  boss: Object.freeze({
    type: "combine", name: "The Combine", health: 18000, damage: 50, speed: 52,
    harvestRunCooldown: 7, cornCannonCooldown: 4, cornDumpCooldown: 8,
  }),
});

export const BEACH_MAP = Object.freeze({
  id: "beach",
  name: "Beach",
  world: Object.freeze({ width: VIEWPORT.designWidth * 2, height: VIEWPORT.designHeight * 1.5, gridSize: 96 }),
  lawnColors: Object.freeze({ primary: "#d9bd7b", secondary: "#d1b271" }),
  houseSide: null,
  normalEnemyType: "beach",
  enemyCap: 100,
  bossSpawnTime: 120,
  victoryCoinBonus: 8000,
  bossThrownEnemy: null,
  unlocks: "campground",
  beachSpawnWeights: Object.freeze({ crab: .42, hermitCrab: .2, beachBall: .2, sandOctopus: .1, lifeguard: .08 }),
  obstacles: Object.freeze([]),
  boss: Object.freeze({ type: "king-crab", name: "King Crab", health: 25000, speed: 150, damage: 35 }),
});

export const CAMPGROUND_MAP = Object.freeze({
  id:"campground",name:"Campground",
  world:Object.freeze({width:VIEWPORT.designWidth*1.8,height:VIEWPORT.designHeight*1.8,gridSize:96}),
  lawnColors:Object.freeze({primary:"#263426",secondary:"#202d23"}),houseSide:null,
  normalEnemyType:"campground",enemyCap:100,bossSpawnTime:120,victoryCoinBonus:8500,bossThrownEnemy:null,unlocks:"mountain-trail",
  campgroundSpawnWeights:Object.freeze({raccoon:.74,skunk:.12,bear:.08,owl:.06}),
  campfires:Object.freeze([
    Object.freeze({x:340,y:290}),Object.freeze({x:VIEWPORT.designWidth*1.8-340,y:290}),
    Object.freeze({x:340,y:VIEWPORT.designHeight*1.8-290}),Object.freeze({x:VIEWPORT.designWidth*1.8-340,y:VIEWPORT.designHeight*1.8-290}),
  ]),
  obstacles:Object.freeze([]),boss:Object.freeze({type:"campground-ranger",name:"Campground Ranger",health:28000,speed:95,damage:30}),
});

export const MOUNTAIN_TRAIL_MAP=Object.freeze({
  id:"mountain-trail",name:"Mountain Trail",world:Object.freeze({width:VIEWPORT.designWidth*1.8,height:VIEWPORT.designHeight*1.8,gridSize:96}),
  lawnColors:Object.freeze({primary:"#716852",secondary:"#655d4a"}),houseSide:null,normalEnemyType:"mountain-trail",enemyCap:100,bossSpawnTime:120,victoryCoinBonus:9000,bossThrownEnemy:null,unlocks:"neighborhood-block-party",
  mountainSpawnWeights:Object.freeze({goat:.12,acornSquirrel:.71,eagle:.12,ram:.05}),obstacles:Object.freeze([]),
  boulderEntries:Object.freeze([{x:0,y:.2,dx:1,dy:.12},{x:0,y:.7,dx:1,dy:-.08},{x:1,y:.3,dx:-1,dy:.1},{x:1,y:.82,dx:-1,dy:-.12},{x:.25,y:0,dx:.18,dy:1},{x:.75,y:0,dx:-.15,dy:1}]),
  boss:Object.freeze({type:"billy-mountain-king",name:"Billy the Mountain King",health:32000,speed:115,damage:38}),
});

export const NEIGHBORHOOD_BLOCK_PARTY_MAP = Object.freeze({
  id: "neighborhood-block-party",
  name: "Neighborhood Block Party",
  world: Object.freeze({ width: VIEWPORT.designWidth * 1.7, height: VIEWPORT.designHeight * 1.7, gridSize: 96 }),
  lawnColors: Object.freeze({ primary: "#668c62", secondary: "#5f845d" }),
  houseSide: null,
  normalEnemyType: "block-party",
  enemyCap: 100,
  bossSpawnTime: 120,
  victoryCoinBonus: 9500,
  bossThrownEnemy: null,
  unlocks: "supermarket",
  blockPartySpawnWeights: Object.freeze({ partygoer: .46, hype: .12, grill: .1, cooler: .1, dj: .08, coach: .1, firstAid: .04 }),
  obstacles: Object.freeze([]),
  boss: Object.freeze({ type: "party-planner", name: "The Party Planner", health: 38000, speed: 105, damage: 22 }),
});

export const SUPERMARKET_MAP = Object.freeze({
  id:"supermarket",name:"Supermarket",
  world:Object.freeze({width:VIEWPORT.designWidth*1.8,height:VIEWPORT.designHeight*1.6,gridSize:80}),
  lawnColors:Object.freeze({primary:"#bbb7a9",secondary:"#aaa79b"}),houseSide:null,
  normalEnemyType:"supermarket",enemyCap:100,bossSpawnTime:120,victoryCoinBonus:10000,bossThrownEnemy:null,unlocks:null,
  supermarketSpawnWeights:Object.freeze({bagGremlin:.5,canStack:.22,baguette:.16,frozenDinner:.07,cartGoblin:.05}),
  obstacles:Object.freeze([
    Object.freeze({kind:"supermarket-shelf",x:140,y:240,width:VIEWPORT.designWidth*1.8-280,height:52,solid:true}),
    Object.freeze({kind:"supermarket-shelf",x:140,y:570,width:VIEWPORT.designWidth*1.8-280,height:52,solid:true}),
    Object.freeze({kind:"supermarket-shelf",x:140,y:900,width:VIEWPORT.designWidth*1.8-280,height:52,solid:true}),
  ]),boss:Object.freeze({type:"store-manager",name:"The Store Manager",health:42000,speed:105,damage:28}),
});

export const MAP_SLOTS = Object.freeze([FIRST_MAP, FRONTYARD_MAP, GARDEN_MAP, PUBLIC_PARK_MAP, LAKE_ELIZABETH_MAP, GOLF_COURSE_MAP, AQUATIC_GARDEN_MAP, REDWOOD_TRAIL_MAP, CHICKEN_FARM_MAP, CORN_FARM_MAP, SCHOOL_FIELD_MAP, CONSTRUCTION_SITE_MAP, BOTANICAL_GARDEN_MAP, BEACH_MAP, CAMPGROUND_MAP, MOUNTAIN_TRAIL_MAP, NEIGHBORHOOD_BLOCK_PARTY_MAP, SUPERMARKET_MAP]);
export const MAPS_BY_ID = Object.freeze(Object.fromEntries(MAP_SLOTS.map((map) => [map.id, map])));

export function mapById(id) {
  return MAPS_BY_ID[id] ?? FIRST_MAP;
}
