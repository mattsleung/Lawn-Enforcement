import test from "node:test";
import assert from "node:assert/strict";

import { isEnemyHitByMelee, isWithinMeleeArc, RARITY_ORDER, WEAPON_DEFINITIONS, WEAPONS, WEAPONS_SORTED_BY_RARITY, weaponById, weaponForSlot, weaponLevelWithLoadoutBonus, weaponStatsAtLevel, weaponsVisibleInCollection } from "../src/config/weapons.js";
import { HELD_WEAPON_VISUALS } from "../src/entities/held-weapon.js";
import { Gnome } from "../src/entities/gnome.js";
import { Player } from "../src/entities/player.js";
import { Projectile } from "../src/entities/projectile.js";
import { Game, rangedFireFeedback, weaponPopupStats, weaponStatsWithPermanentProgress } from "../src/core/game.js";
import { applyFire, applyFreeze, applyKnockback, nearestBounceTarget, totalContactDamage, updateEnemyStatus } from "../src/systems/combat.js";

test("weapon slots resolve to melee and ranged loadout entries", () => {
  assert.equal(weaponForSlot(1), WEAPONS.melee);
  assert.equal(weaponForSlot(2), WEAPONS.ranged);
});

test("every weapon has a held-weapon visual definition", () => {
  assert.deepEqual(
    Object.keys(HELD_WEAPON_VISUALS).sort(),
    WEAPON_DEFINITIONS.map((weapon) => weapon.id).sort(),
  );
  for (const visual of Object.values(HELD_WEAPON_VISUALS)) {
    assert.ok(visual.kind.length > 0);
  }
});

test("every permanent weapon level improves damage and attack speed", () => {
  for (const weapon of WEAPON_DEFINITIONS) {
    let previous = weaponStatsAtLevel(weapon, 1);
    for (let level = 2; level <= 10; level += 1) {
      const current = weaponStatsAtLevel(weapon, level);
      if (weapon.id === "rock-salt-blaster" && level === 10) assert.ok(current.damage < previous.damage);
      else assert.ok(current.damage > previous.damage);
      assert.ok(current.cooldown < previous.cooldown);
      previous = current;
    }
  }
  assert.equal(weaponStatsAtLevel(WEAPONS.ranged, 9).levelTenActive, false);
  assert.equal(weaponStatsAtLevel(WEAPONS.ranged, 9).explosive, false);
  assert.equal(weaponStatsAtLevel(WEAPONS.ranged, 10).levelTenActive, true);
  assert.equal(weaponStatsAtLevel(WEAPONS.melee, 10).range, WEAPONS.melee.range * 1.2);
  assert.equal(weaponStatsAtLevel(WEAPONS.ranged, 10).explosive, true);
  assert.ok(weaponStatsAtLevel(WEAPONS.ranged, 10).damage > weaponStatsAtLevel(WEAPONS.ranged, 9).damage);
});

test("weapon roster has unique playable designs in both slots", () => {
  assert.equal(new Set(WEAPON_DEFINITIONS.map((weapon) => weapon.id)).size, WEAPON_DEFINITIONS.length);
  assert.equal(WEAPON_DEFINITIONS.filter((weapon) => weapon.slot === "melee").length, 9);
  assert.equal(WEAPON_DEFINITIONS.filter((weapon) => weapon.slot === "ranged").length, 37);
  for (const weapon of WEAPON_DEFINITIONS) {
    assert.ok(weapon.description.length > 10);
    assert.ok(weapon.levelTenFeature.length > 10);
  }
});

test("arsenal presentation is sorted from Common through Secret", () => {
  const rarityRanks = WEAPONS_SORTED_BY_RARITY.map((weapon) => RARITY_ORDER.indexOf(weapon.rarity));
  assert.deepEqual(rarityRanks, [...rarityRanks].sort((left, right) => left - right));
});

test("Limited weapons stay out of the Collection until owned", () => {
  assert.equal(weaponsVisibleInCollection(["apples"]).some((weapon) => weapon.id === "rainbow-apples"), false);
  assert.equal(weaponsVisibleInCollection(["apples"]).some((weapon) => weapon.id === "party-hat"), false);
  assert.equal(weaponsVisibleInCollection(["apples", "rainbow-apples"]).some((weapon) => weapon.id === "rainbow-apples"), true);
});

