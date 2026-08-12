import { Camera } from "./camera.js";
import { Input } from "./input.js";
import { Player } from "../entities/player.js";
import { Gnome } from "../entities/gnome.js";
import { Gopher } from "../entities/gopher.js";
import { CommonWeed } from "../entities/common-weed.js";
import { Squirrel } from "../entities/squirrel.js";
import { AcornSquirrel } from "../entities/acorn-squirrel.js";
import { Goose } from "../entities/goose.js";
import { Projectile } from "../entities/projectile.js";
import { AcornProjectile } from "../entities/acorn-projectile.js";
import { Pickup } from "../entities/pickup.js";
import { Boss } from "../entities/boss.js";
import { DandelionBoss } from "../entities/dandelion-boss.js";
import { GroundskeeperBoss } from "../entities/groundskeeper-boss.js";
import { PondfatherBoss } from "../entities/pondfather-boss.js";
import { SporeProjectile } from "../entities/spore-projectile.js";
import { GrassClipping } from "../entities/grass-clipping.js";
import { ThrownGnome } from "../entities/thrown-gnome.js";
import { COLORS } from "../config/game-config.js";
import { FIRST_MAP, MAP_SLOTS, mapById } from "../config/map-config.js";
import { ENEMY_GLOSSARY } from "../config/glossary-config.js";
import { CHARACTER_STAT_COSTS, CHEST_COST, PERMANENT_WEAPONS, weaponMaxLevelForMaps, weaponUpgradeCost } from "../config/economy-config.js";
import { applyRunWeaponBonuses, isEnemyHitByMelee, WEAPON_DEFINITIONS, WEAPONS, WEAPONS_SORTED_BY_RARITY, weaponById, weaponForSlot, weaponLevelWithLoadoutBonus, weaponStatsAtLevel, weaponsForSlot } from "../config/weapons.js";
import { applyFire, applyFreeze, applyKnockback, nearestBounceTarget, totalContactDamage, updateEnemyStatus } from "../systems/combat.js";
import { applyRunUpgrade, chooseRunUpgrades, loadProgress, REPEATABLE_GOLD_UPGRADES, saveProgress, xpRequiredForLevel } from "../systems/progression.js";
import { buyWeapon, dailyDealForDate, openChest, upgradeCharacterStat, upgradeWeapon } from "../systems/economy.js";

const FIXED_STEP = 1 / 60;
const MAX_FRAME_TIME = 0.1;
const MAX_ENEMIES = 100;
const GNOME_HEALTH = 54;

