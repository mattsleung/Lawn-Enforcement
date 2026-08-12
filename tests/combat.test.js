import test from "node:test";
import assert from "node:assert/strict";

import { isEnemyHitByMelee, isWithinMeleeArc, RARITY_ORDER, WEAPON_DEFINITIONS, WEAPONS, WEAPONS_SORTED_BY_RARITY, weaponById, weaponForSlot, weaponLevelWithLoadoutBonus, weaponStatsAtLevel } from "../src/config/weapons.js";
import { Gnome } from "../src/entities/gnome.js";
import { Player } from "../src/entities/player.js";
import { Projectile } from "../src/entities/projectile.js";
import { applyFire, applyFreeze, applyKnockback, nearestBounceTarget, totalContactDamage, updateEnemyStatus } from "../src/systems/combat.js";

test("weapon slots resolve to melee and ranged loadout entries", () => {
  assert.equal(weaponForSlot(1), WEAPONS.melee);
  assert.equal(weaponForSlot(2), WEAPONS.ranged);
});

test("every permanent weapon level improves damage and attack speed", () => {
  for (const weapon of WEAPON_DEFINITIONS) {
    let previous = weaponStatsAtLevel(weapon, 1);
    for (let level = 2; level <= 10; level += 1) {
      const current = weaponStatsAtLevel(weapon, level);
      assert.ok(current.damage > previous.damage);
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
  assert.equal(WEAPON_DEFINITIONS.filter((weapon) => weapon.slot === "melee").length, 6);
  assert.equal(WEAPON_DEFINITIONS.filter((weapon) => weapon.slot === "ranged").length, 10);
  for (const weapon of WEAPON_DEFINITIONS) {
    assert.ok(weapon.description.length > 10);
    assert.ok(weapon.levelTenFeature.length > 10);
  }
});

test("arsenal presentation is sorted from Common through Secret", () => {
  const rarityRanks = WEAPONS_SORTED_BY_RARITY.map((weapon) => RARITY_ORDER.indexOf(weapon.rarity));
  assert.deepEqual(rarityRanks, [...rarityRanks].sort((left, right) => left - right));
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
    "hedge-clippers": 52,
    "garden-shovel": 72,
    "golden-rake": 64,
    "turbo-mower": 30,
  };
  for (const [weaponId, originalDamage] of Object.entries(originalMeleeDamage)) {
    assert.equal(weaponById(weaponId).damage, Number((originalDamage * 0.7).toFixed(1)));
  }
  assert.equal(weaponById("leaf-blower").damage, 4);
  assert.equal(weaponById("storm-sprinkler").damage, 6);
});

test("Ordinance Undefined damage is halved after its earlier reduction", () => {
  assert.equal(weaponById("ordinance-undefined").damage, 21.7 / 2);
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

test("Bowling Ball is a slow medium-range Rare projectile with one pierce", () => {
  const bowlingBall = weaponById("bowling-ball");
  const leafBlower = weaponById("leaf-blower");
  assert.equal(bowlingBall.rarity, "Rare");
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

test("projectiles support fire and freeze payloads while only the flamethrower uses fire", () => {
  const projectile = new Projectile({
    x: 0, y: 0, velocityX: 1, velocityY: 0, damage: 1, lifetime: 1,
    fireDamagePerSecond: 5, fireDuration: 10, freezeDuration: 2,
  });
  assert.equal(projectile.fireDamagePerSecond, 5);
  assert.equal(projectile.fireDuration, 10);
  assert.equal(projectile.fireMaxStacks, 1);
  assert.equal(projectile.freezeDuration, 2);
  for (const weapon of WEAPON_DEFINITIONS.filter((entry) => entry.slot === "ranged")) {
    assert.equal(weapon.fireDuration > 0, weapon.id === "backyard-flamethrower");
    assert.equal(weapon.freezeDuration, 0, `${weapon.id} does not use freeze yet`);
  }
});

test("Backyard Flamethrower has short range and at most two burn stacks", () => {
  const flamethrower = weaponById("backyard-flamethrower");
  assert.equal(flamethrower.rarity, "Mythical");
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
  assert.equal(racket.shape, "arc");
  assert.equal(weaponLevelWithLoadoutBonus(racket.id, 3, { melee: racket.id, ranged: balls.id }), 4);
  assert.equal(weaponLevelWithLoadoutBonus(balls.id, 4, { melee: racket.id, ranged: balls.id }), 5);
  assert.equal(weaponLevelWithLoadoutBonus(balls.id, 4, { melee: "weedwacker-9000", ranged: balls.id }), 4);
});

test("Ordinance Undefined fires at half its previous attack speed", () => {
  assert.equal(weaponById("ordinance-undefined").cooldown, 0.24);
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