test("seasonal Rainbow Horseshoe and Piñata keep their distinct mechanics", () => {
  const horseshoe = weaponById("rainbow-horseshoe");
  const regularHorseshoe = weaponById("horseshoe");
  const pinata = weaponById("pinata");
  const gardenGnome = weaponById("garden-gnome");
  assert.equal(horseshoe.rarity, "Epic");
  assert.equal(horseshoe.limited, true);
  assert.ok(Math.abs(horseshoe.projectileLifetime - regularHorseshoe.projectileLifetime * 3) < 1e-9);
  assert.equal(horseshoe.horseshoeOrbitCount, 3);
  assert.ok(horseshoe.horseshoeRange > regularHorseshoe.horseshoeRange);
  assert.equal(pinata.rarity, "Legendary");
  assert.equal(pinata.limited, true);
  assert.equal(pinata.decoyHealth, 50);
  assert.ok(pinata.decoyExplosionDamage > 0);
  assert.equal(pinata.pinataConfettiCount, 8);
  assert.ok(pinata.pinataConfettiLifetime < weaponById("party-hat").projectileLifetime);
  assert.equal(gardenGnome.decoyExplosionDamage, 0);
  assert.equal(gardenGnome.decoyExplosionRadius, 0);
});

test("Party Hat is a Mythical Limited confetti cone", () => {
  const weapon = weaponById("party-hat");
  assert.equal(weapon.rarity, "Mythical");
  assert.equal(weapon.limited, true);
  assert.equal(weapon.projectileKind, "confetti");
  assert.equal(weapon.damage, 21);
  assert.ok(weapon.projectileCount >= 7);
  assert.ok(weapon.fanSpacing > 0);
});

test("starter balance uses reduced Weedwacker range and one-second ball and fruit cooldowns", () => {
  assert.equal(weaponById("weedwacker-9000").range, 82 * 0.9);
  assert.equal(weaponById("apples").cooldown, 1);
  assert.equal(weaponById("tennis-balls").cooldown, 1);
  assert.equal(weaponById("acorn-slingshot").cooldown, 0.5 * 2);
  assert.equal(weaponById("tennis-balls").bounces, 2);
  assert.equal(weaponStatsAtLevel(weaponById("tennis-balls"), 5).bounces, 2);
  assert.equal(weaponStatsAtLevel(weaponById("tennis-balls"), 10).bounces, 4);
});

test("melee damage is reduced by thirty percent while rapid air and water weapons are stronger", () => {
  const originalMeleeDamage = {
    "weedwacker-9000": 34,
    "garden-shears": 12,
    "hedge-clippers": 52,
    wheelbarrow: 16,
    "garden-shovel": 72,
    "golden-rake": 64,
    "turbo-mower": 30,
  };
  for (const [weaponId, originalDamage] of Object.entries(originalMeleeDamage)) {
    const expected = ["weedwacker-9000", "garden-shears"].includes(weaponId)
      ? Number((originalDamage * 0.7 * 1.1).toFixed(2))
      : Number((originalDamage * 0.7).toFixed(1));
    assert.equal(weaponById(weaponId).damage, expected);
  }
  assert.equal(weaponById("leaf-blower").damage, 4);
  assert.equal(weaponById("storm-sprinkler").damage, 6);
});

test("slower ranged weapons get brighter, longer firing feedback", () => {
  const heavy = rangedFireFeedback(weaponById("orbital-sprinkler"));
  const rapid = rangedFireFeedback(weaponById("storm-sprinkler"));
  assert.ok(heavy.strength > rapid.strength);
  assert.ok(heavy.lengthMultiplier > rapid.lengthMultiplier);
  assert.ok(heavy.lifetime > rapid.lifetime);
  assert.ok(heavy.radiusMultiplier > rapid.radiusMultiplier);
});

test("weapon kickback scales from no rebound to medium and high power", () => {
  const game = Object.create(Game.prototype);
  game.player = { x: 500, y: 400, radius: 18 };
  game.world = { width: 1000, height: 800 };
  game.activeObstacles = [];

  game.applyWeaponKickback(weaponById("orbital-sprinkler"), 0);
  assert.equal(game.player.x, 500);

  game.player.x = 500;
  game.applyWeaponKickback(weaponById("polarity-gun"), 0);
  const mediumRebound = 500 - game.player.x;

  game.player.x = 500;
  game.applyWeaponKickback(weaponById("rock-salt-blaster"), 0);
  const highRebound = 500 - game.player.x;

  assert.equal(mediumRebound, 14);
  assert.equal(highRebound, 30);
  assert.ok(highRebound > mediumRebound);
});