export class Game {
  constructor(canvas, debugOutput) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.debugOutput = debugOutput;
    this.input = new Input(canvas);
    this.random = Math.random;
    this.player = new Player();
    this.camera = new Camera(window.innerWidth, window.innerHeight, FIRST_MAP.world.width, FIRST_MAP.world.height);
    this.debugVisible = false;
    this.accumulator = 0;
    this.previousTime = 0;
    this.frames = 0;
    this.fps = 0;
    this.fpsElapsed = 0;
    const savedProgress = loadProgress(window.localStorage);
    this.progress = savedProgress;
    this.input.setKeybinds(savedProgress.keybinds);
    this.bankCoins = savedProgress.coins;
    this.unlockedMaps = new Set(savedProgress.unlockedMaps);
    this.selectedMapId = "backyard";
    this.currentMap = FIRST_MAP;
    this.world = FIRST_MAP.world;
    this.menuMessage = "";
    this.permanentUpgradeCategory = null;
    this.glossaryTab = "bestiary";
    this.glossaryScroll = 0;
    this.mapSelectionScroll = 0;
    this.weaponSelectionScroll = { melee: 0, ranged: 0 };
    this.arsenalScroll = { melee: 0, ranged: 0 };
    this.uiHitTargets = [];

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    window.addEventListener("resize", this.resize);
    this.resize();
    this.resetRun();
    this.screenState = savedProgress.settings.tutorialSeen ? "menu" : "tutorial";
  }

  resetRun() {
    this.currentMap = mapById(this.selectedMapId);
    this.world = this.currentMap.world;
    this.camera.setWorldSize(this.world.width, this.world.height);
    this.player = new Player();
    this.player.x = this.world.width / 2;
    this.player.y = this.world.height / 2;
    this.applyPermanentProgression();
    this.enemies = [];
    this.projectiles = [];
    this.pickups = [];
    this.syrupSplats = [];
    this.explosions = [];
    this.abilityProjectiles = [];
    this.thrownGnomes = [];
    this.bossProjectiles = [];
    this.activeObstacles = (this.currentMap.obstacles ?? []).map((obstacle) => ({ ...obstacle }));
    this.weaponSlot = 1;
    this.attackCooldown = 0;
    this.meleePulse = 0;
    this.meleeEffectWeapon = null;
    this.runTime = 0;
    this.runCoins = 0;
    this.runXp = 0;
    this.runLevel = 1;
    this.levelXp = 0;
    this.xpToNextLevel = xpRequiredForLevel(this.runLevel);
    this.appliedUpgrades = [];
    this.appliedUpgradeIds = new Set();
    this.upgradeChoices = [];
    this.syrupTimer = 0;
    this.passiveCooldowns = { mower: 5, battery: 5, freeze: 5, scarecrow: 5 };
    this.boss = null;
    this.bossSpawned = false;
    this.bossIndex = 0;
    this.bossNextSpawnTimer = null;
    this.firstBossDefeated = false;
    this.bossIntroTime = 0;
    this.victoryReward = 0;
    this.spawnTimer = 0.8;
    this.screenState = "running";
    this.runRewardsBanked = false;
    this.input.pointer.down = false;
    this.input.consumeAttackRequest();
    this.camera.follow(this.player);

    for (let index = 0; index < 3; index += 1) {
      this.spawnNormalEnemy(index / 3 * Math.PI * 2);
    }
  }

  start() {
    requestAnimationFrame(this.frame);
  }

  resize() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    this.canvas.width = Math.round(width * pixelRatio);
    this.canvas.height = Math.round(height * pixelRatio);
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.context.imageSmoothingEnabled = false;
    this.camera.resize(width, height);
    this.camera.follow(this.player);
  }

  frame(timestamp) {
    const time = timestamp / 1000;
    const elapsed = this.previousTime === 0 ? 0 : Math.min(time - this.previousTime, MAX_FRAME_TIME);
    this.previousTime = time;
    this.accumulator += elapsed;
    this.updateFps(elapsed);

    while (this.accumulator >= FIXED_STEP) {
      this.update(FIXED_STEP);
      this.accumulator -= FIXED_STEP;
    }

    this.render();
    requestAnimationFrame(this.frame);
  }

  update(deltaTime) {
    const bossSpawnRequested = this.input.consumeBossSpawnRequest();
    if (this.input.consumeDebugToggle()) {
      this.debugVisible = !this.debugVisible;
      this.debugOutput.classList.toggle("is-visible", this.debugVisible);
    }

    if (this.screenState === "tutorial") {
      const uiAction = this.consumeUiAction();
      if (this.input.consumeConfirmRequest() || uiAction === "continue") {
        this.progress.settings.tutorialSeen = true;
        this.savePermanentProgress();
        this.screenState = "menu";
      }
      return;
    }

    if (this.screenState === "menu") {
      const uiAction = this.consumeUiAction();
      const menuAction = uiAction?.type === "menu" ? uiAction.value : this.input.consumeMenuAction();
      if (menuAction === "shop") {
        this.screenState = "shop";
        this.input.consumeUpgradeChoice();
        return;
      }
      if (menuAction === "upgrades") {
        this.screenState = "permanent-upgrades";
        this.permanentUpgradeCategory = null;
        this.input.consumeUpgradeChoice();
        return;
      }
      if (menuAction === "settings") {
        this.screenState = "settings";
        this.input.consumeUpgradeChoice();
        return;
      }
      if (menuAction === "glossary") {
        this.screenState = "glossary";
        this.glossaryTab = "bestiary";
        this.input.consumeUpgradeChoice();
        return;
      }
      this.input.consumeWeaponSlot();
      this.input.consumeUpgradeChoice();
      if (this.input.consumeConfirmRequest() || uiAction === "start") {
        this.screenState = "map-selection";
        this.input.consumeUpgradeChoice();
      }
      this.updateDebugOutput();
      return;
    }

    if (this.screenState === "map-selection") {
      const uiAction = this.consumeUiAction();
      if (this.input.consumePauseRequest() || uiAction === "back") {
        this.screenState = "menu";
        return;
      }
      const scrollDirection = uiAction?.type === "map-scroll"
        ? uiAction.value
        : this.input.consumeScrollRequest();
      if (scrollDirection) {
        const visibleCount = Math.max(1, Math.floor((this.camera.viewHeight / 2 - 20) / 62));
        const maxOffset = Math.max(0, MAP_SLOTS.length - visibleCount);
        this.mapSelectionScroll = clamp(this.mapSelectionScroll + scrollDirection * 3, 0, maxOffset);
      }
      const keyboardChoice = this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      const mapId = uiAction?.type === "map"
        ? uiAction.value
        : MAP_SLOTS[keyboardChoice - 1]?.id;
      if (mapId && this.unlockedMaps.has(mapId)) {
        this.selectedMapId = mapId;
        this.screenState = "melee-selection";
      }
      return;
    }

    if (this.screenState === "melee-selection" || this.screenState === "ranged-selection") {
      if (this.input.consumePauseRequest()) {
        this.screenState = "menu";
        return;
      }
      const slot = this.screenState === "melee-selection" ? "melee" : "ranged";
      const weapons = this.ownedWeaponsForSlot(slot);
      const uiAction = this.consumeUiAction();
      if (uiAction === "back") {
        this.screenState = slot === "ranged" ? "melee-selection" : "menu";
        return;
      }
      const scrollDirection = uiAction?.type === "weapon-scroll"
        ? uiAction.value
        : this.input.consumeScrollRequest();
      if (scrollDirection) {
        const visibleCount = Math.min(5, weapons.length);
        const maxOffset = Math.max(0, weapons.length - visibleCount);
        this.weaponSelectionScroll[slot] = clamp(this.weaponSelectionScroll[slot] + scrollDirection * 3, 0, maxOffset);
      }
      const choice = uiAction?.type === "choice" ? uiAction.value : this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      if (choice !== null && weapons[choice - 1]) this.progress.equippedWeapons[slot] = weapons[choice - 1].id;
      if (this.input.consumeConfirmRequest() || uiAction === "confirm") {
        if (slot === "melee") this.screenState = "ranged-selection";
        else {
          this.savePermanentProgress();
          this.resetRun();
        }
      }
      return;
    }

    if (this.screenState === "shop") {
      if (this.input.consumePauseRequest()) {
        this.screenState = "menu";
      }
      const uiAction = this.consumeUiAction();
      if (uiAction === "back") {
        this.screenState = "menu";
        return;
      }
      const choice = uiAction?.type === "choice" ? uiAction.value : this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      if (choice !== null) this.handleShopChoice(choice);
      this.updateDebugOutput();
      return;
    }

    if (this.screenState === "permanent-upgrades") {
      if (this.input.consumePauseRequest()) {
        if (this.permanentUpgradeCategory) this.permanentUpgradeCategory = null;
        else this.screenState = "menu";
      }
      const uiAction = this.consumeUiAction();
      if (uiAction === "back") {
        if (this.permanentUpgradeCategory) this.permanentUpgradeCategory = null;
        else this.screenState = "menu";
        return;
      }
      if (this.permanentUpgradeCategory) {
        const scrollDirection = uiAction?.type === "arsenal-scroll" ? uiAction.value : this.input.consumeScrollRequest();
        if (scrollDirection) {
          const weapons = this.ownedWeaponsForSlot(this.permanentUpgradeCategory);
          const visibleCount = Math.min(5, weapons.length);
          const maxOffset = Math.max(0, weapons.length - visibleCount);
          this.arsenalScroll[this.permanentUpgradeCategory] = clamp(this.arsenalScroll[this.permanentUpgradeCategory] + scrollDirection * 3, 0, maxOffset);
        }
      }
      const choice = uiAction?.type === "choice" ? uiAction.value : this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      if (choice !== null) this.handlePermanentUpgradeChoice(choice);
      this.updateDebugOutput();
      return;
    }

    if (this.screenState === "settings") {
      const completedRebind = this.input.consumeCompletedRebind();
      if (completedRebind) {
        this.progress.keybinds[completedRebind.action] = completedRebind.code;
        this.menuMessage = `${completedRebind.action} set to ${formatKeyCode(completedRebind.code)}`;
        this.savePermanentProgress();
      }
      if (!this.input.rebindingAction && this.input.consumePauseRequest()) this.screenState = "menu";
      const uiAction = this.consumeUiAction();
      if (uiAction === "back" && !this.input.rebindingAction) {
        this.screenState = "menu";
        return;
      }
      const choice = uiAction?.type === "choice" ? uiAction.value : this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      if (choice !== null && !this.input.rebindingAction) this.handleSettingsChoice(choice);
      return;
    }

    if (this.screenState === "glossary") {
      if (this.input.consumePauseRequest()) {
        this.screenState = "menu";
        return;
      }
      const uiAction = this.consumeUiAction();
      if (uiAction === "back") {
        this.screenState = "menu";
      } else if (uiAction?.type === "glossary-tab") {
        this.glossaryTab = uiAction.value;
        this.glossaryScroll = 0;
      } else if (uiAction?.type === "glossary-scroll") {
        this.glossaryScroll = clamp(this.glossaryScroll + uiAction.value * 3, 0, this.glossaryMaxScroll(this.camera.viewWidth, this.camera.viewHeight));
      }
      if (!uiAction || (uiAction?.type !== "glossary-scroll" && uiAction !== "back")) {
        const scrollDirection = this.input.consumeScrollRequest();
        if (scrollDirection) this.glossaryScroll = clamp(this.glossaryScroll + scrollDirection * 3, 0, this.glossaryMaxScroll(this.camera.viewWidth, this.camera.viewHeight));
      }
      this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      return;
    }

    if (this.screenState === "defeat" || this.screenState === "victory") {
      const uiAction = this.consumeUiAction();
      if (this.input.consumeRestartRequest() || uiAction === "retry") {
        this.resetRun();
      } else if (this.input.consumeConfirmRequest() || uiAction === "menu") {
        this.screenState = "menu";
      }
      this.updateDebugOutput();
      return;
    }

    if (this.screenState === "paused") {
      if (this.input.consumePauseRequest() || this.consumeUiAction() === "resume") {
        this.screenState = "running";
      }
      this.updateDebugOutput();
      return;
    }

    if (this.screenState === "upgrade") {
      const uiAction = this.consumeUiAction();
      const choice = uiAction?.type === "choice" ? uiAction.value : this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      if (choice !== null) {
        this.selectUpgrade(choice - 1);
      }
      this.updateDebugOutput();
      return;
    }

    if (this.input.consumePauseRequest()) {
      this.screenState = "paused";
      this.input.pointer.down = false;
      this.updateDebugOutput();
      return;
    }

    this.input.consumeUpgradeChoice();
    this.input.consumeMenuAction();
    this.input.consumeClickRequest();

    const requestedSlot = this.input.consumeWeaponSlot();
    if (requestedSlot !== null) {
      this.weaponSlot = requestedSlot;
    }

    if (bossSpawnRequested && !this.bossSpawned) this.spawnBoss();

    deltaTime = this.applyBossIntroSlowdown(deltaTime);

    let aimPoint = this.camera.screenToWorld(this.input.pointer);
    this.player.update(deltaTime, this.input.movementVector(), aimPoint, this.world, this.activeObstacles);
    this.camera.follow(this.player);
    aimPoint = this.camera.screenToWorld(this.input.pointer);
    this.player.updateRecoil(deltaTime, this.input.pointer.down);

    this.attackCooldown = Math.max(0, this.attackCooldown - deltaTime);
    this.meleePulse = Math.max(0, this.meleePulse - deltaTime);
    this.runTime += deltaTime;
    if (!this.bossSpawned && this.bossNextSpawnTimer !== null) {
      this.bossNextSpawnTimer -= deltaTime;
      if (this.bossNextSpawnTimer <= 0) this.spawnBoss();
    } else if (!this.bossSpawned && this.runTime >= this.currentMap.bossSpawnTime) {
      this.spawnBoss();
    }
    this.spawnTimer -= deltaTime;
    if (!this.bossSpawned && this.spawnTimer <= 0 && this.enemies.length < MAX_ENEMIES) {
      const burstSize = 1 + Math.floor(this.runTime / 45);
      const availableSlots = MAX_ENEMIES - this.enemies.length;
      for (let index = 0; index < Math.min(burstSize, availableSlots); index += 1) {
        this.spawnNormalEnemy();
      }
      this.spawnTimer = Math.max(0.6, 2.25 - this.runTime * 0.018) * (this.currentMap.normalEnemyType === "park" ? 1.3 : this.currentMap.normalEnemyType === "lake" ? 1.5 : 1);
    }

    if (this.player.syrupTrail && this.player.isMoving) {
      this.syrupTimer -= deltaTime;
      if (this.syrupTimer <= 0) {
        this.syrupSplats.push({ x: this.player.x, y: this.player.y + 14, lifetime: 7 });
        this.syrupTimer = 0.7;
      }
    }

    const attackRequested = this.input.consumeAttackRequest();
    if ((this.input.pointer.down || attackRequested) && this.attackCooldown <= 0) {
      this.attack(aimPoint);
    }
    this.updatePassiveAbilities(deltaTime);

    for (const projectile of this.projectiles) {
      projectile.update(deltaTime);
      if (!projectile.active) {
        continue;
      }
      for (const enemy of this.enemies) {
        if (enemy.active && enemy.targetable !== false && !projectile.hitEnemies.has(enemy) && circlesOverlap(projectile, enemy)) {
          projectile.hitEnemies.add(enemy);
          this.damageEnemy(enemy, projectile.damage);
          if (projectile.slowDuration > 0) enemy.slowTime = Math.max(enemy.slowTime ?? 0, projectile.slowDuration);
          if (projectile.fireDuration > 0) applyFire(enemy, projectile.fireDamagePerSecond, projectile.fireDuration, projectile.fireMaxStacks);
          if (projectile.freezeDuration > 0) applyFreeze(enemy, projectile.freezeDuration);
          applyKnockback(enemy, projectile.x - projectile.velocityX * 0.02, projectile.y - projectile.velocityY * 0.02, projectile.knockback, this.world);
          if (projectile.explosive) {
            const blastRadius = projectile.splashRadius || 72;
            this.explosions.push({ x: enemy.x, y: enemy.y, lifetime: 0.28, radius: blastRadius, color: projectile.color });
            for (const nearbyEnemy of this.enemies) {
              if (nearbyEnemy.active && nearbyEnemy.targetable !== false
                && Math.hypot(nearbyEnemy.x - enemy.x, nearbyEnemy.y - enemy.y) <= blastRadius) {
                if (projectile.slowDuration > 0) nearbyEnemy.slowTime = Math.max(nearbyEnemy.slowTime ?? 0, projectile.slowDuration);
                if (projectile.fireDuration > 0) applyFire(nearbyEnemy, projectile.fireDamagePerSecond, projectile.fireDuration, projectile.fireMaxStacks);
                if (projectile.freezeDuration > 0) applyFreeze(nearbyEnemy, projectile.freezeDuration);
                if (nearbyEnemy !== enemy) this.damageEnemy(nearbyEnemy, Math.round(projectile.damage * projectile.splashDamageMultiplier));
              }
            }
          }
          const bounceTarget = projectile.bouncesRemaining > 0
            ? nearestBounceTarget(projectile, this.enemies, enemy)
            : null;
          if (bounceTarget) projectile.redirectToward(bounceTarget);
          else if (projectile.piercesRemaining > 0) projectile.piercesRemaining -= 1;
          else projectile.active = false;
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => projectile.active);
    for (const explosion of this.explosions) explosion.lifetime -= deltaTime;
    this.explosions = this.explosions.filter((explosion) => explosion.lifetime > 0);

    for (const pickup of this.pickups) {
      pickup.update(deltaTime, this.player);
      if (!pickup.active) this.collectPickup(pickup);
    }
    this.pickups = this.pickups.filter((pickup) => pickup.active);

    for (const splat of this.syrupSplats) splat.lifetime -= deltaTime;
    this.syrupSplats = this.syrupSplats.filter((splat) => splat.lifetime > 0);

    for (const thrownGnome of this.thrownGnomes) {
      thrownGnome.update(deltaTime);
      if (thrownGnome.arrived) this.spawnLandedEnemy(thrownGnome.enemyType, thrownGnome.x, thrownGnome.y, true);
    }
    this.thrownGnomes = this.thrownGnomes.filter((thrownGnome) => !thrownGnome.arrived);

    for (const spore of this.bossProjectiles) {
      spore.update(deltaTime, this.world);
      if (spore.active && circlesOverlap(spore, this.player)) {
        this.player.takeDamage(spore.damage);
        spore.hitPlayer();
      }
      if (!spore.active && spore.spawnsWeed && !spore.spawnedWeed) {
        spore.spawnedWeed = true;
        this.spawnCommonWeedAt(spore.x, spore.y);
      }
    }
    this.bossProjectiles = this.bossProjectiles.filter((spore) => spore.active);

    const touchingEnemies = [];
    for (const enemy of this.enemies) {
      const status = updateEnemyStatus(enemy, deltaTime);
      if (status.fireDamage > 0) this.damageEnemy(enemy, status.fireDamage);
      const bossEvents = status.frozen || !enemy.active ? {} : enemy.update(deltaTime, this.player, this.activeObstacles) ?? {};
      if (enemy.isBoss && bossEvents.summonGnomes) {
        this.summonBossGnomes(enemy);
      }
      if (enemy.isBoss && bossEvents.throwGnome) {
        this.thrownGnomes.push(new ThrownGnome({
          x: enemy.x,
          y: enemy.y,
          targetX: bossEvents.throwGnome.x,
          targetY: bossEvents.throwGnome.y,
          speed: bossEvents.throwGnome.speed,
          enemyType: this.currentMap.bossThrownEnemy,
        }));
      }
      if (bossEvents.throwAcorn) {
        const event = bossEvents.throwAcorn;
        const dx = event.x - enemy.x;
        const dy = event.y - enemy.y;
        const distance = Math.hypot(dx, dy) || 1;
        this.bossProjectiles.push(new AcornProjectile({
          x: enemy.x,
          y: enemy.y,
          velocityX: dx / distance * event.speed,
          velocityY: dy / distance * event.speed,
        }));
      }
      if (enemy.isBoss && bossEvents.throwMinions) {
        for (const thrown of bossEvents.throwMinions) {
          this.thrownGnomes.push(new ThrownGnome({
            x: enemy.x, y: enemy.y, targetX: thrown.x, targetY: thrown.y,
            speed: thrown.speed, enemyType: thrown.type,
          }));
        }
      }
      if (enemy.isBoss && bossEvents.fireSpores) this.fireDandelionSpores(enemy);
      if (enemy.isBoss && bossEvents.fireAimedSpore) this.fireDandelionAimedSpore(enemy);
      if (enemy.isBoss && bossEvents.divebomb) {
        this.player.takeDamage(50);
        const dx = this.player.x - enemy.waterX;
        const dy = this.player.y - enemy.waterY;
        const distance = Math.hypot(dx, dy) || 1;
        this.player.x = clamp(this.player.x + dx / distance * 120, this.player.radius, this.world.width - this.player.radius);
        this.player.y = clamp(this.player.y + dy / distance * 120, this.player.radius, this.world.height - this.player.radius);
      }
      if (bossEvents.copyWeed) this.spawnCommonWeedAt(bossEvents.copyWeed.x, bossEvents.copyWeed.y);
      resolveEnemyObstacles(enemy, this.activeObstacles);
      if (enemy.isBoss && bossEvents.fireClippings) this.fireGroundskeeperClippings(bossEvents.fireClippings);
      if (enemy.isBoss && bossEvents.crushObstacles?.length) {
        for (const obstacle of bossEvents.crushObstacles) {
          this.activeObstacles = this.activeObstacles.filter((entry) => entry !== obstacle);
          this.spawnParkEnemyAt(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, false, true);
          this.spawnParkEnemyAt(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, true, true);
        }
      }
      if (enemy.isBoss && bossEvents.spawnGeese) {
        for (let index = 0; index < 3; index += 1) this.spawnGoose(Math.PI * 2 * index / 3, true);
      }
      if (enemy.isBoss && bossEvents.spawnMinion) {
        const angle = Math.random() * Math.PI * 2;
        if (bossEvents.spawnMinion === "goose") this.spawnGoose(angle, true);
        else {
          const offset = 80 + Math.random() * 120;
          this.spawnParkEnemyAt(enemy.x + Math.cos(angle) * offset, enemy.y + Math.sin(angle) * offset, bossEvents.spawnMinion === "acorn-squirrel", true);
        }
      }
      if (enemy.isBoss && enemy.enemyType === "groundskeeper" && enemy.chargeTime > 0) {
        for (const minion of this.enemies) {
          if (minion !== enemy && minion.active && !minion.isBoss && circlesOverlap(enemy, minion)) {
            this.damageEnemy(minion, Number.POSITIVE_INFINITY);
          }
        }
      }
      if (this.syrupSplats.some((splat) => Math.hypot(enemy.x - splat.x, enemy.y - splat.y) <= 34)) {
        enemy.slowTime = Math.max(enemy.slowTime, 0.15);
      }
      if (enemy.active && enemy.targetable !== false && circlesOverlap(enemy, this.player)) {
        touchingEnemies.push(enemy);
      }
    }
    if (touchingEnemies.length > 0) {
      this.player.takeDamage(totalContactDamage(touchingEnemies));
    }
    this.enemies = this.enemies.filter((enemy) => enemy.active);

    if (this.player.health <= 0 && this.screenState === "running") {
      this.finishRun();
    }

    this.updateDebugOutput();
  }

  updateDebugOutput() {
    if (!this.debugVisible) {
      return;
    }

    this.debugOutput.value = [
      `FPS      ${this.fps.toString().padStart(3, " ")}`,
      `PLAYER   ${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)}`,
      `HEALTH   ${this.player.health} / ${this.player.maxHealth}`,
      `TIME     ${formatTime(this.runTime)}`,
      `WEAPON   ${weaponForSlot(this.weaponSlot, this.progress.equippedWeapons).name}`,
      `COINS    ${this.runCoins}`,
      `XP       ${this.runXp}`,
      `LEVEL    ${this.runLevel} (${this.levelXp}/${this.xpToNextLevel})`,
      `ACCURACY ${this.player.accuracy.toFixed(2)}x · RECOIL ${(this.player.recoil * 100).toFixed(0)}%`,
      `STATE    ${this.screenState.toUpperCase()}`,
    ].join("\n");
  }

  applyPermanentProgression() {
    const stats = this.progress.characterStats;
    this.player.maxHealth = Math.round(this.player.maxHealth * (1 + stats.health * 0.1));
    this.player.health = this.player.maxHealth;
    this.player.roundStartingMaxHealth = this.player.maxHealth;
    this.player.maxHealthCap = this.player.maxHealth * 2;
    this.player.damageMultiplier *= 1 + stats.damage * 0.08;
    this.player.speed *= 1 + stats.speed * 0.06;
    this.player.cooldownMultiplier *= Math.max(0.55, 1 - stats.attackSpeed * 0.06);
    this.player.accuracy *= 1 + stats.accuracy * 0.08;
    this.player.reducedMotion = this.progress.settings.reducedMotion;
  }

  ownedWeaponsForSlot(slot) {
    return weaponsForSlot(slot).filter((weapon) => this.progress.ownedWeapons.includes(weapon.id));
  }

  savePermanentProgress() {
    this.progress.coins = this.bankCoins;
    this.progress.unlockedMaps = [...this.unlockedMaps];
    saveProgress(window.localStorage, this.progress);
  }

  handleShopChoice(choice) {
    let success = false;
    let label = "Purchase unavailable";
    if (choice >= 1 && choice <= 3) {
      const id = ["tennis-balls", "hedge-clippers", "acorn-slingshot"][choice - 1];
      success = buyWeapon(this.progress, id);
      label = success ? `${weaponById(id).name} purchased` : "Cannot purchase weapon";
    } else if (choice === 4) {
      const id = "diet-cola-launcher";
      success = buyWeapon(this.progress, id);
      label = success ? `${weaponById(id).name} purchased` : "Cannot purchase Diet Cola Launcher";
    } else if (choice === 5) {
      const deal = dailyDealForDate(new Date().toISOString().slice(0, 10));
      success = buyWeapon(this.progress, deal.id, Math.floor(deal.price * 0.75));
      label = success ? `${deal.name} daily deal purchased` : "Cannot purchase daily deal";
    } else if (choice === 6) {
      this.openChestFromMenu();
      return;
    }
    this.bankCoins = this.progress.coins;
    this.menuMessage = label;
    if (success) this.savePermanentProgress();
  }

  handlePermanentUpgradeChoice(choice) {
    let success = false;
    let label = "Upgrade unavailable";
    if (this.permanentUpgradeCategory) {
      const weapons = this.ownedWeaponsForSlot(this.permanentUpgradeCategory);
      const weapon = weapons[choice - 1];
      if (!weapon) return;
      success = upgradeWeapon(this.progress, weapon.id);
      label = success ? `${weapon.name} upgraded to level ${this.progress.weaponLevels[weapon.id]}` : `${weapon.name} cannot be upgraded`;
    } else if (choice === 1 || choice === 2) {
      this.permanentUpgradeCategory = choice === 1 ? "melee" : "ranged";
      this.menuMessage = "Choose any owned weapon to upgrade";
      return;
    } else if (choice >= 3 && choice <= 7) {
      const stat = ["health", "damage", "speed", "attackSpeed", "accuracy"][choice - 3];
      success = upgradeCharacterStat(this.progress, stat, this.unlockedMaps.size * 5);
      label = success ? `${stat} upgraded` : "Cannot upgrade stat";
    }
    this.bankCoins = this.progress.coins;
    this.menuMessage = label;
    if (success) this.savePermanentProgress();
  }

  openChestFromMenu() {
    const result = openChest(this.progress);
    if (!result) {
      this.menuMessage = `Need ${CHEST_COST} coins for a chest`;
      return;
    }
    this.bankCoins = this.progress.coins;
    this.menuMessage = result.duplicate
      ? `${result.rarity} duplicate: +${result.coinsReturned} coins`
      : `${result.rarity}: ${result.weapon.name} unlocked`;
    this.savePermanentProgress();
  }

  handleSettingsChoice(choice) {
    if (choice >= 1 && choice <= 3) {
      const setting = ["sound", "screenShake", "reducedMotion"][choice - 1];
      this.progress.settings[setting] = !this.progress.settings[setting];
      this.menuMessage = `${setting}: ${this.progress.settings[setting] ? "ON" : "OFF"}`;
      this.savePermanentProgress();
    } else if (choice === 4 || choice === 5) {
      const action = choice === 4 ? "melee" : "ranged";
      this.input.beginRebind(action);
      this.menuMessage = `Press a key for ${action}`;
    }
  }

  spawnEnemy(forcedAngle = Math.random() * Math.PI * 2) {
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    const x = clamp(this.player.x + Math.cos(forcedAngle) * distance, 30, this.world.width - 30);
    const y = clamp(this.player.y + Math.sin(forcedAngle) * distance, 30, this.world.height - 30);
    const difficulty = 1 + this.runTime / 60;
    this.enemies.push(new Gnome({
      x,
      y,
      health: GNOME_HEALTH,
      speed: Math.min(145, 72 + this.runTime * 0.55),
      damage: 6,
      coinValue: 2 + Math.floor(difficulty),
      xpValue: 20,
    }));
  }

  spawnNormalEnemy(forcedAngle = Math.random() * Math.PI * 2) {
    if (this.currentMap.normalEnemyType === "lake" && this.firstBossDefeated) {
      if (Math.random() < 0.5) this.spawnGoose(forcedAngle);
      else this.spawnParkEnemy(forcedAngle);
      return;
    }
    if (this.currentMap.normalEnemyType === "lake") {
      this.spawnLakeEnemy(forcedAngle);
      return;
    }
    if (this.currentMap.normalEnemyType === "weed") {
      this.spawnCommonWeed(forcedAngle);
      return;
    }
    if (this.currentMap.normalEnemyType === "mixed"
      && this.runTime >= this.currentMap.gopherSpawnTime
      && Math.random() < this.currentMap.gopherSpawnChance) {
      this.spawnGopher(forcedAngle);
      return;
    }
    if (this.currentMap.normalEnemyType === "park") {
      this.spawnParkEnemy(forcedAngle);
      return;
    }
    this.spawnEnemy(forcedAngle);
  }

  spawnLakeEnemy(forcedAngle = Math.random() * Math.PI * 2) {
    if (Math.random() < this.currentMap.gopherSpawnChance) this.spawnGopher(forcedAngle);
    else this.spawnEnemy(forcedAngle);
  }

  spawnGoose(forcedAngle = Math.random() * Math.PI * 2, bossMinion = false) {
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    const goose = new Goose({
      x: clamp(this.player.x + Math.cos(forcedAngle) * distance, 30, this.world.width - 30),
      y: clamp(this.player.y + Math.sin(forcedAngle) * distance, 30, this.world.height - 30),
    });
    goose.bossMinion = bossMinion;
    this.enemies.push(goose);
  }

  spawnParkEnemy(forcedAngle = Math.random() * Math.PI * 2) {
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    const options = {
      x: clamp(this.player.x + Math.cos(forcedAngle) * distance, 30, this.world.width - 30),
      y: clamp(this.player.y + Math.sin(forcedAngle) * distance, 30, this.world.height - 30),
    };
    this.enemies.push(new (Math.random() < 0.35 ? AcornSquirrel : Squirrel)(options));
  }

  spawnParkEnemyAt(x, y, acorn = false, bossMinion = false) {
    if (this.enemies.length >= MAX_ENEMIES) return;
    const enemy = new (acorn ? AcornSquirrel : Squirrel)({ x, y });
    enemy.bossMinion = bossMinion;
    this.enemies.push(enemy);
  }

  spawnGopher(forcedAngle = Math.random() * Math.PI * 2) {
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    this.enemies.push(new Gopher({
      x: clamp(this.player.x + Math.cos(forcedAngle) * distance, 30, this.world.width - 30),
      y: clamp(this.player.y + Math.sin(forcedAngle) * distance, 30, this.world.height - 30),
    }));
  }

  spawnCommonWeed(forcedAngle = Math.random() * Math.PI * 2) {
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    this.spawnCommonWeedAt(
      this.player.x + Math.cos(forcedAngle) * distance,
      this.player.y + Math.sin(forcedAngle) * distance,
    );
  }

  spawnCommonWeedAt(x, y) {
    if (this.enemies.length >= MAX_ENEMIES) return;
    this.enemies.push(new CommonWeed({
      x: clamp(x, 24, this.world.width - 24),
      y: clamp(y, 24, this.world.height - 24),
    }));
  }

  spawnBoss() {
    this.bossSpawned = true;
    this.bossNextSpawnTimer = null;
    this.bossIntroTime = 1;
    const angle = -Math.PI / 2;
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.45;
    const bossConfig = this.currentMap.bosses?.[this.bossIndex] ?? this.currentMap.boss;
    const BossType = bossConfig.type === "dandelion"
      ? DandelionBoss
      : bossConfig.type === "groundskeeper" ? GroundskeeperBoss
        : bossConfig.type === "pondfather" ? PondfatherBoss : Boss;
    const pond = this.currentMap.obstacles?.find((obstacle) => obstacle.kind === "lake");
    this.boss = new BossType({
      x: bossConfig.type === "pondfather" && pond ? pond.x + pond.width / 2 : clamp(this.player.x + Math.cos(angle) * distance, 80, this.world.width - 80),
      y: bossConfig.type === "pondfather" && pond ? pond.y + pond.height / 2 : clamp(this.player.y + Math.sin(angle) * distance, 80, this.world.height - 80),
      config: bossConfig,
      world: this.world,
    });
    this.enemies.push(this.boss);
  }

  applyBossIntroSlowdown(deltaTime) {
    if (this.bossIntroTime <= 0) return deltaTime;
    this.bossIntroTime = Math.max(0, this.bossIntroTime - deltaTime);
    return deltaTime * 0.2;
  }

  fireDandelionSpores(boss) {
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      this.bossProjectiles.push(new SporeProjectile({
        x: boss.x,
        y: boss.y,
        velocityX: Math.cos(angle) * boss.sporeSpeed,
        velocityY: Math.sin(angle) * boss.sporeSpeed,
        damage: boss.sporeDamage,
        lifetime: boss.sporeLifetime,
      }));
    }
  }

  fireDandelionAimedSpore(boss) {
    const offsetX = this.player.x - boss.x;
    const offsetY = this.player.y - boss.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    this.bossProjectiles.push(new SporeProjectile({
      x: boss.x,
      y: boss.y,
      velocityX: offsetX / distance * boss.sporeSpeed,
      velocityY: offsetY / distance * boss.sporeSpeed,
      damage: boss.sporeDamage,
      lifetime: boss.sporeLifetime,
    }));
  }

  fireGroundskeeperClippings(event) {
    const base = Math.atan2(event.directionY, event.directionX);
    for (const offset of [-0.38, -0.19, 0, 0.19, 0.38]) {
      const angle = base + offset;
      this.bossProjectiles.push(new GrassClipping({
        x: event.x, y: event.y,
        velocityX: Math.cos(angle) * 300,
        velocityY: Math.sin(angle) * 300,
      }));
    }
  }

  summonBossGnomes(boss) {
    const distance = 84;
    const positions = [
      { x: boss.x, y: boss.y - distance },
      { x: boss.x + distance, y: boss.y },
      { x: boss.x, y: boss.y + distance },
      { x: boss.x - distance, y: boss.y },
    ];
    for (const position of positions) {
      if (this.enemies.length >= MAX_ENEMIES) break;
      this.enemies.push(new Gnome({
        x: clamp(position.x, 30, this.world.width - 30),
        y: clamp(position.y, 30, this.world.height - 30),
        health: GNOME_HEALTH,
        speed: 110,
        damage: 6,
        coinValue: 3,
        xpValue: 20,
        bossMinion: true,
      }));
    }
  }

  spawnLandedEnemy(enemyType, x, y, bossMinion = false) {
    if (this.enemies.length >= MAX_ENEMIES) return;
    if (enemyType === "gopher") {
      const gopher = new Gopher({ x, y, bossMinion });
      gopher.burrowed = false;
      gopher.burrowTime = 0;
      this.enemies.push(gopher);
      return;
    }
    if (enemyType === "goose") {
      const goose = new Goose({ x, y }); goose.bossMinion = bossMinion; this.enemies.push(goose); return;
    }
    if (enemyType === "squirrel" || enemyType === "acorn-squirrel") {
      this.spawnParkEnemyAt(x, y, enemyType === "acorn-squirrel", bossMinion); return;
    }
    this.enemies.push(new Gnome({
      x,
      y,
      health: GNOME_HEALTH,
      speed: 110,
      damage: 6,
      coinValue: 3,
      xpValue: 20,
      bossMinion,
    }));
  }

  damageEnemy(enemy, damage) {
    if (this.bossSpawned && this.boss?.active && !enemy.isBoss && !enemy.bossMinion) damage *= 3;
    if (enemy.takeDamage(damage)) {
      const enemyType = enemy.enemyType ?? (enemy.isBoss ? "king-gnomulus" : "gnome");
      if (enemyType in this.progress.defeatedEnemies) {
        this.progress.defeatedEnemies[enemyType] += 1;
      }
      if (enemy.isBoss) {
        if (this.currentMap.bosses && this.bossIndex < this.currentMap.bosses.length - 1) {
          this.bossIndex += 1;
          this.firstBossDefeated = true;
          this.bossSpawned = false;
          this.boss = null;
          this.bossNextSpawnTimer = 60;
        } else {
          this.finishVictory();
        }
        return;
      }
      const coinDropChance = enemy.coinDropChance ?? 1;
      if (coinDropChance >= 1 || (this.random ?? Math.random)() < coinDropChance) {
        for (let index = 0; index < enemy.coinValue; index += 1) {
          const offset = randomDropOffset();
          this.pickups.push(new Pickup({ x: enemy.x, y: enemy.y, type: "coin", ...offset }));
        }
      }
      const xpDropChance = enemy.xpDropChance ?? 1;
      if (xpDropChance >= 1 || (this.random ?? Math.random)() < xpDropChance) {
        for (let xp = 0; xp < enemy.xpValue; xp += 10) {
          const offset = randomDropOffset();
          this.pickups.push(new Pickup({ x: enemy.x, y: enemy.y, type: "xp", amount: 10, ...offset }));
        }
      }
    }
  }

  collectPickup(pickup) {
    if (pickup.type === "coin") {
      this.runCoins += 1;
      return;
    }
    this.runXp += pickup.amount;
    this.levelXp += pickup.amount;
    if (this.levelXp >= this.xpToNextLevel && this.screenState === "running") {
      this.levelXp -= this.xpToNextLevel;
      this.runLevel += 1;
      this.xpToNextLevel = xpRequiredForLevel(this.runLevel);
      this.upgradeChoices = chooseRunUpgrades(
        Math.random,
        3,
        this.appliedUpgradeIds,
        [this.progress.equippedWeapons.melee, this.progress.equippedWeapons.ranged],
      );
      this.screenState = "upgrade";
      this.input.pointer.down = false;
    }
  }

  selectUpgrade(index) {
    const upgrade = this.upgradeChoices[index];
    if (!upgrade || !applyRunUpgrade(this.player, upgrade.id)) {
      return;
    }
    this.appliedUpgrades.push(upgrade.name);
    if (upgrade.rarity === "Silver"
      || (upgrade.rarity === "Gold" && !REPEATABLE_GOLD_UPGRADES.has(upgrade.id))) {
      this.appliedUpgradeIds.add(upgrade.id);
    }
    this.screenState = "running";
  }

  finishRun() {
    if (!this.runRewardsBanked) {
      this.bankCoins += this.runCoins;
      this.savePermanentProgress();
      this.runRewardsBanked = true;
    }
    this.screenState = "defeat";
    this.input.pointer.down = false;
  }

  finishVictory() {
    if (!this.runRewardsBanked) {
      this.victoryReward = this.runCoins * 2 + this.currentMap.victoryCoinBonus;
      this.bankCoins += this.victoryReward;
      if (this.currentMap.unlocks) this.unlockedMaps.add(this.currentMap.unlocks);
      this.savePermanentProgress();
      this.runRewardsBanked = true;
    }
    this.screenState = "victory";
    this.input.pointer.down = false;
  }

  attack(aimPoint) {
    const slotName = this.weaponSlot === 1 ? "melee" : "ranged";
    const weaponId = this.progress.equippedWeapons[slotName];
    const baseWeapon = weaponById(weaponId) ?? weaponForSlot(this.weaponSlot);
    const effectiveLevel = weaponLevelWithLoadoutBonus(
      weaponId,
      this.progress.weaponLevels[weaponId],
      this.progress.equippedWeapons,
    );
    const weapon = applyRunWeaponBonuses(
      weaponStatsAtLevel(baseWeapon, effectiveLevel),
      this.player,
    );
    this.attackCooldown = weapon.cooldown * this.player.cooldownMultiplier;

    if (weapon.slot === "melee") {
      this.meleePulse = 0.16;
      this.meleeEffectWeapon = weapon;
      for (const enemy of this.enemies) {
        if (enemy.active && enemy.targetable !== false
          && isEnemyHitByMelee(this.player, enemy, weapon, this.player.meleeRangeMultiplier)) {
          this.damageEnemy(enemy, Math.round(weapon.damage * this.player.damageMultiplier));
          applyKnockback(enemy, this.player.x, this.player.y, weapon.knockback, this.world);
        }
      }
      return;
    }

    const offsetX = aimPoint.x - this.player.x;
    const offsetY = aimPoint.y - this.player.y;
    const holdMultiplier = 1 + Math.min(1, this.player.attackHoldTime * 0.35);
    const shotRecoil = (weapon.recoil + this.player.recoil) / this.player.accuracy;
    const bonusAppleProjectiles = weaponId === "apples" ? this.player.appleCount - 1 : 0;
    const projectileCount = weapon.projectileCount + bonusAppleProjectiles;
    for (let index = 0; index < projectileCount; index += 1) {
      const fanOffset = (index - (projectileCount - 1) / 2) * 0.14;
      const jitter = weapon.spread ? (Math.random() - 0.5) * weapon.spread : 0;
      const recoilOffset = (Math.random() - 0.5) * shotRecoil * 2;
      const angle = Math.atan2(offsetY, offsetX) + fanOffset + jitter + recoilOffset;
      const explosive = this.player.rangedExplosion || weapon.explosive;
      this.projectiles.push(new Projectile({
        x: this.player.x,
        y: this.player.y - 8,
        velocityX: Math.cos(angle) * weapon.projectileSpeed,
        velocityY: Math.sin(angle) * weapon.projectileSpeed,
        damage: Math.round(weapon.damage * this.player.damageMultiplier),
        lifetime: weapon.projectileLifetime,
        kind: weapon.projectileKind,
        color: weapon.color,
        radius: weapon.projectileRadius,
        explosive,
        splashRadius: explosive ? (weapon.splashRadius || 72) : 0,
        splashDamageMultiplier: weapon.splashDamageMultiplier,
        slowDuration: weapon.slowDuration,
        bounces: weapon.bounces,
        pierces: weapon.pierces,
        knockback: weapon.knockback,
        fireDamagePerSecond: weapon.fireDamagePerSecond,
        fireDuration: weapon.fireDuration,
        fireMaxStacks: weapon.fireMaxStacks,
        freezeDuration: weapon.freezeDuration,
      }));
    }
    this.player.addRecoil(weapon.recoil * holdMultiplier);
  }

  updatePassiveAbilities(deltaTime) {
    const target = nearestActiveEnemy(this.player, this.enemies);
    if (this.player.autonomousMower) {
      this.passiveCooldowns.mower -= deltaTime;
      if (this.passiveCooldowns.mower <= 0 && target) {
        this.abilityProjectiles.push(makeAbilityProjectile("mower", this.player, target, 440));
        this.passiveCooldowns.mower = 5;
      }
    }
    if (this.player.batteryPack) {
      this.passiveCooldowns.battery -= deltaTime;
      if (this.passiveCooldowns.battery <= 0 && target) {
        this.abilityProjectiles.push(makeAbilityProjectile("battery", this.player, target, 520));
        this.passiveCooldowns.battery = 5;
      }
    }
    if (this.player.freezePulse) {
      this.passiveCooldowns.freeze -= deltaTime;
      if (this.passiveCooldowns.freeze <= 0) {
        for (const enemy of this.enemies) {
          if (enemy.active && enemy.targetable !== false && distanceBetween(enemy, this.player) <= 190) applyFreeze(enemy, 2);
        }
        this.explosions.push({ x: this.player.x, y: this.player.y, lifetime: 0.42, maxLifetime: 0.42, radius: 190, color: "#82dcf2" });
        this.passiveCooldowns.freeze = 5;
      }
    }
    if (this.player.scarecrowPulse) {
      this.passiveCooldowns.scarecrow -= deltaTime;
      if (this.passiveCooldowns.scarecrow <= 0) {
        for (const enemy of this.enemies) {
          if (enemy.active && enemy.targetable !== false && distanceBetween(enemy, this.player) <= 170) {
            applyKnockback(enemy, this.player.x, this.player.y, 24, this.world);
          }
        }
        this.explosions.push({ x: this.player.x, y: this.player.y, lifetime: 0.35, maxLifetime: 0.35, radius: 170, color: "#e5ca58" });
        this.passiveCooldowns.scarecrow = 5;
      }
    }

    for (const ability of this.abilityProjectiles) {
      const offsetX = ability.targetX - ability.x;
      const offsetY = ability.targetY - ability.y;
      const distance = Math.hypot(offsetX, offsetY) || 1;
      const travel = ability.speed * deltaTime;
      if (distance <= travel) {
        ability.x = ability.targetX;
        ability.y = ability.targetY;
        ability.active = false;
        this.detonateAbility(ability);
      } else {
        ability.x += offsetX / distance * travel;
        ability.y += offsetY / distance * travel;
      }
    }
    this.abilityProjectiles = this.abilityProjectiles.filter((ability) => ability.active);
  }

  detonateAbility(ability) {
    const radius = ability.kind === "mower" ? 150 : 100;
    const color = ability.kind === "mower" ? "#d8cf65" : "#ef753d";
    this.explosions.push({ x: ability.x, y: ability.y, lifetime: 0.36, maxLifetime: 0.36, radius, color });
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.targetable === false || distanceBetween(enemy, ability) > radius) continue;
      if (ability.kind === "mower") {
        this.damageEnemy(enemy, 20);
        const travelX = ability.targetX - ability.originX;
        const travelY = ability.targetY - ability.originY;
        applyKnockback(enemy, ability.x - travelX * 0.02, ability.y - travelY * 0.02, 12, this.world);
      } else {
        applyFire(enemy, 5, 10);
      }
    }
  }

  consumeUiAction() {
    const point = this.input.consumeClickRequest();
    if (!point) return null;
    const target = this.uiHitTargets.find((entry) => point.x >= entry.x && point.x <= entry.x + entry.width
      && point.y >= entry.y && point.y <= entry.y + entry.height);
    return target?.action ?? null;
  }

  renderButton(context, x, y, width, height, label, action, options = {}) {
    const hovered = this.input.pointer.inside
      && this.input.pointer.x >= x && this.input.pointer.x <= x + width
      && this.input.pointer.y >= y && this.input.pointer.y <= y + height;
    if (hovered && action !== null) this.canvas.style.cursor = "pointer";
    context.fillStyle = hovered ? (options.hoverFill ?? "#c8b452") : (options.fill ?? "#343621");
    context.fillRect(x, y, width, height);
    context.strokeStyle = options.border ?? "#9a9256";
    context.lineWidth = options.lineWidth ?? 3;
    context.strokeRect(x, y, width, height);
    context.fillStyle = hovered ? (options.hoverText ?? "#242116") : (options.text ?? "#f3e7bd");
    context.font = options.font ?? "bold 13px 'Courier New', monospace";
    context.textAlign = "center";
    context.fillText(label, x + width / 2, y + height / 2 + 5);
    this.uiHitTargets.push({ x, y, width, height, action });
  }

  updateFps(elapsed) {
    this.frames += 1;
    this.fpsElapsed += elapsed;
    if (this.fpsElapsed >= 0.5) {
      this.fps = Math.round(this.frames / this.fpsElapsed);
      this.frames = 0;
      this.fpsElapsed = 0;
    }
  }

  render() {
    const { context } = this;
    const width = this.camera.viewWidth;
    const height = this.camera.viewHeight;
    this.uiHitTargets = [];
    this.canvas.style.cursor = this.screenState === "running" ? "crosshair" : "default";
    context.clearRect(0, 0, width, height);
    this.renderLawn(context, width, height);
    this.renderGardenBeds(context);
    this.renderFence(context);
    this.renderLandmarks(context);
    for (const enemy of this.enemies) {
      enemy.render(context, this.camera);
      this.renderEnemyStatus(context, enemy);
    }
    for (const thrownGnome of this.thrownGnomes) thrownGnome.render(context, this.camera);
    for (const spore of this.bossProjectiles) spore.render(context, this.camera);
    for (const splat of this.syrupSplats) {
      const x = Math.round(splat.x - this.camera.x);
      const y = Math.round(splat.y - this.camera.y);
      context.fillStyle = "rgba(139, 76, 30, 0.72)";
      context.fillRect(x - 22, y - 8, 44, 16);
      context.fillRect(x - 14, y - 13, 28, 26);
    }
    for (const pickup of this.pickups) pickup.render(context, this.camera);
    for (const explosion of this.explosions) {
      const progress = 1 - explosion.lifetime / (explosion.maxLifetime ?? 0.28);
      const radius = explosion.radius * (0.35 + progress * 0.65);
      const x = Math.round(explosion.x - this.camera.x);
      const y = Math.round(explosion.y - this.camera.y);
      context.globalAlpha = 0.55 * (1 - progress);
      context.fillStyle = explosion.color ?? "#eb9931";
      for (let index = 0; index < 16; index += 1) {
        const angle = index / 16 * Math.PI * 2;
        context.fillRect(Math.round(x + Math.cos(angle) * radius) - 4, Math.round(y + Math.sin(angle) * radius) - 4, 8, 8);
      }
      context.globalAlpha = 1;
    }
    for (const projectile of this.projectiles) {
      projectile.render(context, this.camera);
    }
    for (const ability of this.abilityProjectiles) this.renderAbilityProjectile(context, ability);
    this.player.render(context, this.camera);
    this.renderMeleePulse(context);
    if (this.screenState === "running") {
      this.renderAim(context);
    }
    this.renderLighting(context, width, height);
    this.renderBossLighting(context, width, height);
    this.renderPixelFrame(context, width, height);
    if (["running", "paused", "upgrade", "defeat", "victory"].includes(this.screenState)) {
      this.renderCombatHud(context, width, height);
    }
    if (this.screenState === "menu") {
      this.renderMenuOverlay(context, width, height);
    } else if (this.screenState === "map-selection") {
      this.renderMapSelectionOverlay(context, width, height);
    } else if (this.screenState === "melee-selection" || this.screenState === "ranged-selection") {
      this.renderWeaponSelectionOverlay(context, width, height);
    } else if (this.screenState === "tutorial") {
      this.renderTutorialOverlay(context, width, height);
    } else if (this.screenState === "shop") {
      this.renderShopOverlay(context, width, height);
    } else if (this.screenState === "permanent-upgrades") {
      this.renderPermanentUpgradesOverlay(context, width, height);
    } else if (this.screenState === "settings") {
      this.renderSettingsOverlay(context, width, height);
    } else if (this.screenState === "glossary") {
      this.renderGlossaryOverlay(context, width, height);
    } else if (this.screenState === "paused") {
      this.renderPauseOverlay(context, width, height);
    } else if (this.screenState === "upgrade") {
      this.renderUpgradeOverlay(context, width, height);
    } else if (this.screenState === "defeat") {
      this.renderDefeatOverlay(context, width, height);
    } else if (this.screenState === "victory") {
      this.renderVictoryOverlay(context, width, height);
    }
  }

  renderMeleePulse(context) {
    if (this.meleePulse <= 0) {
      return;
    }

    const weapon = this.meleeEffectWeapon ?? weaponStatsAtLevel(WEAPONS.melee, this.progress.weaponLevels["weedwacker-9000"]);
    const centerX = Math.round(this.player.x - this.camera.x);
    const centerY = Math.round(this.player.y - this.camera.y);
    const progress = 1 - this.meleePulse / 0.16;
    const radius = weapon.range * this.player.meleeRangeMultiplier * (0.72 + progress * 0.28);
    context.fillStyle = weapon.color;
    context.globalAlpha = 0.6 * (1 - progress);
    renderMeleePattern(context, centerX, centerY, this.player.facing, weapon, radius);
    context.globalAlpha = 1;
  }

  renderEnemyStatus(context, enemy) {
    if (!enemy.active || enemy.targetable === false) return;
    const x = Math.round(enemy.x - this.camera.x);
    const y = Math.round(enemy.y - this.camera.y);
    if ((enemy.freezeTime ?? 0) > 0) {
      context.fillStyle = "rgba(122, 220, 245, 0.82)";
      context.fillRect(x - enemy.radius, y + enemy.radius - 7, enemy.radius * 2, 7);
      context.fillRect(x - enemy.radius - 3, y - 5, 5, 14);
      context.fillRect(x + enemy.radius - 2, y - 12, 5, 18);
    }
    if ((enemy.fireTime ?? 0) > 0) {
      context.fillStyle = "#f2a23d";
      context.fillRect(x - 10, y - enemy.radius - 12, 7, 12);
      context.fillRect(x + 4, y - enemy.radius - 16, 8, 16);
      context.fillStyle = "#e94e32";
      context.fillRect(x - 7, y - enemy.radius - 7, 5, 7);
      context.fillRect(x + 7, y - enemy.radius - 9, 5, 9);
    }
  }

  renderAbilityProjectile(context, ability) {
    const x = Math.round(ability.x - this.camera.x);
    const y = Math.round(ability.y - this.camera.y);
    context.fillStyle = "#25231e";
    context.fillRect(x - 11, y - 8, 22, 16);
    context.fillStyle = ability.kind === "mower" ? "#d8cf65" : "#ef753d";
    context.fillRect(x - 8, y - 6, 16, 12);
    if (ability.kind === "mower") {
      context.fillStyle = "#9ea5a2";
      context.fillRect(x - 14, y + 5, 28, 4);
    }
  }

  renderCombatHud(context, width, height) {
    const baseWeapon = weaponForSlot(this.weaponSlot, this.progress.equippedWeapons);
    const weapon = weaponStatsAtLevel(baseWeapon, weaponLevelWithLoadoutBonus(
      baseWeapon.id,
      this.progress.weaponLevels[baseWeapon.id],
      this.progress.equippedWeapons,
    ));
    const panelX = 24;
    const panelY = height - 102;
    context.fillStyle = "rgba(24, 27, 15, 0.88)";
    context.fillRect(panelX, panelY, 300, 78);
    context.strokeStyle = "#9a9256";
    context.lineWidth = 3;
    context.strokeRect(panelX, panelY, 300, 78);

    context.fillStyle = "#2a211b";
    context.fillRect(panelX + 12, panelY + 12, 146, 12);
    context.fillStyle = "#a23b32";
    context.fillRect(panelX + 14, panelY + 14, 142 * (this.player.health / this.player.maxHealth), 8);
    context.fillStyle = "#f2e5b7";
    context.font = "bold 12px 'Courier New', monospace";
    context.fillText(`HEALTH ${this.player.health}/${this.player.maxHealth}`, panelX + 168, panelY + 22);

    const meleeDisplay = weaponById(this.progress.equippedWeapons.melee) ?? WEAPONS.melee;
    const rangedDisplay = weaponById(this.progress.equippedWeapons.ranged) ?? WEAPONS.ranged;
    renderWeaponSlot(context, panelX + 12, panelY + 35, meleeDisplay, this.weaponSlot === 1,
      weaponLevelWithLoadoutBonus(meleeDisplay.id, this.progress.weaponLevels[meleeDisplay.id], this.progress.equippedWeapons));
    renderWeaponSlot(context, panelX + 155, panelY + 35, rangedDisplay, this.weaponSlot === 2,
      weaponLevelWithLoadoutBonus(rangedDisplay.id, this.progress.weaponLevels[rangedDisplay.id], this.progress.equippedWeapons));

    const effectiveCooldown = weapon.cooldown * this.player.cooldownMultiplier;
    const cooldownProgress = effectiveCooldown === 0 ? 1 : 1 - this.attackCooldown / effectiveCooldown;
    context.fillStyle = "#24251b";
    context.fillRect(panelX + 12, panelY + 66, 276, 5);
    context.fillStyle = "#dcc45f";
    context.fillRect(panelX + 12, panelY + 66, 276 * clamp01(cooldownProgress), 5);

    context.fillStyle = "rgba(24, 27, 15, 0.88)";
    context.fillRect(width - 254, 24, 230, 68);
    context.strokeStyle = "#9a9256";
    context.lineWidth = 3;
    context.strokeRect(width - 254, 24, 230, 68);
    context.fillStyle = "#f1e4b4";
    context.font = "bold 12px 'Courier New', monospace";
    context.fillText(`TIME ${formatTime(this.runTime)}`, width - 240, 42);
    context.fillText(`COINS ${this.runCoins}`, width - 147, 42);
    context.fillText(`XP ${this.runXp}`, width - 240, 57);
    context.fillText(`LEVEL ${this.runLevel}`, width - 240, 75);
    context.fillStyle = "#29291d";
    context.fillRect(width - 240, 81, 202, 5);
    context.fillStyle = "#78a84a";
    context.fillRect(width - 240, 81, 202 * clamp01(this.levelXp / this.xpToNextLevel), 5);

    if (this.boss?.active) {
      const barWidth = Math.min(440, width * 0.42);
      const barX = (width - barWidth) / 2;
      context.fillStyle = "rgba(24, 20, 16, 0.92)";
      context.fillRect(barX - 8, 22, barWidth + 16, 42);
      context.strokeStyle = "#d0b85e";
      context.lineWidth = 3;
      context.strokeRect(barX - 8, 22, barWidth + 16, 42);
      context.fillStyle = "#f1e4b4";
      context.textAlign = "center";
      context.font = "bold 13px 'Courier New', monospace";
      context.fillText(this.boss.name.toUpperCase(), width / 2, 38);
      context.fillStyle = "#33211d";
      context.fillRect(barX, 46, barWidth, 10);
      context.fillStyle = "#b83b32";
      context.fillRect(barX, 46, barWidth * (this.boss.health / this.boss.maxHealth), 10);
      if ((this.boss.shield ?? 0) > 0) {
        context.fillStyle = "#8edcf2";
        context.fillRect(barX, 58, barWidth * clamp01(this.boss.shield / this.boss.shieldStrength), 4);
      }
      context.textAlign = "start";
    }
    this.renderAbilityCooldowns(context, width);
  }

  renderAbilityCooldowns(context, width) {
    const abilities = [
      { enabled: this.player.syrupTrail, name: "SYRUP TRAIL", ready: "ACTIVE" },
      { enabled: this.player.autonomousMower, name: "MOWER", timer: this.passiveCooldowns.mower },
      { enabled: this.player.batteryPack, name: "BATTERY", timer: this.passiveCooldowns.battery },
      { enabled: this.player.freezePulse, name: "FREEZE", timer: this.passiveCooldowns.freeze },
      { enabled: this.player.scarecrowPulse, name: "SCARECROW", timer: this.passiveCooldowns.scarecrow },
    ].filter((ability) => ability.enabled);
    if (abilities.length === 0) return;
    const panelWidth = 188;
    const rowHeight = 18;
    const x = width - panelWidth - 24;
    const y = 102;
    context.fillStyle = "rgba(24, 27, 15, 0.88)";
    context.fillRect(x, y, panelWidth, abilities.length * rowHeight + 12);
    context.strokeStyle = "#9a9256";
    context.lineWidth = 2;
    context.strokeRect(x, y, panelWidth, abilities.length * rowHeight + 12);
    context.font = "bold 10px 'Courier New', monospace";
    abilities.forEach((ability, index) => {
      const status = ability.ready ?? `${Math.max(0, ability.timer).toFixed(1)}s`;
      context.fillStyle = "#ead77b";
      context.fillText(ability.name, x + 9, y + 17 + index * rowHeight);
      context.fillStyle = ability.timer <= 0 || ability.ready ? "#9fcf71" : "#f3e7bd";
      context.textAlign = "right";
      context.fillText(status, x + panelWidth - 9, y + 17 + index * rowHeight);
      context.textAlign = "start";
    });
  }

  renderMenuOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 42px 'Courier New', monospace";
    context.fillText("LAWN ENFORCEMENT", width / 2, height / 2 - 105);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 16px 'Courier New', monospace";
    context.fillText("Defend your turf from the gnome invasion.", width / 2, height / 2 - 64);
    context.fillText(`COINS  ${this.bankCoins}`, width / 2, height / 2 - 28);
    context.fillStyle = "#d8d0ae";
    context.font = "12px 'Courier New', monospace";
    context.fillText(`${this.unlockedMaps.size} MAP${this.unlockedMaps.size === 1 ? "" : "S"} UNLOCKED`, width / 2, height / 2 + 4);
    this.renderButton(context, width / 2 - 145, height / 2 + 28, 290, 42, "START RUN", "start");
    this.renderButton(context, width / 2 - 290, height / 2 + 88, 135, 34, "SHOP", { type: "menu", value: "shop" });
    this.renderButton(context, width / 2 - 145, height / 2 + 88, 135, 34, "UPGRADES", { type: "menu", value: "upgrades" });
    this.renderButton(context, width / 2, height / 2 + 88, 135, 34, "GLOSSARY", { type: "menu", value: "glossary" });
    this.renderButton(context, width / 2 + 145, height / 2 + 88, 135, 34, "SETTINGS", { type: "menu", value: "settings" });
    if (this.menuMessage) {
      context.fillStyle = "#9fcf71";
      context.fillText(this.menuMessage, width / 2, height / 2 + 172);
    }
    context.textAlign = "start";
  }

  renderGlossaryOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText("GLOSSARY", width / 2, height / 2 - 260);
    this.renderButton(context, width / 2 - 230, height / 2 - 225, 225, 38, "BESTIARY",
      { type: "glossary-tab", value: "bestiary" },
      { fill: this.glossaryTab === "bestiary" ? "#6a6031" : "#343621" });
    this.renderButton(context, width / 2 + 5, height / 2 - 225, 225, 38, "COLLECTION",
      { type: "glossary-tab", value: "collection" },
      { fill: this.glossaryTab === "collection" ? "#6a6031" : "#343621" });

    if (this.glossaryTab === "bestiary") {
      this.renderBestiary(context, width, height);
    } else {
      this.renderCollection(context, width, height);
    }
    context.textAlign = "start";
  }

  renderBestiary(context, width, height) {
    const listTop = height / 2 - 165;
    const listBottom = height - 92;
    const rowHeight = 104;
    const visibleHeight = listBottom - listTop;
    const maxScroll = Math.max(0, ENEMY_GLOSSARY.length * rowHeight - visibleHeight);
    this.glossaryScroll = clamp(this.glossaryScroll, 0, maxScroll);
    context.save();
    context.beginPath();
    context.rect(width / 2 - 300, listTop, 600, visibleHeight);
    context.clip();
    ENEMY_GLOSSARY.forEach((enemy, index) => {
      const defeated = this.progress.defeatedEnemies[enemy.id] ?? 0;
      const x = width / 2 - 285;
      const y = listTop + index * rowHeight - this.glossaryScroll;
      context.fillStyle = defeated > 0 ? "rgba(52, 54, 33, 0.94)" : "rgba(35, 35, 27, 0.94)";
      context.fillRect(x, y, 570, 86);
      context.strokeStyle = defeated > 0 ? "#9a9256" : "#5b5747";
      context.lineWidth = 3;
      context.strokeRect(x, y, 570, 86);
      context.fillStyle = defeated > 0 ? "#ead77b" : "#77715d";
      context.font = "bold 16px 'Courier New', monospace";
      context.fillText(defeated > 0 ? enemy.name.toUpperCase() : "UNDISCOVERED", width / 2, y + 25);
      context.fillStyle = defeated > 0 ? "#9fcf71" : "#77715d";
      context.font = "bold 11px 'Courier New', monospace";
      context.fillText(`DEFEATED ${defeated}`, width / 2, y + 45);
      context.fillStyle = defeated > 0 ? "#d8d0ae" : "#5f5b4c";
      context.font = "11px 'Courier New', monospace";
      context.fillText(defeated > 0 ? enemy.description : "Defeat this enemy to reveal its entry.", width / 2, y + 67);
    });
    context.restore();
    this.renderScrollBar(context, Math.min(width / 2 + 294, width - 14), listTop, visibleHeight, maxScroll, this.glossaryScroll);
    const controlX = Math.min(width / 2 + 265, width - 64);
    this.renderButton(context, controlX, listTop - 32, 58, 24, "▲", { type: "glossary-scroll", value: -1 }, { font: "bold 12px 'Courier New', monospace" });
    this.renderButton(context, controlX, listBottom + 6, 58, 24, "▼", { type: "glossary-scroll", value: 1 }, { font: "bold 12px 'Courier New', monospace" });
  }

  glossaryMaxScroll(width, height) {
    const listTop = height / 2 - 165;
    const visibleHeight = height - 92 - listTop;
    const itemCount = this.glossaryTab === "bestiary" ? ENEMY_GLOSSARY.length : WEAPONS_SORTED_BY_RARITY.length + 4;
    const contentHeight = this.glossaryTab === "bestiary" ? itemCount * 104 : Math.ceil(WEAPON_DEFINITIONS.length / 2) * 26 + 160;
    return Math.max(0, contentHeight - visibleHeight);
  }

  renderCollection(context, width, height) {
    const owned = new Set(this.progress.ownedWeapons);
    const rowsPerColumn = Math.ceil(WEAPON_DEFINITIONS.length / 2);
    const weaponListTop = height / 2 - 135;
    const weaponRowSpacing = 26;
    context.fillStyle = "#ead77b";
    context.font = "bold 14px 'Courier New', monospace";
    context.fillText(`WEAPONS ${owned.size}/${WEAPON_DEFINITIONS.length}`, width / 2, weaponListTop - 20);
    const listTop = height / 2 - 135;
    const contentHeight = Math.ceil(WEAPON_DEFINITIONS.length / 2) * weaponRowSpacing + 170;
    const visibleHeight = height - 92 - listTop;
    const maxScroll = Math.max(0, contentHeight - visibleHeight);
    this.glossaryScroll = clamp(this.glossaryScroll, 0, maxScroll);
    context.save();
    context.beginPath();
    context.rect(width / 2 - 300, listTop - 28, 600, visibleHeight + 28);
    context.clip();
    WEAPONS_SORTED_BY_RARITY.forEach((weapon, index) => {
      const column = index < rowsPerColumn ? 0 : 1;
      const row = column === 0 ? index : index - rowsPerColumn;
      const boxWidth = Math.min(275, Math.max(130, (width - 70) / 2));
      const x = width / 2 - boxWidth - 10 + column * (boxWidth + 20);
      const y = weaponListTop + row * weaponRowSpacing - this.glossaryScroll;
      const unlocked = owned.has(weapon.id);
      context.fillStyle = unlocked ? "#343621" : "#29291f";
      context.fillRect(x, y, boxWidth, 24);
      context.strokeStyle = unlocked ? "#807a4b" : "#4d493a";
      context.lineWidth = 2;
      context.strokeRect(x, y, boxWidth, 24);
      context.fillStyle = unlocked ? "#f3e7bd" : "#696453";
      context.textAlign = "center";
      fitCenteredText(
        context,
        unlocked ? `${weapon.name} · ${weapon.rarity} · LV ${this.progress.weaponLevels[weapon.id]}` : "??? · LOCKED",
        x + boxWidth / 2,
        y + 16,
        boxWidth - 16,
        10,
        7,
      );
    });

    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 14px 'Courier New', monospace";
    const mapsTitleY = weaponListTop + rowsPerColumn * weaponRowSpacing + 30;
    context.fillText(`MAPS ${this.unlockedMaps.size}/${MAP_SLOTS.length}`, width / 2, mapsTitleY - this.glossaryScroll);
    const mapCardWidth = Math.min(180, Math.max(130, (width - 80) / 2));
    const mapGap = 15;
    const mapStartX = width / 2 - mapCardWidth - mapGap / 2;
    MAP_SLOTS.forEach((map, index) => {
      const unlocked = this.unlockedMaps.has(map.id);
      const x = mapStartX + (index % 2) * (mapCardWidth + mapGap);
      const y = mapsTitleY + 17 + Math.floor(index / 2) * 48 - this.glossaryScroll;
      context.fillStyle = unlocked ? "#343621" : "#29291f";
      context.fillRect(x, y, mapCardWidth, 42);
      context.strokeStyle = unlocked ? "#9a9256" : "#4d493a";
      context.lineWidth = 2;
      context.strokeRect(x, y, mapCardWidth, 42);
      context.fillStyle = unlocked ? "#f3e7bd" : "#696453";
      context.font = "bold 10px 'Courier New', monospace";
      fitCenteredText(context, unlocked ? map.name.toUpperCase() : "??? · LOCKED", x + mapCardWidth / 2, y + 26, mapCardWidth - 12, 10, 8, true);
    });
    context.restore();
    this.renderScrollBar(context, Math.min(width / 2 + 294, width - 14), listTop - 28, visibleHeight + 28, maxScroll, this.glossaryScroll);
    const controlX = Math.min(width / 2 + 265, width - 64);
    this.renderButton(context, controlX, listTop - 32, 58, 24, "▲", { type: "glossary-scroll", value: -1 }, { font: "bold 12px 'Courier New', monospace" });
    this.renderButton(context, controlX, height - 86, 58, 24, "▼", { type: "glossary-scroll", value: 1 }, { font: "bold 12px 'Courier New', monospace" });
  }

  renderScrollBar(context, x, y, height, maxScroll, scroll) {
    const width = 8;
    context.fillStyle = "rgba(20, 20, 14, 0.82)";
    context.fillRect(x, y, width, height);
    if (maxScroll <= 0) {
      context.fillStyle = "#8d8756";
      context.fillRect(x, y, width, height);
      return;
    }
    const thumbHeight = Math.max(24, height * height / (height + maxScroll));
    const thumbY = y + (height - thumbHeight) * (scroll / maxScroll);
    context.fillStyle = "#d4bd58";
    context.fillRect(x, thumbY, width, thumbHeight);
  }

  renderMapSelectionOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 36px 'Courier New', monospace";
    context.fillText("CHOOSE A MAP", width / 2, height / 2 - 155);
    context.fillStyle = "#d8d0ae";
    context.font = "13px 'Courier New', monospace";
    context.fillText("Click an unlocked map to continue to your loadout", width / 2, height / 2 - 120);
    const listTop = height / 2 - 75;
    const listBottom = height - 95;
    const rowHeight = 62;
    const visibleCount = Math.min(5, MAP_SLOTS.length);
    const visibleHeight = visibleCount * rowHeight;
    const maxOffset = Math.max(0, MAP_SLOTS.length - visibleCount);
    this.mapSelectionScroll = clamp(this.mapSelectionScroll, 0, maxOffset);
    context.save();
    context.beginPath();
    context.rect(width / 2 - 240, listTop, 480, visibleHeight);
    context.clip();
    MAP_SLOTS.forEach((map, index) => {
      const unlocked = this.unlockedMaps.has(map.id);
      this.renderButton(context, width / 2 - 230, listTop + (index - this.mapSelectionScroll) * rowHeight, 460, 54,
        `${unlocked ? "PLAY" : "LOCKED"} — ${map.name}`,
        unlocked ? { type: "map", value: map.id } : null,
        { fill: unlocked ? "#343621" : "#29291f", text: unlocked ? "#f3e7bd" : "#756f58", font: "bold 14px 'Courier New', monospace" });
    });
    context.restore();
    this.renderScrollBar(context, Math.min(width / 2 + 238, width - 12), listTop, visibleHeight, maxOffset, this.mapSelectionScroll);
    const controlX = Math.min(width / 2 + 245, width - 46);
    this.renderButton(context, controlX, listTop - 30, 40, 24, "▲", { type: "map-scroll", value: -1 }, { font: "bold 12px 'Courier New', monospace" });
    this.renderButton(context, controlX, listBottom + 6, 40, 24, "▼", { type: "map-scroll", value: 1 }, { font: "bold 12px 'Courier New', monospace" });
    context.fillStyle = "#d8d0ae";
    context.font = "11px 'Courier New', monospace";
    context.textAlign = "start";
  }

  renderTutorialOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText("WELCOME TO LAWN ENFORCEMENT", width / 2, height / 2 - 150);
    context.fillStyle = "#f3e7bd";
    context.font = "15px 'Courier New', monospace";
    [
      "WASD or arrow keys move your homeowner.",
      "Aim with the mouse and hold left click to attack.",
      "Use your configured melee/ranged keys to switch weapons.",
      "Collect individual coins and green XP orbs dropped by enemies.",
      "Choose one temporary upgrade whenever your run level increases.",
      "Survive until the selected map's boss arrives, then defeat it.",
    ].forEach((line, index) => context.fillText(line, width / 2, height / 2 - 92 + index * 29));
    this.renderButton(context, width / 2 - 145, height / 2 + 92, 290, 42, "CONTINUE", "continue");
    context.textAlign = "start";
  }

  renderWeaponSelectionOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    const slot = this.screenState === "melee-selection" ? "melee" : "ranged";
    const weapons = this.ownedWeaponsForSlot(slot);
    const equippedId = this.progress.equippedWeapons[slot];
    const visibleCount = Math.min(5, weapons.length);
    const maxOffset = Math.max(0, weapons.length - visibleCount);
    const offset = clamp(this.weaponSelectionScroll[slot], 0, maxOffset);
    this.weaponSelectionScroll[slot] = offset;
    const listTop = Math.max(125, height / 2 - 170);
    const listBottom = listTop + visibleCount * 32;
    const descriptionY = Math.min(height - 170, listBottom + 38);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText(`CHOOSE ${slot.toUpperCase()} WEAPON`, width / 2, listTop - 42);
    context.fillStyle = "#f3e7bd";
    context.font = "14px 'Courier New', monospace";
    weapons.slice(offset, offset + visibleCount).forEach((weapon, visibleIndex) => {
      const index = offset + visibleIndex;
      const selected = weapon.id === equippedId;
      const effectiveLevel = weaponLevelWithLoadoutBonus(
        weapon.id,
        this.progress.weaponLevels[weapon.id],
        this.progress.equippedWeapons,
      );
      const synergy = effectiveLevel > this.progress.weaponLevels[weapon.id] ? " · PAIR +1" : "";
      this.renderButton(context, width / 2 - 245, listTop + visibleIndex * 32, 490, 27,
        `${selected ? "> " : ""}${weapon.name} · ${weapon.rarity} · LV ${effectiveLevel}${synergy}`,
        { type: "choice", value: index + 1 },
        { fill: selected ? "#5a5530" : "#343621", font: "12px 'Courier New', monospace" });
    });
    if (maxOffset > 0) {
      this.renderButton(context, width / 2 + 255, listTop, 54, 27, "▲", { type: "weapon-scroll", value: -1 });
      this.renderButton(context, width / 2 + 255, listTop + (visibleCount - 1) * 32, 54, 27, "▼", { type: "weapon-scroll", value: 1 });
      context.fillStyle = "#d8d0ae";
      context.font = "10px 'Courier New', monospace";
      context.fillText(`${offset + 1}-${offset + visibleCount} / ${weapons.length}`, width / 2 + 282, listTop + 91);
    }
    const equipped = weaponById(equippedId);
    context.fillStyle = "#9fcf71";
    context.font = "12px 'Courier New', monospace";
    context.fillText(equipped?.description ?? "", width / 2, descriptionY);
    context.fillStyle = "#c9b95f";
    context.fillText(`LV 10: ${equipped?.levelTenFeature ?? ""}`, width / 2, descriptionY + 21);
    this.renderButton(context, width / 2 - 155, descriptionY + 39, 310, 36,
      slot === "melee" ? "CONTINUE TO RANGED" : "BEGIN RUN", "confirm");
    context.fillStyle = "#d8d0ae";
    context.font = "11px 'Courier New', monospace";
    context.fillText("Click a weapon · Mouse wheel or arrows scroll · Escape returns", width / 2, descriptionY + 94);
    context.textAlign = "start";
  }

  renderSettingsOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    const settings = this.progress.settings;
    const options = [
      `1 SOUND: ${settings.sound ? "ON" : "OFF"}`,
      `2 SCREEN SHAKE: ${settings.screenShake ? "ON" : "OFF"}`,
      `3 REDUCED MOTION: ${settings.reducedMotion ? "ON" : "OFF"}`,
      `4 MELEE KEY: ${formatKeyCode(this.progress.keybinds.melee)}`,
      `5 RANGED KEY: ${formatKeyCode(this.progress.keybinds.ranged)}`,
    ];
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText("SETTINGS & ACCESSIBILITY", width / 2, height / 2 - 170);
    context.fillStyle = "#f3e7bd";
    context.font = "14px 'Courier New', monospace";
    options.forEach((option, index) => this.renderButton(
      context, width / 2 - 220, height / 2 - 145 + index * 38, 440, 32,
      option.replace(/^\d\s+/, ""), { type: "choice", value: index + 1 },
      { font: "12px 'Courier New', monospace" },
    ));
    context.fillStyle = "#9fcf71";
    context.fillText(this.input.rebindingAction ? `Press any key for ${this.input.rebindingAction}` : this.menuMessage, width / 2, height / 2 + 120);
    context.fillStyle = "#d8d0ae";
    context.fillText("Click to toggle or rebind · Escape to return", width / 2, height / 2 + 158);
    context.textAlign = "start";
  }

  renderShopOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    const deal = dailyDealForDate(new Date().toISOString().slice(0, 10));
    const options = [
      `1 Tennis Balls — ${ownedOrPrice(this.progress, "tennis-balls")}`,
      `2 Hedge Clippers — ${ownedOrPrice(this.progress, "hedge-clippers")}`,
      `3 Acorn Slingshot — ${ownedOrPrice(this.progress, "acorn-slingshot")}`,
      `4 Diet Cola Launcher — ${ownedOrPrice(this.progress, "diet-cola-launcher")}`,
      `5 DAILY ${deal.rarity.toUpperCase()}: ${deal.name} — ${this.progress.ownedWeapons.includes(deal.id) ? "OWNED" : `${Math.floor(deal.price * 0.75)} coins`}`,
      `6 WEAPON CHEST — ${CHEST_COST} coins`,
    ];
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText("ORDINANCE SHOP", width / 2, height / 2 - 210);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 15px 'Courier New', monospace";
    context.fillText(`COINS ${this.bankCoins}`, width / 2, height / 2 - 177);
    options.forEach((option, index) => this.renderButton(
      context, width / 2 - 260, height / 2 - 126 + index * 43, 520, 34,
      option.replace(/^\d\s+/, ""), { type: "choice", value: index + 1 },
      { font: "12px 'Courier New', monospace" },
    ));
    context.fillStyle = "#9fcf71";
    context.fillText(this.menuMessage, width / 2, height / 2 + 160);
    context.fillStyle = "#d8d0ae";
    context.fillText("Click an item to buy · Escape to return", width / 2, height / 2 + 194);
    context.textAlign = "start";
  }

  renderPermanentUpgradesOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    if (this.permanentUpgradeCategory) {
      this.renderWeaponUpgradeCategoryOverlay(context, width, height);
      return;
    }
    const statCap = Math.min(CHARACTER_STAT_COSTS.length, this.unlockedMaps.size * 5);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText("PERMANENT UPGRADES", width / 2, height / 2 - 250);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 15px 'Courier New', monospace";
    context.fillText(`COINS ${this.bankCoins} · STAT CAP ${statCap}`, width / 2, height / 2 - 220);
    context.font = "bold 14px 'Courier New', monospace";
    context.fillStyle = "#ead77b";
    context.fillText("STAT UPGRADES", width / 2, height / 2 - 195);
    context.font = "12px 'Courier New', monospace";
    ["health", "damage", "speed", "attackSpeed", "accuracy"].forEach((stat, index) => {
      const level = this.progress.characterStats[stat];
      const cost = level >= statCap ? "MAX FOR MAPS" : `${CHARACTER_STAT_COSTS[level]} coins`;
      this.renderButton(context, width / 2 - 225, height / 2 - 174 + index * 30, 450, 27,
        `${stat.toUpperCase()} LV ${level} → ${cost}`, { type: "choice", value: index + 3 },
        { font: "12px 'Courier New', monospace" });
    });
    context.fillStyle = "#ead77b";
    context.font = "bold 14px 'Courier New', monospace";
    context.fillText("MELEE UPGRADES", width / 2, height / 2 - 5);
    context.fillStyle = "#f3e7bd";
    context.font = "12px 'Courier New', monospace";
    this.renderButton(context, width / 2 - 225, height / 2 + 10, 450, 34,
      `OPEN MELEE ARSENAL · ${this.ownedWeaponsForSlot("melee").length} OWNED`, { type: "choice", value: 1 });
    context.fillStyle = "#ead77b";
    context.font = "bold 14px 'Courier New', monospace";
    context.fillText("RANGED UPGRADES", width / 2, height / 2 + 63);
    context.fillStyle = "#f3e7bd";
    context.font = "12px 'Courier New', monospace";
    this.renderButton(context, width / 2 - 225, height / 2 + 72, 450, 34,
      `OPEN RANGED ARSENAL · ${this.ownedWeaponsForSlot("ranged").length} OWNED`, { type: "choice", value: 2 });
    context.fillStyle = "#9fcf71";
    context.fillText(this.menuMessage, width / 2, height / 2 + 125);
    context.fillStyle = "#d8d0ae";
    context.fillText("Click an upgrade category or stat · Escape to return", width / 2, height / 2 + 165);
    context.textAlign = "start";
  }

  renderWeaponUpgradeCategoryOverlay(context, width, height) {
    const category = this.permanentUpgradeCategory;
    const weapons = this.ownedWeaponsForSlot(category);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 32px 'Courier New', monospace";
    context.fillText(`${category.toUpperCase()} ARSENAL UPGRADES`, width / 2, height / 2 - 225);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 14px 'Courier New', monospace";
    context.fillText(`COINS ${this.bankCoins} · EVERY OWNED WEAPON CAN REACH LEVEL 5`, width / 2, height / 2 - 192);
    context.font = "12px 'Courier New', monospace";
    const listTop = height / 2 - 165;
    const listBottom = height - 105;
    const rowHeight = 34;
    const visibleCount = Math.max(1, Math.floor((listBottom - listTop) / rowHeight));
    const maxOffset = Math.max(0, weapons.length - visibleCount);
    const offset = clamp(this.arsenalScroll[category] ?? 0, 0, maxOffset);
    this.arsenalScroll[category] = offset;
    context.save();
    context.beginPath();
    context.rect(width / 2 - 265, listTop, 530, visibleCount * rowHeight);
    context.clip();
    weapons.slice(offset, offset + visibleCount).forEach((weapon, visibleIndex) => {
      const index = offset + visibleIndex;
      const equipped = weapon.id === this.progress.equippedWeapons[category];
      this.renderButton(context, width / 2 - 255, listTop + visibleIndex * rowHeight, 510, 29,
        `${equipped ? "> " : ""}${weaponUpgradeLabel(this.progress, weapon)}`,
        { type: "choice", value: index + 1 },
        { fill: equipped ? "#5a5530" : "#343621", font: "11px 'Courier New', monospace" });
    });
    context.restore();
    this.renderScrollBar(context, Math.min(width / 2 + 264, width - 14), listTop, visibleCount * rowHeight, maxOffset, offset);
    const controlX = Math.min(width / 2 + 235, width - 64);
    if (maxOffset > 0) {
      this.renderButton(context, controlX, listTop - 30, 58, 24, "▲", { type: "arsenal-scroll", value: -1 }, { font: "bold 12px 'Courier New', monospace" });
      this.renderButton(context, controlX, listBottom + 6, 58, 24, "▼", { type: "arsenal-scroll", value: 1 }, { font: "bold 12px 'Courier New', monospace" });
    }
    context.fillStyle = "#9fcf71";
    context.font = "11px 'Courier New', monospace";
    context.fillText(this.menuMessage, width / 2, height - 70);
    context.fillStyle = "#d8d0ae";
    context.fillText("Click a weapon to upgrade · Scroll or arrows · Escape returns", width / 2, height - 46);
    context.textAlign = "start";
  }

  renderPauseOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 38px 'Courier New', monospace";
    context.fillText("PAUSED", width / 2, height / 2 - 20);
    this.renderButton(context, width / 2 - 125, height / 2 + 5, 250, 42, "RESUME", "resume");
    context.textAlign = "start";
  }

  renderUpgradeOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 32px 'Courier New', monospace";
    context.fillText(`LEVEL ${this.runLevel} — CHOOSE AN UPGRADE`, width / 2, height / 2 - 125);
    const cardWidth = 210;
    const gap = 18;
    const startX = width / 2 - (cardWidth * 3 + gap * 2) / 2;
    this.upgradeChoices.forEach((upgrade, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = height / 2 - 82;
      context.fillStyle = "#292b1d";
      context.fillRect(x, y, cardWidth, 142);
      context.strokeStyle = upgrade.rarity === "Silver" ? "#b8bec4" : "#b77b43";
      context.lineWidth = 4;
      context.strokeRect(x, y, cardWidth, 142);
      context.fillStyle = "#ead77b";
      context.font = "bold 22px 'Courier New', monospace";
      context.fillText(String(index + 1), x + cardWidth / 2, y + 30);
      context.fillStyle = "#f3e7bd";
      fitCenteredText(context, upgrade.name.toUpperCase(), x + cardWidth / 2, y + 58, cardWidth - 20, 14, 11, true);
      context.fillStyle = upgrade.rarity === "Silver" ? "#cbd0d4" : "#d69b61";
      context.font = "11px 'Courier New', monospace";
      context.fillText(upgrade.rarity.toUpperCase(), x + cardWidth / 2, y + 81);
      context.fillStyle = "#d8d0ae";
      wrapCenteredText(context, upgrade.description, x + cardWidth / 2, y + 108, cardWidth - 22, 15);
      this.uiHitTargets.push({ x, y, width: cardWidth, height: 142, action: { type: "choice", value: index + 1 } });
    });
    context.fillStyle = "#f3e7bd";
    context.font = "bold 14px 'Courier New', monospace";
    context.fillText("Click an upgrade card", width / 2, height / 2 + 92);
    context.textAlign = "start";
  }

  renderDefeatOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 38px 'Courier New', monospace";
    context.fillText("LAWN OVERRUN", width / 2, height / 2 - 48);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 16px 'Courier New', monospace";
    context.fillText(`Survived ${formatTime(this.runTime)}  ·  Earned ${this.runCoins} coins  ·  ${this.runXp} XP`, width / 2, height / 2 - 8);
    context.fillText(`Upgrades chosen: ${this.appliedUpgrades.length}`, width / 2, height / 2 + 20);
    this.renderButton(context, width / 2 - 205, height / 2 + 42, 190, 40, "RETRY", "retry");
    this.renderButton(context, width / 2 + 15, height / 2 + 42, 190, 40, "MAIN MENU", "menu");
    context.textAlign = "start";
  }

  renderVictoryOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 38px 'Courier New', monospace";
    context.fillText("LAWN SECURED", width / 2, height / 2 - 62);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 16px 'Courier New', monospace";
    context.fillText(`${this.currentMap.boss.name} has been defeated in ${this.currentMap.name}!`, width / 2, height / 2 - 24);
    context.fillText(`Victory reward: ${this.runCoins} × 2 + ${this.currentMap.victoryCoinBonus} = ${this.victoryReward} coins`, width / 2, height / 2 + 8);
    context.fillText(this.currentMap.unlocks ? `${mapById(this.currentMap.unlocks).name} unlocked` : `${this.currentMap.name} secured`, width / 2, height / 2 + 38);
    this.renderButton(context, width / 2 - 205, height / 2 + 62, 190, 40, "REPLAY", "retry");
    this.renderButton(context, width / 2 + 15, height / 2 + 62, 190, 40, "MAIN MENU", "menu");
    context.textAlign = "start";
  }

  renderLawn(context, width, height) {
    context.fillStyle = this.currentMap.lawnColors?.primary ?? COLORS.lawnA;
    context.fillRect(0, 0, width, height);

    const grid = this.world.gridSize;
    const startColumn = Math.floor(this.camera.x / grid);
    const endColumn = Math.ceil((this.camera.x + width) / grid);
    const startRow = Math.floor(this.camera.y / grid);
    const endRow = Math.ceil((this.camera.y + height) / grid);

    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        const worldX = column * grid;
        const worldY = row * grid;
        const seed = hashCoordinates(column, row);
        if (seed % 4 === 0) {
          context.fillStyle = seed % 8 === 0
            ? "rgba(42, 62, 24, 0.08)"
            : "rgba(181, 194, 96, 0.055)";
          context.fillRect(
            Math.round(worldX + 18 + (seed >>> 17) % 42 - this.camera.x),
            Math.round(worldY + 20 + (seed >>> 21) % 38 - this.camera.y),
            18 + seed % 16,
            8,
          );
        }
        renderGrassTuft(context, worldX + 14 + seed % 54 - this.camera.x, worldY + 12 + (seed >>> 5) % 56 - this.camera.y, seed);
        renderGrassTuft(context, worldX + 48 + (seed >>> 9) % 35 - this.camera.x, worldY + 54 + (seed >>> 13) % 28 - this.camera.y, seed >>> 3);
      }
    }

    context.strokeStyle = COLORS.boundary;
    context.lineWidth = 12;
    context.strokeRect(-this.camera.x, -this.camera.y, this.world.width, this.world.height);

  }

  renderLandmarks(context) {
    if (this.currentMap.id === "garden") return;
    if (this.currentMap.id === "public-park") {
      this.renderParkLandmarks(context);
      return;
    }
    if (this.currentMap.id === "lake-elizabeth") {
      this.renderLakeLandmarks(context);
      return;
    }
    const landmarks = this.currentMap.id === "frontyard"
      ? [
          { x: this.world.width / 2 - 260, y: 60, width: 520, height: 260, color: "#83604b" },
          { x: this.world.width / 2 - 90, y: 320, width: 180, height: 580, color: "#aaa08b" },
          { x: 150, y: this.world.height - 360, width: 260, height: 150, color: "#7891a0" },
          { x: this.world.width - 410, y: this.world.height - 330, width: 250, height: 140, color: "#9d7b54" },
        ]
      : [
          { x: this.world.width / 2 - 220, y: this.world.height - 360, width: 440, height: 320, color: "#6d5140" },
          { x: this.world.width / 2 - 75, y: this.world.height - 900, width: 150, height: 540, color: "#aaa08b" },
          { x: 280, y: 300, width: 240, height: 150, color: "#7891a0" },
          { x: this.world.width - 580, y: 280, width: 300, height: 180, color: "#9d7b54" },
        ];

    for (const landmark of landmarks) {
      const x = landmark.x - this.camera.x;
      const y = landmark.y - this.camera.y;
      if (x + landmark.width < 0 || y + landmark.height < 0 || x > this.camera.viewWidth || y > this.camera.viewHeight) {
        continue;
      }

      context.fillStyle = "rgba(0, 0, 0, 0.24)";
      context.fillRect(Math.round(x + 12), Math.round(y + 16), landmark.width, landmark.height);
      context.fillStyle = landmark.color;
      context.fillRect(Math.round(x), Math.round(y), landmark.width, landmark.height);
      context.strokeStyle = "#3d342c";
      context.lineWidth = 6;
      context.strokeRect(Math.round(x), Math.round(y), landmark.width, landmark.height);
      context.fillStyle = "rgba(255, 255, 255, 0.12)";
      context.fillRect(Math.round(x + 10), Math.round(y + 10), landmark.width - 20, 8);
    }
  }

  renderParkLandmarks(context) {
    const worldWidth = this.world.width;
    const worldHeight = this.world.height;
    context.fillStyle = "rgba(206, 181, 126, 0.36)";
    context.fillRect(-this.camera.x, Math.round(worldHeight * 0.54 - this.camera.y), worldWidth, 46);
    context.fillRect(Math.round(worldWidth * 0.47 - this.camera.x), -this.camera.y, 48, worldHeight);
    for (const obstacle of this.activeObstacles ?? []) {
      const x = Math.round(obstacle.x - this.camera.x);
      const y = Math.round(obstacle.y - this.camera.y);
      if (x + obstacle.width < 0 || y + obstacle.height < 0 || x > this.camera.viewWidth || y > this.camera.viewHeight) continue;
      context.fillStyle = "rgba(31, 39, 21, 0.28)";
      context.fillRect(x + 8, y + 10, obstacle.width, obstacle.height);
      if (obstacle.kind === "trees") {
        context.fillStyle = "#60402d";
        context.fillRect(x + obstacle.width * 0.42, y + 22, obstacle.width * 0.16, obstacle.height - 30);
        context.fillStyle = "#31552e";
        context.fillRect(x + 12, y + 10, obstacle.width - 24, obstacle.height * 0.58);
        context.fillStyle = "#47733b";
        context.fillRect(x + 28, y + 2, obstacle.width - 56, obstacle.height * 0.34);
      } else if (obstacle.kind === "playground") {
        context.fillStyle = "#c56d43";
        context.fillRect(x + 20, y + 24, obstacle.width - 40, 22);
        context.fillStyle = "#4d6c93";
        context.fillRect(x + 55, y + 48, 28, obstacle.height - 78);
        context.fillRect(x + obstacle.width - 83, y + 48, 28, obstacle.height - 78);
        context.fillStyle = "#d7a53f";
        context.fillRect(x + 20, y + obstacle.height - 48, obstacle.width - 40, 22);
      } else {
        context.fillStyle = obstacle.kind === "picnic-table" ? "#8a5d38" : "#6b523d";
        context.fillRect(x, y, obstacle.width, obstacle.height);
        context.fillStyle = "#c0925b";
        context.fillRect(x + 10, y + 8, obstacle.width - 20, 8);
        context.strokeStyle = "#3f3024";
        context.lineWidth = 4;
        context.strokeRect(x, y, obstacle.width, obstacle.height);
      }
    }
  }

  renderLakeLandmarks(context) {
    const lake = this.currentMap.obstacles?.find((obstacle) => obstacle.kind === "lake");
    if (!lake) return;
    const x = Math.round(lake.x - this.camera.x); const y = Math.round(lake.y - this.camera.y);
    context.fillStyle = "#315b73"; context.fillRect(x, y, lake.width, lake.height);
    context.fillStyle = "#4f8e9a"; context.fillRect(x + 18, y + 18, lake.width - 36, lake.height - 36);
    context.strokeStyle = "#8fb7a1"; context.lineWidth = 8; context.strokeRect(x, y, lake.width, lake.height);
    context.fillStyle = "rgba(216, 239, 213, 0.28)";
    for (let wave = 0; wave < 8; wave += 1) context.fillRect(x + 40, y + 42 + wave * 68, lake.width - 80, 4);
  }

  renderFence(context) {
    if (!this.currentMap.houseSide) return;
    const fenceWorldY = this.currentMap.houseSide === "top"
      ? 340
      : this.world.height - 390;
    const y = Math.round(fenceWorldY - this.camera.y);
    if (y < -45 || y > this.camera.viewHeight + 45) return;

    const startPost = Math.max(0, Math.floor(this.camera.x / 64) - 1);
    const endPost = Math.min(Math.ceil(this.world.width / 64), Math.ceil((this.camera.x + this.camera.viewWidth) / 64) + 1);
    context.fillStyle = "#584433";
    context.fillRect(-this.camera.x, y - 12, this.world.width, 8);
    context.fillRect(-this.camera.x, y + 12, this.world.width, 8);
    context.fillStyle = "#a78358";
    context.fillRect(-this.camera.x, y - 15, this.world.width, 6);
    context.fillRect(-this.camera.x, y + 9, this.world.width, 6);
    for (let post = startPost; post <= endPost; post += 1) {
      const x = Math.round(post * 64 - this.camera.x);
      context.fillStyle = "#4a382d";
      context.fillRect(x - 6, y - 32, 14, 66);
      context.fillStyle = "#b18d61";
      context.fillRect(x - 4, y - 29, 9, 58);
      context.fillRect(x - 6, y - 35, 13, 7);
    }
  }

  renderGardenBeds(context) {
    if (this.currentMap.id !== "garden") return;
    const spacingX = 300;
    const spacingY = 220;
    const bedWidth = 230;
    const bedHeight = 145;
    const startColumn = Math.max(0, Math.floor(this.camera.x / spacingX));
    const endColumn = Math.min(Math.ceil(this.world.width / spacingX), Math.ceil((this.camera.x + this.camera.viewWidth) / spacingX));
    const startRow = Math.max(0, Math.floor(this.camera.y / spacingY));
    const endRow = Math.min(Math.ceil(this.world.height / spacingY), Math.ceil((this.camera.y + this.camera.viewHeight) / spacingY));
    for (let row = startRow; row <= endRow; row += 1) {
      for (let column = startColumn; column <= endColumn; column += 1) {
        const x = Math.round(column * spacingX + 34 - this.camera.x);
        const y = Math.round(row * spacingY + 38 - this.camera.y);
        context.fillStyle = "#5a3b25";
        context.fillRect(x, y, bedWidth, bedHeight);
        context.fillStyle = "#7c5734";
        context.fillRect(x + 8, y + 8, bedWidth - 16, bedHeight - 16);
        context.fillStyle = "#3f2b1d";
        for (let furrow = 0; furrow < 4; furrow += 1) {
          context.fillRect(x + 25 + furrow * 50, y + 15, 7, bedHeight - 30);
        }
        context.strokeStyle = "#b08a58";
        context.lineWidth = 7;
        context.strokeRect(x, y, bedWidth, bedHeight);
      }
    }
  }

  renderAim(context) {
    if (!this.input.pointer.inside) {
      return;
    }

    const { x, y } = this.input.pointer;
    const aimX = Math.round(x);
    const aimY = Math.round(y);
    const recoilGap = 5 + Math.round(this.player.recoil * 60);
    context.fillStyle = COLORS.aim;
    context.fillRect(aimX - recoilGap - 9, aimY - 2, 9, 4);
    context.fillRect(aimX + recoilGap, aimY - 2, 9, 4);
    context.fillRect(aimX - 2, aimY - recoilGap - 9, 4, 9);
    context.fillRect(aimX - 2, aimY + recoilGap, 4, 9);
    context.fillRect(aimX - 3, aimY - 3, 6, 6);
  }

  renderPixelFrame(context, width, height) {
    const frameSize = 10;
    context.fillStyle = "rgba(35, 31, 15, 0.42)";
    context.fillRect(0, 0, width, frameSize);
    context.fillRect(0, height - frameSize, width, frameSize);
    context.fillRect(0, 0, frameSize, height);
    context.fillRect(width - frameSize, 0, frameSize, height);
  }

  renderLighting(context, width, height) {
    const playerX = this.player.x - this.camera.x;
    const playerY = this.player.y - this.camera.y;

    const shade = context.createRadialGradient(playerX, playerY, 110, playerX, playerY, 520);
    shade.addColorStop(0, "rgba(16, 20, 10, 0)");
    shade.addColorStop(0.48, "rgba(16, 20, 10, 0.025)");
    shade.addColorStop(1, "rgba(10, 14, 7, 0.18)");
    context.fillStyle = shade;
    context.fillRect(0, 0, width, height);

    const glow = context.createRadialGradient(playerX, playerY - 8, 12, playerX, playerY - 8, 380);
    glow.addColorStop(0, "rgba(255, 226, 142, 0.24)");
    glow.addColorStop(0.3, "rgba(250, 215, 118, 0.15)");
    glow.addColorStop(0.68, "rgba(235, 194, 91, 0.055)");
    glow.addColorStop(1, "rgba(235, 194, 91, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  }

  renderBossLighting(context, width, height) {
    if (!this.boss?.active) return;
    const bossX = Math.round(this.boss.x - this.camera.x);
    const bossY = Math.round(this.boss.y - this.camera.y);
    const glow = context.createRadialGradient(bossX, bossY - 12, 16, bossX, bossY - 12, 440);
    const introFlash = this.bossIntroTime > 0
      ? 0.08 + (Math.sin(this.bossIntroTime * Math.PI * 10) + 1) * 0.04
      : 0;
    glow.addColorStop(0, `rgba(255, 236, 168, ${0.24 + introFlash})`);
    glow.addColorStop(0.3, "rgba(249, 218, 128, 0.15)");
    glow.addColorStop(0.68, "rgba(235, 194, 91, 0.055)");
    glow.addColorStop(1, "rgba(235, 194, 91, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  }
}

function hashCoordinates(x, y) {
  let value = Math.imul(x ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(y ^ 0xc2b2ae35, 0x27d4eb2f);
  value ^= value >>> 15;
  return value >>> 0;
}

function renderDarkOverlay(context, width, height) {
  context.fillStyle = "rgba(20, 18, 12, 0.82)";
  context.fillRect(0, 0, width, height);
}

function randomDropOffset(random = Math.random) {
  const angle = random() * Math.PI * 2;
  const distance = 12 + random() * 34;
  return {
    offsetX: Math.cos(angle) * distance,
    offsetY: Math.sin(angle) * distance,
  };
}

function wrapCenteredText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 2).forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
}

function fitCenteredText(context, text, x, y, maxWidth, startSize, minimumSize, bold = false) {
  let size = startSize;
  do {
    context.font = `${bold ? "bold " : ""}${size}px 'Courier New', monospace`;
    size -= 1;
  } while (size >= minimumSize && context.measureText(text).width > maxWidth);
  context.fillText(text, x, y);
}

function renderGrassTuft(context, x, y, seed) {
  const roundedX = Math.round(x);
  const roundedY = Math.round(y);
  context.fillStyle = seed % 3 === 0 ? "rgba(184, 190, 92, 0.28)" : "rgba(45, 72, 26, 0.3)";
  context.fillRect(roundedX, roundedY + 4, 3, 7);
  context.fillRect(roundedX + 4, roundedY, 3, 11);
  context.fillRect(roundedX + 8, roundedY + 5, 3, 6);
  if (seed % 5 === 0) {
    context.fillRect(roundedX - 5, roundedY + 9, 4, 3);
    context.fillRect(roundedX + 12, roundedY + 8, 4, 3);
  }
}

function circlesOverlap(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y) <= first.radius + second.radius;
}

function resolveEnemyObstacles(enemy, obstacles) {
  if (enemy.isBoss || enemy.targetable === false) return;
  for (const obstacle of obstacles) {
    if (obstacle.solid === false) continue;
    const closestX = Math.max(obstacle.x, Math.min(enemy.x, obstacle.x + obstacle.width));
    const closestY = Math.max(obstacle.y, Math.min(enemy.y, obstacle.y + obstacle.height));
    const offsetX = enemy.x - closestX;
    const offsetY = enemy.y - closestY;
    if (offsetX * offsetX + offsetY * offsetY >= enemy.radius * enemy.radius) continue;
    const leftPush = Math.abs(enemy.x - obstacle.x);
    const rightPush = Math.abs(enemy.x - (obstacle.x + obstacle.width));
    const topPush = Math.abs(enemy.y - obstacle.y);
    const bottomPush = Math.abs(enemy.y - (obstacle.y + obstacle.height));
    if (Math.min(leftPush, rightPush) < Math.min(topPush, bottomPush)) {
      enemy.x = leftPush < rightPush ? obstacle.x - enemy.radius : obstacle.x + obstacle.width + enemy.radius;
    } else {
      enemy.y = topPush < bottomPush ? obstacle.y - enemy.radius : obstacle.y + obstacle.height + enemy.radius;
    }
  }
}

function distanceBetween(first, second) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function nearestActiveEnemy(source, enemies) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const enemy of enemies) {
    if (!enemy.active || enemy.targetable === false) continue;
    const distance = distanceBetween(source, enemy);
    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }
  return nearest;
}