test("Ordinance Undefined is a Developer weapon with doubled damage", () => {
  const ordinance = weaponById("ordinance-undefined");
  assert.equal(ordinance.rarity, "Developer");
  assert.equal(ordinance.developerOnly, true);
  assert.equal(ordinance.damage, 8.88832);
  assert.equal(ordinance.burstRounds, 2);
  assert.ok(ordinance.burstInterval <= 0.05);
  assert.equal(ordinance.fireDamagePerSecond, 15);
  assert.equal(ordinance.fireDuration, 5);
  assert.equal(ordinance.freezeDuration, 2);
});

test("weapon preview creates a movable three-dummy firing range with respawning 500-health targets", () => {
  const game = Object.create(Game.prototype);
  game.progress = { weaponLevels: { apples: 1 } };
  game.input = { pointer: { x: 300, y: 145, down: true }, movementVector: () => ({ x: 1, y: 0 }) };
  game.openWeaponPreview("apples", "shop");
  assert.equal(game.screenState, "weapon-preview");
  assert.equal(game.weaponPreview.dummies.length, 3);
  assert.deepEqual(game.weaponPreview.dummies.map(({ x, y }) => [x, y]), [[238, 76], [292, 128], [238, 180]]);
  assert.deepEqual(game.weaponPreview.dummies.map(({ health }) => health), [500, 500, 500]);
  const originalPlayerX = game.weaponPreview.player.x;
  game.input.pointer.down = true;
  game.updateWeaponPreview(1 / 60);
  assert.ok(game.weaponPreview.player.x > originalPlayerX);
  assert.ok(game.weaponPreview.projectiles.length > 0);
  game.weaponPreview.dummies[0].health = 0;
  game.weaponPreview.dummies[0].resetTimer = 0;
  game.updateWeaponPreview(1 / 60, false);
  assert.equal(game.weaponPreview.dummies[0].health, 500);
});

test("Limited weapon metadata records its original season", () => {
  for (const weaponId of ["rainbow-apples", "party-hat"]) {
    const weapon = weaponById(weaponId);
    assert.equal(weapon.limited, true);
    assert.equal(weapon.season, "Lawn Enforcement");
  }
});

test("Pebble Shooter fires its burst with very short spacing", () => {
  const pebbles = weaponById("pebble-shooter");
  assert.equal(pebbles.burstCount, 3);
  assert.ok(pebbles.burstInterval <= 0.025);
  assert.ok(pebbles.burstSpacing <= 0.012);
  assert.ok(pebbles.spread <= 0.002);
  assert.ok(pebbles.recoil <= 0.01);
});

test("Weedwacker hits a 180-degree arc toward the mouse", () => {
  const player = { x: 100, y: 100 };
  const targetInFront = { x: 100 + WEAPONS.melee.range, y: 100, radius: 20 };
  const targetAtArcEdge = { x: 100, y: 100 + WEAPONS.melee.range, radius: 20 };
  const targetBehind = { x: 100 - WEAPONS.melee.range, y: 100, radius: 20 };
  const targetTooFar = { x: 100 + WEAPONS.melee.range + 21, y: 100, radius: 20 };

  assert.equal(isWithinMeleeArc(player, targetInFront, WEAPONS.melee.range, 0), true);
  assert.equal(isWithinMeleeArc(player, targetAtArcEdge, WEAPONS.melee.range, 0), true);
  assert.equal(isWithinMeleeArc(player, targetBehind, WEAPONS.melee.range, 0), false);
  assert.equal(isWithinMeleeArc(player, targetTooFar, WEAPONS.melee.range, 0), false);
});

test("Hedge Clippers trade spread for precision range", () => {
  const clippers = weaponById("hedge-clippers");
  const player = { x: 100, y: 100, facing: 0 };
  assert.equal(isEnemyHitByMelee(player, { x: 220, y: 100, radius: 8 }, clippers), true);
  assert.equal(isEnemyHitByMelee(player, { x: 190, y: 180, radius: 8 }, clippers), false);
  assert.ok(clippers.range > WEAPONS.melee.range);
  assert.equal(clippers.arc, Math.PI / 4);
});

test("Golden Rake hits its forward stem and branching tines", () => {
  const rake = weaponById("golden-rake");
  const player = { x: 0, y: 0, facing: 0 };
  assert.equal(isEnemyHitByMelee(player, { x: 80, y: 0, radius: 5 }, rake), true);
  assert.equal(isEnemyHitByMelee(player, { x: rake.range, y: rake.width / 2, radius: 5 }, rake), true);
  assert.equal(isEnemyHitByMelee(player, { x: 75, y: 50, radius: 5 }, rake), false);
});

test("shovel thrust is narrow and Turbo Mower covers a lane", () => {
  const player = { x: 0, y: 0, facing: 0 };
  const shovel = weaponById("garden-shovel");
  const mower = weaponById("turbo-mower");
  assert.equal(isEnemyHitByMelee(player, { x: 120, y: 10, radius: 5 }, shovel), true);
  assert.equal(isEnemyHitByMelee(player, { x: 120, y: 50, radius: 5 }, shovel), false);
  assert.equal(isEnemyHitByMelee(player, { x: 70, y: 30, radius: 5 }, mower), true);
  assert.equal(mower.knockback, 22);
});

test("Wheelbarrow and Garden Shears expose their distinct melee designs", () => {
  const barrow = weaponById("wheelbarrow");
  const shears = weaponById("garden-shears");
  const player = { x: 0, y: 0, facing: 0 };
  assert.equal(barrow.rarity, "Uncommon");
  assert.ok(barrow.knockback > 60);
  assert.equal(isEnemyHitByMelee(player, { x: 90, y: 45, radius: 5 }, barrow), true);
  assert.equal(isEnemyHitByMelee(player, { x: 90, y: 80, radius: 5 }, barrow), false);
  assert.equal(shears.rarity, "Common");
  assert.ok(shears.cooldown < 0.25);
  assert.equal(shears.range, 104);
  assert.equal(isEnemyHitByMelee(player, { x: 90, y: 0, radius: 5 }, shears), true);
  assert.equal(isEnemyHitByMelee(player, { x: 90, y: 20, radius: 5 }, shears), false);
  assert.equal(weaponStatsAtLevel(barrow, 10).knockbackCollisionDamage, 8);
  assert.equal(weaponStatsAtLevel(shears, 10).extraAttackChance, 0.5);
});

test("Bowling Ball is a slow medium-range Uncommon projectile with one pierce", () => {
  const bowlingBall = weaponById("bowling-ball");
  const leafBlower = weaponById("leaf-blower");
  assert.equal(bowlingBall.rarity, "Uncommon");
  assert.equal(bowlingBall.pierces, 1);
  assert.equal(bowlingBall.projectileRadius, 12);
  assert.ok(bowlingBall.projectileSpeed < 350);
  assert.ok(Math.abs(
    bowlingBall.projectileSpeed * bowlingBall.projectileLifetime
      - leafBlower.projectileSpeed * leafBlower.projectileLifetime,
  ) < 10);
});

test("apple projectile moves at its configured velocity and expires", () => {
  const projectile = new Projectile({
    x: 10,
    y: 20,
    velocityX: 100,
    velocityY: -40,
    damage: WEAPONS.ranged.damage,
    lifetime: 0.5,
    explosive: true,
  });

  projectile.update(0.25);
  assert.deepEqual({ x: projectile.x, y: projectile.y }, { x: 35, y: 10 });
  assert.equal(projectile.active, true);
  assert.equal(projectile.explosive, true);

  projectile.update(0.25);
  assert.equal(projectile.active, false);
});

test("projectiles support the configured fire and freeze weapon payloads", () => {
  const projectile = new Projectile({
    x: 0, y: 0, velocityX: 1, velocityY: 0, damage: 1, lifetime: 1,
    fireDamagePerSecond: 5, fireDuration: 10, freezeDuration: 2,
  });
  assert.equal(projectile.fireDamagePerSecond, 5);
  assert.equal(projectile.fireDuration, 10);
  assert.equal(projectile.fireMaxStacks, 1);
  assert.equal(projectile.freezeDuration, 2);
  for (const weapon of WEAPON_DEFINITIONS.filter((entry) => entry.slot === "ranged")) {
    assert.equal(weapon.fireDuration > 0, ["backyard-flamethrower", "firecracker", "ordinance-undefined"].includes(weapon.id));
    assert.equal(weapon.freezeDuration, ["sprinkler-mine", "ordinance-undefined"].includes(weapon.id) ? 2 : (["gravity-freezer", "slushie", "polarity-gun"].includes(weapon.id) ? 1 : 0), `${weapon.id} freeze duration`);
  }
});