function makeAbilityProjectile(kind, source, target, speed) {
  return {
    kind,
    x: source.x,
    y: source.y,
    originX: source.x,
    originY: source.y,
    targetX: target.x,
    targetY: target.y,
    speed,
    active: true,
  };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (wholeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function renderWeaponSlot(context, x, y, weapon, selected, level = 1) {
  context.fillStyle = selected ? "#d4bd58" : "#4c4d37";
  context.fillRect(x, y, 133, 26);
  context.fillStyle = selected ? "#242116" : "#ddd5af";
  context.textAlign = "left";
  fitCenteredText(context, `${weapon.slotNumber}  ${weapon.name}`, x + 7, y + 11, 119, 11, 7, true);
  context.font = "9px 'Courier New', monospace";
  context.fillText(`LV ${level} · ${weapon.rarity}`, x + 7, y + 21);
}

function ownedOrPrice(progress, weaponId) {
  if (progress.ownedWeapons.includes(weaponId)) return "OWNED";
  const weapon = PERMANENT_WEAPONS.find((entry) => entry.id === weaponId);
  return `${weapon.price} coins`;
}

function formatKeyCode(code) {
  return code.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Arrow/, "Arrow ");
}

function weaponUpgradeLabel(progress, weapon) {
  const level = progress.weaponLevels[weapon.id];
  const maxLevel = weaponMaxLevelForMaps(progress.unlockedMaps);
  return `${weapon.name} LV ${level} → ${level >= maxLevel ? "MAX" : `${weaponUpgradeCost(level)} coins`}`;
}

function renderMeleePattern(context, centerX, centerY, facing, weapon, radius) {
  const forwardX = Math.cos(facing);
  const forwardY = Math.sin(facing);
  const sideX = -forwardY;
  const sideY = forwardX;
  const pixel = weapon.shape === "lane" ? 7 : 6;
  const drawPixel = (forward, side = 0) => {
    const x = Math.round(centerX + forwardX * forward + sideX * side);
    const y = Math.round(centerY + forwardY * forward + sideY * side);
    context.fillRect(x - pixel / 2, y - pixel / 2, pixel, pixel);
  };

  if (weapon.shape === "arc") {
    const startAngle = facing - weapon.arc / 2;
    for (let index = 0; index <= 12; index += 1) {
      const angle = startAngle + index / 12 * weapon.arc;
      context.fillRect(
        Math.round(centerX + Math.cos(angle) * radius) - 3,
        Math.round(centerY + Math.sin(angle) * radius) - 3,
        6,
        6,
      );
    }
    return;
  }

  for (let distance = 22; distance <= radius; distance += 14) drawPixel(distance);
  if (weapon.shape === "rake") {
    const halfWidth = weapon.width / 2;
    for (let side = -halfWidth; side <= halfWidth; side += 13) drawPixel(radius, side);
  } else if (weapon.shape === "lane") {
    const halfWidth = weapon.width / 2;
    for (let side = -halfWidth; side <= halfWidth; side += 15) {
      drawPixel(radius * 0.45, side);
      drawPixel(radius, side);
    }
  }
}