test("Backyard Flamethrower has short range and at most two burn stacks", () => {
  const flamethrower = weaponById("backyard-flamethrower");
  assert.equal(flamethrower.rarity, "Rare");
  assert.equal(flamethrower.cooldown, 0.11);
  assert.ok(flamethrower.projectileSpeed * flamethrower.projectileLifetime < 180);
  assert.equal(flamethrower.damage, 10);
  assert.equal(flamethrower.fireDamagePerSecond, 10);
  assert.equal(flamethrower.fireDuration, 5);
  assert.equal(flamethrower.fireMaxStacks, 2);
  assert.equal(weaponStatsAtLevel(flamethrower, 9).fireDamagePerSecond, 10);
  assert.equal(weaponStatsAtLevel(flamethrower, 10).fireDamagePerSecond, 15);

  const enemy = {};
  applyFire(enemy, flamethrower.fireDamagePerSecond, flamethrower.fireDuration, flamethrower.fireMaxStacks);
  applyFire(enemy, flamethrower.fireDamagePerSecond, flamethrower.fireDuration, flamethrower.fireMaxStacks);
  applyFire(enemy, flamethrower.fireDamagePerSecond, flamethrower.fireDuration, flamethrower.fireMaxStacks);
  assert.equal(enemy.fireStacks, 2);
  assert.equal(enemy.fireDamagePerSecond, 20);
  assert.equal(updateEnemyStatus(enemy, 1).fireDamage, 20);
});

test("Tennis Racket and Tennis Balls are Rare and grant each other one effective level", () => {
  const racket = weaponById("tennis-racket");
  const balls = weaponById("tennis-balls");
  assert.equal(racket.rarity, "Rare");
  assert.equal(balls.rarity, "Rare");
  assert.equal(balls.damage, 15);
  assert.equal(racket.shape, "arc");
  assert.equal(weaponLevelWithLoadoutBonus(racket.id, 3, { melee: racket.id, ranged: balls.id }), 4);
  assert.equal(weaponLevelWithLoadoutBonus(balls.id, 4, { melee: racket.id, ranged: balls.id }), 5);
  assert.equal(weaponLevelWithLoadoutBonus(balls.id, 4, { melee: "weedwacker-9000", ranged: balls.id }), 4);
});

test("new shotgun and nail-gun ranged designs expose their signatures", () => {
  const sprayer = weaponById("garden-sprayer");
  const salt = weaponById("rock-salt-blaster");
  const nails = weaponById("nail-gun");
  const firecracker = weaponById("firecracker");
  assert.equal(sprayer.projectileCount, 6);
  assert.equal(sprayer.cooldown, 0.92);
  assert.equal(weaponById("apples").damage, 35.2);
  assert.equal(weaponById("pebble-shooter").damage, 19.2);
  assert.equal(sprayer.damage, 12.32);
  assert.equal(weaponStatsAtLevel(sprayer, 10).projectileCount, 8);
  assert.equal(weaponStatsAtLevel(sprayer, 10).centerPierceCount, 2);
  assert.equal(salt.projectileCount, 5);
  assert.equal(nails.rarity, "Rare");
  assert.equal(salt.rarity, "Epic");
  assert.equal(salt.damage, 32);
  assert.equal(weaponStatsAtLevel(salt, 10).rounds, 2);
  assert.equal(weaponStatsAtLevel(salt, 10).damage, Number((salt.damage * 2.08 * 0.75).toFixed(2)));
  assert.equal(nails.recoil, 0);
  assert.equal(nails.damage, 14);
  assert.equal(nails.perfectAccuracy, true);
  assert.equal(weaponStatsAtLevel(nails, 10).pierces, 2);
  assert.equal(firecracker.fireDamagePerSecond, 20);
  assert.equal(firecracker.fireDuration, 5);
});

test("Plastic Ghost is a broad Secret sustain stream with one pierce", () => {
  const ghost = weaponById("plastic-ghost");
  assert.equal(ghost.rarity, "Secret");
  assert.equal(ghost.damage, 2.048);
  assert.equal(ghost.cooldown, 0.09765625);
  assert.equal(ghost.pierces, 1);
  assert.equal(ghost.lifesteal, 0.0075);
  assert.equal(ghost.projectileCount, 2);
  assert.equal(ghost.recoil, 0.018);
  assert.ok(ghost.cooldown < 0.1);
  assert.ok(ghost.projectileLifetime > weaponById("backyard-flamethrower").projectileLifetime);
  assert.ok(Math.abs(weaponStatsAtLevel(ghost, 10).projectileLifetime - ghost.projectileLifetime * 1.3) < 1e-9);
  assert.equal(weaponStatsAtLevel(ghost, 10).damage > ghost.damage, true);
  assert.equal(weaponStatsAtLevel(ghost, 10).lifesteal, 0.0075);
});

test("Trash Can Lid has maximum pierce", () => {
  assert.equal(weaponById("trash-can-lid").pierces, Number.MAX_SAFE_INTEGER);
});

test("Shurikens start with three working pierces", () => {
  const shurikens = weaponById("shurikens");
  assert.equal(shurikens.damage, 14);
  assert.equal(shurikens.cooldown, 0.24);
  assert.equal(shurikens.pierces, 3);
  assert.equal(weaponStatsAtLevel(shurikens, 10).pierces, 3);
  const projectile = new Projectile({
    x: 0, y: 0, velocityX: 100, velocityY: 0, damage: 1, lifetime: 1,
    kind: "shuriken", pierces: shurikens.pierces,
  });
  for (let hit = 0; hit < 3; hit += 1) projectile.piercesRemaining -= 1;
  assert.equal(projectile.piercesRemaining, 0);
  assert.equal(projectile.active, true);
});

test("weapon popup stats include maximum DPS for every weapon", () => {
  for (const weapon of WEAPON_DEFINITIONS) {
    assert.ok(weaponPopupStats(weapon).some((stat) => stat.text.startsWith("MAX DPS:")), weapon.id);
  }
});

test("weapon popup calculations include weapon level and permanent upgrades", () => {
  const base = weaponById("apples");
  const upgraded = weaponStatsWithPermanentProgress(base, 5, { damage: 3, attackSpeed: 2, accuracy: 4 });
  assert.equal(upgraded.level, 5);
  assert.ok(upgraded.damage > weaponStatsAtLevel(base, 5).damage);
  assert.ok(upgraded.cooldown < weaponStatsAtLevel(base, 5).cooldown);
  assert.ok(upgraded.spread <= weaponStatsAtLevel(base, 5).spread);
  assert.ok(weaponPopupStats(upgraded).some((stat) => stat.text === "LEVEL: 5"));
});

test("Vampire Fang is a fast Secret lifesteal arc and pairs with Plastic Ghost", () => {
  const fang = weaponById("vampire-fang");
  assert.equal(fang.rarity, "Secret");
  assert.equal(fang.damage, 4.5);
  assert.equal(fang.cooldown, 0.18);
  assert.equal(fang.arc, Math.PI / 2);
  assert.equal(fang.lifesteal, 0.01);
  assert.ok(fang.cooldown < 0.2);
  assert.equal(weaponLevelWithLoadoutBonus("vampire-fang", 3, { melee: "vampire-fang", ranged: "plastic-ghost" }), 5);
  assert.equal(weaponLevelWithLoadoutBonus("plastic-ghost", 3, { melee: "vampire-fang", ranged: "plastic-ghost" }), 5);
});

test("all Secret weapons receive the global damage and attack-speed buff", () => {
  for (const weapon of WEAPON_DEFINITIONS.filter((entry) => entry.rarity === "Secret")) {
    const stats = weaponStatsAtLevel(weapon, 1);
    assert.equal(stats.damage, Number((weapon.damage * 1.2 * 1.1).toFixed(2)), `${weapon.name} damage should be buffed`);
    assert.equal(stats.cooldown, weapon.cooldown * 0.85, `${weapon.name} should attack faster`);
  }
  const developerWeapon = weaponById("ordinance-undefined");
  assert.equal(weaponStatsAtLevel(developerWeapon, 1).damage, Number((developerWeapon.damage * 1.1).toFixed(2)));
  assert.equal(weaponStatsAtLevel(developerWeapon, 1).cooldown, developerWeapon.cooldown);
});

test("all weapons get a modest damage buff except Rock Salt Blaster", () => {
  for (const weapon of WEAPON_DEFINITIONS) {
    const stats = weaponStatsAtLevel(weapon, 1);
    if (weapon.id === "rock-salt-blaster") assert.equal(stats.damage, weapon.damage);
    else {
      const secretMultiplier = weapon.rarity === "Secret" ? 1.2 : 1;
      assert.equal(stats.damage, Number((weapon.damage * secretMultiplier * 1.1).toFixed(2)));
    }
  }
});

test("Plastic Ghost lifesteal accumulates fractional healing across enemies", () => {
  const game = Object.create(Game.prototype);
  game.player = { health: 50, maxHealth: 100, lifestealAccumulator: 0 };
  game.bossSpawned = false;
  const makeEnemy = (health = 100) => ({
    health,
    isBoss: false,
    bossMinion: false,
    takeDamage(amount) { this.health -= amount; return false; },
  });
  game.damageEnemy(makeEnemy(), 3, 0.05);
  game.damageEnemy(makeEnemy(), 4, 0.05);
  game.damageEnemy(makeEnemy(), 7, 0.05);
  game.damageEnemy(makeEnemy(), 8, 0.05);
  assert.equal(game.player.health, 51);
  assert.ok(Math.abs(game.player.lifestealAccumulator - 0.1) < 1e-9);
  assert.ok(game.hitEffects.every((effect) => effect.particles.length === 8));
  assert.ok(game.hitEffects.every((effect) => effect.particles.every((particle) => particle.size >= 5)));
  assert.ok(game.hitEffects.every((effect) => effect.particles.every((particle) => particle.velocityY < 0)));
});

test("Rock Salt Blaster pellets speed up initially and slow near the end of flight", () => {
  const salt = weaponById("rock-salt-blaster");
  assert.equal(salt.endSpeedMultiplier, 0.1);
  assert.equal(salt.speedCurve, "fast-slowdown");
  assert.ok(salt.projectileSpeed > 800);
  assert.ok(salt.fanSpacing < 0.07);
  assert.ok(salt.spread < 0.025);

  const projectile = new Projectile({
    x: 0, y: 0, velocityX: 100, velocityY: 0, damage: 1, lifetime: 1,
    endSpeedMultiplier: salt.endSpeedMultiplier,
  });
  projectile.update(0.1);
  const earlyDistance = projectile.x;
  projectile.update(0.8);
  const beforeLateStep = projectile.x;
  projectile.update(0.05);
  const lateDistance = projectile.x - beforeLateStep;
  assert.ok(earlyDistance > 9);
  assert.ok(lateDistance < earlyDistance);
});

test("Ordinance Undefined keeps its reduced firing speed", () => {
  const ordinance = weaponById("ordinance-undefined");
  assert.equal(ordinance.damage, 8.88832);
  assert.equal(ordinance.cooldown, 0.5859375);
  assert.equal(ordinance.projectileCount, 2);
});

test("fire deals damage over time and freeze reports movement lock duration", () => {
  const enemy = {};
  applyFire(enemy, 5, 10);
  applyFreeze(enemy, 2);
  const firstTick = updateEnemyStatus(enemy, 1);
  assert.equal(firstTick.fireDamage, 5);
  assert.equal(firstTick.frozen, true);
  assert.equal(enemy.fireTime, 9);
  assert.equal(enemy.freezeTime, 1);
  const secondTick = updateEnemyStatus(enemy, 1);
  assert.equal(secondTick.fireDamage, 5);
  assert.equal(secondTick.frozen, true);
  assert.equal(updateEnemyStatus(enemy, 1).frozen, false);
});

test("fire damage is emitted as twice-per-second DPS pulses", () => {
  const enemy = {};
  applyFire(enemy, 5, 3);
  assert.equal(updateEnemyStatus(enemy, 0.25).fireDamage, 0);
  assert.equal(updateEnemyStatus(enemy, 0.25).fireDamage, 2.5);
  assert.equal(updateEnemyStatus(enemy, 0.49).fireDamage, 0);
  assert.equal(updateEnemyStatus(enemy, 0.01).fireDamage, 2.5);
});

test("accuracy reduces accumulated recoil and recoil recovers when firing stops", () => {
  const accuratePlayer = new Player();
  accuratePlayer.accuracy = 2;
  accuratePlayer.addRecoil(0.1);
  assert.equal(accuratePlayer.recoil, 0.05);
  accuratePlayer.updateRecoil(0.5, true);
  assert.equal(accuratePlayer.attackHoldTime, 0.5);
  assert.ok(accuratePlayer.recoil < 0.05);
  accuratePlayer.updateRecoil(1, false);
  assert.equal(accuratePlayer.recoil, 0);
  assert.equal(accuratePlayer.attackHoldTime, 0);
});

test("tennis ball redirects toward a new enemy with reduced damage", () => {
  const projectile = new Projectile({ x: 0, y: 0, velocityX: 100, velocityY: 0, damage: 20, lifetime: 2, bounces: 1 });
  const first = { x: 10, y: 0, active: true, targetable: true };
  const second = { x: 0, y: 50, active: true, targetable: true };
  projectile.hitEnemies.add(first);
  assert.equal(nearestBounceTarget(projectile, [first, second], first), second);
  projectile.redirectToward(second);
  assert.equal(projectile.bouncesRemaining, 0);
  assert.equal(projectile.damage, 14);
  assert.equal(projectile.velocityX, 0);
  assert.equal(projectile.velocityY, 100);
});

test("leaf-blower knockback moves normal enemies but not bosses", () => {
  const enemy = { x: 10, y: 0, radius: 2, isBoss: false };
  applyKnockback(enemy, 0, 0, 18, { width: 100, height: 100 });
  assert.equal(enemy.x, 28);
  const boss = { x: 10, y: 0, radius: 2, isBoss: true };
  applyKnockback(boss, 0, 0, 18, { width: 100, height: 100 });
  assert.equal(boss.x, 10);
});

test("stream, minigun, piercing, and explosive weapons expose their mechanics", () => {
  assert.ok(weaponById("garden-hose").cooldown < 0.1);
  assert.ok(weaponById("leaf-blower").knockback > 0);
  assert.ok(weaponById("storm-sprinkler").projectileSpeed > 1000);
  assert.ok(weaponById("acorn-slingshot").pierces > 0);
  assert.equal(weaponById("diet-cola-launcher").explosive, true);
  assert.equal(weaponById("diet-cola-launcher").damage, 50);
  assert.equal(weaponById("orbital-sprinkler").damage, 30);
});

test("gnome chases its target and reports a defeat once", () => {
  const gnome = new Gnome({
    x: 100,
    y: 200,
    health: 50,
    speed: 80,
    damage: 8,
    coinValue: 3,
    xpValue: 12,
  });

  gnome.update(0.5, { x: 100, y: 100 });
  assert.equal(gnome.y, 160);
  assert.equal(gnome.takeDamage(20), false);
  assert.equal(gnome.health, 30);
  assert.equal(gnome.takeDamage(30), true);
  assert.equal(gnome.takeDamage(1), false);
});

test("player contact damage respects temporary invulnerability", () => {
  const player = new Player();
  assert.equal(player.takeDamage(8), true);
  assert.equal(player.health, 92);
  assert.equal(player.takeDamage(8), false);
  assert.equal(player.health, 92);

  player.update(0.7, { x: 0, y: 0 }, { x: player.x + 1, y: player.y });
  assert.equal(player.takeDamage(8), true);
  assert.equal(player.health, 84);
});

test("contact damage adds damage from every touching enemy", () => {
  assert.equal(totalContactDamage([{ damage: 6 }]), 6);
  assert.equal(totalContactDamage([{ damage: 6 }, { damage: 6 }]), 12);
  assert.equal(totalContactDamage([{ damage: 6 }, { damage: 6 }, { damage: 6 }]), 18);
  assert.equal(totalContactDamage([{ damage: 50 }, { damage: undefined }]), 50);
});

test("invalid contact damage cannot make player health NaN", () => {
  const player = new Player();
  assert.equal(player.takeDamage(Number.NaN), false);
  assert.equal(player.health, player.maxHealth);
  player.health = Number.NaN;
  assert.equal(player.takeDamage(50), true);
  assert.equal(player.health, player.maxHealth - 50);
  assert.equal(Number.isNaN(player.health), false);
});

test("player damage creates a red floating damage number", () => {
  const game = Object.create(Game.prototype);
  game.random = () => 0.5;
  game.floatingDamageNumbers = [];
  game.player = {
    x: 100, y: 120, radius: 18, health: 80, shield: 0,
    takeDamage(amount) { this.health -= amount; return true; },
  };
  assert.equal(game.damagePlayer(12), true);
  assert.equal(game.floatingDamageNumbers.length, 1);
  assert.equal(game.floatingDamageNumbers[0].text, "-12");
  assert.equal(game.floatingDamageNumbers[0].color, "#ff4b45");
});
