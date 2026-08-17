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
import { LilyQueenBoss } from "../entities/lily-queen-boss.js";
import { LilyPad } from "../entities/lily-pad.js";
import { GroundskeeperBoss } from "../entities/groundskeeper-boss.js";
import { PondfatherBoss } from "../entities/pondfather-boss.js";
import { SporeProjectile } from "../entities/spore-projectile.js";
import { GrassClipping } from "../entities/grass-clipping.js";
import { GolfBallProjectile } from "../entities/golf-ball-projectile.js";
import { GolfBombProjectile } from "../entities/golf-bomb-projectile.js";
import { Golfer } from "../entities/golfer.js";
import { ProGolferBoss } from "../entities/pro-golfer-boss.js";
import { ThrownGnome } from "../entities/thrown-gnome.js";
import { Snail } from "../entities/snail.js";
import { Mosquito } from "../entities/mosquito.js";
import { Deer } from "../entities/deer.js";
import { AncientSnailBoss } from "../entities/ancient-snail-boss.js";
import { SnailSpitProjectile } from "../entities/snail-spit-projectile.js";
import { RogueSoccerBall, Sprinter, Backpack, SchoolBasketball } from "../entities/school-field-enemies.js";
import { SchoolBallProjectile } from "../entities/school-ball-projectile.js";
import { PeTeacherBoss } from "../entities/pe-teacher-boss.js";
import { BallLauncherBoss } from "../entities/ball-launcher-boss.js";
import { ConstructionWorker, TrafficConeEnemy, RunawayTire, BrickCarrier, SafetyVestEnemy } from "../entities/construction-enemies.js";
import { ExcavatorBoss } from "../entities/excavator-boss.js";
import { Chicken, Chick, ChickenEgg, Rooster } from "../entities/chicken-farm-enemies.js";
import { MotherHenBoss } from "../entities/mother-hen-boss.js";
import { renderHeldWeaponVisual } from "../entities/held-weapon.js";
import { COLORS } from "../config/game-config.js";
import { FIRST_MAP, MAP_SLOTS, mapById } from "../config/map-config.js";
import { ENEMY_GLOSSARY } from "../config/glossary-config.js";
import { CHARACTER_STAT_COSTS, characterStatMaxLevelForMaps, weaponMaxLevelForMaps, weaponUpgradeCost } from "../config/economy-config.js";
import { applyRunWeaponBonuses, isEnemyHitByMelee, WEAPON_DEFINITIONS, WEAPONS, WEAPONS_SORTED_BY_RARITY, weaponById, weaponForSlot, weaponLevelWithLoadoutBonus, weaponStatsAtLevel, weaponsForSlot, weaponsVisibleInCollection } from "../config/weapons.js";
import { applyFire, applyFreeze, applyKnockback, nearestBounceTarget, totalContactDamage, updateEnemyStatus } from "../systems/combat.js";
import { applyRunUpgrade, chooseRunUpgrades, loadProgress, REPEATABLE_GOLD_UPGRADES, saveProgress, unlockAllMaps, unlockAllWeapons, unlockSeasonWeapons, xpRequiredForLevel } from "../systems/progression.js";
import { dailyQuestTimeRemaining, ensureDailyQuests, formatQuestTimer, updateDailyQuestProgress } from "../systems/daily-quests.js";
import { buySeasonWeapon, claimCompletedSeasonQuests, ensureSeasonState, exchangeSeasonCoin, PARTY_HAT_COST, PINATA_COST, RAINBOW_APPLE_COST, RAINBOW_HORSESHOE_COST, SEASON_ACTIVE, SEASON_COIN_EXCHANGE_VALUE, SEASON_DAILY_CLAIM_LIMIT, updateSeasonQuestProgress } from "../systems/season.js";
import { buyWeapon, chestCost, openChest, shopWeaponPrice, upgradeCharacterStat, upgradeWeapon } from "../systems/economy.js";

const FIXED_STEP = 1 / 60;
const MAX_FRAME_TIME = 0.1;
const MAX_ENEMIES = 220;
const MAX_COMMON_WEEDS = 100;
const MAX_STRONGWEEDS = 300;
const GNOME_HEALTH = 54;
const MAP_SELECTION_VISIBLE_COUNT = 5;
const SHOP_WEAPON_IDS = Object.freeze([
  "tennis-balls", "hedge-clippers", "acorn-slingshot", "beach-ball", "diet-cola-launcher",
  "pebble-shooter", "jumper-cables", "garden-mirror", "orbital-sprinkler",
]);
const SCREEN_SHAKE_DIRECTIONS = Object.freeze([
  [1, 0],
  [-1, 0],
  [0, -1],
  [0, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
  [1, 1],
]);

export class Game {
  constructor(canvas, debugOutput, options = {}) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.debugOutput = debugOutput;
    this.previewInstance = options.previewInstance === true;
    this.input = options.input ?? new Input(canvas);
    this.random = Math.random;
    this.player = new Player();
    this.camera = new Camera(this.previewInstance ? canvas.width : window.innerWidth, this.previewInstance ? canvas.height : window.innerHeight, FIRST_MAP.world.width, FIRST_MAP.world.height);
    this.debugVisible = false;
    this.accumulator = 0;
    this.previousTime = 0;
    this.frames = 0;
    this.fps = 0;
    this.fpsElapsed = 0;
    const savedProgress = loadProgress(window.localStorage);
    this.progress = savedProgress;
    unlockAllWeapons(this.progress);
    unlockSeasonWeapons(this.progress);
    unlockAllMaps(this.progress);
    ensureDailyQuests(this.progress);
    ensureSeasonState(this.progress);
    saveProgress(window.localStorage, this.progress);
    this.input.setKeybinds(savedProgress.keybinds);
    this.bankCoins = this.progress.coins;
    this.questSaveTimer = 0;
    this.unlockedMaps = new Set(savedProgress.unlockedMaps);
    this.selectedMapId = "backyard";
    this.currentMap = FIRST_MAP;
    this.world = FIRST_MAP.world;
    this.menuMessage = "";
    this.permanentUpgradeCategory = null;
    this.glossaryTab = "bestiary";
    this.glossaryScroll = 0;
    this.mapSelectionScroll = 0;
    this.shopScroll = 0;
    this.weaponSelectionScroll = { melee: 0, ranged: 0 };
    this.weaponSearch = { melee: "", ranged: "" };
    this.arsenalScroll = { melee: 0, ranged: 0 };
    this.weaponPreview = null;
    this.weaponPreviewReturnState = null;
    this.uiHitTargets = [];

    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    if (!this.previewInstance) {
      window.addEventListener("resize", this.resize);
      this.resize();
    }
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
    this.magnetActive = false;
    this.syrupSplats = [];
    this.explosions = [];
    this.attackEffects = [];
    this.weaponFlashes = [];
    this.deathEffects = [];
    this.hitEffects = [];
    this.floatingDamageNumbers = [];
    this.abilityProjectiles = [];
    this.thrownGnomes = [];
    this.bossProjectiles = [];
    this.sprinklerMines = [];
    this.bugZappers = [];
    this.gardenDecoys = [];
    this.fertilizerClouds = [];
    this.pendingBurstShots = [];
    this.leafTornadoes = [];
    this.lightningRods = [];
    this.gardenMirrors = [];
    this.doorbells = [];
    this.orbitalStrikes = [];
    this.lightningArcs = [];
    this.polarityPulses = [];
    this.doorbellWaves = [];
    this.polarityNext = "pull";
    this.activeObstacles = (this.currentMap.obstacles ?? []).map((obstacle) => ({ ...obstacle }));
    this.slimeTerrain = [];
    this.constructionHazards = [];
    this.constructionProjectiles = [];
    this.constructionDebrisTimer = 6 + Math.random() * 4;
    this.lilypads = this.currentMap.id === "aquatic-garden" ? this.createLilyPads() : [];
    this.weaponSlot = 1;
    this.attackCooldown = 0;
    this.attackCooldowns = { 1: 0, 2: 0 };
    this.meleePulse = 0;
    this.meleeEffectWeapon = null;
    this.screenShakeTime = 0;
    this.screenShakeDuration = 0;
    this.screenShakeStrength = 0;
    this.screenShakeFrame = 0;
    this.screenKickX = 0;
    this.screenKickY = 0;
    this.runTime = 0;
    this.runCoins = 0;
    this.runXp = 0;
    this.runLevel = 1;
    this.levelXp = 0;
    this.xpToNextLevel = xpRequiredForLevel(this.runLevel);
    this.appliedUpgrades = [];
    this.appliedUpgradeIds = new Set();
    this.upgradeChoices = [];
    this.upgradeSelectionDelay = 0;
    this.syrupTimer = 0;
    this.passiveCooldowns = { mower: 5, battery: 5, freeze: 5, scarecrow: 5, flamingo: 5 };
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
    this.input.setTextCapture(this.screenState === "melee-selection" || this.screenState === "ranged-selection");

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
      const previousQuestRefresh = this.progress.dailyQuests?.refreshAt;
      ensureDailyQuests(this.progress);
      if (previousQuestRefresh !== this.progress.dailyQuests.refreshAt) this.savePermanentProgress();
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
      if (menuAction === "quests") {
        this.screenState = "quests";
        this.input.consumeUpgradeChoice();
        return;
      }
      if (menuAction === "season-shop" && SEASON_ACTIVE) {
        this.screenState = "season-shop";
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
        const visibleCount = Math.min(MAP_SELECTION_VISIBLE_COUNT, MAP_SLOTS.length);
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
      this.input.setTextCapture(true);
      this.input.consumeMenuAction();
      if (this.input.consumePauseRequest()) {
        this.screenState = "menu";
        return;
      }
      const slot = this.screenState === "melee-selection" ? "melee" : "ranged";
      const allWeapons = this.ownedWeaponsForSlot(slot);
      const uiAction = this.consumeUiAction();
      if (uiAction === "back") {
        this.screenState = slot === "ranged" ? "melee-selection" : "menu";
        return;
      }
      if (uiAction?.type === "weapon-search-clear") {
        this.weaponSearch[slot] = "";
        this.weaponSelectionScroll[slot] = 0;
      }
      const searchText = this.input.consumeTextInput();
      const backspaces = this.input.consumeBackspaceRequest();
      if (searchText) this.weaponSearch[slot] = `${this.weaponSearch[slot]}${searchText}`.slice(0, 28);
      if (backspaces) this.weaponSearch[slot] = this.weaponSearch[slot].slice(0, Math.max(0, this.weaponSearch[slot].length - backspaces));
      const query = this.weaponSearch[slot].trim().toLowerCase();
      const weapons = query
        ? allWeapons.filter((weapon) => `${weapon.name} ${weapon.rarity} ${weapon.id}`.toLowerCase().includes(query))
        : allWeapons;
      const scrollDirection = uiAction?.type === "weapon-scroll"
        ? uiAction.value
        : this.input.consumeScrollRequest();
      if (scrollDirection) {
        const visibleCount = Math.min(5, weapons.length);
        const maxOffset = Math.max(0, weapons.length - visibleCount);
        this.weaponSelectionScroll[slot] = clamp(this.weaponSelectionScroll[slot] + scrollDirection, 0, maxOffset);
      }
      const choice = uiAction?.type === "choice" ? uiAction.value : this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      const offset = this.weaponSelectionScroll[slot] ?? 0;
      if (choice !== null && weapons[offset + choice - 1]) this.progress.equippedWeapons[slot] = weapons[offset + choice - 1].id;
      if (this.input.consumeConfirmRequest() || uiAction === "confirm") {
        if (slot === "melee") this.screenState = "ranged-selection";
        else {
          this.savePermanentProgress();
          this.resetRun();
        }
      }
      return;
    }

    if (this.screenState === "weapon-preview") {
      const uiAction = this.consumeUiAction();
      if (this.input.consumePauseRequest() || uiAction === "preview-close") {
        this.screenState = this.weaponPreviewReturnState ?? "menu";
        this.weaponPreview = null;
        this.input.pointer.down = false;
        return;
      }
      if (uiAction === "preview-buy" && this.weaponPreviewReturnState === "shop") {
        const weapon = weaponById(this.weaponPreview?.weaponId);
        const success = weapon && buyWeapon(this.progress, weapon.id, shopWeaponPrice(weapon.id), false);
        this.bankCoins = this.progress.coins;
        this.menuMessage = success ? `${weapon.name} purchased` : "Cannot purchase weapon";
        if (success) this.savePermanentProgress();
      }
      this.updateWeaponPreview(deltaTime, uiAction == null);
      this.input.consumeMenuAction();
      this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
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
      const shopScroll = uiAction?.type === "shop-scroll" ? uiAction.value : this.input.consumeScrollRequest();
      if (shopScroll) this.shopScroll = clamp(this.shopScroll + shopScroll * 3, 0, Math.max(0, this.shopItems().length - 6));
      if (uiAction?.type === "weapon-preview") {
        this.openWeaponPreview(uiAction.value, "shop");
        return;
      }
      const choice = uiAction?.type === "choice" ? uiAction.value : this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      if (choice !== null) this.handleShopChoice(choice);
      this.updateDebugOutput();
      return;
    }

    if (this.screenState === "quests") {
      if (this.input.consumePauseRequest() || this.consumeUiAction() === "back") this.screenState = "menu";
      this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      return;
    }

    if (this.screenState === "season-shop") {
      const uiAction = this.consumeUiAction();
      if (this.input.consumePauseRequest() || uiAction === "back") {
        this.screenState = "menu";
        return;
      }
      if (uiAction?.type === "season-buy") {
        const weapon = weaponById(uiAction.value);
        this.menuMessage = buySeasonWeapon(this.progress, uiAction.value)
          ? `${weapon.name} unlocked!`
          : this.progress.ownedWeapons.includes(uiAction.value) ? `${weapon.name} already owned.` : "Not enough Season Coins.";
        this.savePermanentProgress();
      } else if (uiAction === "season-exchange") {
        if (exchangeSeasonCoin(this.progress)) {
          this.bankCoins = this.progress.coins;
          this.menuMessage = `Exchanged 1 Season Coin for ${SEASON_COIN_EXCHANGE_VALUE} Coins.`;
        } else {
          this.menuMessage = "You need 1 Season Coin to exchange.";
        }
        this.savePermanentProgress();
      } else if (uiAction === "season-claim") {
        const result = claimCompletedSeasonQuests(this.progress);
        this.menuMessage = result.claimed
          ? `Claimed ${result.coins} Season Coins · ${result.remaining} rewards left today`
          : result.remaining <= 0 ? "Daily reward limit reached. Completed quests remain until tomorrow." : "Complete a Season Quest first.";
        this.savePermanentProgress();
      }
      this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
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
        this.glossaryScroll = clamp(this.glossaryScroll + uiAction.value * 48, 0, this.glossaryMaxScroll(this.camera.viewWidth, this.camera.viewHeight));
      } else if (uiAction?.type === "weapon-preview") {
        this.openWeaponPreview(uiAction.value, "glossary");
        return;
      }
      if (!uiAction || (uiAction?.type !== "glossary-scroll" && uiAction !== "back")) {
        const scrollDirection = this.input.consumeScrollRequest();
        if (scrollDirection) this.glossaryScroll = clamp(this.glossaryScroll + scrollDirection * 48, 0, this.glossaryMaxScroll(this.camera.viewWidth, this.camera.viewHeight));
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
      this.upgradeSelectionDelay = Math.max(0, this.upgradeSelectionDelay - deltaTime);
      const uiAction = this.consumeUiAction();
      const choice = uiAction?.type === "choice" ? uiAction.value : this.input.consumeUpgradeChoice();
      this.input.consumeWeaponSlot();
      if (choice !== null && this.upgradeSelectionDelay <= 0) {
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
    this.updateTemporaryObstacles(deltaTime);
    this.updateConstructionSite(deltaTime);
    const river = this.currentMap.obstacles?.find((obstacle) => obstacle.kind === "river");
    if (river) {
      for (const lilyPad of this.lilypads) {
        if (lilyPad.update(deltaTime, river).spawnStrongweed) {
          const angle = (this.random ?? Math.random)() * Math.PI * 2;
          const distance = 22 + (this.random ?? Math.random)() * 24;
          this.spawnStrongweedAt(
            lilyPad.x + Math.cos(angle) * distance,
            lilyPad.y + Math.sin(angle) * distance,
          );
          lilyPad.resetSpawnTimer();
        }
      }
    }

    let aimPoint = this.camera.screenToWorld(this.input.pointer);
    this.player.update(deltaTime, this.input.movementVector(), aimPoint, this.world, this.activeObstacles);
    this.camera.follow(this.player, deltaTime);
    aimPoint = this.camera.screenToWorld(this.input.pointer);
    this.player.updateRecoil(deltaTime, this.input.pointer.down);

    this.attackCooldowns[1] = Math.max(0, this.attackCooldowns[1] - deltaTime);
    this.attackCooldowns[2] = Math.max(0, this.attackCooldowns[2] - deltaTime);
    this.attackCooldown = this.attackCooldowns[this.weaponSlot];
    this.meleePulse = Math.max(0, this.meleePulse - deltaTime);
    for (const effect of this.attackEffects ?? []) effect.lifetime -= deltaTime;
    this.attackEffects = (this.attackEffects ?? []).filter((effect) => effect.lifetime > 0);
    for (const flash of this.weaponFlashes ?? []) flash.lifetime -= deltaTime;
    this.weaponFlashes = (this.weaponFlashes ?? []).filter((flash) => flash.lifetime > 0);
    for (const effect of this.deathEffects ?? []) {
      effect.lifetime -= deltaTime;
      effect.angle += effect.angularVelocity * deltaTime;
      const progress = 1 - Math.max(0, effect.lifetime) / effect.maxLifetime;
      const distance = effect.spiralDistance * progress;
      const fall = progress * progress;
      effect.enemy.x = effect.originX + Math.cos(effect.angle) * distance + effect.fallX * fall;
      effect.enemy.y = effect.originY + Math.sin(effect.angle) * distance + effect.fallY * fall;
    }
    this.deathEffects = (this.deathEffects ?? []).filter((effect) => effect.lifetime > 0);
    for (const effect of this.hitEffects ?? []) {
      effect.lifetime -= deltaTime;
      for (const particle of effect.particles ?? []) {
        particle.velocityY += 360 * deltaTime;
        particle.x += particle.velocityX * deltaTime;
        particle.y += particle.velocityY * deltaTime;
        particle.velocityX *= Math.exp(-deltaTime * 2.5);
      }
    }
    this.hitEffects = (this.hitEffects ?? []).filter((effect) => effect.lifetime > 0);
    this.screenShakeTime = Math.max(0, (this.screenShakeTime ?? 0) - deltaTime);
    this.screenShakeStrength = Math.max(0, (this.screenShakeStrength ?? 0) - deltaTime * 0.7);
    if (this.screenShakeTime <= 0) {
      this.screenShakeDuration = 0;
      this.screenShakeFrame = 0;
    }
    const kickDamping = Math.exp(-deltaTime * 18);
    this.screenKickX = (this.screenKickX ?? 0) * kickDamping;
    this.screenKickY = (this.screenKickY ?? 0) * kickDamping;
    for (const number of this.floatingDamageNumbers ?? []) {
      number.lifetime -= deltaTime;
      number.y -= number.riseSpeed * deltaTime;
      number.x += number.drift * deltaTime;
    }
    this.floatingDamageNumbers = (this.floatingDamageNumbers ?? []).filter((number) => number.lifetime > 0);
    this.runTime += deltaTime;
    const playQuestCoins = updateDailyQuestProgress(this.progress, { type: "play-time", amount: deltaTime });
    updateSeasonQuestProgress(this.progress, { type: "play-time", amount: deltaTime });
    if (playQuestCoins > 0) {
      this.bankCoins = this.progress.coins;
      this.menuMessage = `Daily quest complete: +${playQuestCoins} coins`;
      this.savePermanentProgress();
    }
    this.questSaveTimer -= deltaTime;
    if (this.questSaveTimer <= 0) {
      this.questSaveTimer = 5;
      this.savePermanentProgress();
    }
    if (!this.bossSpawned && this.bossNextSpawnTimer !== null) {
      this.bossNextSpawnTimer -= deltaTime;
      if (this.bossNextSpawnTimer <= 0) this.spawnBoss();
    } else if (!this.bossSpawned && this.runTime >= this.currentMap.bossSpawnTime) {
      this.spawnBoss();
    }
    this.spawnTimer -= deltaTime;
    const isWeedMap = this.currentMap.normalEnemyType === "weed"
      || this.currentMap.normalEnemyType === "aquatic-garden";
    const commonWeedCount = isWeedMap
      ? this.enemies.filter((enemy) => enemy instanceof CommonWeed && !enemy.bossMode && enemy.active).length
      : 0;
    const population = isWeedMap ? commonWeedCount : this.enemies.length;
    const populationLimit = isWeedMap ? MAX_COMMON_WEEDS : (this.currentMap.enemyCap ?? MAX_ENEMIES);
    if (!this.bossSpawned && this.spawnTimer <= 0 && population < populationLimit) {
      const burstSize = this.currentMap.normalEnemyType === "chicken-farm" ? 1 : 1 + Math.floor(this.runTime / 45);
      const availableSlots = populationLimit - population;
      for (let index = 0; index < Math.min(burstSize, availableSlots); index += 1) {
        this.spawnNormalEnemy();
      }
      const spawnMultiplier = this.currentMap.normalEnemyType === "park" ? 1.3
        : this.currentMap.normalEnemyType === "lake" ? 1.5
          : this.currentMap.normalEnemyType === "golf" ? 1.1
            : this.currentMap.normalEnemyType === "redwood-trail" ? 1.15 : 1;
      const schoolSpawnMultiplier = this.currentMap.normalEnemyType === "school-field" ? 1.28 : 1;
      this.spawnTimer = Math.max(0.6, 2.25 - this.runTime * 0.018) * spawnMultiplier * schoolSpawnMultiplier;
    }

    if (this.player.syrupTrail && this.player.isMoving) {
      this.syrupTimer -= deltaTime;
      if (this.syrupTimer <= 0) {
        this.syrupSplats.push({ x: this.player.x, y: this.player.y + 14, lifetime: 7 });
        this.syrupTimer = 0.7;
      }
    }

    const attackRequested = this.input.consumeAttackRequest();
    if ((this.input.pointer.down || attackRequested) && this.attackCooldowns[this.weaponSlot] <= 0) {
      this.attack(aimPoint);
    }
    this.updatePassiveAbilities(deltaTime);
    this.updateWeaponDeployables(deltaTime);
    this.updatePendingBurstShots(deltaTime);

    for (const projectile of this.projectiles) {
      if (projectile.horseshoe && projectile.active) {
        const distanceFromOrigin = Math.hypot(projectile.x - projectile.originX, projectile.y - projectile.originY);
        if (!projectile.returning && distanceFromOrigin >= projectile.horseshoeRange) {
          projectile.returning = true;
          projectile.horseshoeOrbiting = true;
          projectile.horseshoeOrbitTime = 0;
          projectile.horseshoeOrbitRadius = Math.max(70, Math.min(135, Math.hypot(projectile.x - this.player.x, projectile.y - this.player.y)));
          projectile.horseshoeOrbitAngle = Math.atan2(projectile.y - this.player.y, projectile.x - this.player.x);
        }
        if (projectile.horseshoeOrbiting) {
          projectile.horseshoeOrbitTime += deltaTime;
          projectile.horseshoeOrbitAngle += (projectile.horseshoeDirection ?? 1) * 4.8 * deltaTime;
          const orbitX = this.player.x + Math.cos(projectile.horseshoeOrbitAngle) * projectile.horseshoeOrbitRadius;
          const orbitY = this.player.y + Math.sin(projectile.horseshoeOrbitAngle) * projectile.horseshoeOrbitRadius;
          projectile.velocityX = (orbitX - projectile.x) / Math.max(deltaTime, 0.001);
          projectile.velocityY = (orbitY - projectile.y) / Math.max(deltaTime, 0.001);
          const orbitDuration = projectile.horseshoeOrbitCount * Math.PI * 2 / 4.8;
          if (projectile.horseshoeOrbitTime >= orbitDuration) projectile.horseshoeOrbiting = false;
        } else if (projectile.returning) {
          const speed = Math.hypot(projectile.velocityX, projectile.velocityY) || 1;
          const dx = this.player.x - projectile.x; const dy = this.player.y - projectile.y;
          const distance = Math.hypot(dx, dy) || 1;
          projectile.velocityX = dx / distance * speed;
          projectile.velocityY = dy / distance * speed;
          if (distance <= this.player.radius + projectile.radius) projectile.active = false;
        }
      } else if (projectile.boomerang && projectile.active) {
        const distanceFromOrigin = Math.hypot(projectile.x - projectile.originX, projectile.y - projectile.originY);
        if (!projectile.returning && distanceFromOrigin >= projectile.boomerangRange) {
          projectile.returning = true;
          const dx = this.player.x - projectile.x; const dy = this.player.y - projectile.y;
          const distance = Math.hypot(dx, dy) || 1;
          projectile.velocityX = dx / distance * projectile.returnSpeed;
          projectile.velocityY = dy / distance * projectile.returnSpeed;
        } else if (projectile.returning) {
          const dx = this.player.x - projectile.x; const dy = this.player.y - projectile.y;
          const distance = Math.hypot(dx, dy) || 1;
          projectile.velocityX = dx / distance * projectile.returnSpeed;
          projectile.velocityY = dy / distance * projectile.returnSpeed;
          if (distance <= this.player.radius + projectile.radius) projectile.active = false;
        }
      }
      if (projectile.active && !projectile.reflected && projectile.kind !== "garden-mirror") {
        for (const mirror of this.gardenMirrors) {
          if (!mirror.active || Math.hypot(projectile.x - mirror.x, projectile.y - mirror.y) > mirror.radius + projectile.radius) continue;
          const target = this.enemies.filter((enemy) => enemy.active && enemy.targetable !== false)
            .sort((a, b) => Math.hypot(a.x - projectile.x, a.y - projectile.y) - Math.hypot(b.x - projectile.x, b.y - projectile.y))[0];
          if (!target) break;
          const speed = Math.hypot(projectile.velocityX, projectile.velocityY) || 1;
          const dx = target.x - projectile.x; const dy = target.y - projectile.y; const distance = Math.hypot(dx, dy) || 1;
          projectile.velocityX = dx / distance * speed; projectile.velocityY = dy / distance * speed;
          projectile.reflected = true;
          projectile.piercesRemaining = projectile.initialPierces;
          projectile.bouncesRemaining = projectile.initialBounces;
          projectile.damage *= mirror.damageMultiplier;
          mirror.flash = 0.18;
          break;
        }
      }
      if (projectile.kind === "firecracker" && projectile.active
        && this.enemies.some((enemy) => enemy.active && Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y) <= this.player.radius + (enemy.radius ?? 16) + projectile.radius)) {
        projectile.x = this.player.x; projectile.y = this.player.y; projectile.lifetime = 0;
      }
      projectile.update(deltaTime);
      if (projectile.active && !projectile.gravityPull) {
        for (const tree of this.activeObstacles.filter((obstacle) => obstacle.kind === "redwood-trunk" && obstacle.solid !== false)) {
          const closestX = clamp(projectile.x, tree.x, tree.x + tree.width);
          const closestY = clamp(projectile.y, tree.y, tree.y + tree.height);
          if (Math.hypot(projectile.x - closestX, projectile.y - closestY) > projectile.radius) continue;
          if (projectile.kind === "beach-ball" && projectile.bouncesRemaining > 0) {
            const horizontal = Math.min(Math.abs(projectile.x - tree.x), Math.abs(projectile.x - (tree.x + tree.width)));
            const vertical = Math.min(Math.abs(projectile.y - tree.y), Math.abs(projectile.y - (tree.y + tree.height)));
            if (horizontal < vertical) projectile.velocityX *= -1; else projectile.velocityY *= -1;
            projectile.bouncesRemaining -= 1;
            const target = nearestBounceTarget(projectile, this.enemies, null);
            if (target) {
              const dx = target.x - projectile.x; const dy = target.y - projectile.y; const distance = Math.hypot(dx, dy) || 1;
              const speed = Math.hypot(projectile.velocityX, projectile.velocityY);
              projectile.velocityX = dx / distance * speed; projectile.velocityY = dy / distance * speed;
            }
            if (projectile.bouncesRemaining === 0) {
              this.explosions.push({ x: projectile.x, y: projectile.y, lifetime: 0.28, radius: projectile.splashRadius, color: projectile.color });
              for (const enemy of this.enemies) {
                if (enemy.active && enemy.targetable !== false && Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) <= projectile.splashRadius) {
                  this.damageEnemy(enemy, Math.round(projectile.damage * projectile.splashDamageMultiplier), 0, projectile.weaponId);
                }
              }
              projectile.active = false;
            }
          } else {
            projectile.active = false;
          }
          break;
        }
      }
      if (!projectile.active && projectile.detonateOnExpiry) {
        if (projectile.kind === "fertilizer-bag") {
          this.createFertilizerCloud(projectile.x, projectile.y, projectile);
          projectile.detonateOnExpiry = false;
          continue;
        }
        if (projectile.kind === "polarity") {
          this.detonatePolarityProjectile(projectile);
          projectile.detonateOnExpiry = false;
          continue;
        }
        this.detonateProjectile(projectile);
        projectile.detonateOnExpiry = false;
        continue;
      }
      if (projectile.kind === "gravity-portal" && projectile.active) {
        for (const nearby of this.enemies) {
          if (!nearby.active || nearby.targetable === false) continue;
          const dx = projectile.x - nearby.x; const dy = projectile.y - nearby.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance <= projectile.splashRadius) {
            const pull = Math.min(90, projectile.gravityPull * deltaTime * (1 - distance / projectile.splashRadius));
            nearby.x += dx / distance * pull; nearby.y += dy / distance * pull;
            nearby.slowTime = Math.max(nearby.slowTime ?? 0, projectile.freezeDuration);
            nearby.freezeTime = Math.max(nearby.freezeTime ?? 0, projectile.freezeDuration);
          }
        }
      }
      if (projectile.boundaryBounces && projectile.active) {
        let bounced = false;
        if ((projectile.x - projectile.radius < 0 || projectile.x + projectile.radius > this.world.width) && projectile.bouncesRemaining > 0) {
          projectile.velocityX *= -1; projectile.x = Math.max(projectile.radius, Math.min(this.world.width - projectile.radius, projectile.x)); bounced = true;
        }
        if ((projectile.y - projectile.radius < 0 || projectile.y + projectile.radius > this.world.height) && projectile.bouncesRemaining > 0) {
          projectile.velocityY *= -1; projectile.y = Math.max(projectile.radius, Math.min(this.world.height - projectile.radius, projectile.y)); bounced = true;
        }
        if (bounced) {
          projectile.bouncesRemaining -= 1;
          const nearestEnemy = nearestBounceTarget(projectile, this.enemies, null);
          if (nearestEnemy && projectile.kind === "beach-ball") {
            const targetX = nearestEnemy.x - projectile.x;
            const targetY = nearestEnemy.y - projectile.y;
            const targetDistance = Math.hypot(targetX, targetY) || 1;
            const speed = Math.hypot(projectile.velocityX, projectile.velocityY);
            projectile.velocityX = targetX / targetDistance * speed;
            projectile.velocityY = targetY / targetDistance * speed;
          }
          if (projectile.bouncesRemaining === 0) {
            this.explosions.push({ x: projectile.x, y: projectile.y, lifetime: 0.28, radius: projectile.splashRadius, color: projectile.color });
            for (const enemy of this.enemies) if (enemy.active && Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) <= projectile.splashRadius) this.damageEnemy(enemy, Math.round(projectile.damage * projectile.splashDamageMultiplier), 0, projectile.weaponId);
            projectile.active = false;
          }
        }
      }
      if (!projectile.active) {
        continue;
      }
      for (const enemy of this.enemies) {
        const hitCount = projectile.hitCounts?.get(enemy) ?? 0;
        if (enemy.active && enemy.targetable !== false
          && (projectile.boomerang ? hitCount < 2 : (!projectile.hitEnemies.has(enemy) || (projectile.allowRepeatBounces && projectile.rehitCooldown <= 0)))
          && circlesOverlap(projectile, enemy)) {
          if (projectile.detonateOnExpiry) {
            // Firecracker detonates on contact; if nothing is hit, its range expiry still detonates it.
            if (projectile.kind === "firecracker") {
              this.detonateProjectile(projectile);
              projectile.detonateOnExpiry = false;
              projectile.active = false;
            } else if (projectile.kind === "fertilizer-bag") {
              this.createFertilizerCloud(projectile.x, projectile.y, projectile);
              projectile.detonateOnExpiry = false;
              projectile.active = false;
            } else if (projectile.kind === "polarity") {
              this.detonatePolarityProjectile(projectile);
              projectile.detonateOnExpiry = false;
              projectile.active = false;
            }
            else continue;
          }
          if (!projectile.active) break;
          projectile.hitEnemies.add(enemy);
          if (projectile.boomerang) projectile.hitCounts.set(enemy, hitCount + 1);
          if (projectile.gravityPull > 0) {
            for (const nearby of this.enemies) if (nearby.active && nearby.targetable !== false) {
              const dx = projectile.x - nearby.x; const dy = projectile.y - nearby.y; const distance = Math.hypot(dx, dy);
              if (distance > 0 && distance <= projectile.splashRadius) { nearby.x += dx / distance * projectile.gravityPull * 0.05; nearby.y += dy / distance * projectile.gravityPull * 0.05; }
            }
          }
          if (projectile.allowRepeatBounces) projectile.rehitCooldown = 0.16;
          const hitDamage = projectile.returning
            ? projectile.damage * projectile.returnDamageMultiplier
            : projectile.damage;
          const bossAdjustedDamage = enemy.isBoss
            ? hitDamage * (projectile.bossDamageMultiplier ?? 1)
            : hitDamage;
          this.damageEnemy(enemy, bossAdjustedDamage, projectile.lifesteal, projectile.weaponId);
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
                if (nearbyEnemy !== enemy) this.damageEnemy(nearbyEnemy, Math.round(projectile.damage * projectile.splashDamageMultiplier), projectile.lifesteal, projectile.weaponId);
              }
            }
          }
          if (projectile.splitCount > 0) {
            for (let split = 0; split < projectile.splitCount; split += 1) {
              const angle = split / projectile.splitCount * Math.PI * 2;
              this.projectiles.push(new Projectile({ x: projectile.x, y: projectile.y, velocityX: Math.cos(angle) * 480, velocityY: Math.sin(angle) * 480, damage: projectile.splitDamage, lifetime: 0.35, kind: "firecracker-spark", color: projectile.color, radius: 7, explosive: false, detonateOnExpiry: true, splashRadius: projectile.splitRadius, splashDamageMultiplier: 0.7, fireDamagePerSecond: projectile.fireDamagePerSecond, fireDuration: projectile.fireDuration, fireMaxStacks: projectile.fireMaxStacks, weaponId: projectile.weaponId }));
            }
            projectile.splitCount = 0;
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
      if (!pickup.active) continue;
      const attractAll = this.magnetActive && (pickup.type === "coin" || pickup.type === "xp");
      pickup.update(deltaTime, this.player, { attractAll });
      if (!pickup.active) this.collectPickup(pickup);
    }
    this.pickups = this.pickups.filter((pickup) => pickup.active);
    if (this.magnetActive && !this.pickups.some((pickup) => pickup.type === "coin" || pickup.type === "xp")) {
      this.magnetActive = false;
    }

    for (const splat of this.syrupSplats) splat.lifetime -= deltaTime;
    this.syrupSplats = this.syrupSplats.filter((splat) => splat.lifetime > 0);

    for (const thrownGnome of this.thrownGnomes) {
      thrownGnome.update(deltaTime);
      if (thrownGnome.arrived) {
        if (thrownGnome.damage > 0 && Math.hypot(thrownGnome.x - this.player.x, thrownGnome.y - this.player.y) <= this.player.radius + thrownGnome.radius) {
          this.damagePlayer(thrownGnome.damage);
        }
        this.spawnLandedEnemy(thrownGnome.enemyType, thrownGnome.x, thrownGnome.y, true);
      }
    }
    this.thrownGnomes = this.thrownGnomes.filter((thrownGnome) => !thrownGnome.arrived);

    for (const spore of this.bossProjectiles) {
      spore.update(deltaTime, this.world, this.player);
      if (spore instanceof SnailSpitProjectile && spore.active) {
        for (const tree of this.activeObstacles.filter((obstacle) => obstacle.kind === "redwood-trunk" && obstacle.solid !== false)) {
          const closestX = clamp(spore.x, tree.x, tree.x + tree.width);
          const closestY = clamp(spore.y, tree.y, tree.y + tree.height);
          if (Math.hypot(spore.x - closestX, spore.y - closestY) <= spore.radius) {
            if (spore.bouncesRemaining > 0) {
              const target = { x: this.player.x, y: this.player.y };
              spore.bounceToward(target);
            } else { spore.active = false; spore.impacted = true; }
            break;
          }
        }
      }
      if (spore.impacted && !(spore instanceof SnailSpitProjectile)) this.handleGolfBombImpact(spore);
      if (spore instanceof SnailSpitProjectile && spore.impacted) {
        if (Math.hypot(spore.x - this.player.x, spore.y - this.player.y) <= this.player.radius + spore.radius) this.damagePlayer(spore.damage);
        this.addSlimePuddle(spore.x, spore.y, spore.splashRadius, 5);
        spore.impacted = false;
      }
      if (spore instanceof SnailSpitProjectile && spore.active) {
        const hit = this.enemies.find((enemy) => enemy !== this.boss && enemy.active && enemy.targetable !== false && circlesOverlap(spore, enemy));
        if (hit) {
          this.damageEnemy(hit, spore.damage);
          if (spore.bouncesRemaining > 0) spore.bounceToward({ x: this.player.x, y: this.player.y });
          else { spore.active = false; spore.impacted = true; }
        }
      }
      if (spore.active && !spore.isBomb && circlesOverlap(spore, this.player)) {
        this.damagePlayer(spore.damage);
        if (spore.knockback) {
          const distance = Math.hypot(spore.velocityX, spore.velocityY) || 1;
          this.player.x = clamp(this.player.x + spore.velocityX / distance * spore.knockback, this.player.radius, this.world.width - this.player.radius);
          this.player.y = clamp(this.player.y + spore.velocityY / distance * spore.knockback, this.player.radius, this.world.height - this.player.radius);
        }
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
      const enemyTarget = this.getEnemyTarget(enemy);
      const onRunningTrack = this.currentMap.id === "school-field" && this.activeObstacles.some((obstacle) => obstacle.kind === "running-track"
        && enemy.x >= obstacle.x && enemy.x <= obstacle.x + obstacle.width
        && enemy.y >= obstacle.y && enemy.y <= obstacle.y + obstacle.height);
      const enemyDeltaTime = onRunningTrack ? deltaTime * 1.2 : deltaTime;
      const bossEvents = status.frozen || !enemy.active ? {} : enemy.update(enemyDeltaTime, enemyTarget, this.activeObstacles, this.enemies) ?? {};
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
      if (enemy.isBoss && bossEvents.spawnStrongweed) this.spawnLilyQueenStrongweed(enemy);
      if (bossEvents.slimeTrail) {
        // Snail trail deposits must remain separate so they leave a visible path
        // instead of merging into one puddle that follows the enemy.
        this.addSlimePuddle(
          bossEvents.slimeTrail.x,
          bossEvents.slimeTrail.y,
          bossEvents.slimeTrail.radius,
          bossEvents.slimeTrail.lifetime,
          false,
          false,
        );
      }
      if (enemy.isBoss && bossEvents.permanentSlime) this.addSlimePuddle(bossEvents.permanentSlime.x, bossEvents.permanentSlime.y, bossEvents.permanentSlime.radius, Infinity, true);
      if (enemy.isBoss && bossEvents.spit) this.fireAncientSnailSpit(bossEvents.spit);
      if (enemy.isBoss && bossEvents.shellSlam) {
        const slam = bossEvents.shellSlam;
        const dx = this.player.x - enemy.x; const dy = this.player.y - enemy.y; const distance = Math.hypot(dx, dy) || 1;
        if (distance <= slam.radius) {
          this.damagePlayer(slam.damage);
          this.player.x = clamp(this.player.x + dx / distance * slam.pushback, this.player.radius, this.world.width - this.player.radius);
          this.player.y = clamp(this.player.y + dy / distance * slam.pushback, this.player.radius, this.world.height - this.player.radius);
        }
        this.explosions.push({ x: enemy.x, y: enemy.y, lifetime: 0.45, maxLifetime: 0.45, radius: slam.radius, ring: true, color: "#d6a55a" });
      }
      if (enemy.isBoss && bossEvents.spawnSnail) this.spawnRedwoodEnemy(Math.random() * Math.PI * 2, true, "snail");
      if (enemy.isBoss && bossEvents.spawnRiverbankWeed) this.spawnRiverbankWeed();
      if (bossEvents.throwBrick) this.spawnConstructionProjectile({ ...bossEvents.throwBrick, source: enemy }, "brick");
      if (enemy.isBoss && bossEvents.bucketSlam) this.constructionHazards.push({ type: "bucket-slam", ...bossEvents.bucketSlam, warning: 1, lifetime: 1, source: enemy });
      if (enemy.isBoss && bossEvents.dirtThrow) this.spawnConstructionProjectile(bossEvents.dirtThrow, "dirt");
      if (enemy.isBoss && bossEvents.spawnSupport) {
        const angle = Math.random() * Math.PI * 2;
        this.spawnConstructionEnemyAt(enemy.x + Math.cos(angle) * 90, enemy.y + Math.sin(angle) * 90, true, bossEvents.spawnSupport);
      }
      if (enemy.isBoss && bossEvents.spawnCrew) {
        this.spawnConstructionEnemyAt(enemy.x - 70, enemy.y + 75, true, "worker");
        this.spawnConstructionEnemyAt(enemy.x + 70, enemy.y + 75, true, "worker");
        this.spawnConstructionEnemyAt(enemy.x, enemy.y - 90, true, "brick-carrier");
      }
      if (bossEvents.grow && enemy instanceof Chick) {
        const index = this.enemies.indexOf(enemy);
        const chicken = new Chicken({ x: enemy.x, y: enemy.y }); chicken.bossMinion = enemy.bossMinion;
        if (index >= 0) this.enemies[index] = chicken;
        continue;
      }
      if (bossEvents.hatch && enemy instanceof ChickenEgg) {
        enemy.health = 0;
        for (let chick = 0; chick < 3; chick += 1) {
          const angle = chick / 3 * Math.PI * 2;
          this.spawnChickenFarmEnemyAt(enemy.x + Math.cos(angle) * 22, enemy.y + Math.sin(angle) * 22, "chick", enemy.bossMinion);
        }
        this.explosions.push({ x: enemy.x, y: enemy.y, radius: 32, lifetime: .3, maxLifetime: .3, color: "#f4ead2" });
        continue;
      }
      if (bossEvents.crow && enemy instanceof Rooster) {
        for (const farmEnemy of this.enemies) {
          if ((farmEnemy instanceof Chicken || farmEnemy instanceof Chick) && !farmEnemy.isBoss
            && Math.hypot(farmEnemy.x - enemy.x, farmEnemy.y - enemy.y) <= bossEvents.crow.radius) {
            farmEnemy.speedBuffTime = Math.max(farmEnemy.speedBuffTime ?? 0, bossEvents.crow.duration);
            farmEnemy.maxShield = Math.max(farmEnemy.maxShield ?? 0, 100);
            farmEnemy.shield = Math.max(farmEnemy.shield ?? 0, 100);
            farmEnemy.crowShieldActive = true;
          }
        }
      }
      if (enemy.isBoss && bossEvents.tossEggs) {
        for (const target of bossEvents.tossEggs) {
          const x = clamp(target.x, 20, this.world.width - 20);
          const y = clamp(target.y, 20, this.world.height - 20);
          this.thrownGnomes.push(new ThrownGnome({ x: enemy.x, y: enemy.y, targetX: x, targetY: y, speed: 560, enemyType: "chicken-egg" }));
        }
      }
      if (enemy.isBoss && bossEvents.chickenRush) {
        for (let chickenIndex = 0; chickenIndex < bossEvents.chickenRush; chickenIndex += 1) {
          const angle = chickenIndex / bossEvents.chickenRush * Math.PI * 2;
          const chicken = this.spawnChickenFarmEnemyAt(enemy.x + Math.cos(angle) * 82, enemy.y + Math.sin(angle) * 82, "chicken", true);
          if (chicken) chicken.sprintTime = 1;
        }
      }
      if (enemy.isBoss && bossEvents.wingBlast) {
        const blast = bossEvents.wingBlast;
        const aim = Math.atan2(blast.targetY - enemy.y, blast.targetX - enemy.x);
        const dx = this.player.x - enemy.x; const dy = this.player.y - enemy.y; const distance = Math.hypot(dx, dy) || 1;
        const angleDifference = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - aim), Math.cos(Math.atan2(dy, dx) - aim)));
        if (distance <= blast.radius && angleDifference <= blast.arc / 2) {
          this.damagePlayer(blast.damage);
          this.player.x = clamp(this.player.x + dx / distance * blast.pushback, this.player.radius, this.world.width - this.player.radius);
          this.player.y = clamp(this.player.y + dy / distance * blast.pushback, this.player.radius, this.world.height - this.player.radius);
        }
        this.explosions.push({ x: enemy.x + Math.cos(aim) * blast.radius * .45, y: enemy.y + Math.sin(aim) * blast.radius * .45, radius: blast.radius * .55, lifetime: .45, maxLifetime: .45, color: "#f5ead1" });
      }
      if (enemy.isBoss && bossEvents.divebomb) {
        this.damagePlayer(50);
        const dx = this.player.x - enemy.waterX;
        const dy = this.player.y - enemy.waterY;
        const distance = Math.hypot(dx, dy) || 1;
        this.player.x = clamp(this.player.x + dx / distance * 120, this.player.radius, this.world.width - this.player.radius);
        this.player.y = clamp(this.player.y + dy / distance * 120, this.player.radius, this.world.height - this.player.radius);
      }
      if (bossEvents.copyWeed) this.spawnCommonWeedAt(bossEvents.copyWeed.x, bossEvents.copyWeed.y);
      resolveEnemyObstacles(enemy, this.activeObstacles);
      if (enemy.isBoss && bossEvents.fireClippings) this.fireGroundskeeperClippings(bossEvents.fireClippings);
      if (bossEvents.fireGolfBall) this.fireGolfBall(bossEvents.fireGolfBall);
      if (enemy.isBoss && bossEvents.attack) this.fireProGolferAttack(enemy, bossEvents.attack);
      if (enemy.isBoss && bossEvents.throwDodgeball) this.fireSchoolBall(bossEvents.throwDodgeball, "dodgeball");
      if (enemy.isBoss && bossEvents.whistle) {
        const whistleRadius = enemy.config?.whistleRadius ?? 240;
        const whistleDamage = enemy.config?.whistleDamage ?? 35;
        const whistleKnockback = enemy.config?.whistleKnockback ?? 130;
        const dx = this.player.x - enemy.x; const dy = this.player.y - enemy.y; const distance = Math.hypot(dx, dy) || 1;
        if (distance <= whistleRadius) {
          this.damagePlayer(whistleDamage);
          this.player.x = clamp(this.player.x + dx / distance * whistleKnockback, this.player.radius, this.world.width - this.player.radius);
          this.player.y = clamp(this.player.y + dy / distance * whistleKnockback, this.player.radius, this.world.height - this.player.radius);
        }
        this.explosions.push({ x: enemy.x, y: enemy.y, lifetime: 0.55, maxLifetime: 0.55, radius: whistleRadius, ring: true, color: "#f4e27a" });
      }
      if (enemy.isBoss && bossEvents.fireRandomBall) this.fireBallLauncherShot(bossEvents.fireRandomBall, enemy.config);
      if (enemy.isBoss && bossEvents.ballDump) this.fireSchoolBallDump(enemy);
      if (enemy.isBoss && bossEvents.crushObstacles?.length) {
        for (const obstacle of bossEvents.crushObstacles) {
          this.activeObstacles = this.activeObstacles.filter((entry) => entry !== obstacle);
          if (enemy.summonSquirrels) {
            this.spawnParkEnemyAt(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, false, true);
            this.spawnParkEnemyAt(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, true, true);
          }
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
      if (enemyTarget !== this.player && enemy.active && circlesOverlap(enemy, enemyTarget)) {
        enemyTarget.health -= (enemy.damage ?? 4) * deltaTime;
      }
      if (this.syrupSplats.some((splat) => Math.hypot(enemy.x - splat.x, enemy.y - splat.y) <= 34)) {
        enemy.slowTime = Math.max(enemy.slowTime, 0.15);
      }
      if (enemy.active && enemy.targetable !== false && circlesOverlap(enemy, this.player)
        && !(enemy instanceof SchoolBasketball && enemy.bounceHeight > 4)) {
        touchingEnemies.push(enemy);
      }
    }
    if (this.enemies.some((enemy) => enemy instanceof CommonWeed && enemy.active)) {
      this.separateWeeds();
    }
    if (touchingEnemies.length > 0) {
      this.damagePlayer(totalContactDamage(touchingEnemies));
    }
    this.enemies = this.enemies.filter((enemy) => enemy.active);

    if (this.player.health <= 0 && this.screenState === "running") {
      this.finishRun();
    }

    this.updateDebugOutput();
  }

  addSlimePuddle(x, y, radius = 30, lifetime = 5, permanent = false, merge = true) {
    const nearby = merge && this.slimeTerrain.find((puddle) => puddle.permanent === permanent
      && Math.hypot(puddle.x - x, puddle.y - y) < Math.min(puddle.radius, radius) * 0.7);
    if (nearby) {
      nearby.lifetime = permanent ? Infinity : Math.max(nearby.lifetime, lifetime);
      nearby.radius = Math.max(nearby.radius, radius);
      nearby.x = (nearby.x + x) / 2; nearby.y = (nearby.y + y) / 2;
      return;
    }
    this.slimeTerrain.push({ x, y, radius, lifetime, permanent });
    if (this.slimeTerrain.length > 1800) this.slimeTerrain.splice(0, this.slimeTerrain.length - 1800);
  }

  spawnConstructionProjectile(event, type) {
    const dx = event.targetX - event.x; const dy = event.targetY - event.y; const distance = Math.hypot(dx, dy) || 1;
    this.constructionProjectiles.push({
      type, x: event.x, y: event.y, targetX: event.targetX, targetY: event.targetY,
      velocityX: dx / distance * event.speed, velocityY: dy / distance * event.speed,
      damage: event.damage, enemyDamage: event.enemyDamage ?? (type === "brick" ? 50 : 0),
      radius: type === "brick" ? 58 : 75, collisionRadius: type === "brick" ? 15 : 12,
      source: event.source ?? null, active: true,
    });
  }

  updateConstructionSite(deltaTime) {
    if (this.currentMap.id !== "construction-site") return;
    const random = this.random ?? Math.random;
    for (const enemy of this.enemies) enemy.speedBuff = false;
    for (const cone of this.enemies.filter((enemy) => enemy instanceof TrafficConeEnemy && enemy.active && enemy.plantedTime > 0)) {
      for (const enemy of this.enemies) {
        if (enemy !== cone && enemy.active && Math.hypot(enemy.x - cone.x, enemy.y - cone.y) <= 105) enemy.speedBuff = true;
      }
    }
    this.constructionDebrisTimer -= deltaTime;
    if (this.constructionDebrisTimer <= 0) {
      this.constructionHazards.push({ type: "debris", x: 90 + random() * (this.world.width - 180), y: 90 + random() * (this.world.height - 180), radius: 92, damage: 40, knockback: 140, warning: 1.5, lifetime: 1.5 });
      this.constructionDebrisTimer = (this.currentMap.debrisMinCooldown ?? 6) + random() * ((this.currentMap.debrisMaxCooldown ?? 10) - (this.currentMap.debrisMinCooldown ?? 6));
    }
    for (const projectile of [...this.constructionProjectiles]) {
      if (!projectile.active) continue;
      projectile.x += projectile.velocityX * deltaTime; projectile.y += projectile.velocityY * deltaTime;
      if (projectile.type === "brick") {
        const struckEnemy = this.enemies.find((enemy) => enemy.active && enemy !== projectile.source
          && Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y) <= projectile.collisionRadius + enemy.radius);
        if (struckEnemy) {
          this.damageEnemy(struckEnemy, projectile.enemyDamage, 0, "environment");
          projectile.active = false;
          this.explosions.push({ x: projectile.x, y: projectile.y, radius: 28, lifetime: 0.22, maxLifetime: 0.22, color: "#bd553d" });
          continue;
        }
      }
      if (Math.hypot(projectile.x - projectile.targetX, projectile.y - projectile.targetY) <= Math.hypot(projectile.velocityX, projectile.velocityY) * deltaTime + 8) {
        projectile.active = false;
        // Thrown bricks and dirt target the player. Environmental debris,
        // bucket slams, and a Brick Carrier's death blast provide friendly fire.
        this.applyConstructionPlayerDamage(projectile.x, projectile.y, projectile.radius, projectile.damage, 75);
        if (projectile.type === "dirt") this.activeObstacles.push({ kind: "temporary-dirt", x: projectile.x, y: projectile.y, radius: 95, width: 190, height: 190, solid: false, lifetime: 8 });
        this.explosions.push({ x: projectile.x, y: projectile.y, radius: projectile.radius, lifetime: 0.35, maxLifetime: 0.35, color: projectile.type === "dirt" ? "#8f683d" : "#bd553d" });
      }
    }
    this.constructionProjectiles = this.constructionProjectiles.filter((projectile) => projectile.active);
    for (const hazard of this.constructionHazards) {
      hazard.warning -= deltaTime; hazard.lifetime -= deltaTime;
      if (hazard.warning <= 0 && !hazard.impacted) {
        hazard.impacted = true;
        this.applyConstructionAreaDamage(hazard.x, hazard.y, hazard.radius, hazard.damage, hazard.knockback, hazard.source);
        this.explosions.push({ x: hazard.x, y: hazard.y, radius: hazard.radius, lifetime: 0.45, maxLifetime: 0.45, color: hazard.type === "debris" ? "#d1b07a" : "#d8973f" });
        this.addScreenShake(0.14, 0.25);
      }
    }
    this.constructionHazards = this.constructionHazards.filter((hazard) => !hazard.impacted || hazard.lifetime > -0.35);
  }

  applyConstructionAreaDamage(x, y, radius, damage, knockback = 0, excludedEnemy = null) {
    this.applyConstructionPlayerDamage(x, y, radius, damage, knockback);
    for (const enemy of [...this.enemies]) {
      if (!enemy.active || enemy === excludedEnemy || enemy.isBoss || Math.hypot(enemy.x - x, enemy.y - y) > radius + enemy.radius) continue;
      this.damageEnemy(enemy, damage, 0, "environment");
      const dx = enemy.x - x; const dy = enemy.y - y; const distance = Math.hypot(dx, dy) || 1;
      enemy.x = clamp(enemy.x + dx / distance * knockback, enemy.radius, this.world.width - enemy.radius);
      enemy.y = clamp(enemy.y + dy / distance * knockback, enemy.radius, this.world.height - enemy.radius);
    }
  }

  applyConstructionPlayerDamage(x, y, radius, damage, knockback = 0) {
    const playerDistance = Math.hypot(this.player.x - x, this.player.y - y);
    if (playerDistance <= radius + this.player.radius) {
      this.damagePlayer(damage);
      const distance = playerDistance || 1;
      this.player.x = clamp(this.player.x + (this.player.x - x) / distance * knockback, this.player.radius, this.world.width - this.player.radius);
      this.player.y = clamp(this.player.y + (this.player.y - y) / distance * knockback, this.player.radius, this.world.height - this.player.radius);
    }
  }

  getEnemyTarget(enemy) {
    if (enemy.isBoss || !this.gardenDecoys?.length) return this.player;
    const nearestDecoy = this.gardenDecoys
      .filter((decoy) => decoy.active)
      .sort((a, b) => Math.hypot(a.x - enemy.x, a.y - enemy.y) - Math.hypot(b.x - enemy.x, b.y - enemy.y))[0];
    if (!nearestDecoy) return this.player;
    const playerDistance = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
    const decoyDistance = Math.hypot(nearestDecoy.x - enemy.x, nearestDecoy.y - enemy.y);
    return decoyDistance < playerDistance ? nearestDecoy : this.player;
  }

  updateDebugOutput() {
    if (!this.debugVisible) {
      return;
    }

    this.debugOutput.value = [
      `FPS      ${this.fps.toString().padStart(3, " ")}`,
      `PLAYER   ${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)}`,
      `HEALTH   ${this.player.health} / ${this.player.maxHealth}`,
      `SHIELD   ${this.player.shield.toFixed(2)} / ${this.player.maxShield}`,
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
    this.player.maxShield = this.progress.shieldUnlocked ? 10 + (stats.shield ?? 0) : 0;
    this.player.shield = this.player.maxShield;
    this.player.shieldRegen = this.progress.shieldUnlocked ? 0.25 : 0;
    this.player.healthRegenAmount = (stats.regeneration ?? 0) > 0 ? 1 : 0;
    this.player.healthRegenInterval = (stats.regeneration ?? 0) > 0 ? 3 : 0;
    this.player.healthRegenTimer = 0;
    this.player.reducedMotion = this.progress.settings.reducedMotion;
  }

  ownedWeaponsForSlot(slot) {
    // Loadout slots are now category-agnostic: either slot may equip any owned weapon.
    return WEAPONS_SORTED_BY_RARITY.filter((weapon) => this.progress.ownedWeapons.includes(weapon.id));
  }

  savePermanentProgress() {
    this.progress.coins = this.bankCoins;
    this.progress.unlockedMaps = [...this.unlockedMaps];
    saveProgress(window.localStorage, this.progress);
  }

  handleShopChoice(choice) {
    let success = false;
    let label = "Purchase unavailable";
    const items = this.shopItems();
    const item = items[this.shopScroll + choice - 1];
    if (item && item.id) {
      const id = item.id;
      success = buyWeapon(this.progress, id, shopWeaponPrice(id), false);
      label = success ? `${weaponById(id).name} purchased` : "Cannot purchase weapon";
    } else if (item?.chest) {
      this.openChestFromMenu();
      return;
    }
    this.bankCoins = this.progress.coins;
    this.menuMessage = label;
    if (success) this.savePermanentProgress();
  }

  shopItems() {
    const shopIds = new Set(SHOP_WEAPON_IDS);
    return [{ chest: true }, ...WEAPONS_SORTED_BY_RARITY
      .filter((weapon) => shopIds.has(weapon.id))
      .map((weapon) => ({ id: weapon.id }))];
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
    } else if (choice === 1) {
      this.permanentUpgradeCategory = "all";
      this.menuMessage = "Choose any owned weapon to upgrade";
      return;
    } else if (choice >= 3 && choice <= 9) {
      const stat = ["health", "damage", "speed", "attackSpeed", "accuracy", "shield", "regeneration"][choice - 3];
      success = upgradeCharacterStat(this.progress, stat, characterStatMaxLevelForMaps(this.unlockedMaps));
      label = success ? `${stat} upgraded` : "Cannot upgrade stat";
    }
    this.bankCoins = this.progress.coins;
    this.menuMessage = label;
    if (success) this.savePermanentProgress();
  }

  openChestFromMenu() {
    const currentChestCost = chestCost(this.progress);
    const result = openChest(this.progress);
    if (!result) {
      this.menuMessage = `Need ${currentChestCost} coins for a chest`;
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
    if (this.currentMap.normalEnemyType === "weed"
      || this.currentMap.normalEnemyType === "aquatic-garden") {
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
    if (this.currentMap.normalEnemyType === "golf") {
      this.spawnGolfEnemy(forcedAngle);
      return;
    }
    if (this.currentMap.normalEnemyType === "redwood-trail") {
      this.spawnRedwoodEnemy(forcedAngle);
      return;
    }
    if (this.currentMap.normalEnemyType === "school-field") {
      this.spawnSchoolFieldEnemy(forcedAngle);
      return;
    }
    if (this.currentMap.normalEnemyType === "construction-site") {
      this.spawnConstructionEnemy(forcedAngle);
      return;
    }
    if (this.currentMap.normalEnemyType === "chicken-farm") {
      this.spawnChickenFarmGroup(forcedAngle);
      return;
    }
    this.spawnEnemy(forcedAngle);
  }

  spawnConstructionEnemy(forcedAngle = Math.random() * Math.PI * 2) {
    if (this.enemies.length >= (this.currentMap.enemyCap ?? 100)) return null;
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    return this.spawnConstructionEnemyAt(
      clamp(this.player.x + Math.cos(forcedAngle) * distance, 40, this.world.width - 40),
      clamp(this.player.y + Math.sin(forcedAngle) * distance, 40, this.world.height - 40),
    );
  }

  spawnConstructionEnemyAt(x, y, bossMinion = false, forcedType = null) {
    if (this.enemies.length >= (this.currentMap.enemyCap ?? 100)) return null;
    const weights = this.currentMap.constructionSpawnWeights;
    const roll = (this.random ?? Math.random)();
    const type = forcedType ?? (roll < weights.worker ? "worker" : roll < weights.worker + weights.cone ? "cone"
      : roll < weights.worker + weights.cone + weights.tire ? "tire"
        : roll < weights.worker + weights.cone + weights.tire + weights.brickCarrier ? "brick-carrier" : "safety-vest");
    const options = { x, y, world: this.world };
    const enemy = type === "worker" ? new ConstructionWorker(options) : type === "cone" ? new TrafficConeEnemy(options)
      : type === "tire" ? new RunawayTire(options) : type === "brick-carrier" ? new BrickCarrier(options) : new SafetyVestEnemy(options);
    enemy.bossMinion = bossMinion; this.enemies.push(enemy); return enemy;
  }

  spawnChickenFarmGroup(forcedAngle = Math.random() * Math.PI * 2) {
    const cap = this.currentMap.enemyCap ?? 150;
    if (this.enemies.length >= cap) return;
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    const centerX = clamp(this.player.x + Math.cos(forcedAngle) * distance, 50, this.world.width - 50);
    const centerY = clamp(this.player.y + Math.sin(forcedAngle) * distance, 50, this.world.height - 50);
    const roll = (this.random ?? Math.random)();
    if (roll < 0.1) { this.spawnChickenFarmEnemyAt(centerX, centerY, "rooster"); return; }
    const type = roll < 0.55 ? "chick" : "chicken";
    const count = 3 + Math.floor((this.random ?? Math.random)() * 3);
    for (let index = 0; index < count && this.enemies.length < cap; index += 1) {
      const angle = index / count * Math.PI * 2;
      this.spawnChickenFarmEnemyAt(centerX + Math.cos(angle) * 35, centerY + Math.sin(angle) * 35, type);
    }
  }

  spawnChickenFarmEnemyAt(x, y, type, bossMinion = false) {
    if (this.enemies.filter((enemy) => enemy.active).length >= (this.currentMap.enemyCap ?? 150)) return null;
    const options = { x: clamp(x, 20, this.world.width - 20), y: clamp(y, 20, this.world.height - 20) };
    const enemy = type === "chick" ? new Chick(options) : type === "egg" ? new ChickenEgg(options)
      : type === "rooster" ? new Rooster(options) : new Chicken(options);
    enemy.bossMinion = bossMinion; this.enemies.push(enemy); return enemy;
  }

  spawnSchoolFieldEnemy(forcedAngle = Math.random() * Math.PI * 2, bossMinion = false, forcedType = null) {
    if (this.enemies.length >= MAX_ENEMIES) return;
    const side = Math.floor((((forcedAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2) * 4);
    const inset = 28;
    const random = this.random ?? Math.random;
    const edgeT = random();
    const x = side === 1 ? this.world.width - inset : side === 3 ? inset : inset + edgeT * (this.world.width - inset * 2);
    const y = side === 0 ? inset : side === 2 ? this.world.height - inset : inset + edgeT * (this.world.height - inset * 2);
    return this.spawnSchoolFieldEnemyAt(x, y, bossMinion, forcedType);
  }

  spawnSchoolFieldEnemyAt(x, y, bossMinion = false, forcedType = null) {
    if (this.enemies.length >= MAX_ENEMIES) return null;
    const random = this.random ?? Math.random;
    const weights = (this.firstBossDefeated
      ? this.currentMap.schoolFieldSpawnWeights
      : this.currentMap.schoolFieldPreBossSpawnWeights)
      ?? { rogueSoccerBall: 0.29, sprinter: 0.26, backpack: 0.22, basketball: 0.23 };
    const roll = random();
    const type = forcedType ?? (roll < weights.rogueSoccerBall ? "rogue-soccer-ball"
      : roll < weights.rogueSoccerBall + weights.sprinter ? "sprinter"
        : roll < weights.rogueSoccerBall + weights.sprinter + weights.backpack ? "backpack"
          : "basketball");
    const options = { x, y, world: this.world, random };
    let enemy;
    if (type === "rogue-soccer-ball") enemy = new RogueSoccerBall(options);
    else if (type === "sprinter") enemy = new Sprinter(options);
    else if (type === "backpack") enemy = new Backpack(options);
    else enemy = new SchoolBasketball(options);
    enemy.bossMinion = bossMinion;
    this.enemies.push(enemy);
    return enemy;
  }

  spawnRedwoodEnemy(forcedAngle = Math.random() * Math.PI * 2, bossMinion = false, forcedType = null) {
    if (this.enemies.length >= MAX_ENEMIES) return;
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    const x = clamp(this.player.x + Math.cos(forcedAngle) * distance, 36, this.world.width - 36);
    const y = clamp(this.player.y + Math.sin(forcedAngle) * distance, 36, this.world.height - 36);
    const random = this.random ?? Math.random;
    const weights = this.currentMap.redwoodSpawnWeights ?? { snail: 0.5, mosquito: 0.34, deer: 0.16 };
    const roll = random();
    const type = forcedType ?? (roll < weights.snail ? "snail" : roll < weights.snail + weights.mosquito ? "mosquito" : "deer");
    if (type === "mosquito") this.enemies.push(new Mosquito({ x, y, random, bossMinion }));
    else if (type === "deer") this.enemies.push(new Deer({ x, y, bossMinion }));
    else this.enemies.push(new Snail({ x, y, bossMinion }));
  }

  spawnGolfEnemy(forcedAngle = Math.random() * Math.PI * 2) {
    const random = this.random ?? Math.random;
    const gooseChance = this.firstBossDefeated
      ? (this.currentMap.gooseSpawnChance ?? 0.16)
      : (this.currentMap.preBossGooseSpawnChance ?? this.currentMap.gooseSpawnChance ?? 0.16);
    const preBossGopherChance = this.currentMap.preBossGopherSpawnChance ?? 0;
    const golferChance = this.currentMap.golferSpawnChance ?? 0.20;
    let roll = random();
    if (this.firstBossDefeated) {
      const squirrelChance = this.currentMap.postBossSquirrelSpawnChance ?? 0.16;
      const gopherChance = this.currentMap.postBossGopherSpawnChance ?? 0.16;
      if (roll < squirrelChance) {
        this.spawnParkEnemy(forcedAngle);
        return;
      }
      roll -= squirrelChance;
      if (roll < gopherChance) {
        this.spawnGopher(forcedAngle);
        return;
      }
      roll -= gopherChance;
    } else if (roll < preBossGopherChance) {
      this.spawnGopher(forcedAngle);
      return;
    } else {
      roll -= preBossGopherChance;
    }
    if (roll < gooseChance) {
      this.spawnGoose(forcedAngle);
      return;
    }
    roll -= gooseChance;
    // Golfer probability is explicit so it can be balanced independently of
    // the other Golf Course enemies.
    if (roll >= golferChance) return;
    const distance = Math.max(this.camera.viewWidth, this.camera.viewHeight) * 0.52 + 90;
    this.enemies.push(new Golfer({
      x: clamp(this.player.x + Math.cos(forcedAngle) * distance, 30, this.world.width - 30),
      y: clamp(this.player.y + Math.sin(forcedAngle) * distance, 30, this.world.height - 30),
    }));
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
    const commonWeedCount = this.enemies.filter((enemy) => enemy instanceof CommonWeed && !enemy.bossMode && enemy.active).length;
    if (commonWeedCount >= MAX_COMMON_WEEDS) return;
    const river = this.currentMap.obstacles?.find((obstacle) => obstacle.kind === "river");
    if (river && y >= river.y && y <= river.y + river.height) {
      const topBank = river.y - 26;
      const bottomBank = river.y + river.height + 26;
      y = Math.abs(y - topBank) <= Math.abs(y - bottomBank) ? topBank : bottomBank;
    }
    this.enemies.push(new CommonWeed({
      x: clamp(x, 24, this.world.width - 24),
      y: clamp(y, 24, this.world.height - 24),
      bossMode: this.isDandelionBossMode(),
    }));
  }

  spawnStrongweedAt(x, y) {
    const strongweedCount = this.enemies.filter((enemy) => enemy.enemyType === "strongweed" && enemy.active).length;
    if (strongweedCount >= MAX_STRONGWEEDS) return;
    this.enemies.push(new CommonWeed({
      x: clamp(x, 24, this.world.width - 24),
      y: clamp(y, 24, this.world.height - 24),
      bossMode: true,
    }));
  }

  spawnLilyQueenStrongweed(boss) {
    const random = this.random ?? Math.random;
    if (random() >= (boss.strongweedLaunchChance ?? 0.5)) {
      this.spawnStrongweedAt(boss.x, boss.y);
      return;
    }
    this.thrownGnomes.push(new ThrownGnome({
      x: boss.x,
      y: boss.y,
      targetX: this.player.x,
      targetY: this.player.y,
      speed: boss.strongweedLaunchSpeed ?? 900,
      enemyType: "strongweed",
      damage: 20,
    }));
  }

  spawnRiverbankWeed() {
    const river = this.currentMap.obstacles?.find((obstacle) => obstacle.kind === "river");
    if (!river) return;
    const random = this.random ?? Math.random;
    const x = 32 + random() * Math.max(1, this.world.width - 64);
    const y = random() < 0.5 ? river.y - 26 : river.y + river.height + 26;
    this.spawnCommonWeedAt(x, y);
  }

  fireAncientSnailSpit(event) {
    const dx = event.targetX - event.x; const dy = event.targetY - event.y; const distance = Math.hypot(dx, dy) || 1;
    this.bossProjectiles.push(new SnailSpitProjectile({
      x: event.x, y: event.y, velocityX: dx / distance * event.speed, velocityY: dy / distance * event.speed,
      damage: event.damage, lifetime: event.lifetime, splashRadius: event.splashRadius,
    }));
  }

  createLilyPads() {
    const river = this.currentMap.obstacles?.find((obstacle) => obstacle.kind === "river");
    if (!river) return [];
    const count = Math.min(3, this.currentMap.lilypadCount ?? 3);
    return Array.from({ length: count }, (_, index) => new LilyPad({
      x: river.x + (index + 0.5) * river.width / count,
      y: river.y + river.height * (0.28 + (index % 3) * 0.2),
      driftSpeed: 5 + index,
      phase: index * 1.8,
    }));
  }

  updateTemporaryObstacles(deltaTime) {
    this.activeObstacles = (this.activeObstacles ?? []).filter((obstacle) => {
      if (obstacle.kind === "slime") return false;
      if (Number.isFinite(obstacle.lifetime)) obstacle.lifetime -= deltaTime;
      return !Number.isFinite(obstacle.lifetime) || obstacle.lifetime > 0;
    });
    for (const puddle of this.slimeTerrain ?? []) {
      if (!puddle.permanent) puddle.lifetime -= deltaTime;
    }
    this.slimeTerrain = (this.slimeTerrain ?? []).filter((puddle) => puddle.permanent || puddle.lifetime > 0);
    for (const puddle of this.slimeTerrain) {
      this.activeObstacles.push({ kind: "slime", x: puddle.x, y: puddle.y, radius: puddle.radius, width: puddle.radius * 2, height: puddle.radius * 2, solid: false });
    }
    for (const puddle of this.activeObstacles.filter((obstacle) => obstacle.kind === "ice-puddle")) {
      for (const enemy of this.enemies) {
        if (enemy.active && Math.hypot(enemy.x - puddle.x, enemy.y - puddle.y) <= puddle.radius + enemy.radius) {
          enemy.freezeTime = Math.max(enemy.freezeTime ?? 0, 0.35);
          enemy.slowTime = Math.max(enemy.slowTime ?? 0, 0.35);
        }
      }
    }
  }

  isDandelionBossMode() {
    return Boolean(this.bossSpawned && this.boss?.active && this.boss.enemyType === "dandelion");
  }

  separateWeeds() {
    const weeds = this.enemies.filter((enemy) => enemy instanceof CommonWeed && enemy.active);
    const random = this.random ?? Math.random;
    for (let pass = 0; pass < 4; pass += 1) {
      let separated = true;
      for (let first = 0; first < weeds.length; first += 1) {
        for (let second = first + 1; second < weeds.length; second += 1) {
          const a = weeds[first];
          const b = weeds[second];
          const minimumDistance = a.radius + b.radius;
          const offsetX = b.x - a.x;
          const offsetY = b.y - a.y;
          const distance = Math.hypot(offsetX, offsetY);
          if (distance >= minimumDistance) continue;
          const baseAngle = distance > 0 ? Math.atan2(offsetY, offsetX) : 0;
          // A small angle jitter prevents perfectly aligned rows while keeping
          // the push mostly along the shortest separation direction.
          const angle = baseAngle + (random() - 0.5) * 0.28;
          const normalX = Math.cos(angle);
          const normalY = Math.sin(angle);
          const push = (minimumDistance - distance) / 2 + 0.01;
          a.x = clamp(a.x - normalX * push, a.radius, this.world.width - a.radius);
          a.y = clamp(a.y - normalY * push, a.radius, this.world.height - a.radius);
          b.x = clamp(b.x + normalX * push, b.radius, this.world.width - b.radius);
          b.y = clamp(b.y + normalY * push, b.radius, this.world.height - b.radius);
          separated = false;
        }
      }
      if (separated) break;
    }
  }

  separateStrongweeds() {
    this.separateWeeds();
  }

  separateDandelionWeeds() {
    this.separateWeeds();
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
        : bossConfig.type === "pondfather" ? PondfatherBoss
          : bossConfig.type === "pro-golfer" ? ProGolferBoss
            : bossConfig.type === "lily-queen" ? LilyQueenBoss
              : bossConfig.type === "ancient-snail" ? AncientSnailBoss
                : bossConfig.type === "pe-teacher" ? PeTeacherBoss
                  : bossConfig.type === "ball-launcher" ? BallLauncherBoss
                    : bossConfig.type === "excavator" ? ExcavatorBoss : Boss;
    const ResolvedBossType = bossConfig.type === "mother-hen" ? MotherHenBoss : BossType;
    const pond = this.currentMap.obstacles?.find((obstacle) => obstacle.kind === "lake");
    this.boss = new ResolvedBossType({
      x: bossConfig.type === "pondfather" && pond ? pond.x + pond.width / 2
        : bossConfig.type === "lily-queen" ? this.world.width / 2
          : bossConfig.type === "ball-launcher" ? this.world.width / 2
          : clamp(this.player.x + Math.cos(angle) * distance, 80, this.world.width - 80),
      y: bossConfig.type === "pondfather" && pond ? pond.y + pond.height / 2
        : bossConfig.type === "lily-queen" ? this.world.height / 2
          : bossConfig.type === "ball-launcher" ? this.world.height / 2
          : clamp(this.player.y + Math.sin(angle) * distance, 80, this.world.height - 80),
      config: bossConfig,
      world: this.world,
    });
    if (bossConfig.type === "dandelion") {
      for (const enemy of this.enemies) {
        if (enemy instanceof CommonWeed) enemy.enterBossMode();
      }
    }
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

  fireGolfBall(event) {
    const dx = event.targetX - event.x; const dy = event.targetY - event.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.bossProjectiles.push(new GolfBallProjectile({
      x: event.x, y: event.y, velocityX: dx / distance * event.speed, velocityY: dy / distance * event.speed,
      damage: event.damage, maxDistance: event.range ?? null,
    }));
  }

  fireSchoolBall(event, forcedKind = null, config = {}) {
    const kinds = [
      { kind: "soccer-ball", radius: 12, speed: config.ballSpeed ?? 440, damage: config.ballDamage ?? 18, color: "#f3f0df", knockback: 22 },
      { kind: "basketball", radius: 14, speed: (config.ballSpeed ?? 440) * 0.82, damage: config.ballDamage ?? 18, color: "#d47736", knockback: 18, bounce: true },
      { kind: "tennis-ball", radius: 7, speed: (config.ballSpeed ?? 440) * 1.65, damage: config.ballDamage ?? 18, color: "#d4e85e", knockback: 10 },
      { kind: "volleyball", radius: 18, speed: (config.ballSpeed ?? 440) * 0.58, damage: config.ballDamage ?? 18, color: "#f0eee3", knockback: 75 },
    ];
    const selected = forcedKind === "dodgeball"
      ? { kind: "dodgeball", radius: 13, speed: event.speed, damage: event.damage, color: "#d94f45", knockback: event.knockback }
      : kinds[Math.floor((this.random ?? Math.random)() * kinds.length)];
    const dx = event.targetX - event.x; const dy = event.targetY - event.y; const distance = Math.hypot(dx, dy) || 1;
    this.bossProjectiles.push(new SchoolBallProjectile({
      x: event.x, y: event.y, velocityX: dx / distance * selected.speed, velocityY: dy / distance * selected.speed,
      damage: selected.damage, radius: selected.radius, kind: selected.kind, color: selected.color, knockback: selected.knockback,
      bounce: selected.bounce,
    }));
  }

  fireBallLauncherShot(event, config = {}) {
    const roll = (this.random ?? Math.random)();
    if (roll < 0.05) {
      this.spawnSchoolFieldEnemyAt(event.x, event.y, true, "basketball");
      return "basketball-enemy";
    }
    if (roll < 0.10) {
      this.spawnSchoolFieldEnemyAt(event.x, event.y, true, "rogue-soccer-ball");
      return "soccer-ball-enemy";
    }
    this.fireSchoolBall(event, null, config);
    return "projectile";
  }

  fireSchoolBallDump(boss) {
    const config = boss.config ?? {};
    for (let index = 0; index < 10; index += 1) {
      const angle = index / 10 * Math.PI * 2;
      const kinds = ["soccer-ball", "basketball", "tennis-ball", "volleyball"];
      const kind = kinds[index % kinds.length];
      const settings = kind === "volleyball" ? { radius: 18, damage: config.dumpDamage ?? 22, speed: config.dumpSpeed ?? 360, color: "#f0eee3", knockback: 65 }
        : kind === "tennis-ball" ? { radius: 7, damage: config.dumpDamage ?? 22, speed: (config.dumpSpeed ?? 360) * 1.35, color: "#d4e85e", knockback: 8 }
          : kind === "basketball" ? { radius: 14, damage: config.dumpDamage ?? 22, speed: config.dumpSpeed ?? 360, color: "#d47736", knockback: 18, bounce: true }
            : { radius: 12, damage: config.dumpDamage ?? 22, speed: config.dumpSpeed ?? 360, color: "#f3f0df", knockback: 20 };
      this.bossProjectiles.push(new SchoolBallProjectile({ x: boss.x, y: boss.y, velocityX: Math.cos(angle) * settings.speed, velocityY: Math.sin(angle) * settings.speed, ...settings, kind }));
    }
    this.explosions.push({ x: boss.x, y: boss.y, lifetime: 0.5, maxLifetime: 0.5, radius: 82, ring: true, color: "#f0d96c" });
  }

  fireProGolferAttack(boss, attack) {
    if (attack.type === "bomb") {
      this.bossProjectiles.push(new GolfBombProjectile({
        x: boss.x, y: boss.y, targetX: attack.targetX, targetY: attack.targetY,
        damage: attack.damage, warningDuration: attack.warningDuration,
      }));
      return;
    }
    const dx = attack.targetX - boss.x; const dy = attack.targetY - boss.y;
    const base = Math.atan2(dy, dx);
    const angles = attack.type === "fan" ? [base - 0.34, base, base + 0.34] : [base];
    for (const angle of angles) {
      this.bossProjectiles.push(new GolfBallProjectile({
        x: boss.x, y: boss.y, velocityX: Math.cos(angle) * attack.speed, velocityY: Math.sin(angle) * attack.speed,
        damage: attack.damage,
      }));
    }
  }

  handleGolfBombImpact(bomb) {
    const radius = bomb.bunkerRadius;
    this.activeObstacles.push({
      x: clamp(bomb.targetX - radius, 0, this.world.width - radius * 2),
      y: clamp(bomb.targetY - radius, 0, this.world.height - radius * 2),
      width: radius * 2, height: radius * 2, kind: "sand-bunker", solid: false, lifetime: 20,
    });
    this.damagePlayer(bomb.damage);
    bomb.impacted = false;
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
    if (enemyType === "chicken-egg") {
      this.spawnChickenFarmEnemyAt(x, y, "egg", bossMinion);
      this.explosions.push({ x, y, radius: 26, lifetime: .35, maxLifetime: .35, ring: true, color: "#f4ead2" });
      return;
    }
    if (enemyType === "strongweed") {
      this.spawnStrongweedAt(x, y);
      return;
    }
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

  damageEnemy(enemy, damage, lifestealRatio = 0, weaponId = null) {
    const healthBefore = Number.isFinite(enemy.health) ? enemy.health : 0;
    const shieldBefore = Number.isFinite(enemy.shield) ? enemy.shield : 0;
    if (this.bossSpawned && this.boss?.active && !enemy.isBoss && !enemy.bossMinion) damage *= 3;
    const defeated = enemy.takeDamage(damage);
    const healthDamage = Math.max(0, healthBefore - (Number.isFinite(enemy.health) ? enemy.health : healthBefore));
    const shieldDamage = Math.max(0, shieldBefore - (Number.isFinite(enemy.shield) ? enemy.shield : shieldBefore));
    const impactDamage = healthDamage + shieldDamage;
    if (impactDamage > 0) {
      const random = this.random ?? Math.random;
      const impactStrength = enemy.isBoss ? 0.14 : Math.min(0.12, 0.045 + impactDamage * 0.002);
      const impactDuration = enemy.isBoss ? 0.2 : 0.09;
      const impactKick = enemy.isBoss ? 5 : Math.min(3, 1 + impactDamage * 0.03);
      this.addScreenShake(
        impactStrength,
        impactDuration,
        (random() - 0.5) * impactKick,
        (random() - 0.5) * impactKick,
      );
      const radius = Math.max(10, Math.min(24, (enemy.radius ?? 16) * 0.8));
      const particleSide = random() < 0.5 ? -1 : 1;
      (this.hitEffects ??= []).push({
        x: enemy.x,
        y: enemy.y,
        radius,
        angle: random() * Math.PI * 2,
        color: enemy.isBoss ? "#ffe07a" : "#fff1bf",
        particles: Array.from({ length: 8 }, (_, index) => {
          return {
            x: (random() - 0.5) * radius * 0.75,
            y: (random() - 0.5) * radius * 0.45,
            velocityX: particleSide * (70 + random() * 90) + (index - 3.5) * 7,
            velocityY: -(105 + random() * 105),
            size: 5 + Math.floor(random() * 5),
          };
        }),
        lifetime: 0.65,
        maxLifetime: 0.65,
      });
      (this.floatingDamageNumbers ??= []).push({
        x: enemy.x + (random() - 0.5) * 14,
        y: enemy.y - (enemy.radius ?? 16) - 6,
        text: `${Math.max(1, Math.round(impactDamage))}`,
        color: enemy.isBoss ? "#ffe07a" : "#fff1bf",
        lifetime: 0.7,
        maxLifetime: 0.7,
        riseSpeed: 34,
        drift: (random() - 0.5) * 16,
      });
    }
    if (lifestealRatio > 0 && healthDamage > 0) this.addLifesteal(healthDamage * lifestealRatio);
    if (defeated) {
      if (enemy instanceof Chicken && !enemy.isBoss && this.currentMap.id === "chicken-farm"
        && (this.random ?? Math.random)() < (this.currentMap.chickenEggDeathChance ?? 0.5)) {
        this.spawnChickenFarmEnemyAt(enemy.x, enemy.y, "egg", enemy.bossMinion);
      }
      if (enemy.deathBrickBurst && this.currentMap.id === "construction-site") {
        for (let index = 0; index < enemy.deathBrickBurst.count; index += 1) {
          const angle = index / enemy.deathBrickBurst.count * Math.PI * 2;
          this.spawnConstructionProjectile({
            x: enemy.x, y: enemy.y,
            targetX: enemy.x + Math.cos(angle) * enemy.deathBrickBurst.range,
            targetY: enemy.y + Math.sin(angle) * enemy.deathBrickBurst.range,
            speed: enemy.deathBrickBurst.speed,
            damage: enemy.deathBrickBurst.playerDamage,
            enemyDamage: enemy.deathBrickBurst.enemyDamage,
            source: enemy,
          }, "brick");
        }
      }
      if (enemy.deathAoe && this.currentMap.id === "construction-site") {
        this.applyConstructionAreaDamage(enemy.x, enemy.y, enemy.deathAoe.radius, enemy.deathAoe.damage, 85, enemy);
      }
      this.addScreenShake(enemy.isBoss ? 0.16 : 0.1, enemy.isBoss ? 0.24 : 0.14);
      // A compact pixel burst marks the exact frame an enemy is removed. Use
      // the shared explosion renderer so it remains cheap even in large waves.
      (this.explosions ??= []).push({
        x: enemy.x,
        y: enemy.y,
        lifetime: enemy.isBoss ? 0.5 : 0.3,
        maxLifetime: enemy.isBoss ? 0.5 : 0.3,
        radius: enemy.isBoss ? 68 : Math.max(24, (enemy.radius ?? 16) * 1.35),
        color: enemy.isBoss ? "#ffe07a" : "#f4c85d",
      });
      const random = this.random ?? Math.random;
      const deathLifetime = enemy.isBoss ? 1.3 : 0.9;
      (this.deathEffects ??= []).push({
        enemy,
        originX: enemy.x,
        originY: enemy.y,
        angle: random() * Math.PI * 2,
        angularVelocity: (random() < 0.5 ? -1 : 1) * (7 + random() * 5),
        spiralDistance: Math.max(22, (enemy.radius ?? 16) * 1.7),
        fallX: (random() < 0.5 ? -1 : 1) * (28 + random() * 24),
        fallY: 12 + random() * 18,
        lifetime: deathLifetime,
        maxLifetime: deathLifetime,
      });
      const enemyType = enemy.enemyType ?? (enemy.isBoss ? "king-gnomulus" : "gnome");
      if (enemyType in this.progress.defeatedEnemies) {
        this.progress.defeatedEnemies[enemyType] += 1;
      }
      const killQuestCoins = updateDailyQuestProgress(this.progress, { type: "enemy-kill", enemyType, weaponId });
      updateSeasonQuestProgress(this.progress, { type: "enemy-kill", enemyType, weaponId });
      if (killQuestCoins > 0) {
        this.bankCoins = this.progress.coins;
        this.menuMessage = `Daily quest complete: +${killQuestCoins} coins`;
        this.savePermanentProgress();
      }
      if (enemy.isBoss) {
        if (enemy.enemyType === "ancient-snail") {
          this.slimeTerrain = [];
          this.activeObstacles = this.activeObstacles.filter((obstacle) => obstacle.kind !== "slime");
          this.progress.shieldUnlocked = true;
        }
        if (this.currentMap.bosses && this.bossIndex < this.currentMap.bosses.length - 1) {
          this.bossIndex += 1;
          this.firstBossDefeated = true;
          this.bossSpawned = false;
          this.boss = null;
          this.bossNextSpawnTimer = this.currentMap.nextBossSpawnDelay ?? 60;
        } else {
          this.finishVictory();
        }
        return;
      }
      if ((this.random ?? Math.random)() < 0.01) {
        const offset = randomDropOffset();
        this.pickups.push(new Pickup({ x: enemy.x, y: enemy.y, type: "magnet", ...offset }));
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
    return healthDamage;
  }

  damagePlayer(amount) {
    const healthBefore = Number.isFinite(this.player.health) ? this.player.health : 0;
    const shieldBefore = Number.isFinite(this.player.shield) ? this.player.shield : 0;
    const accepted = this.player.takeDamage(amount);
    if (!accepted) return false;
    const healthDamage = Math.max(0, healthBefore - this.player.health);
    const shieldDamage = Math.max(0, shieldBefore - (Number.isFinite(this.player.shield) ? this.player.shield : 0));
    const damageTaken = healthDamage + shieldDamage;
    if (damageTaken > 0) {
      const random = this.random ?? Math.random;
      (this.floatingDamageNumbers ??= []).push({
        x: this.player.x + (random() - 0.5) * 10,
        y: this.player.y - this.player.radius - 10,
        text: `-${Math.max(1, Math.round(damageTaken))}`,
        color: "#ff4b45",
        lifetime: 0.85,
        maxLifetime: 0.85,
        riseSpeed: 38,
        drift: (random() - 0.5) * 12,
      });
    }
    return true;
  }

  detonateProjectile(projectile) {
    const radius = projectile.splashRadius || 0;
    this.explosions.push({ x: projectile.x, y: projectile.y, lifetime: 0.28, radius, color: projectile.color });
    if (projectile.puddleDuration > 0) {
      this.activeObstacles.push({ kind: "ice-puddle", x: projectile.x, y: projectile.y, radius: projectile.puddleRadius, width: projectile.puddleRadius * 2, height: projectile.puddleRadius * 2, lifetime: projectile.puddleDuration, solid: false });
    }
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.targetable === false || Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y) > radius) continue;
      this.damageEnemy(enemy, projectile.damage, projectile.lifesteal, projectile.weaponId);
      if (projectile.fireDuration > 0) applyFire(enemy, projectile.fireDamagePerSecond, projectile.fireDuration, projectile.fireMaxStacks);
      if (projectile.freezeDuration > 0) applyFreeze(enemy, projectile.freezeDuration);
    }
    for (let split = 0; split < projectile.splitCount; split += 1) {
      const angle = split / projectile.splitCount * Math.PI * 2;
      this.projectiles.push(new Projectile({
        x: projectile.x, y: projectile.y, velocityX: Math.cos(angle) * 480, velocityY: Math.sin(angle) * 480,
        damage: projectile.splitDamage, lifetime: 0.35, kind: "firecracker-spark", color: projectile.color,
        radius: 7, explosive: false, detonateOnExpiry: true, splashRadius: projectile.splitRadius,
        splashDamageMultiplier: 0.7, fireDamagePerSecond: projectile.fireDamagePerSecond,
        fireDuration: projectile.fireDuration, fireMaxStacks: projectile.fireMaxStacks,
        weaponId: projectile.weaponId,
      }));
    }
    projectile.splitCount = 0;
  }

  addLifesteal(amount) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const player = this.player;
    player.lifestealAccumulator = (Number.isFinite(player.lifestealAccumulator) ? player.lifestealAccumulator : 0) + amount;
    const wholeHealing = Math.floor(player.lifestealAccumulator);
    if (wholeHealing <= 0) return;
    const healable = Math.max(0, Math.floor(player.maxHealth - player.health));
    const appliedHealing = Math.min(wholeHealing, healable);
    if (appliedHealing <= 0) return;
    player.health += appliedHealing;
    player.lifestealAccumulator -= appliedHealing;
  }

  collectPickup(pickup) {
    if (pickup.type === "magnet") {
      this.magnetActive = true;
      return;
    }
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
        this.currentMap.id,
      );
      this.screenState = "upgrade";
      this.upgradeSelectionDelay = 0.5;
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
    this.checkForPendingLevelUp();
  }

  checkForPendingLevelUp() {
    if (this.screenState !== "running" || this.levelXp < this.xpToNextLevel) return;
    this.levelXp -= this.xpToNextLevel;
    this.runLevel += 1;
    this.xpToNextLevel = xpRequiredForLevel(this.runLevel);
    this.upgradeChoices = chooseRunUpgrades(
      Math.random,
      3,
      this.appliedUpgradeIds,
      [this.progress.equippedWeapons.melee, this.progress.equippedWeapons.ranged],
      this.currentMap.id,
    );
    this.screenState = "upgrade";
    this.upgradeSelectionDelay = 0.5;
    this.input.pointer.down = false;
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
    const fireFeedback = weapon.slot === "melee" ? null : rangedFireFeedback(weapon);
    this.attackCooldowns[this.weaponSlot] = weapon.cooldown * this.player.cooldownMultiplier;
    this.attackCooldown = this.attackCooldowns[this.weaponSlot];
    const aimAngle = weapon.slot === "melee"
      ? this.player.facing
      : Math.atan2(aimPoint.y - this.player.y, aimPoint.x - this.player.x);
    (this.attackEffects ??= []).push({
      x: this.player.x,
      y: this.player.y - 8,
      angle: aimAngle,
      color: weapon.color ?? "#f4d36c",
      kind: weapon.slot === "melee" ? "melee" : "muzzle",
      radius: weapon.range ?? 42,
      strength: fireFeedback?.strength ?? 1,
      lengthMultiplier: fireFeedback?.lengthMultiplier ?? 1,
      lifetime: fireFeedback?.lifetime ?? 0.18,
      maxLifetime: fireFeedback?.lifetime ?? 0.18,
    });
    if (fireFeedback) {
      const flashX = this.player.x + Math.cos(aimAngle) * 24;
      const flashY = this.player.y + Math.sin(aimAngle) * 24;
      (this.weaponFlashes ??= []).push({
        x: flashX,
        y: flashY,
        radius: 144 * (fireFeedback?.radiusMultiplier ?? 1),
        strength: fireFeedback.strength,
        lifetime: fireFeedback.lifetime,
        maxLifetime: fireFeedback.lifetime,
      });
    }
    const shakeStrength = weapon.slot === "melee" ? 0.1 : 0.08 + (fireFeedback?.strength ?? 1) * 0.025;
    const shakeDuration = weapon.slot === "melee" ? 0.16 : 0.09 + (fireFeedback?.lifetime ?? 0.11) * 0.24;
    const screenKick = weapon.slot === "melee" ? 2.5 : 4 + (fireFeedback?.strength ?? 1) * 2;
    this.addScreenShake(
      shakeStrength,
      shakeDuration,
      -Math.cos(aimAngle) * screenKick,
      -Math.sin(aimAngle) * screenKick,
    );

    if (weapon.slot === "melee") {
      this.meleePulse = 0.16;
      this.meleeEffectWeapon = weapon;
      const performMeleeStrike = () => {
        for (const enemy of this.enemies) {
          if (enemy.active && enemy.targetable !== false
            && isEnemyHitByMelee(this.player, enemy, weapon, this.player.meleeRangeMultiplier)) {
            this.damageEnemy(enemy, Math.round(weapon.damage * this.player.damageMultiplier), weapon.lifesteal, weaponId);
            applyKnockback(enemy, this.player.x, this.player.y, weapon.knockback, this.world);
            if (enemy.active && weapon.knockbackCollisionDamage > 0) {
              for (const otherEnemy of this.enemies) {
                if (otherEnemy !== enemy && otherEnemy.active && otherEnemy.targetable !== false
                  && circlesOverlap(enemy, otherEnemy)) {
                  this.damageEnemy(otherEnemy, Math.round(weapon.knockbackCollisionDamage * this.player.damageMultiplier));
                }
              }
            }
          }
        }
      };
      performMeleeStrike();
      if (weapon.extraAttackChance > 0 && Math.random() < weapon.extraAttackChance) {
        this.meleePulse = 0.16;
        performMeleeStrike();
      }
      return;
    }

    const offsetX = aimPoint.x - this.player.x;
    const offsetY = aimPoint.y - this.player.y;
    const holdMultiplier = 1 + Math.min(1, this.player.attackHoldTime * 0.35);
    this.applyWeaponKickback(weapon, aimAngle, holdMultiplier);
    const shotRecoil = weapon.perfectAccuracy ? 0 : (weapon.recoil + this.player.recoil) / this.player.accuracy;
    if (weapon.projectileKind === "sprinkler-mine") {
      if (this.sprinklerMines.length >= weapon.maxMines) this.sprinklerMines.shift();
      this.sprinklerMines.push({ x: this.player.x, y: this.player.y, active: true, warningTime: weapon.mineWarningDuration, triggerRadius: weapon.mineTriggerRadius, explosionRadius: weapon.mineExplosionRadius, damage: weapon.damage * this.player.damageMultiplier, freezeDuration: weapon.freezeDuration, color: weapon.color });
      return;
    }
    if (weapon.projectileKind === "bug-zapper") {
      this.bugZappers.push({ x: this.player.x, y: this.player.y, active: true, lifetime: weapon.zapperDuration, cooldown: 0, zapCooldown: weapon.zapCooldown, range: weapon.zapperRange, damage: weapon.damage * this.player.damageMultiplier, chainCount: weapon.chainCount, chainDamageMultiplier: weapon.chainDamageMultiplier, color: weapon.color });
      return;
    }
    if (weapon.projectileKind === "garden-gnome") {
      const count = weapon.decoyCount ?? 1;
      for (let index = 0; index < count; index += 1) {
        const angle = count === 1 ? 0 : index / count * Math.PI * 2;
        this.gardenDecoys.push({ x: this.player.x + Math.cos(angle) * 28, y: this.player.y + Math.sin(angle) * 28, radius: weapon.projectileRadius, health: weapon.decoyHealth, maxHealth: weapon.decoyHealth, lifetime: weapon.decoyDuration, explosionDamage: weapon.decoyExplosionDamage * this.player.damageMultiplier, explosionRadius: weapon.decoyExplosionRadius, color: weapon.color, pinata: weapon.pinata === true, confettiCount: weapon.pinataConfettiCount ?? 0, confettiDamage: (weapon.pinataConfettiDamage ?? 0) * this.player.damageMultiplier, confettiSpeed: weapon.pinataConfettiSpeed ?? 0, confettiLifetime: weapon.pinataConfettiLifetime ?? 0, active: true });
      }
      return;
    }
    if (weapon.projectileKind === "pebble") {
      const count = weapon.burstCount ?? 3;
      for (let index = 0; index < count; index += 1) {
        this.pendingBurstShots.push({ delay: index * (weapon.burstInterval ?? 0.09), angle: Math.atan2(offsetY, offsetX) + (index - (count - 1) / 2) * (weapon.burstSpacing ?? 0.14) + (Math.random() - 0.5) * shotRecoil, weapon, damage: weapon.damage * this.player.damageMultiplier });
      }
      this.player.addRecoil(weapon.recoil * holdMultiplier);
      return;
    }
    if (weapon.id === "ordinance-undefined") {
      const aimAngle = Math.atan2(offsetY, offsetX);
      const burstRounds = weapon.burstRounds ?? 2;
      for (let burst = 0; burst < burstRounds; burst += 1) {
        for (let index = 0; index < weapon.projectileCount; index += 1) {
          const fanOffset = (index - (weapon.projectileCount - 1) / 2) * (weapon.fanSpacing ?? 0.14);
          const jitter = weapon.spread ? (Math.random() - 0.5) * weapon.spread : 0;
          const angle = aimAngle + fanOffset + jitter + (Math.random() - 0.5) * shotRecoil * 2;
          this.pendingBurstShots.push({
            delay: burst * weapon.burstInterval,
            projectileOptions: {
              x: this.player.x, y: this.player.y - 8,
              velocityX: Math.cos(angle) * weapon.projectileSpeed,
              velocityY: Math.sin(angle) * weapon.projectileSpeed,
              damage: Math.round(weapon.damage * this.player.damageMultiplier),
              lifetime: weapon.projectileLifetime, kind: weapon.projectileKind,
              color: weapon.color, radius: weapon.projectileRadius,
              explosive: true, splashRadius: weapon.splashRadius,
              bounces: weapon.bounces, pierces: weapon.pierces,
              knockback: weapon.knockback, weaponId: weapon.id,
              fireDamagePerSecond: weapon.fireDamagePerSecond,
              fireDuration: weapon.fireDuration,
              fireMaxStacks: weapon.fireMaxStacks,
              freezeDuration: weapon.freezeDuration,
            },
          });
        }
      }
      this.player.addRecoil(weapon.recoil * holdMultiplier);
      return;
    }
    if (weapon.projectileKind === "leaf-tornado") {
      const count = weapon.projectileCount ?? 1;
      const aimAngle = Math.atan2(offsetY, offsetX);
      for (let index = 0; index < count; index += 1) {
        const angle = aimAngle + (index - (count - 1) / 2) * 0.16;
        this.leafTornadoes.push({
          x: this.player.x, y: this.player.y - 8,
          velocityX: Math.cos(angle) * weapon.projectileSpeed,
          velocityY: Math.sin(angle) * weapon.projectileSpeed,
          lifetime: weapon.projectileLifetime, radius: weapon.projectileRadius,
          pullRadius: weapon.tornadoPullRadius, pullForce: weapon.tornadoPullForce,
          tick: 0, tickInterval: weapon.tornadoTickInterval,
          damage: weapon.damage * this.player.damageMultiplier, color: weapon.color, active: true,
        });
      }
      return;
    }
    if (weapon.projectileKind === "polarity") {
      const angle = Math.atan2(offsetY, offsetX) + (Math.random() - 0.5) * shotRecoil * 2;
      this.projectiles.push(new Projectile({
        x: this.player.x, y: this.player.y - 8,
        velocityX: Math.cos(angle) * weapon.projectileSpeed, velocityY: Math.sin(angle) * weapon.projectileSpeed,
        damage: Math.round(weapon.damage * this.player.damageMultiplier), lifetime: weapon.projectileLifetime,
        kind: weapon.projectileKind, color: weapon.color, radius: weapon.projectileRadius,
        polarity: this.polarityNext, polarityRadius: weapon.polarityRadius, polarityForce: weapon.polarityForce, freezeDuration: weapon.freezeDuration,
        detonateOnExpiry: true,
      }));
      this.polarityNext = this.polarityNext === "pull" ? "push" : "pull";
      this.player.addRecoil(weapon.recoil * holdMultiplier);
      return;
    }
    if (weapon.projectileKind === "horseshoe") {
      const count = weapon.projectileCount ?? 1;
      const aimAngle = Math.atan2(offsetY, offsetX);
      for (let index = 0; index < count; index += 1) {
        const angle = aimAngle + (index - (count - 1) / 2) * 0.2;
        const horseshoe = new Projectile({
          x: this.player.x, y: this.player.y - 8, velocityX: Math.cos(angle) * weapon.projectileSpeed, velocityY: Math.sin(angle) * weapon.projectileSpeed,
          damage: Math.round(weapon.damage * this.player.damageMultiplier), lifetime: weapon.projectileLifetime,
          kind: weapon.projectileKind, color: weapon.color, radius: weapon.projectileRadius,
          pierces: weapon.pierces,
          horseshoe: true, horseshoeRange: weapon.horseshoeRange, horseshoeArc: weapon.horseshoeArc,
          horseshoeOrbitCount: weapon.horseshoeOrbitCount ?? 1,
          weaponId,
        });
        horseshoe.horseshoeDirection = index % 2 === 0 ? 1 : -1;
        this.projectiles.push(horseshoe);
      }
      this.player.addRecoil(weapon.recoil * holdMultiplier);
      return;
    }
    if (weapon.projectileKind === "jumper-cables") {
      const targets = [];
      let origin = { x: aimPoint.x, y: aimPoint.y };
      for (let jump = 0; jump < weapon.maxChainJumps; jump += 1) {
        const target = this.enemies
          .filter((enemy) => enemy.active && enemy.targetable !== false && !targets.includes(enemy))
          .sort((a, b) => Math.hypot(a.x - origin.x, a.y - origin.y) - Math.hypot(b.x - origin.x, b.y - origin.y))[0];
        if (!target || (targets.length > 0 && Math.hypot(target.x - origin.x, target.y - origin.y) > weapon.chainRange)) break;
        const previous = targets.length ? targets[targets.length - 1] : { x: this.player.x, y: this.player.y - 8 };
        targets.push(target);
        this.lightningArcs.push({ x1: previous.x, y1: previous.y, x2: target.x, y2: target.y, lifetime: 0.24, color: weapon.color });
        const falloff = weapon.chainFalloff === 1 ? 1 : weapon.chainFalloff ** (targets.length - 1);
        this.damageEnemy(target, weapon.damage * this.player.damageMultiplier * falloff);
        origin = target;
      }
      return;
    }
    if (weapon.projectileKind === "lightning-rod") {
      if (this.lightningRods.length >= weapon.rodMax) this.lightningRods.shift();
      this.lightningRods.push({ x: this.player.x, y: this.player.y, active: true, lifetime: weapon.rodDuration, strikeTimer: 0, strikeInterval: weapon.rodStrikeInterval, radius: weapon.rodRadius, chainRange: weapon.rodChainRange, chainCount: weapon.rodChainCount ?? 10, damage: weapon.damage * this.player.damageMultiplier, color: weapon.color, flash: 0 });
      return;
    }
    if (weapon.projectileKind === "garden-mirror") {
      const count = weapon.projectileCount ?? 1;
      for (let index = 0; index < count; index += 1) {
        const angle = count === 1 ? 0 : index / count * Math.PI * 2;
        if (this.gardenMirrors.length >= weapon.mirrorMax) this.gardenMirrors.shift();
        this.gardenMirrors.push({ x: this.player.x + Math.cos(angle) * 26, y: this.player.y + Math.sin(angle) * 26, radius: 22, lifetime: weapon.mirrorDuration, damageMultiplier: weapon.mirrorDamageMultiplier, active: true, flash: 0 });
      }
      return;
    }
    if (weapon.projectileKind === "doorbell") {
      if (this.doorbells.length >= 3) this.doorbells.shift();
      this.doorbells.push({ x: this.player.x, y: this.player.y, active: true, lifetime: weapon.doorbellDuration, ringTimer: 0, interval: weapon.doorbellInterval, radius: weapon.doorbellRadius, ringCount: weapon.doorbellRingCount, outerMultiplier: weapon.doorbellOuterMultiplier, damage: weapon.damage * this.player.damageMultiplier, color: weapon.color });
      return;
    }
    if (weapon.projectileKind === "orbital-sprinkler") {
      this.orbitalStrikes.push({ x: aimPoint.x, y: aimPoint.y, active: true, delay: weapon.orbitalDelay, radius: weapon.orbitalRadius, damage: weapon.damage * this.player.damageMultiplier, radialCount: weapon.radialCount, radialDamage: weapon.radialDamage * this.player.damageMultiplier, radialSpeed: weapon.radialSpeed, radialLifetime: weapon.radialLifetime, bossDamageMultiplier: 0.3, color: weapon.color, second: weapon.orbitalSecondStrike, didSecond: false });
      return;
    }
    const bonusAppleProjectiles = (weaponId === "apples" || weaponId === "rainbow-apples") ? this.player.appleCount - 1 : 0;
    const projectileCount = weapon.projectileCount + bonusAppleProjectiles;
    const projectilesPerRound = weapon.projectilesPerRound ?? projectileCount;
    const rounds = weapon.rounds ?? 1;
    for (let round = 0; round < rounds; round += 1) {
      for (let index = 0; index < projectilesPerRound; index += 1) {
      const fanOffset = (index - (projectilesPerRound - 1) / 2) * (weapon.fanSpacing ?? 0.14);
      const jitter = weapon.spread ? (Math.random() - 0.5) * weapon.spread : 0;
      const recoilOffset = (Math.random() - 0.5) * shotRecoil * 2;
      const roundOffset = rounds > 1 ? (round - (rounds - 1) / 2) * 0.035 : 0;
      const angle = Math.atan2(offsetY, offsetX) + fanOffset + roundOffset + jitter + recoilOffset;
      const explosive = this.player.rangedExplosion || weapon.explosive;
      const centerPierceCount = weapon.centerPierceCount ?? 0;
      const centerStart = Math.floor((projectilesPerRound - centerPierceCount) / 2);
      const centerPierce = index >= centerStart && index < centerStart + centerPierceCount ? 1 : 0;
      this.projectiles.push(new Projectile({
        x: weapon.projectileKind === "gravity-portal" ? aimPoint.x : this.player.x,
        y: weapon.projectileKind === "gravity-portal" ? aimPoint.y : this.player.y - 8,
        velocityX: weapon.projectileKind === "gravity-portal" ? 0 : Math.cos(angle) * weapon.projectileSpeed,
        velocityY: weapon.projectileKind === "gravity-portal" ? 0 : Math.sin(angle) * weapon.projectileSpeed,
        damage: Math.round(weapon.damage * this.player.damageMultiplier),
        lifetime: weapon.projectileLifetime,
        kind: weapon.projectileKind,
        color: weaponId === "party-hat" ? `hsl(${(index * 53 + Date.now() / 18) % 360} 90% 60%)` : weapon.color,
        radius: weapon.projectileRadius * (weapon.projectileRadiusMultiplier ?? 1),
        endSpeedMultiplier: weapon.endSpeedMultiplier,
        speedCurve: weapon.speedCurve,
        lifesteal: weapon.lifesteal,
        explosive,
        splashRadius: explosive ? (weapon.splashRadius || 72) : 0,
        splashDamageMultiplier: weapon.splashDamageMultiplier,
        slowDuration: weapon.slowDuration,
        bounces: weapon.bounces,
        pierces: weapon.pierces + centerPierce,
        knockback: weapon.knockback,
        fireDamagePerSecond: weapon.fireDamagePerSecond,
        fireDuration: weapon.fireDuration,
        fireMaxStacks: weapon.fireMaxStacks,
        freezeDuration: weapon.freezeDuration,
        gravityPull: weapon.gravityPull, splitCount: weapon.splitCount, splitDamage: weapon.splitDamage, splitRadius: weapon.splitRadius,
        polarity: weapon.polarity, polarityRadius: weapon.polarityRadius, polarityForce: weapon.polarityForce,
        detonateOnExpiry: weapon.detonateOnExpiry,
        puddleDuration: weapon.puddleDuration, puddleRadius: weapon.puddleRadius,
        boomerang: weapon.projectileKind === "trash-can-lid", boomerangRange: weapon.boomerangRange, returnSpeed: weapon.returnSpeed, returnDamageMultiplier: weapon.returnDamageMultiplier,
        fertilizerCloudRadius: weapon.fertilizerCloudRadius, fertilizerCloudDuration: weapon.fertilizerCloudDuration, fertilizerTickInterval: weapon.fertilizerTickInterval,
        boundaryBounces: weapon.boundaryBounces,
        allowRepeatBounces: weapon.allowRepeatBounces,
        weaponId,
      }));
      }
    }
    this.player.addRecoil(weapon.recoil * holdMultiplier);
  }

  updatePendingBurstShots(deltaTime) {
    for (const shot of this.pendingBurstShots) {
      shot.delay -= deltaTime;
      if (shot.delay <= 0 && !shot.fired) {
        shot.fired = true;
        this.projectiles.push(new Projectile(shot.projectileOptions ?? {
          x: this.player.x, y: this.player.y - 8,
          velocityX: Math.cos(shot.angle) * shot.weapon.projectileSpeed,
          velocityY: Math.sin(shot.angle) * shot.weapon.projectileSpeed,
          damage: shot.damage, lifetime: shot.weapon.projectileLifetime,
          kind: shot.weapon.projectileKind, color: shot.weapon.color, radius: shot.weapon.projectileRadius,
          weaponId: shot.weapon.id,
        }));
      }
    }
    this.pendingBurstShots = this.pendingBurstShots.filter((shot) => !shot.fired);
  }

  updateWeaponDeployables(deltaTime) {
    for (const tornado of this.leafTornadoes) {
      if (!tornado.active) continue;
      tornado.x += tornado.velocityX * deltaTime; tornado.y += tornado.velocityY * deltaTime;
      tornado.lifetime -= deltaTime; tornado.tick -= deltaTime;
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.targetable === false) continue;
        const dx = tornado.x - enemy.x; const dy = tornado.y - enemy.y; const distance = Math.hypot(dx, dy) || 1;
        if (distance <= tornado.pullRadius) {
          const pull = tornado.pullForce * deltaTime * Math.max(0.15, 1 - distance / tornado.pullRadius);
          enemy.x += dx / distance * pull; enemy.y += dy / distance * pull;
          if (tornado.tick <= 0) this.damageEnemy(enemy, tornado.damage);
        }
      }
      if (tornado.tick <= 0) tornado.tick = tornado.tickInterval;
      if (tornado.lifetime <= 0 || tornado.x < -80 || tornado.y < -80 || tornado.x > this.world.width + 80 || tornado.y > this.world.height + 80) tornado.active = false;
    }
    this.leafTornadoes = this.leafTornadoes.filter((tornado) => tornado.active);

    for (const rod of this.lightningRods) {
      if (!rod.active) continue;
      rod.lifetime -= deltaTime; rod.strikeTimer -= deltaTime; rod.flash = Math.max(0, (rod.flash ?? 0) - deltaTime);
      if (rod.strikeTimer <= 0) { this.strikeLightningRod(rod); rod.strikeTimer = rod.strikeInterval; }
      if (rod.lifetime <= 0) rod.active = false;
    }
    this.lightningRods = this.lightningRods.filter((rod) => rod.active);

    for (const mirror of this.gardenMirrors) {
      if (!mirror.active) continue;
      mirror.lifetime -= deltaTime; mirror.flash = Math.max(0, (mirror.flash ?? 0) - deltaTime);
      if (mirror.lifetime <= 0) mirror.active = false;
    }
    this.gardenMirrors = this.gardenMirrors.filter((mirror) => mirror.active);

    for (const bell of this.doorbells) {
      if (!bell.active) continue;
      bell.lifetime -= deltaTime; bell.ringTimer -= deltaTime;
      if (bell.ringTimer <= 0) {
        for (let index = 0; index < bell.ringCount; index += 1) this.doorbellWaves.push({ x: bell.x, y: bell.y, radius: 12 + index * 8, maxRadius: bell.radius, speed: 250, damage: bell.damage, outerMultiplier: bell.outerMultiplier, active: true, hitEnemies: new Set() });
        bell.ringTimer = bell.interval;
      }
      if (bell.lifetime <= 0) bell.active = false;
    }
    this.doorbells = this.doorbells.filter((bell) => bell.active);
    for (const wave of this.doorbellWaves) {
      if (!wave.active) continue;
      const previousRadius = wave.radius; wave.radius += wave.speed * deltaTime;
      for (const enemy of this.enemies) {
        if (!enemy.active || enemy.targetable === false || wave.hitEnemies.has(enemy)) continue;
        const distance = Math.hypot(enemy.x - wave.x, enemy.y - wave.y);
        if (distance >= previousRadius && distance < wave.radius + enemy.radius) {
          wave.hitEnemies.add(enemy);
          this.damageEnemy(enemy, wave.damage * (distance > wave.maxRadius * 0.72 ? wave.outerMultiplier : 1));
        }
      }
      if (wave.radius >= wave.maxRadius) wave.active = false;
    }
    this.doorbellWaves = this.doorbellWaves.filter((wave) => wave.active);

    for (const strike of this.orbitalStrikes) {
      if (!strike.active) continue;
      strike.delay -= deltaTime;
      if (strike.delay <= 0) {
        this.explosions.push({ x: strike.x, y: strike.y, lifetime: 0.5, radius: strike.radius, color: strike.color });
        for (const enemy of this.enemies) if (enemy.active && Math.hypot(enemy.x - strike.x, enemy.y - strike.y) <= strike.radius) {
          const damage = enemy.isBoss ? strike.damage * strike.bossDamageMultiplier : strike.damage;
          this.damageEnemy(enemy, damage);
        }
        for (let index = 0; index < strike.radialCount; index += 1) {
          const angle = index / strike.radialCount * Math.PI * 2;
          this.projectiles.push(new Projectile({ x: strike.x, y: strike.y, velocityX: Math.cos(angle) * strike.radialSpeed, velocityY: Math.sin(angle) * strike.radialSpeed, damage: strike.radialDamage, lifetime: strike.radialLifetime, kind: "orbital-water", color: strike.color, radius: 7, bossDamageMultiplier: strike.bossDamageMultiplier }));
        }
        if (strike.second && !strike.didSecond) { strike.didSecond = true; strike.delay = 0.65; continue; }
        strike.active = false;
      }
    }
    this.orbitalStrikes = this.orbitalStrikes.filter((strike) => strike.active);
    this.lightningArcs = this.lightningArcs.filter((arc) => (arc.lifetime -= deltaTime) > 0);
    this.polarityPulses = this.polarityPulses.filter((pulse) => (pulse.lifetime -= deltaTime) > 0);
    for (const mine of this.sprinklerMines) {
      if (!mine.active) continue;
      mine.warningTime -= deltaTime;
      const target = this.enemies.find((enemy) => enemy.active && enemy.targetable !== false
        && Math.hypot(enemy.x - mine.x, enemy.y - mine.y) <= mine.triggerRadius + enemy.radius);
      if (target && mine.warningTime <= 0) {
        this.explosions.push({ x: mine.x, y: mine.y, lifetime: 0.32, radius: mine.explosionRadius, color: mine.color });
        for (const enemy of this.enemies) {
          if (!enemy.active || Math.hypot(enemy.x - mine.x, enemy.y - mine.y) > mine.explosionRadius) continue;
          this.damageEnemy(enemy, mine.damage);
          if (enemy.active) applyFreeze(enemy, mine.freezeDuration);
        }
        mine.active = false;
      }
    }
    this.sprinklerMines = this.sprinklerMines.filter((mine) => mine.active);

    for (const zapper of this.bugZappers) {
      if (!zapper.active) continue;
      zapper.lifetime -= deltaTime; zapper.cooldown -= deltaTime;
      if (zapper.lifetime <= 0) { zapper.active = false; continue; }
      if (zapper.cooldown <= 0) {
        const candidates = this.enemies.filter((enemy) => enemy.active && enemy.targetable !== false
          && Math.hypot(enemy.x - zapper.x, enemy.y - zapper.y) <= zapper.range).sort((a, b) => Math.hypot(a.x - zapper.x, a.y - zapper.y) - Math.hypot(b.x - zapper.x, b.y - zapper.y));
        const targets = candidates.slice(0, 1 + zapper.chainCount);
        targets.forEach((enemy, index) => this.damageEnemy(enemy, zapper.damage * (index ? zapper.chainDamageMultiplier : 1)));
        if (targets.length) this.explosions.push({ x: zapper.x, y: zapper.y, lifetime: 0.18, radius: zapper.range * 0.18, color: zapper.color, ring: true });
        zapper.cooldown = zapper.zapCooldown;
      }
    }
    this.bugZappers = this.bugZappers.filter((zapper) => zapper.active);

    for (const decoy of this.gardenDecoys) {
      if (!decoy.active) continue;
      decoy.lifetime -= deltaTime;
      for (const enemy of this.enemies) {
        if (enemy.active && !enemy.isBoss && Math.hypot(enemy.x - decoy.x, enemy.y - decoy.y) <= enemy.radius + decoy.radius) {
          decoy.health -= (enemy.damage ?? 4) * deltaTime;
        }
      }
      if (decoy.lifetime <= 0 || decoy.health <= 0) {
        if (decoy.explosionDamage > 0 && decoy.explosionRadius > 0) {
          this.explosions.push({ x: decoy.x, y: decoy.y, lifetime: 0.3, radius: decoy.explosionRadius, color: decoy.color });
          for (const enemy of this.enemies) if (enemy.active && Math.hypot(enemy.x - decoy.x, enemy.y - decoy.y) <= decoy.explosionRadius) this.damageEnemy(enemy, decoy.explosionDamage);
        }
        for (let confetti = 0; confetti < (decoy.confettiCount ?? 0); confetti += 1) {
          const angle = confetti / decoy.confettiCount * Math.PI * 2;
          this.projectiles.push(new Projectile({
            x: decoy.x, y: decoy.y,
            velocityX: Math.cos(angle) * decoy.confettiSpeed,
            velocityY: Math.sin(angle) * decoy.confettiSpeed,
            damage: decoy.confettiDamage, lifetime: decoy.confettiLifetime,
            kind: "confetti", color: `hsl(${confetti * 45} 90% 60%)`, radius: 5,
            weaponId: "pinata",
          }));
        }
        decoy.active = false;
      }
    }
    this.gardenDecoys = this.gardenDecoys.filter((decoy) => decoy.active);

    for (const cloud of this.fertilizerClouds) {
      if (!cloud.active) continue;
      cloud.lifetime -= deltaTime; cloud.tick -= deltaTime;
      if (cloud.tick <= 0) {
        for (const enemy of this.enemies) if (enemy.active && Math.hypot(enemy.x - cloud.x, enemy.y - cloud.y) <= cloud.radius) this.damageEnemy(enemy, cloud.damage);
        cloud.tick = cloud.tickInterval;
      }
      if (cloud.lifetime <= 0) cloud.active = false;
    }
    this.fertilizerClouds = this.fertilizerClouds.filter((cloud) => cloud.active);
  }

  strikeLightningRod(rod) {
    rod.flash = 0.2;
    this.lightningArcs.push({ x1: rod.x, y1: rod.y - 180, x2: rod.x, y2: rod.y, lifetime: 0.22, color: rod.color });
    const struckEnemies = new Set();
    for (const enemy of this.enemies) {
      if (enemy.active && Math.hypot(enemy.x - rod.x, enemy.y - rod.y) <= rod.radius) {
        struckEnemies.add(enemy);
        this.damageEnemy(enemy, rod.damage);
      }
    }
    let previous = { x: rod.x, y: rod.y };
    for (let jump = 0; jump < (rod.chainCount ?? 0); jump += 1) {
      const target = this.enemies
        .filter((enemy) => enemy.active && enemy.targetable !== false && !struckEnemies.has(enemy))
        .sort((a, b) => Math.hypot(a.x - previous.x, a.y - previous.y) - Math.hypot(b.x - previous.x, b.y - previous.y))[0];
      if (!target || Math.hypot(target.x - previous.x, target.y - previous.y) > rod.chainRange) break;
      this.lightningArcs.push({ x1: previous.x, y1: previous.y, x2: target.x, y2: target.y, lifetime: 0.22, color: rod.color });
      this.damageEnemy(target, rod.damage * 0.5);
      struckEnemies.add(target);
      previous = target;
    }
    for (const other of this.lightningRods) if (other !== rod && other.active && Math.hypot(other.x - rod.x, other.y - rod.y) <= rod.chainRange) {
      this.lightningArcs.push({ x1: rod.x, y1: rod.y, x2: other.x, y2: other.y, lifetime: 0.22, color: rod.color });
      for (const enemy of this.enemies) if (enemy.active && Math.hypot(enemy.x - (rod.x + other.x) / 2, enemy.y - (rod.y + other.y) / 2) <= 35) this.damageEnemy(enemy, rod.damage * 0.5);
    }
  }

  detonatePolarityProjectile(projectile) {
    const radius = projectile.polarityRadius || 82;
    const pull = projectile.polarity === "pull";
    this.polarityPulses.push({ x: projectile.x, y: projectile.y, radius, polarity: projectile.polarity, lifetime: 0.28, color: projectile.color });
    this.explosions.push({ x: projectile.x, y: projectile.y, lifetime: 0.28, radius, color: projectile.color, ring: true });
    for (const enemy of this.enemies) {
      if (!enemy.active || enemy.targetable === false) continue;
      const dx = projectile.x - enemy.x; const dy = projectile.y - enemy.y; const distance = Math.hypot(dx, dy) || 1;
      if (distance > radius) continue;
      this.damageEnemy(enemy, projectile.damage * 0.65);
      if (projectile.freezeDuration > 0) applyFreeze(enemy, projectile.freezeDuration);
      const direction = pull ? 1 : -1;
      const force = projectile.polarityForce * direction * (1 - distance / radius);
      enemy.x += dx / distance * force; enemy.y += dy / distance * force;
    }
  }

  createFertilizerCloud(x, y, projectile) {
    this.explosions.push({ x, y, lifetime: 0.25, radius: projectile.fertilizerCloudRadius, color: projectile.color, ring: true });
    this.fertilizerClouds.push({ x, y, radius: projectile.fertilizerCloudRadius, lifetime: projectile.fertilizerCloudDuration, tick: 0, tickInterval: projectile.fertilizerTickInterval, damage: projectile.damage, color: projectile.color, active: true });
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
    if (this.player.flamingoTube) {
      const radius = 105;
      for (const enemy of this.enemies) {
        if (enemy.active && enemy.targetable !== false && distanceBetween(enemy, this.player) <= radius) {
          applyKnockback(enemy, this.player.x, this.player.y, 90 * deltaTime, this.world);
        }
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

  openWeaponPreview(weaponId, returnState) {
    const weapon = weaponById(weaponId);
    if (!weapon) return;
    let simulation = null;
    if (typeof document !== "undefined") {
      const previewCanvas = document.createElement("canvas");
      previewCanvas.width = 360;
      previewCanvas.height = 250;
      const previewInput = createPreviewInput();
      simulation = new Game(previewCanvas, null, { previewInstance: true, input: previewInput });
      simulation.progress = structuredClone(this.progress);
      const slotName = weapon.slot === "melee" ? "melee" : "ranged";
      simulation.progress.equippedWeapons[slotName] = weapon.id;
      simulation.resetRun();
      simulation.currentMap = { ...FIRST_MAP, id: "weapon-preview", world: { width: 360, height: 250 }, obstacles: [], bossSpawnTime: Number.POSITIVE_INFINITY, enemyCap: 0 };
      simulation.world = simulation.currentMap.world;
      simulation.camera.resize(360, 250);
      simulation.camera.setWorldSize(360, 250);
      simulation.player.x = 74;
      simulation.player.y = 132;
      simulation.enemies = [new PreviewDummy(238, 76), new PreviewDummy(292, 128), new PreviewDummy(238, 180)];
      simulation.activeObstacles = [];
      simulation.projectiles = [];
      simulation.pickups = [];
      simulation.weaponSlot = weapon.slot === "melee" ? 1 : 2;
      simulation.attackCooldowns = { 1: 0, 2: 0 };
      simulation.bossSpawned = true;
      simulation.boss = null;
      simulation.spawnTimer = Number.POSITIVE_INFINITY;
      simulation.screenState = "running";
    }
    this.weaponPreviewReturnState = returnState;
    this.weaponPreview = {
      weaponId, cooldown: 0, projectiles: [], effects: [],
      player: { x: 74, y: 132, radius: 15, speed: 120, facing: 0, isMoving: false, walkTime: 0 },
      dummies: [
        { x: 238, y: 76, health: 500, maxHealth: 500 },
        { x: 292, y: 128, health: 500, maxHealth: 500 },
        { x: 238, y: 180, health: 500, maxHealth: 500 },
      ],
      simulation,
    };
    this.screenState = "weapon-preview";
    this.input.pointer.down = false;
  }

  updateWeaponPreview(deltaTime, allowFiring = true) {
    const preview = this.weaponPreview;
    if (!preview) return;
    if (preview.simulation) {
      const simulation = preview.simulation;
      simulation.input.keys = this.input.keys;
      simulation.input.pointer.x = clamp(this.input.pointer.x - 18, 0, 360);
      simulation.input.pointer.y = clamp(this.input.pointer.y - 18, 0, 250);
      simulation.input.pointer.inside = this.input.pointer.x >= 18 && this.input.pointer.x <= 378
        && this.input.pointer.y >= 18 && this.input.pointer.y <= 268;
      simulation.input.pointer.down = allowFiring && simulation.input.pointer.inside && this.input.pointer.down;
      simulation.update(deltaTime);
      simulation.render();
      preview.player = simulation.player;
      preview.dummies = simulation.enemies;
      return;
    }
    const baseWeapon = weaponById(preview.weaponId);
    if (!baseWeapon) return;
    const weapon = weaponStatsAtLevel(baseWeapon, this.progress.weaponLevels[baseWeapon.id] ?? 1);
    const movement = this.input.movementVector?.() ?? { x: 0, y: 0 };
    const previewPlayer = preview.player;
    previewPlayer.isMoving = Math.hypot(movement.x, movement.y) > 0;
    if (previewPlayer.isMoving) previewPlayer.walkTime += deltaTime;
    previewPlayer.x = clamp(previewPlayer.x + movement.x * previewPlayer.speed * deltaTime, 24, 336);
    previewPlayer.y = clamp(previewPlayer.y + movement.y * previewPlayer.speed * deltaTime, 48, 220);
    preview.cooldown = Math.max(0, preview.cooldown - deltaTime);
    for (const effect of preview.effects) effect.lifetime -= deltaTime;
    preview.effects = preview.effects.filter((effect) => effect.lifetime > 0);
    for (const dummy of preview.dummies) {
      if (dummy.health <= 0) dummy.resetTimer = (dummy.resetTimer ?? 0.65) - deltaTime;
      if ((dummy.resetTimer ?? 1) <= 0) { dummy.health = dummy.maxHealth; dummy.resetTimer = null; }
    }

    const arenaX = 18; const arenaY = 18;
    const playerX = arenaX + previewPlayer.x; const playerY = arenaY + previewPlayer.y;
    const aimX = clamp(this.input.pointer.x, arenaX + 34, arenaX + 342);
    const aimY = clamp(this.input.pointer.y, arenaY + 34, arenaY + 232);
    previewPlayer.facing = Math.atan2(aimY - playerY, aimX - playerX);
    if (allowFiring && this.input.pointer.down && preview.cooldown <= 0
      && this.input.pointer.x >= arenaX && this.input.pointer.x <= arenaX + 360
      && this.input.pointer.y >= arenaY && this.input.pointer.y <= arenaY + 250) {
      preview.cooldown = Math.max(0.06, weapon.cooldown);
      const baseAngle = Math.atan2(aimY - playerY, aimX - playerX);
      preview.effects.push({ x: playerX, y: playerY, angle: baseAngle, lifetime: 0.16, maxLifetime: 0.16, melee: weapon.slot === "melee" });
      if (weapon.slot === "melee") {
        const range = Math.min(145, Math.max(42, (weapon.range ?? 55) * 1.25));
        for (const dummy of preview.dummies) {
          if (dummy.health <= 0) continue;
          const dx = arenaX + dummy.x - playerX; const dy = arenaY + dummy.y - playerY;
          const difference = Math.abs(normalizeAngle(Math.atan2(dy, dx) - baseAngle));
          if (Math.hypot(dx, dy) <= range + 18 && difference <= (weapon.arc ?? Math.PI / 2) / 2) dummy.health -= weapon.damage;
        }
      } else {
        const count = Math.min(20, weapon.projectileCount ?? weapon.pellets ?? 1);
        const spacing = weapon.fanSpacing ?? (count > 1 ? 0.1 : 0);
        for (let index = 0; index < count; index += 1) {
          const angle = baseAngle + (index - (count - 1) / 2) * spacing + (Math.random() - 0.5) * (weapon.spread ?? 0);
          const speed = clamp((weapon.projectileSpeed ?? 650) * 0.42, 150, 560);
          preview.projectiles.push({
            x: playerX + Math.cos(angle) * 24, y: playerY + Math.sin(angle) * 24,
            velocityX: Math.cos(angle) * speed, velocityY: Math.sin(angle) * speed,
            damage: weapon.damage, radius: Math.max(3, Math.min(12, weapon.projectileRadius ?? 5)), color: weapon.color,
            pierces: weapon.pierces ?? 0, bounces: weapon.bounces ?? 0, explosive: weapon.explosive,
            splashRadius: Math.min(70, weapon.splashRadius ?? 0), active: true,
          });
        }
      }
    }

    for (const projectile of preview.projectiles) {
      if (!projectile.active) continue;
      projectile.x += projectile.velocityX * deltaTime; projectile.y += projectile.velocityY * deltaTime;
      for (const dummy of preview.dummies) {
        if (dummy.health <= 0 || projectile.hit === dummy) continue;
        const dummyX = arenaX + dummy.x; const dummyY = arenaY + dummy.y;
        if (Math.hypot(projectile.x - dummyX, projectile.y - dummyY) > projectile.radius + 18) continue;
        dummy.health -= projectile.damage; projectile.hit = dummy;
        preview.effects.push({ x: dummyX, y: dummyY, lifetime: 0.2, maxLifetime: 0.2, hit: true });
        if (projectile.explosive) for (const nearby of preview.dummies) {
          if (nearby !== dummy && nearby.health > 0 && Math.hypot(arenaX + nearby.x - dummyX, arenaY + nearby.y - dummyY) <= projectile.splashRadius) nearby.health -= projectile.damage * 0.7;
        }
        if (projectile.pierces > 0) projectile.pierces -= 1;
        else if (projectile.bounces > 0) {
          projectile.bounces -= 1;
          const target = preview.dummies.filter((entry) => entry !== dummy && entry.health > 0)
            .sort((a, b) => Math.hypot(arenaX+a.x-projectile.x,arenaY+a.y-projectile.y)-Math.hypot(arenaX+b.x-projectile.x,arenaY+b.y-projectile.y))[0];
          if (target) { const angle=Math.atan2(arenaY+target.y-projectile.y,arenaX+target.x-projectile.x);const speed=Math.hypot(projectile.velocityX,projectile.velocityY);projectile.velocityX=Math.cos(angle)*speed;projectile.velocityY=Math.sin(angle)*speed;projectile.hit=null; }
          else projectile.active = false;
        } else projectile.active = false;
        break;
      }
      if (projectile.x < arenaX || projectile.x > arenaX + 360 || projectile.y < arenaY || projectile.y > arenaY + 250) projectile.active = false;
    }
    preview.projectiles = preview.projectiles.filter((projectile) => projectile.active);
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
    context.fillText(label, x + width / 2, options.textY ?? y + height / 2 + 5);
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

  renderWeaponDeployables(context) {
    for (const tornado of this.leafTornadoes) {
      const x = Math.round(tornado.x - this.camera.x); const y = Math.round(tornado.y - this.camera.y);
      context.save(); context.globalAlpha = Math.max(0.18, Math.min(1, tornado.lifetime / 0.8));
      context.fillStyle = "rgba(182,201,87,0.22)"; context.beginPath(); context.arc(x, y, tornado.radius, 0, Math.PI * 2); context.fill();
      context.strokeStyle = tornado.color; context.lineWidth = 4; context.beginPath(); context.arc(x, y, tornado.radius * 0.7, 0, Math.PI * 1.5); context.stroke(); context.restore();
    }
    for (const rod of this.lightningRods) {
      const x = Math.round(rod.x - this.camera.x); const y = Math.round(rod.y - this.camera.y);
      context.fillStyle = "#53606c"; context.fillRect(x - 4, y - 24, 8, 30); context.fillStyle = rod.color; context.fillRect(x - 8, y - 27, 16, 5);
      context.strokeStyle = "rgba(233,237,255,0.2)"; context.beginPath(); context.arc(x, y, rod.radius, 0, Math.PI * 2); context.stroke();
      if (rod.flash > 0) { context.globalAlpha = rod.flash / 0.2; context.strokeStyle = rod.color; context.lineWidth = 4; context.beginPath(); context.moveTo(x, y - 180); context.lineTo(x, y); context.stroke(); context.globalAlpha = 1; }
    }
    for (const mirror of this.gardenMirrors) {
      const x = Math.round(mirror.x - this.camera.x); const y = Math.round(mirror.y - this.camera.y);
      context.save(); context.globalAlpha = mirror.flash > 0 ? 1 : 0.82; context.fillStyle = "#456070"; context.fillRect(x - 10, y - 16, 20, 32); context.fillStyle = "#bdeff6"; context.fillRect(x - 7, y - 13, 14, 26); context.fillStyle = "#ffffff"; context.fillRect(x - 5, y - 10, 3, 16); context.restore();
    }
    for (const bell of this.doorbells) {
      const x = Math.round(bell.x - this.camera.x); const y = Math.round(bell.y - this.camera.y);
      context.fillStyle = "#80552c"; context.fillRect(x - 10, y + 5, 20, 5); context.fillStyle = bell.color; context.fillRect(x - 8, y - 10, 16, 16);
    }
    for (const wave of this.doorbellWaves) {
      const x = Math.round(wave.x - this.camera.x); const y = Math.round(wave.y - this.camera.y);
      context.globalAlpha = 0.45; context.strokeStyle = "#f1d079"; context.lineWidth = 3; context.beginPath(); context.arc(x, y, wave.radius, 0, Math.PI * 2); context.stroke(); context.globalAlpha = 1;
    }
    for (const strike of this.orbitalStrikes) {
      if (!strike.active || strike.delay <= 0) continue;
      const x = Math.round(strike.x - this.camera.x); const y = Math.round(strike.y - this.camera.y);
      context.globalAlpha = 0.45; context.strokeStyle = strike.color; context.lineWidth = 3; context.beginPath(); context.arc(x, y, strike.radius, 0, Math.PI * 2); context.stroke(); context.globalAlpha = 1;
    }
    for (const arc of this.lightningArcs) {
      context.globalAlpha = Math.min(1, arc.lifetime / 0.12); context.strokeStyle = arc.color ?? "#e9edff"; context.lineWidth = 3; context.beginPath(); context.moveTo(arc.x1 - this.camera.x, arc.y1 - this.camera.y); context.lineTo(arc.x2 - this.camera.x, arc.y2 - this.camera.y); context.stroke(); context.globalAlpha = 1;
    }
    for (const pulse of this.polarityPulses) {
      const x = Math.round(pulse.x - this.camera.x); const y = Math.round(pulse.y - this.camera.y);
      context.globalAlpha = pulse.lifetime / 0.28; context.strokeStyle = pulse.polarity === "pull" ? "#b98cff" : "#ff9a75"; context.lineWidth = 4; context.beginPath(); context.arc(x, y, pulse.radius * (1 - pulse.lifetime / 0.28 * 0.35), 0, Math.PI * 2); context.stroke(); context.globalAlpha = 1;
    }
    for (const mine of this.sprinklerMines) {
      const x = Math.round(mine.x - this.camera.x); const y = Math.round(mine.y - this.camera.y);
      context.save(); context.globalAlpha = mine.warningTime > 0 ? 0.45 : 1;
      context.fillStyle = mine.color; context.fillRect(x - 9, y - 9, 18, 18);
      context.strokeStyle = mine.color; context.lineWidth = 2; context.strokeRect(x - mine.explosionRadius, y - mine.explosionRadius, mine.explosionRadius * 2, mine.explosionRadius * 2);
      context.restore();
    }
    for (const zapper of this.bugZappers) {
      const x = Math.round(zapper.x - this.camera.x); const y = Math.round(zapper.y - this.camera.y);
      context.fillStyle = zapper.color; context.fillRect(x - 12, y - 12, 24, 24);
      context.strokeStyle = "rgba(244,223,99,0.22)"; context.beginPath(); context.arc(x, y, zapper.range, 0, Math.PI * 2); context.stroke();
    }
    for (const decoy of this.gardenDecoys) {
      const x = Math.round(decoy.x - this.camera.x); const y = Math.round(decoy.y - this.camera.y);
      if (decoy.pinata) {
        context.fillStyle = "#30231d"; context.fillRect(x - 14, y - 22, 28, 48);
        ["#ee5f76", "#ffcf4b", "#63d6e8", "#8fd65a", "#8c62ca"].forEach((color, index) => {
          context.fillStyle = color; context.fillRect(x - 12, y - 20 + index * 8, 24, 7);
        });
        context.fillStyle = "#f2a04a"; context.fillRect(x + 11, y - 15, 7, 8);
        context.fillStyle = "#2b2521"; context.fillRect(x - 9, y + 20, 6, 9); context.fillRect(x + 3, y + 20, 6, 9);
        context.fillStyle = "#d7ef62"; context.fillRect(x - 13, y - 28, 26 * Math.max(0, decoy.health / decoy.maxHealth), 2);
        continue;
      }
      // Blocky gnome silhouette: tall red cap, face, beard, tunic, and boots.
      context.fillStyle = "#30231d"; context.fillRect(x - 14, y - 3, 28, 27);
      context.fillStyle = "#d64235";
      context.fillRect(x - 13, y - 22, 26, 8); context.fillRect(x - 9, y - 29, 18, 8); context.fillRect(x - 4, y - 35, 8, 7);
      context.fillStyle = "#f0bd91"; context.fillRect(x - 9, y - 13, 18, 13);
      context.fillStyle = "#211c18"; context.fillRect(x - 5, y - 9, 3, 3); context.fillRect(x + 2, y - 9, 3, 3);
      context.fillStyle = "#eee2c6"; context.fillRect(x - 8, y - 1, 16, 12); context.fillRect(x - 5, y + 9, 10, 8);
      context.fillStyle = decoy.color; context.fillRect(x - 11, y + 11, 22, 13);
      context.fillStyle = "#3b5065"; context.fillRect(x - 11, y + 22, 8, 8); context.fillRect(x + 3, y + 22, 8, 8);
      context.fillStyle = "#211c18"; context.fillRect(x - 15, y - 39, 30, 5);
      context.fillStyle = "#d7ef62"; context.fillRect(x - 13, y - 37, 26 * Math.max(0, decoy.health / decoy.maxHealth), 2);
    }
    for (const cloud of this.fertilizerClouds) {
      const x = Math.round(cloud.x - this.camera.x); const y = Math.round(cloud.y - this.camera.y);
      context.fillStyle = "rgba(159,120,61,0.25)"; context.beginPath(); context.arc(x, y, cloud.radius, 0, Math.PI * 2); context.fill();
      context.strokeStyle = cloud.color; context.lineWidth = 3; context.stroke();
    }
  }

  render() {
    const { context } = this;
    const width = this.camera.viewWidth;
    const height = this.camera.viewHeight;
    this.uiHitTargets = [];
    this.canvas.style.cursor = this.screenState === "running" ? "crosshair" : "default";
    context.clearRect(0, 0, width, height);
    context.save();
    if (this.screenState === "running" && (this.screenShakeTime ?? 0) > 0
      && this.progress.settings.screenShake && !this.progress.settings.reducedMotion) {
      const directionIndex = Math.floor((this.screenShakeFrame ?? 0) / 3) % SCREEN_SHAKE_DIRECTIONS.length;
      const direction = SCREEN_SHAKE_DIRECTIONS[directionIndex];
      const duration = Math.max(0.001, this.screenShakeDuration ?? this.screenShakeTime);
      const remaining = clamp(this.screenShakeTime / duration, 0, 1);
      const magnitude = Math.max(4, (this.screenShakeStrength ?? 0) * 70) * (0.55 + remaining * 0.45);
      context.translate(
        direction[0] * magnitude + (this.screenKickX ?? 0),
        direction[1] * magnitude + (this.screenKickY ?? 0),
      );
      this.screenShakeFrame = (this.screenShakeFrame ?? 0) + 1;
    }
    this.renderLawn(context, width, height);
    this.renderGardenBeds(context);
    this.renderFence(context);
    this.renderLandmarks(context);
    this.renderConstructionEffects(context);
    this.renderSlimeTerrain(context);
    this.renderIcePuddles(context);
    for (const lilyPad of this.lilypads) lilyPad.render(context, this.camera);
    this.renderWeaponDeployables(context);
    for (const enemy of this.enemies) {
      renderEnemyArtwork(context, enemy, this.camera);
      this.renderEnemyStatus(context, enemy);
    }
    this.renderDeathEffects(context);
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
      if (explosion.ring) {
        context.strokeStyle = explosion.color ?? "#eb9931";
        context.lineWidth = 5;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.stroke();
      } else {
        for (let index = 0; index < 16; index += 1) {
          const angle = index / 16 * Math.PI * 2;
          context.fillRect(Math.round(x + Math.cos(angle) * radius) - 4, Math.round(y + Math.sin(angle) * radius) - 4, 8, 8);
        }
      }
      context.globalAlpha = 1;
    }
    for (const projectile of this.projectiles) {
      projectile.render(context, this.camera);
    }
    for (const ability of this.abilityProjectiles) this.renderAbilityProjectile(context, ability);
    if (this.player.flamingoTube) this.renderFlamingoTube(context);
    this.player.render(
      context,
      this.camera,
      weaponForSlot(this.weaponSlot, this.progress.equippedWeapons),
    );
    this.renderMeleePulse(context);
    this.renderAttackEffects(context);
    this.renderHitEffects(context);
    this.renderFloatingDamageNumbers(context);
    if (this.screenState === "running") {
      this.renderAim(context);
    }
    this.renderLighting(context, width, height);
    this.renderBossLighting(context, width, height);
    this.renderWeaponFlashes(context);
    this.renderPixelFrame(context, width, height);
    if (!this.previewInstance && ["running", "paused", "upgrade", "defeat", "victory"].includes(this.screenState)) {
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
    } else if (this.screenState === "quests") {
      this.renderQuestsOverlay(context, width, height);
    } else if (this.screenState === "season-shop") {
      this.renderSeasonShopOverlay(context, width, height);
    } else if (this.screenState === "permanent-upgrades") {
      this.renderPermanentUpgradesOverlay(context, width, height);
    } else if (this.screenState === "settings") {
      this.renderSettingsOverlay(context, width, height);
    } else if (this.screenState === "glossary") {
      this.renderGlossaryOverlay(context, width, height);
    } else if (this.screenState === "weapon-preview") {
      this.renderWeaponPreviewOverlay(context, width, height);
    } else if (this.screenState === "paused") {
      this.renderPauseOverlay(context, width, height);
    } else if (this.screenState === "upgrade") {
      this.renderUpgradeOverlay(context, width, height);
    } else if (this.screenState === "defeat") {
      this.renderDefeatOverlay(context, width, height);
    } else if (this.screenState === "victory") {
      this.renderVictoryOverlay(context, width, height);
    }
    context.restore();
  }

  addScreenShake(strength = 0.06, duration = 0.12, kickX = 0, kickY = 0) {
    if (this.screenState !== "running" || !this.progress?.settings?.screenShake || this.progress.settings.reducedMotion) return;
    const heavyDuration = duration * 1.25;
    if ((this.screenShakeTime ?? 0) <= 0) this.screenShakeFrame = 0;
    this.screenShakeTime = Math.max(this.screenShakeTime ?? 0, heavyDuration);
    this.screenShakeDuration = Math.max(this.screenShakeDuration ?? 0, heavyDuration);
    this.screenShakeStrength = Math.max(this.screenShakeStrength ?? 0, strength);
    this.screenKickX = clamp((this.screenKickX ?? 0) + kickX * 0.6, -8, 8);
    this.screenKickY = clamp((this.screenKickY ?? 0) + kickY * 0.6, -8, 8);
  }

  applyWeaponKickback(weapon, aimAngle, holdMultiplier = 1) {
    const kickback = weapon.playerKickback ?? (weapon.recoil ?? 0) * 80;
    if (!(kickback > 0) || !this.player) return;
    const distance = kickback * holdMultiplier;
    this.player.x = clamp(this.player.x - Math.cos(aimAngle) * distance, this.player.radius, this.world.width - this.player.radius);
    this.player.y = clamp(this.player.y - Math.sin(aimAngle) * distance, this.player.radius, this.world.height - this.player.radius);
    resolvePlayerObstacleCollisions(this.player, this.activeObstacles ?? []);
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

  renderAttackEffects(context) {
    for (const effect of this.attackEffects ?? []) {
      const progress = 1 - effect.lifetime / effect.maxLifetime;
      const alpha = Math.max(0, 1 - progress);
      const strength = effect.strength ?? 1;
      const lengthMultiplier = effect.lengthMultiplier ?? 1;
      const x = Math.round(effect.x - this.camera.x);
      const y = Math.round(effect.y - this.camera.y);
      context.save();
      context.translate(x, y);
      context.rotate(effect.angle);
      context.globalAlpha = Math.min(1, alpha * (0.72 + strength * 0.18));
      context.fillStyle = "#fff4bb";
      if (effect.kind === "melee") {
        const reach = 18 + progress * Math.min(effect.radius, 72) * 0.35;
        context.fillRect(Math.round(reach), -4, 12, 8);
        context.fillRect(Math.round(reach + 10), -13, 7, 5);
        context.fillRect(Math.round(reach + 10), 8, 7, 5);
      } else {
        // Layered, high-contrast muzzle flash: a bright core, warm shell, and
        // short pixel trail make every ranged weapon's shot readable.
        context.fillStyle = "#fffef0";
        context.fillRect(7, Math.round(-8 * strength), Math.round(17 * lengthMultiplier), Math.round(16 * strength));
        context.fillStyle = "#fff4a8";
        context.fillRect(17 + Math.round(progress * 5 * lengthMultiplier), Math.round(-11 * strength), Math.round(14 * lengthMultiplier), Math.round(22 * strength));
        context.fillStyle = effect.color;
        context.fillRect(25 + Math.round(progress * 9 * lengthMultiplier), Math.round(-8 * strength), Math.round(13 * lengthMultiplier), Math.round(16 * strength));
        context.globalAlpha = Math.min(1, alpha * (0.3 + strength * 0.12));
        context.fillRect(36 + Math.round(progress * 13 * lengthMultiplier), Math.round(-3 * strength), Math.round(18 * lengthMultiplier), Math.max(2, Math.round(6 * strength)));
      }
      context.restore();
    }
    context.globalAlpha = 1;
  }

  renderWeaponFlashes(context) {
    for (const flash of this.weaponFlashes ?? []) {
      const progress = 1 - flash.lifetime / flash.maxLifetime;
      const alpha = Math.max(0, 1 - progress);
      const x = Math.round(flash.x - this.camera.x);
      const y = Math.round(flash.y - this.camera.y);
      const radius = flash.radius * (0.72 + progress * 0.28);
      const intensity = Math.min(0.72, 0.5 + (flash.strength ?? 1) * 0.08);
      const glow = context.createRadialGradient(x, y, 0, x, y, radius);
      glow.addColorStop(0, `rgba(255, 255, 235, ${intensity * alpha})`);
      glow.addColorStop(0.12, `rgba(255, 241, 165, ${0.56 * alpha})`);
      glow.addColorStop(0.38, `rgba(255, 214, 95, ${0.2 * alpha})`);
      glow.addColorStop(1, "rgba(255, 199, 76, 0)");
      context.save();
      context.globalCompositeOperation = "screen";
      context.fillStyle = glow;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      context.restore();
    }
  }

  renderDeathEffects(context) {
    for (const effect of this.deathEffects ?? []) {
      const progress = 1 - effect.lifetime / effect.maxLifetime;
      const scale = Math.max(0.08, 1 - progress * 0.92);
      const alpha = Math.max(0, 1 - progress);
      const enemy = effect.enemy;
      const x = Math.round(enemy.x - this.camera.x);
      const y = Math.round(enemy.y - this.camera.y);
      const previousHealth = enemy.health;
      // Enemy renderers intentionally skip inactive entities during normal
      // gameplay. Temporarily make this snapshot renderable, then restore its
      // defeated state immediately after drawing the animation frame.
      enemy.health = Math.max(1, enemy.maxHealth ?? 1);
      context.save();
      context.globalAlpha = alpha;
      context.translate(x, y);
      context.rotate(effect.angle);
      context.scale(scale, scale);
      context.translate(-x, -y);
      renderEnemyArtwork(context, enemy, this.camera);
      context.restore();
      enemy.health = previousHealth;
    }
  }

  renderHitEffects(context) {
    for (const effect of this.hitEffects ?? []) {
      const progress = 1 - effect.lifetime / effect.maxLifetime;
      const alpha = Math.max(0, 1 - progress);
      const x = Math.round(effect.x - this.camera.x);
      const y = Math.round(effect.y - this.camera.y);
      context.save();
      context.globalAlpha = alpha;
      context.fillStyle = effect.color;
      for (const particle of effect.particles ?? []) {
        const size = Math.max(2, Math.round(particle.size * (1 - progress * 0.35)));
        const particleX = Math.round(x + particle.x);
        const particleY = Math.round(y + particle.y);
        context.fillRect(particleX - Math.floor(size / 2), particleY - Math.floor(size / 2), size, size);
      }
      context.restore();
    }
  }

  renderFloatingDamageNumbers(context) {
    if (!this.floatingDamageNumbers?.length) return;
    const previousAlign = context.textAlign;
    const previousBaseline = context.textBaseline;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "bold 18px 'Courier New', monospace";
    context.lineWidth = 4;
    for (const number of this.floatingDamageNumbers) {
      const progress = 1 - number.lifetime / number.maxLifetime;
      const x = Math.round(number.x - this.camera.x);
      const y = Math.round(number.y - this.camera.y);
      context.globalAlpha = Math.max(0, 1 - progress);
      context.strokeStyle = "rgba(28, 28, 20, 0.9)";
      context.strokeText(number.text, x, y);
      context.fillStyle = number.color;
      context.fillText(number.text, x, y);
    }
    context.globalAlpha = 1;
    context.textAlign = previousAlign;
    context.textBaseline = previousBaseline;
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

  renderFlamingoTube(context) {
    const x = Math.round(this.player.x - this.camera.x);
    const y = Math.round(this.player.y - this.camera.y);
    context.save();
    context.strokeStyle = "rgba(242, 154, 181, 0.82)";
    context.lineWidth = 4;
    context.beginPath();
    context.arc(x, y, 105, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  renderCombatHud(context, width, height) {
    const baseWeapon = weaponForSlot(this.weaponSlot, this.progress.equippedWeapons);
    const weapon = weaponStatsAtLevel(baseWeapon, weaponLevelWithLoadoutBonus(
      baseWeapon.id,
      this.progress.weaponLevels[baseWeapon.id],
      this.progress.equippedWeapons,
    ));
    const panelX = 24;
    const panelY = height - 120;
    context.fillStyle = "rgba(24, 27, 15, 0.88)";
    context.fillRect(panelX, panelY, 300, 96);
    context.strokeStyle = "#9a9256";
    context.lineWidth = 3;
    context.strokeRect(panelX, panelY, 300, 96);

    context.fillStyle = "#2a211b";
    context.fillRect(panelX + 12, panelY + 12, 146, 12);
    context.fillStyle = "#a23b32";
    context.fillRect(panelX + 14, panelY + 14, 142 * clamp01(this.player.health / Math.max(1, this.player.maxHealth)), 8);
    context.fillStyle = "#f2e5b7";
    context.font = "bold 12px 'Courier New', monospace";
    context.fillText(`HEALTH ${this.player.health}/${this.player.maxHealth}`, panelX + 168, panelY + 22);

    context.fillStyle = "#17262d";
    context.fillRect(panelX + 12, panelY + 28, 146, 10);
    context.fillStyle = "#55bde8";
    context.fillRect(panelX + 14, panelY + 30, 142 * clamp01(this.player.shield / Math.max(1, this.player.maxShield)), 6);
    context.fillStyle = "#bfeaff";
    context.fillText(`SHIELD ${formatHudValue(this.player.shield)}/${formatHudValue(this.player.maxShield)}`, panelX + 168, panelY + 37);

    const meleeDisplay = weaponById(this.progress.equippedWeapons.melee) ?? WEAPONS.melee;
    const rangedDisplay = weaponById(this.progress.equippedWeapons.ranged) ?? WEAPONS.ranged;
    renderWeaponSlot(context, panelX + 12, panelY + 47, meleeDisplay, this.weaponSlot === 1,
      weaponLevelWithLoadoutBonus(meleeDisplay.id, this.progress.weaponLevels[meleeDisplay.id], this.progress.equippedWeapons));
    renderWeaponSlot(context, panelX + 155, panelY + 47, rangedDisplay, this.weaponSlot === 2,
      weaponLevelWithLoadoutBonus(rangedDisplay.id, this.progress.weaponLevels[rangedDisplay.id], this.progress.equippedWeapons));

    const effectiveCooldown = weapon.cooldown * this.player.cooldownMultiplier;
    const cooldownProgress = effectiveCooldown === 0 ? 1 : 1 - this.attackCooldowns[this.weaponSlot] / effectiveCooldown;
    context.fillStyle = "#24251b";
    context.fillRect(panelX + 12, panelY + 84, 276, 5);
    context.fillStyle = "#dcc45f";
    context.fillRect(panelX + 12, panelY + 84, 276 * clamp01(cooldownProgress), 5);

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
      { enabled: this.player.flamingoTube, name: "FLAMINGO TUBE", ready: "ACTIVE" },
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
    const menuButtonWidth = 106;
    const menuButtonGap = 8;
    const menuItems = [["SHOP", "shop"], ...(SEASON_ACTIVE ? [["SEASON", "season-shop"]] : []), ["UPGRADES", "upgrades"], ["QUESTS", "quests"], ["GLOSSARY", "glossary"], ["SETTINGS", "settings"]];
    const menuButtonStart = width / 2 - (menuButtonWidth * menuItems.length + menuButtonGap * (menuItems.length - 1)) / 2;
    menuItems.forEach(([label, value], index) => {
      this.renderButton(context, menuButtonStart + index * (menuButtonWidth + menuButtonGap), height / 2 + 88, menuButtonWidth, 34, label, { type: "menu", value }, { font: "11px 'Courier New', monospace" });
    });
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
    const rowHeight = 112;
    const cardHeight = 100;
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
      context.fillRect(x, y, 570, cardHeight);
      context.strokeStyle = defeated > 0 ? "#9a9256" : "#5b5747";
      context.lineWidth = 3;
      context.strokeRect(x, y, 570, cardHeight);
      if (defeated > 0) renderBestiaryEnemyPortrait(context, enemy.id, x + 55, y + 52);
      context.fillStyle = defeated > 0 ? "#ead77b" : "#77715d";
      context.font = "bold 16px 'Courier New', monospace";
      const textCenterX = defeated > 0 ? x + 340 : width / 2;
      context.fillText(defeated > 0 ? enemy.name.toUpperCase() : "UNDISCOVERED", textCenterX, y + 25);
      context.fillStyle = defeated > 0 ? "#9fcf71" : "#77715d";
      context.font = "bold 11px 'Courier New', monospace";
      context.fillText(`DEFEATED ${defeated}`, textCenterX, y + 45);
      context.fillStyle = defeated > 0 ? "#d8d0ae" : "#5f5b4c";
      context.font = "11px 'Courier New', monospace";
      wrapCenteredText(
        context,
        defeated > 0 ? enemy.description : "Defeat this enemy to reveal its entry.",
        textCenterX,
        y + 64,
        defeated > 0 ? 430 : 530,
        13,
        3,
      );
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
    const collectionWeapons = weaponsVisibleInCollection(this.progress.ownedWeapons);
    const itemCount = this.glossaryTab === "bestiary" ? ENEMY_GLOSSARY.length : collectionWeapons.length + 4;
    const limitedRows = Math.ceil(collectionWeapons.filter((weapon) => weapon.limited).length / 2);
    const regularRows = Math.ceil(collectionWeapons.filter((weapon) => !weapon.limited).length / 2);
    const contentHeight = this.glossaryTab === "bestiary" ? itemCount * 112 : (limitedRows + regularRows) * 56 + (limitedRows > 0 ? 62 : 30) + 170;
    return Math.max(0, contentHeight - visibleHeight);
  }

  renderCollection(context, width, height) {
    const owned = new Set(this.progress.ownedWeapons);
    const collectionWeapons = weaponsVisibleInCollection(this.progress.ownedWeapons);
    const limitedWeapons = collectionWeapons.filter((weapon) => weapon.limited && owned.has(weapon.id));
    const regularWeapons = collectionWeapons.filter((weapon) => !weapon.limited);
    const weaponListTop = height / 2 - 135;
    const weaponRowSpacing = 56;
    const ordinaryWeaponCount = WEAPON_DEFINITIONS.filter((weapon) => !weapon.limited).length;
    const listTop = height / 2 - 135;
    const limitedRows = Math.ceil(limitedWeapons.length / 2);
    const regularRows = Math.ceil(regularWeapons.length / 2);
    const limitedSectionHeight = limitedWeapons.length > 0 ? 34 + limitedRows * weaponRowSpacing : 0;
    const contentHeight = limitedSectionHeight + 34 + regularRows * weaponRowSpacing + 170;
    const visibleHeight = height - 92 - listTop;
    const maxScroll = Math.max(0, contentHeight - visibleHeight);
    this.glossaryScroll = clamp(this.glossaryScroll, 0, maxScroll);
    context.save();
    context.beginPath();
    context.rect(width / 2 - 300, listTop - 28, 600, visibleHeight + 28);
    context.clip();
    const renderWeaponSection = (weapons, sectionTop) => weapons.forEach((weapon, index) => {
      const rowsPerColumn = Math.ceil(weapons.length / 2);
      const column = index < rowsPerColumn ? 0 : 1;
      const row = column === 0 ? index : index - rowsPerColumn;
      const boxWidth = Math.min(275, Math.max(130, (width - 70) / 2));
      const x = width / 2 - boxWidth - 10 + column * (boxWidth + 20);
      const y = sectionTop + row * weaponRowSpacing - this.glossaryScroll;
      const unlocked = owned.has(weapon.id);
      if (unlocked && y + 52 >= listTop - 28 && y <= listTop + visibleHeight) {
        this.renderButton(context, x, y, boxWidth, 52, "", { type: "weapon-preview", value: weapon.id },
          { fill: "#343621", hoverFill: "#4b4d2d", border: "#807a4b", lineWidth: 2 });
      }
      context.fillStyle = unlocked ? "#343621" : "#29291f";
      context.fillRect(x, y, boxWidth, 52);
      context.strokeStyle = unlocked ? "#807a4b" : "#4d493a";
      context.lineWidth = 2;
      context.strokeRect(x, y, boxWidth, 52);
      context.fillStyle = unlocked ? "#f3e7bd" : "#696453";
      context.textAlign = "center";
      if (unlocked) {
        renderWeaponMenuEntry(context, weapon, x + 25, y + 30, x + 67, y + 19,
          `${weapon.name} · LV ${this.progress.weaponLevels[weapon.id]}`, boxWidth - 78, 0.72);
      } else {
        fitCenteredText(context, "??? · LOCKED", x + boxWidth / 2, y + 30, boxWidth - 16, 10, 7);
      }
    });

    context.textAlign = "center";
    context.fillStyle = "#f2b6ff";
    context.font = "bold 14px 'Courier New', monospace";
    if (limitedWeapons.length > 0) {
      context.fillText(`LIMITED ${limitedWeapons.length}`, width / 2, weaponListTop - 12 - this.glossaryScroll);
      renderWeaponSection(limitedWeapons, weaponListTop + 4);
    }
    const regularTitleY = weaponListTop + limitedSectionHeight;
    context.fillStyle = "#ead77b";
    context.fillText(`WEAPONS ${regularWeapons.filter((weapon) => owned.has(weapon.id)).length}/${ordinaryWeaponCount}`, width / 2, regularTitleY - 12 - this.glossaryScroll);
    renderWeaponSection(regularWeapons, regularTitleY + 4);

    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 14px 'Courier New', monospace";
    const mapsTitleY = regularTitleY + regularRows * weaponRowSpacing + 34;
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
    const rowHeight = 62;
    const visibleCount = Math.min(MAP_SELECTION_VISIBLE_COUNT, MAP_SLOTS.length);
    const visibleHeight = visibleCount * rowHeight;
    const listBottom = listTop + visibleHeight;
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
      "Use your configured weapon keys to switch between the two loadout slots.",
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
    const allWeapons = this.ownedWeaponsForSlot(slot);
    const query = (this.weaponSearch[slot] ?? "").trim().toLowerCase();
    const weapons = query
      ? allWeapons.filter((weapon) => `${weapon.name} ${weapon.rarity} ${weapon.id}`.toLowerCase().includes(query))
      : allWeapons;
    const equippedId = this.progress.equippedWeapons[slot];
    const visibleCount = Math.min(5, weapons.length);
    const maxOffset = Math.max(0, weapons.length - visibleCount);
    const offset = clamp(this.weaponSelectionScroll[slot], 0, maxOffset);
    this.weaponSelectionScroll[slot] = offset;
    const listTop = Math.max(155, height / 2 - 145);
    const weaponRowHeight = 54;
    const listBottom = listTop + visibleCount * weaponRowHeight;
    const descriptionY = Math.min(height - 170, listBottom + 38);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText(`CHOOSE LOADOUT ${slot === "melee" ? "1" : "2"} WEAPON`, width / 2, listTop - 82);
    this.renderButton(context, width / 2 - 245, listTop - 58, 400, 28,
      `SEARCH: ${this.weaponSearch[slot] || "type to filter"}`,
      { type: "weapon-search-focus" }, { font: "11px 'Courier New', monospace", text: this.weaponSearch[slot] ? "#f3e7bd" : "#a9a27d" });
    this.renderButton(context, width / 2 + 165, listTop - 58, 80, 28, "CLEAR", { type: "weapon-search-clear" }, { font: "11px 'Courier New', monospace" });
    context.fillStyle = "#f3e7bd";
    context.font = "14px 'Courier New', monospace";
    weapons.slice(offset, offset + visibleCount).forEach((weapon, visibleIndex) => {
      const selected = weapon.id === equippedId;
      const effectiveLevel = weaponLevelWithLoadoutBonus(
        weapon.id,
        this.progress.weaponLevels[weapon.id],
        this.progress.equippedWeapons,
      );
      const synergy = effectiveLevel > this.progress.weaponLevels[weapon.id] ? " · PAIR +1" : "";
      const rowY = listTop + visibleIndex * weaponRowHeight;
      this.renderButton(context, width / 2 - 245, rowY, 490, 49,
        "",
        { type: "choice", value: visibleIndex + 1 },
        { fill: selected ? "#5a5530" : "#343621", font: "12px 'Courier New', monospace", textY: rowY + 15 });
      renderWeaponMenuEntry(context, weapon, width / 2 - 213, rowY + 28, width / 2 - 155, rowY + 18,
        `${visibleIndex + 1}. ${selected ? "> " : ""}${weapon.name} · LV ${effectiveLevel}${synergy}`, 375, 0.78);
    });
    if (weapons.length === 0) {
      context.fillStyle = "#c9b95f";
      context.font = "12px 'Courier New', monospace";
      context.fillText("NO MATCHING WEAPONS", width / 2, listTop + 19);
    }
    if (maxOffset > 0) {
      this.renderButton(context, width / 2 + 255, listTop, 54, 27, "▲", { type: "weapon-scroll", value: -1 });
      this.renderButton(context, width / 2 + 255, listTop + (visibleCount - 1) * weaponRowHeight, 54, 27, "▼", { type: "weapon-scroll", value: 1 });
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
    context.fillText("Type to search · Click a weapon · Wheel/arrows move one item · Escape returns", width / 2, descriptionY + 94);
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

  renderWeaponPreviewOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    const preview = this.weaponPreview;
    const weapon = weaponById(preview?.weaponId);
    if (!preview || !weapon) return;
    const arenaX = 18; const arenaY = 18; const arenaWidth = 360; const arenaHeight = 250;
    context.fillStyle = "#587640"; context.fillRect(arenaX, arenaY, arenaWidth, arenaHeight);
    context.strokeStyle = "#ead77b"; context.lineWidth = 4; context.strokeRect(arenaX, arenaY, arenaWidth, arenaHeight);
    context.fillStyle = "rgba(20,25,16,.28)";
    for (let line = 0; line < 6; line += 1) context.fillRect(arenaX + 12, arenaY + 24 + line * 39, arenaWidth - 24, 2);
    context.fillStyle = "#f3e7bd"; context.font = "bold 10px 'Courier New', monospace"; context.textAlign = "left";
    context.fillText("TEST RANGE · WASD MOVE · HOLD CLICK TO FIRE", arenaX + 10, arenaY + 16);

    if (preview.simulation) {
      context.save();
      context.beginPath(); context.rect(arenaX + 3, arenaY + 20, arenaWidth - 6, arenaHeight - 23); context.clip();
      context.drawImage(preview.simulation.canvas, arenaX, arenaY);
      context.restore();
      context.fillStyle = "rgba(22,25,17,.8)"; context.fillRect(arenaX + 4, arenaY + 3, arenaWidth - 8, 19);
      context.fillStyle = "#f3e7bd"; context.fillText("TEST RANGE · WASD MOVE · HOLD CLICK TO FIRE", arenaX + 10, arenaY + 16);
    } else {
    const playerX = arenaX + preview.player.x; const playerY = arenaY + preview.player.y;
    const aimAngle = Math.atan2(this.input.pointer.y - playerY, this.input.pointer.x - playerX);
    const walkFrame = preview.player.isMoving ? Math.floor(preview.player.walkTime * 8) % 2 : 0;
    const leftStep = walkFrame === 0 ? 2 : -2;
    context.fillStyle = "#f1c89b"; context.fillRect(playerX - 12, playerY - 20, 24, 25);
    context.fillStyle = "#554235"; context.fillRect(playerX - 12, playerY - 20, 24, 5);
    context.fillStyle = "#25231f"; context.fillRect(playerX - 7, playerY - 10, 3, 3); context.fillRect(playerX + 4, playerY - 10, 3, 3);
    context.fillStyle = "#e8d65b"; context.fillRect(playerX - 13, playerY + 5, 26, 20);
    context.fillStyle = "#29486d";
    context.fillRect(playerX - 12, playerY + 25, 10, 15 + leftStep);
    context.fillRect(playerX + 2, playerY + 25, 10, 15 - leftStep);
    context.save(); context.translate(playerX, playerY); context.rotate(aimAngle); renderHeldWeaponVisual(context, weapon); context.restore();

    for (const dummy of preview.dummies) {
      const x = arenaX + dummy.x; const y = arenaY + dummy.y;
      const alive = dummy.health > 0;
      context.fillStyle = alive ? "#d5b373" : "#66543c"; context.fillRect(x - 14, y - 23, 28, 46);
      context.fillStyle = alive ? "#df5550" : "#4a4035"; context.fillRect(x - 10, y - 15, 20, 20);
      context.fillStyle = "#2a261f"; context.fillRect(x - 18, y + 23, 36, 5);
      context.fillStyle = "#241f19"; context.fillRect(x - 18, y - 32, 36, 5);
      context.fillStyle = alive ? "#7fd36b" : "#5b5747"; context.fillRect(x - 17, y - 31, 34 * Math.max(0, dummy.health) / dummy.maxHealth, 3);
    }
    for (const projectile of preview.projectiles) {
      context.fillStyle = projectile.color ?? "#fff1bf"; context.beginPath(); context.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2); context.fill();
    }
    for (const effect of preview.effects) {
      const alpha = Math.max(0, effect.lifetime / effect.maxLifetime); context.save(); context.globalAlpha = alpha;
      if (effect.hit) { context.fillStyle="#fff3b5";for(let i=0;i<8;i++){const a=i/8*Math.PI*2;context.fillRect(effect.x+Math.cos(a)*14-2,effect.y+Math.sin(a)*14-2,5,5);} }
      else { context.translate(effect.x,effect.y);context.rotate(effect.angle);context.fillStyle=effect.melee?"#f5e29a":"#fff6cf";context.fillRect(18,-5,effect.melee?48:25,10); }
      context.restore();
    }
    if (this.input.pointer.x >= arenaX && this.input.pointer.x <= arenaX + arenaWidth
      && this.input.pointer.y >= arenaY && this.input.pointer.y <= arenaY + arenaHeight) {
      context.strokeStyle="#fff4bf";context.lineWidth=2;context.beginPath();context.arc(this.input.pointer.x,this.input.pointer.y,8,0,Math.PI*2);context.stroke();
    }
    }

    const detailX = Math.max(400, width / 2 - 25); const detailWidth = Math.min(500, width - detailX - 24);
    const detailY = 18; const detailHeight = Math.min(520, height - 36);
    context.fillStyle = "rgba(35,36,25,.97)"; context.fillRect(detailX, detailY, detailWidth, detailHeight);
    context.strokeStyle = "#9a9256"; context.lineWidth = 3; context.strokeRect(detailX, detailY, detailWidth, detailHeight);
    context.textAlign = "center"; context.fillStyle="#ead77b";context.font="bold 25px 'Courier New', monospace";
    fitCenteredText(context, weapon.name.toUpperCase(), detailX + detailWidth / 2, 58, detailWidth - 32, 25, 14, true);
    context.fillStyle = rarityColor(weapon.rarity); context.font="bold 14px 'Courier New', monospace";
    context.fillText(`${weapon.rarity.toUpperCase()}${weapon.limited ? " · LIMITED" : ""}`, detailX + detailWidth / 2, 84);
    if (weapon.limited) { context.fillStyle="#f2b6ff";context.font="bold 11px 'Courier New', monospace";context.fillText(`SEASON: ${(weapon.season ?? "Unknown").toUpperCase()}`, detailX + detailWidth / 2, 104); }
    context.save();context.translate(detailX + detailWidth / 2 - 25,132);context.scale(1.65,1.65);renderHeldWeaponVisual(context,weapon);context.restore();
    context.fillStyle="#d8d0ae";context.font="12px 'Courier New', monospace";
    wrapCenteredText(context, weapon.description, detailX + detailWidth / 2, 172, detailWidth - 42, 16, 3);
    const effectiveLevel = weaponLevelWithLoadoutBonus(
      weapon.id,
      this.progress.weaponLevels[weapon.id] ?? 1,
      this.progress.equippedWeapons,
    );
    const displayedWeapon = weaponStatsWithPermanentProgress(weapon, effectiveLevel, this.progress.characterStats);
    const statLines = weaponPopupStats(displayedWeapon);
    context.textAlign = "left"; context.font = "bold 11px 'Courier New', monospace";
    const columnWidth = (detailWidth - 48) / 2;
    statLines.slice(0, 10).forEach((line, index) => {
      const column = index % 2; const row = Math.floor(index / 2);
      context.fillStyle = line.special ? "#f2c66d" : "#c8d9b0";
      fitLeftText(context, line.text, detailX + 24 + column * columnWidth, 232 + row * 20, columnWidth - 10, 11, 8, true);
    });
    context.textAlign = "center";
    context.fillStyle="#9fcf71";context.font="bold 11px 'Courier New', monospace";
    wrapCenteredText(context, `LV 10: ${weapon.levelTenFeature}`, detailX + detailWidth / 2, 350, detailWidth - 42, 15, 3);
    const buttonY = detailY + detailHeight - 52;
    this.renderButton(context, detailX + 18, buttonY, 110, 38, "CLOSE", "preview-close", { font: "bold 12px 'Courier New', monospace" });
    if (this.weaponPreviewReturnState === "shop") {
      const owned = this.progress.ownedWeapons.includes(weapon.id);
      this.renderButton(context, detailX + detailWidth - 148, buttonY, 130, 38,
        owned ? "OWNED" : `BUY ${shopWeaponPrice(weapon.id)}`, owned ? null : "preview-buy", { font: "bold 10px 'Courier New', monospace" });
    }
    context.textAlign = "start";
  }

  renderShopOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    const items = this.shopItems();
    const visibleCount = 6;
    const rowHeight = 48;
    const maxScroll = Math.max(0, items.length - visibleCount);
    this.shopScroll = clamp(this.shopScroll, 0, maxScroll);
    const visibleItems = items.slice(this.shopScroll, this.shopScroll + visibleCount);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText("ORDINANCE SHOP", width / 2, height / 2 - 210);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 15px 'Courier New', monospace";
    context.fillText(`COINS ${this.bankCoins}`, width / 2, height / 2 - 177);
    visibleItems.forEach((item, index) => {
      const rowY = height / 2 - 132 + index * rowHeight;
      const weapon = item.id ? weaponById(item.id) : null;
      const label = item.chest
        ? `WEAPON CHEST — ${chestCost(this.progress)} coins`
        : "";
      if (item.chest) {
        this.renderButton(context, width / 2 - 260, rowY, 520, 43, label,
          { type: "choice", value: index + 1 }, { font: "12px 'Courier New', monospace", textY: rowY + 14 });
      } else if (weapon) {
        this.renderButton(context, width / 2 - 260, rowY, 405, 43, "",
          { type: "weapon-preview", value: weapon.id }, { font: "12px 'Courier New', monospace" });
        renderWeaponMenuEntry(context, weapon, width / 2 - 225, rowY + 24, width / 2 - 165, rowY + 16,
          `${weapon.name} — ${ownedOrPrice(this.progress, item.id)}`, 275, 0.74);
        const owned = this.progress.ownedWeapons.includes(weapon.id);
        this.renderButton(context, width / 2 + 150, rowY, 110, 43, owned ? "OWNED" : "BUY",
          owned ? null : { type: "choice", value: index + 1 }, { font: "bold 11px 'Courier New', monospace" });
      }
    });
    this.renderScrollBar(context, Math.min(width / 2 + 294, width - 14), height / 2 - 132, visibleCount * rowHeight, maxScroll, this.shopScroll);
    if (maxScroll > 0) {
      this.renderButton(context, width / 2 + 268, height / 2 - 164, 58, 24, "▲", { type: "shop-scroll", value: -1 }, { font: "bold 12px 'Courier New', monospace" });
      this.renderButton(context, width / 2 + 268, height / 2 - 126 + visibleCount * rowHeight, 58, 24, "▼", { type: "shop-scroll", value: 1 }, { font: "bold 12px 'Courier New', monospace" });
    }
    context.fillStyle = "#9fcf71";
    context.fillText(this.menuMessage, width / 2, height / 2 + 200);
    context.fillStyle = "#d8d0ae";
    context.fillText("Click a weapon to test it · Use BUY to purchase · Escape to return", width / 2, height / 2 + 228);
    context.textAlign = "start";
  }

  renderQuestsOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    const daily = ensureDailyQuests(this.progress);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText("DAILY QUESTS", width / 2, height / 2 - 225);
    context.fillStyle = "#d8d0ae";
    context.font = "bold 13px 'Courier New', monospace";
    context.fillText(`REFRESH IN ${formatQuestTimer(dailyQuestTimeRemaining(this.progress))}`, width / 2, height / 2 - 190);
    daily.quests.forEach((quest, index) => {
      const x = width / 2 - 290;
      const y = height / 2 - 145 + index * 112;
      context.fillStyle = quest.completed ? "rgba(52, 82, 48, 0.95)" : "rgba(48, 49, 32, 0.95)";
      context.fillRect(x, y, 580, 94);
      context.strokeStyle = quest.completed ? "#9fcf71" : "#817b4d";
      context.lineWidth = 3;
      context.strokeRect(x, y, 580, 94);
      context.fillStyle = "#f3e7bd";
      context.font = "bold 15px 'Courier New', monospace";
      context.fillText(quest.label.toUpperCase(), width / 2, y + 25);
      context.fillStyle = quest.completed ? "#9fcf71" : "#ead77b";
      context.font = "bold 12px 'Courier New', monospace";
      const questProgress = quest.type === "play-time"
        ? `${Math.floor(quest.progress / 60)} / ${Math.floor(quest.goal / 60)} MINUTES`
        : `${Math.floor(quest.progress)} / ${quest.goal}`;
      context.fillText(quest.completed ? `COMPLETE · +${quest.reward} COINS` : `${questProgress} · REWARD ${quest.reward} COINS`, width / 2, y + 50);
      context.fillStyle = "#24251c";
      context.fillRect(x + 40, y + 66, 500, 12);
      context.fillStyle = quest.completed ? "#9fcf71" : "#d8b94f";
      context.fillRect(x + 42, y + 68, 496 * Math.min(1, quest.progress / quest.goal), 8);
    });
    context.fillStyle = "#d8d0ae";
    context.font = "12px 'Courier New', monospace";
    context.fillText("Rewards are collected automatically · Escape to return", width / 2, height / 2 + 220);
    context.textAlign = "start";
  }

  renderSeasonShopOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    const season = ensureSeasonState(this.progress);
    const seasonOffers = [
      [weaponById("rainbow-apples"), RAINBOW_APPLE_COST],
      [weaponById("rainbow-horseshoe"), RAINBOW_HORSESHOE_COST],
      [weaponById("pinata"), PINATA_COST],
      [weaponById("party-hat"), PARTY_HAT_COST],
    ];
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 28px 'Courier New', monospace";
    context.fillText("LAWN ENFORCEMENT SEASON", width / 2, height / 2 - 282);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 12px 'Courier New', monospace";
    context.fillText(`SEASON SHOP · ENDS OCTOBER 1 · ${season.coins} SEASON COINS · ${season.claimsToday}/${SEASON_DAILY_CLAIM_LIMIT} REWARDS TODAY`, width / 2, height / 2 - 252);

    seasonOffers.forEach(([weapon, cost], index) => {
      const x = width / 2 - 290 + index % 2 * 300;
      const y = height / 2 - 230 + Math.floor(index / 2) * 76;
      const owned = this.progress.ownedWeapons.includes(weapon.id);
      context.fillStyle = "rgba(48, 49, 32, 0.96)";
      context.fillRect(x, y, 280, 70);
      context.strokeStyle = "#817b4d";
      context.strokeRect(x, y, 280, 70);
      renderWeaponMenuEntry(context, weapon, x + 30, y + 37, x + 64, y + 20,
        weapon.name.toUpperCase(), 126, 0.8);
      context.fillStyle = "#ead77b";
      context.font = "bold 10px 'Courier New', monospace";
      context.textAlign = "left";
      context.fillText(owned ? "OWNED" : `${cost} SEASON COINS`, x + 64, y + 55);
      this.renderButton(context, x + 205, y + 8, 60, 54, owned ? "OWNED" : "BUY",
        { type: "season-buy", value: weapon.id }, { font: "bold 10px 'Courier New', monospace" });
    });
    context.textAlign = "center";

    season.quests.forEach((quest, index) => {
      const x = width / 2 - 290;
      const y = height / 2 - 68 + index * 58;
      context.fillStyle = quest.completed ? "rgba(52, 82, 48, 0.95)" : "rgba(48, 49, 32, 0.95)";
      context.fillRect(x, y, 580, 50);
      context.strokeStyle = quest.completed ? "#9fcf71" : "#817b4d";
      context.strokeRect(x, y, 580, 50);
      context.fillStyle = "#f3e7bd";
      context.font = "bold 13px 'Courier New', monospace";
      context.fillText(quest.label.toUpperCase(), width / 2, y + 18);
      const shownProgress = quest.type === "play-time"
        ? `${Math.floor(quest.progress / 60)} / ${Math.floor(quest.goal / 60)} MIN`
        : `${Math.floor(quest.progress)} / ${quest.goal}`;
      context.fillStyle = quest.completed ? "#9fcf71" : "#ead77b";
      context.font = "bold 11px 'Courier New', monospace";
      context.fillText(`${shownProgress} · ${quest.reward} SEASON COINS`, width / 2, y + 37);
    });
    const completed = season.quests.filter((quest) => quest.completed).length;
    this.renderButton(context, width / 2 - 220, height / 2 + 112, 440, 38,
      completed ? `CLAIM REWARDS & REFRESH (${completed})` : "COMPLETE QUESTS TO CLAIM", "season-claim", { font: "bold 12px 'Courier New', monospace" });
    this.renderButton(context, width / 2 - 220, height / 2 + 156, 440, 36,
      "EXCHANGE 1 SEASON COIN FOR 800 REGULAR COINS", "season-exchange", { font: "bold 11px 'Courier New', monospace" });
    context.fillStyle = "#d8d0ae";
    context.font = "11px 'Courier New', monospace";
    context.fillText("Quests refresh only when completed rewards are claimed.", width / 2, height / 2 + 208);
    context.fillText("After 6 rewarded quests in a day, completed quests wait in their slots until tomorrow.", width / 2, height / 2 + 226);
    context.fillStyle = "#9fcf71";
    context.fillText(this.menuMessage, width / 2, height / 2 + 250);
    context.textAlign = "start";
  }

  renderPermanentUpgradesOverlay(context, width, height) {
    renderDarkOverlay(context, width, height);
    this.renderButton(context, 30, height - 62, 110, 34, "BACK", "back", { font: "12px 'Courier New', monospace" });
    if (this.permanentUpgradeCategory) {
      this.renderWeaponUpgradeCategoryOverlay(context, width, height);
      return;
    }
    const statCap = characterStatMaxLevelForMaps(this.unlockedMaps);
    context.textAlign = "center";
    context.fillStyle = "#ead77b";
    context.font = "bold 34px 'Courier New', monospace";
    context.fillText("PERMANENT UPGRADES", width / 2, height / 2 - 250);
    context.fillStyle = "#f3e7bd";
    context.font = "bold 15px 'Courier New', monospace";
    context.fillText(`COINS ${this.bankCoins} · STAT CAP ${statCap}`, width / 2, height / 2 - 220);
    context.font = "bold 14px 'Courier New', monospace";
    context.fillStyle = "#ead77b";
    context.fillText("STAT UPGRADES", width / 2, height / 2 - 205);
    context.font = "12px 'Courier New', monospace";
    ["health", "damage", "speed", "attackSpeed", "accuracy", "shield", "regeneration"].forEach((stat, index) => {
      const level = this.progress.characterStats[stat];
      const unavailable = (stat === "shield" && !this.progress.shieldUnlocked)
        || (stat === "regeneration" && !this.unlockedMaps.has("aquatic-garden"));
      const statMaxLevel = stat === "regeneration" ? 1 : statCap;
      const unlockLabel = stat === "regeneration" ? "BEAT GOLF COURSE" : "UNLOCK REDWOOD TRAIL BOSS";
      const cost = unavailable ? unlockLabel : level >= statMaxLevel ? "MAX" : `${CHARACTER_STAT_COSTS[level] * (this.progress.shieldUnlocked ? 2 : 1)} coins`;
      this.renderButton(context, width / 2 - 225, height / 2 - 185 + index * 27, 450, 24,
        `${stat.toUpperCase()} LV ${level} → ${cost}`, { type: "choice", value: index + 3 },
        { font: "12px 'Courier New', monospace" });
    });
    context.fillStyle = "#ead77b";
    context.font = "bold 14px 'Courier New', monospace";
    context.fillText("WEAPON UPGRADES", width / 2, height / 2 + 10);
    context.fillStyle = "#f3e7bd";
    context.font = "12px 'Courier New', monospace";
    this.renderButton(context, width / 2 - 225, height / 2 + 50, 450, 34,
      `OPEN WEAPON ARSENAL · ${this.ownedWeaponsForSlot("all").length} OWNED`, { type: "choice", value: 1 });
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
    context.fillText("WEAPON ARSENAL UPGRADES", width / 2, height / 2 - 225);
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
      const equipped = Object.values(this.progress.equippedWeapons).includes(weapon.id);
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
    context.fillText(this.upgradeSelectionDelay > 0
      ? `CHOICES READY IN ${this.upgradeSelectionDelay.toFixed(1)}s`
      : "Click an upgrade card", width / 2, height / 2 + 92);
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
    context.fillText(`${this.boss?.name ?? this.currentMap.boss.name} has been defeated in ${this.currentMap.name}!`, width / 2, height / 2 - 24);
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
    if (this.currentMap.id === "redwood-trail") {
      this.renderRedwoodLandmarks(context);
      return;
    }
    if (this.currentMap.id === "school-field") {
      this.renderSchoolFieldLandmarks(context);
      return;
    }
    if (this.currentMap.id === "construction-site") {
      this.renderConstructionLandmarks(context);
      return;
    }
    if (this.currentMap.id === "chicken-farm") {
      this.renderChickenFarmLandmarks(context);
      return;
    }
    if (this.currentMap.id === "aquatic-garden") {
      this.renderAquaticGardenLandmarks(context);
      return;
    }
    if (this.currentMap.id === "golf-course") {
      this.renderGolfLandmarks(context);
      return;
    }
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

  renderSlimeTerrain(context) {
    for (const puddle of this.slimeTerrain ?? []) {
      const x = Math.round(puddle.x - this.camera.x); const y = Math.round(puddle.y - this.camera.y);
      const alpha = puddle.permanent ? 0.62 : Math.min(0.62, 0.15 + puddle.lifetime / 8);
      context.fillStyle = `rgba(100, 181, 91, ${alpha})`;
      context.beginPath(); context.arc(x, y, puddle.radius, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "rgba(184, 231, 118, 0.58)"; context.lineWidth = 3; context.stroke();
    }
  }

  renderRedwoodLandmarks(context) {
    for (const obstacle of this.activeObstacles ?? []) {
      if (obstacle.kind !== "redwood-trunk") continue;
      const x = Math.round(obstacle.x - this.camera.x); const y = Math.round(obstacle.y - this.camera.y);
      context.fillStyle = "rgba(22, 38, 22, 0.32)"; context.fillRect(x + 12, y + 14, obstacle.width, obstacle.height);
      context.fillStyle = "#663f2d"; context.fillRect(x, y, obstacle.width, obstacle.height);
      context.fillStyle = "#935a37"; context.fillRect(x + 13, y + 10, obstacle.width - 26, obstacle.height - 20);
      context.fillStyle = "#b87543"; context.fillRect(x + obstacle.width * 0.35, y + 16, 10, obstacle.height - 32);
      context.strokeStyle = "#3c2a22"; context.lineWidth = 5; context.strokeRect(x, y, obstacle.width, obstacle.height);
    }
    context.fillStyle = "rgba(31, 79, 40, 0.22)";
    for (let index = 0; index < 18; index += 1) {
      const x = (index * 197 + 90) % this.world.width - this.camera.x;
      const y = (index * 131 + 60) % this.world.height - this.camera.y;
      context.fillRect(Math.round(x), Math.round(y), 46, 18);
      context.fillRect(Math.round(x + 12), Math.round(y - 18), 24, 18);
    }
  }

  renderSchoolFieldLandmarks(context) {
    const width = this.world.width; const height = this.world.height;
    const track = 110;
    context.fillStyle = "#9b5542";
    context.fillRect(-this.camera.x, -this.camera.y, width, track);
    context.fillRect(-this.camera.x, height - track - this.camera.y, width, track);
    context.fillRect(-this.camera.x, -this.camera.y, track, height);
    context.fillRect(width - track - this.camera.x, -this.camera.y, track, height);
    context.strokeStyle = "rgba(255, 224, 180, 0.65)"; context.lineWidth = 5;
    context.strokeRect(track - this.camera.x, track - this.camera.y, width - track * 2, height - track * 2);
    context.setLineDash([26, 18]); context.strokeStyle = "rgba(255, 229, 185, 0.55)"; context.lineWidth = 3;
    context.strokeRect(18 - this.camera.x, 18 - this.camera.y, width - 36, height - 36); context.setLineDash([]);
    context.strokeStyle = "rgba(246, 238, 194, 0.72)"; context.lineWidth = 4;
    context.beginPath(); context.moveTo(width / 2 - this.camera.x, track - this.camera.y); context.lineTo(width / 2 - this.camera.x, height - track - this.camera.y); context.stroke();
    context.beginPath(); context.arc(width / 2 - this.camera.x, height / 2 - this.camera.y, 110, 0, Math.PI * 2); context.stroke();
    for (const obstacle of this.activeObstacles ?? []) {
      const x = Math.round(obstacle.x - this.camera.x); const y = Math.round(obstacle.y - this.camera.y);
      if (x + obstacle.width < 0 || y + obstacle.height < 0 || x > this.camera.viewWidth || y > this.camera.viewHeight) continue;
      if (obstacle.kind === "soccer-goal") {
        context.strokeStyle = "#f4f0d0"; context.lineWidth = 6; context.strokeRect(x, y, obstacle.width, obstacle.height);
        context.strokeStyle = "rgba(245,245,230,0.55)"; context.lineWidth = 2; for (let net = 1; net < 5; net += 1) context.strokeRect(x + net * obstacle.width / 5, y, 1, obstacle.height);
      } else if (obstacle.kind === "bench") {
        context.fillStyle = "#71452f"; context.fillRect(x, y, obstacle.width, obstacle.height); context.fillStyle = "#b27642"; context.fillRect(x + 10, y + 6, obstacle.width - 20, 7);
      }
    }
    context.fillStyle = "#f1d75c";
    for (let index = 0; index < 12; index += 1) {
      const x = 160 + (index * 173) % Math.max(220, width - 320) - this.camera.x;
      const y = 185 + (index * 241) % Math.max(220, height - 370) - this.camera.y;
      context.fillRect(Math.round(x), Math.round(y), 10, 14); context.fillRect(Math.round(x - 4), Math.round(y + 14), 18, 4);
    }
  }

  renderConstructionLandmarks(context) {
    for (const obstacle of this.activeObstacles ?? []) {
      const x = Math.round((obstacle.x ?? 0) - this.camera.x); const y = Math.round((obstacle.y ?? 0) - this.camera.y);
      if (obstacle.kind === "temporary-dirt") { context.fillStyle = "rgba(92,61,34,.65)"; context.beginPath(); context.arc(x,y,obstacle.radius,0,Math.PI*2); context.fill(); continue; }
      if (obstacle.kind === "dirt-pile") { context.fillStyle="#6c4b2f";context.fillRect(x,y,obstacle.width,obstacle.height); }
      else if (obstacle.kind === "pipes") { context.fillStyle="#777b75";for(let i=0;i<3;i++){context.fillRect(x+i*42,y,36,obstacle.height);context.fillStyle="#4c504c";context.fillRect(x+7+i*42,y+9,22,obstacle.height-18);context.fillStyle="#777b75";} }
      else if (obstacle.kind === "pallets") { context.fillStyle="#9b6c3e";for(let i=0;i<4;i++)context.fillRect(x,y+i*15,obstacle.width,8); }
      else if (obstacle.kind === "barrier") { context.fillStyle="#f1e8d0";context.fillRect(x,y,obstacle.width,obstacle.height);context.fillStyle="#e67b28";for(let i=0;i<obstacle.width;i+=40)context.fillRect(x+i,y,20,obstacle.height); }
    }
    context.fillStyle="#ed7428";for(let i=0;i<18;i++){const x=(120+i*211)%this.world.width-this.camera.x;const y=(90+i*137)%this.world.height-this.camera.y;context.fillRect(x-8,y-16,16,22);context.fillRect(x-13,y+6,26,5);}
  }

  renderChickenFarmLandmarks(context) {
    for (const obstacle of this.activeObstacles ?? []) {
      const x = Math.round(obstacle.x - this.camera.x); const y = Math.round(obstacle.y - this.camera.y);
      if (obstacle.kind === "barn") { context.fillStyle="#9f3e32";context.fillRect(x,y,obstacle.width,obstacle.height);context.fillStyle="#f0e3c4";context.fillRect(x+obstacle.width*.38,y+obstacle.height*.42,obstacle.width*.24,obstacle.height*.58);context.fillStyle="#663127";context.fillRect(x-12,y-18,obstacle.width+24,24); }
      else if (obstacle.kind === "chicken-coop") { context.fillStyle="#9b693c";context.fillRect(x,y,obstacle.width,obstacle.height);context.strokeStyle="#e2c897";context.lineWidth=4;for(let line=15;line<obstacle.width;line+=28){context.beginPath();context.moveTo(x+line,y);context.lineTo(x+line,y+obstacle.height);context.stroke();} }
      else if (obstacle.kind === "hay-bales") { context.fillStyle="#d6a93c";context.fillRect(x,y,obstacle.width,obstacle.height);context.fillStyle="#f0ce61";for(let stripe=8;stripe<obstacle.width;stripe+=28)context.fillRect(x+stripe,y,5,obstacle.height); }
      else if (obstacle.kind === "feeding-area") { context.fillStyle="#7a4e2c";context.fillRect(x,y,obstacle.width,obstacle.height);context.fillStyle="#e0bd63";for(let grain=0;grain<12;grain++)context.fillRect(x+8+(grain*29)%obstacle.width,y+8+(grain*17)%Math.max(10,obstacle.height-12),5,4); }
    }
    context.fillStyle="rgba(219,190,117,.42)";
    for(let index=0;index<20;index++){const x=(index*191+70)%this.world.width-this.camera.x;const y=(index*127+80)%this.world.height-this.camera.y;context.fillRect(x,y,22,5);}
  }

  renderConstructionEffects(context) {
    if (this.currentMap.id !== "construction-site") return;
    for (const hazard of this.constructionHazards ?? []) {
      const x=Math.round(hazard.x-this.camera.x),y=Math.round(hazard.y-this.camera.y);
      if (!hazard.impacted) { context.save();context.globalAlpha=.72;context.strokeStyle="#ffcf42";context.lineWidth=6;context.setLineDash([14,10]);context.beginPath();context.arc(x,y,hazard.radius,0,Math.PI*2);context.stroke();context.setLineDash([]);context.restore(); }
    }
    for (const projectile of this.constructionProjectiles ?? []) {
      const x=Math.round(projectile.x-this.camera.x),y=Math.round(projectile.y-this.camera.y);
      if (projectile.type === "brick") {
        const speed = Math.hypot(projectile.velocityX, projectile.velocityY) || 1;
        const trailX = projectile.velocityX / speed * 22;
        const trailY = projectile.velocityY / speed * 22;
        context.save();
        context.strokeStyle = "rgba(255, 211, 111, 0.8)";
        context.lineWidth = 7;
        context.beginPath(); context.moveTo(x - trailX, y - trailY); context.lineTo(x, y); context.stroke();
        context.fillStyle = "#e34f35"; context.fillRect(x - 15, y - 10, 30, 20);
        context.strokeStyle = "#fff0b8"; context.lineWidth = 3; context.strokeRect(x - 15, y - 10, 30, 20);
        context.fillStyle = "#7d241d"; context.fillRect(x - 2, y - 9, 4, 18);
        context.restore();
      } else {
        context.fillStyle="#765130";context.fillRect(x-9,y-9,18,18);
      }
    }
  }

  renderIcePuddles(context) {
    for (const puddle of this.activeObstacles ?? []) {
      if (puddle.kind !== "ice-puddle") continue;
      const x = Math.round(puddle.x - this.camera.x);
      const y = Math.round(puddle.y - this.camera.y);
      const radius = puddle.radius;
      context.fillStyle = "rgba(126, 221, 245, 0.34)";
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      context.strokeStyle = "rgba(218, 250, 255, 0.8)";
      context.lineWidth = 3;
      context.strokeRect(x - radius + 3, y - radius + 3, radius * 2 - 6, radius * 2 - 6);
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

  renderAquaticGardenLandmarks(context) {
    const river = this.currentMap.obstacles?.find((obstacle) => obstacle.kind === "river");
    if (!river) return;
    const x = Math.round(river.x - this.camera.x);
    const y = Math.round(river.y - this.camera.y);
    context.fillStyle = "#27536b";
    context.fillRect(x, y, river.width, river.height);
    context.fillStyle = "#3a7890";
    context.fillRect(x, y + 18, river.width, river.height - 36);
    context.fillStyle = "rgba(175, 225, 214, 0.25)";
    for (let wave = 0; wave < 7; wave += 1) {
      context.fillRect(x, y + 28 + wave * 37, river.width, 4);
    }
    context.fillStyle = "#b8a36a";
    context.fillRect(x, y - 9, river.width, 9);
    context.fillRect(x, y + river.height, river.width, 9);
  }

  renderGolfLandmarks(context) {
    const width = this.world.width; const height = this.world.height;
    context.strokeStyle = "rgba(229, 211, 153, 0.34)"; context.lineWidth = 48; context.lineCap = "round";
    context.beginPath(); context.moveTo(-this.camera.x - 80, 250 - this.camera.y); context.bezierCurveTo(460 - this.camera.x, 80 - this.camera.y, 900 - this.camera.x, 540 - this.camera.y, width + 80 - this.camera.x, 390 - this.camera.y); context.stroke();
    context.beginPath(); context.moveTo(260 - this.camera.x, height + 80 - this.camera.y); context.bezierCurveTo(520 - this.camera.x, 820 - this.camera.y, 1180 - this.camera.x, 960 - this.camera.y, width + 60 - this.camera.x, 700 - this.camera.y); context.stroke();
    for (const obstacle of this.activeObstacles ?? []) {
      const x = Math.round(obstacle.x - this.camera.x); const y = Math.round(obstacle.y - this.camera.y);
      if (x + obstacle.width < 0 || y + obstacle.height < 0 || x > this.camera.viewWidth || y > this.camera.viewHeight) continue;
      if (obstacle.kind === "sand-bunker") {
        context.fillStyle = "rgba(58, 43, 24, 0.3)"; context.fillRect(x + 8, y + 10, obstacle.width, obstacle.height);
        context.fillStyle = "#c5a768"; context.fillRect(x, y + 12, obstacle.width, obstacle.height - 18);
        context.fillStyle = "#e2c985"; context.fillRect(x + 12, y + 20, obstacle.width - 24, obstacle.height - 34);
        context.fillStyle = "#a88b52";
        for (let grain = 0; grain < 8; grain += 1) context.fillRect(x + 14 + (grain * 31) % Math.max(20, obstacle.width - 28), y + 28 + (grain * 17) % Math.max(14, obstacle.height - 42), 5, 3);
      } else if (obstacle.kind === "trees") {
        context.fillStyle = "#63452d"; context.fillRect(x + obstacle.width * 0.38, y + 28, obstacle.width * 0.24, obstacle.height - 28);
        context.fillStyle = "#315d35"; context.fillRect(x + 10, y + 20, obstacle.width - 20, obstacle.height * 0.52);
        context.fillStyle = "#4e8240"; context.fillRect(x + 24, y + 2, obstacle.width - 48, obstacle.height * 0.34);
      } else if (obstacle.kind === "golf-hole") {
        context.fillStyle = "#c5a63e"; context.fillRect(x + 6, y + 6, obstacle.width - 12, obstacle.height - 12);
        context.fillStyle = "#191c16"; context.fillRect(x + 11, y + 18, obstacle.width - 22, obstacle.height - 22);
        context.fillStyle = "#f0d96c"; context.fillRect(x + obstacle.width - 7, y - 55, 4, 58);
        context.fillStyle = "#e6bd46"; context.fillRect(x + obstacle.width - 3, y - 54, 20, 12);
      }
    }
    context.lineCap = "butt";
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

export function wrapCenteredText(context, text, x, y, maxWidth, lineHeight, maxLines = 2) {
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
  lines.slice(0, maxLines).forEach((value, index) => context.fillText(value, x, y + index * lineHeight));
}

function fitCenteredText(context, text, x, y, maxWidth, startSize, minimumSize, bold = false) {
  let size = startSize;
  do {
    context.font = `${bold ? "bold " : ""}${size}px 'Courier New', monospace`;
    size -= 1;
  } while (size >= minimumSize && context.measureText(text).width > maxWidth);
  context.fillText(text, x, y);
}

function fitLeftText(context, text, x, y, maxWidth, startSize, minimumSize, bold = false) {
  let size = startSize;
  do {
    context.font = `${bold ? "bold " : ""}${size}px 'Courier New', monospace`;
    size -= 1;
  } while (size >= minimumSize && context.measureText(text).width > maxWidth);
  context.fillText(text, x, y);
}

export function weaponPopupStats(weapon) {
  const lines = [];
  const add = (label, value, special = false) => lines.push({ text: `${label}: ${value}`, special });
  add("LEVEL", weapon.level ?? 1, true);
  add("DAMAGE", Number.isFinite(weapon.damage) ? formatHudValue(weapon.damage) : "UTILITY");
  const hitsPerAttack = Math.max(1, weapon.projectileCount ?? 1)
    * Math.max(1, weapon.rounds ?? 1)
    * Math.max(1, weapon.burstCount ?? 1);
  let damagePerAttack = (Number.isFinite(weapon.damage) ? weapon.damage : 0) * hitsPerAttack;
  if (weapon.explosive && weapon.splashRadius > 0) {
    damagePerAttack += (weapon.damage ?? 0) * (weapon.splashDamageMultiplier ?? 0.5) * hitsPerAttack;
  }
  const splitHits = Math.max(0, weapon.splitCount ?? 0) * hitsPerAttack;
  damagePerAttack += Math.max(0, weapon.splitDamage ?? 0) * splitHits;
  const statusApplications = hitsPerAttack + splitHits;
  damagePerAttack += Math.max(0, weapon.fireDamagePerSecond ?? 0)
    * Math.max(0, weapon.fireDuration ?? 0) * statusApplications;
  const maximumDps = weapon.cooldown > 0 ? damagePerAttack / weapon.cooldown : 0;
  add("MAX DPS", formatHudValue(maximumDps), true);
  if (weapon.cooldown > 0) add("ATTACK SPEED", `${(1 / weapon.cooldown).toFixed(2)}/SEC`);
  if (weapon.cooldown > 0) add("RELOAD", `${weapon.cooldown.toFixed(2)} SEC`);
  if (weapon.range > 0) add("RANGE", Math.round(weapon.range));
  else if (weapon.projectileSpeed > 0 && weapon.projectileLifetime > 0) add("RANGE", Math.round(weapon.projectileSpeed * weapon.projectileLifetime));
  if ((weapon.projectileCount ?? 1) > 1) add("PROJECTILES", weapon.projectileCount);
  if (weapon.spread > 0) add("SPREAD", `${(weapon.spread * 180 / Math.PI).toFixed(1)}°`);
  else if (weapon.perfectAccuracy) add("ACCURACY", "PERFECT", true);
  if (weapon.pierces >= Number.MAX_SAFE_INTEGER) add("PIERCE", "MAX", true);
  else if (weapon.pierces > 0) add("PIERCE", weapon.pierces);
  if (weapon.bounces > 0) add("BOUNCES", weapon.bounces);
  if (weapon.knockback > 0) add("KNOCKBACK", formatHudValue(weapon.knockback));
  if (weapon.splashRadius > 0) add("EXPLOSION", `RADIUS ${Math.round(weapon.splashRadius)}`, true);
  if (weapon.fireDuration > 0) add("BURN", `${formatHudValue(weapon.fireDamagePerSecond)} DPS / ${formatHudValue(weapon.fireDuration)}S`, true);
  if (weapon.freezeDuration > 0) add("FREEZE", `${formatHudValue(weapon.freezeDuration)} SEC`, true);
  if (weapon.lifesteal > 0) add("LIFESTEAL", `${(weapon.lifesteal * 100).toFixed(2)}%`, true);
  if (weapon.chainCount > 0 || weapon.maxChainJumps > 0) add("CHAIN", weapon.chainCount || weapon.maxChainJumps, true);
  if (weapon.splitCount > 0) add("SPLITS", weapon.splitCount, true);
  if (weapon.gravityPull > 0 || weapon.polarityForce > 0 || weapon.tornadoPullForce > 0) add("SPECIAL", "PULL / PUSH", true);
  if (weapon.boomerangRange > 0) add("SPECIAL", "RETURNS", true);
  if (weapon.decoyHealth > 0) add("DECOY HP", weapon.decoyHealth, true);
  if (weapon.pinataConfettiCount > 0) add("CONFETTI", `${weapon.pinataConfettiCount} RADIAL`, true);
  return lines;
}

export function weaponStatsWithPermanentProgress(weapon, level, characterStats = {}) {
  const leveled = weaponStatsAtLevel(weapon, level);
  const damageBonus = Math.max(0, Number(characterStats.damage) || 0) * 0.08;
  const cooldownMultiplier = Math.max(0.55, 1 - Math.max(0, Number(characterStats.attackSpeed) || 0) * 0.06);
  const accuracyMultiplier = 1 + Math.max(0, Number(characterStats.accuracy) || 0) * 0.08;
  return {
    ...leveled,
    damage: Number((leveled.damage * (1 + damageBonus)).toFixed(2)),
    cooldown: leveled.cooldown * cooldownMultiplier,
    spread: (leveled.spread ?? 0) / accuracyMultiplier,
    recoil: (leveled.recoil ?? 0) / accuracyMultiplier,
    permanentDamageBonus: damageBonus,
    permanentCooldownMultiplier: cooldownMultiplier,
    permanentAccuracyMultiplier: accuracyMultiplier,
  };
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
  if (enemy.isBoss || enemy.targetable === false || enemy.ignoresObstacles || enemy.chargeTime > 0) return;
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

function formatHudValue(value) {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolvePlayerObstacleCollisions(circle, obstacles) {
  for (const obstacle of obstacles) {
    if (obstacle.solid === false) continue;
    const closestX = Math.max(obstacle.x, Math.min(circle.x, obstacle.x + obstacle.width));
    const closestY = Math.max(obstacle.y, Math.min(circle.y, obstacle.y + obstacle.height));
    const offsetX = circle.x - closestX;
    const offsetY = circle.y - closestY;
    if (offsetX * offsetX + offsetY * offsetY >= circle.radius * circle.radius) continue;
    const pushX = Math.min(Math.abs(circle.x - obstacle.x), Math.abs(circle.x - (obstacle.x + obstacle.width)));
    const pushY = Math.min(Math.abs(circle.y - obstacle.y), Math.abs(circle.y - (obstacle.y + obstacle.height)));
    if (pushX < pushY) circle.x = circle.x < obstacle.x + obstacle.width / 2
      ? obstacle.x - circle.radius : obstacle.x + obstacle.width + circle.radius;
    else circle.y = circle.y < obstacle.y + obstacle.height / 2
      ? obstacle.y - circle.radius : obstacle.y + obstacle.height + circle.radius;
  }
}

// Reverse reload feedback: quick-firing weapons get a compact, restrained
// cue, while slower/heavier weapons earn a brighter, longer-lived flash.
export function rangedFireFeedback(weapon) {
  const reload = Math.max(0.05, weapon.cooldown ?? 0.5);
  const reloadFactor = clamp(reload / 1.5, 0.25, 3);
  return {
    strength: 0.62 + reloadFactor * 0.28,
    lengthMultiplier: 0.7 + reloadFactor * 0.12,
    lifetime: 0.075 + reloadFactor * 0.027,
    radiusMultiplier: 0.65 + reloadFactor * 0.12,
  };
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
  context.fillText(`LV ${level} · ${weapon.rarity}${weapon.limited ? " · LIMITED" : ""}`, x + 7, y + 21);
}

function renderWeaponMenuEntry(context, weapon, iconX, iconY, textX, topY, topText, maxTextWidth, scale = 0.72) {
  context.save();
  context.translate(iconX, iconY);
  context.scale(scale, scale);
  renderHeldWeaponVisual(context, weapon);
  context.restore();
  context.save();
  context.fillStyle = "#f3e7bd";
  context.font = "bold 11px 'Courier New', monospace";
  context.textAlign = "left";
  context.fillText(topText, textX, topY, maxTextWidth);
  context.fillStyle = rarityColor(weapon.rarity);
  context.font = "bold 10px 'Courier New', monospace";
  context.fillText(weapon.rarity.toUpperCase(), textX, topY + 17);
  if (weapon.limited) {
    const hue = typeof performance === "undefined" ? 0 : performance.now() / 12 % 360;
    const rarityWidth = context.measureText(weapon.rarity.toUpperCase()).width;
    context.fillStyle = `hsl(${hue} 90% 65%)`;
    context.fillText(" · LIMITED", textX + rarityWidth, topY + 17);
  }
  context.restore();
}

function rarityColor(rarity) {
  return {
    Common: "#d8d0ae",
    Uncommon: "#9fcf71",
    Rare: "#72bde3",
    Epic: "#c58bea",
    Legendary: "#e8bd55",
    Mythical: "#ef7272",
    Secret: "#f1f1f1",
    Developer: "#51f0de",
  }[rarity] ?? "#d8d0ae";
}

function renderBestiaryEnemyPortrait(context, enemyId, x, y) {
  const preview = bestiaryEnemyPreview(enemyId);
  if (preview) {
    const scale = preview.isBoss ? 0.5 : 0.82;
    context.save();
    context.translate(Math.round(x), Math.round(y + (preview.isBoss ? 8 : 5)));
    context.scale(scale, scale);
    renderEnemyArtwork(context, preview, { x: 0, y: 0 }, { portrait: true });
    context.restore();
    return;
  }
  const bossIds = ["king-gnomulus", "dandelion", "lily-queen", "groundskeeper", "pondfather", "pro-golfer", "ancient-snail", "pe-teacher", "ball-launcher", "mother-hen"];
  const large = bossIds.includes(enemyId);
  context.save();
  context.translate(Math.round(x), Math.round(y));
  context.scale(large ? 1.05 : 0.9, large ? 1.05 : 0.9);
  context.strokeStyle = "#24231d";
  context.lineWidth = 3;
  if (["gnome", "king-gnomulus"].includes(enemyId)) {
    context.fillStyle = "#e6c39d"; context.fillRect(-11, -5, 22, 18);
    context.fillStyle = "#bd4139"; context.beginPath(); context.moveTo(-15, -5); context.lineTo(0, -29); context.lineTo(15, -5); context.fill();
    context.fillStyle = "#50744d"; context.fillRect(-13, 13, 26, 17);
    if (large) { context.fillStyle = "#e7c84f"; context.fillRect(-15, -32, 30, 7); context.fillRect(-13, -39, 6, 8); context.fillRect(-3, -42, 6, 11); context.fillRect(7, -39, 6, 8); }
  } else if (enemyId === "gopher") {
    portraitCircle(context, 0, 2, 20, "#8a633f"); portraitCircle(context, -11, -15, 7, "#725037"); portraitCircle(context, 11, -15, 7, "#725037"); context.fillStyle = "#e8d7b1"; context.fillRect(-4, 10, 8, 12);
  } else if (["common-weed", "strongweed"].includes(enemyId)) {
    context.fillStyle = enemyId === "strongweed" ? "#38a86a" : "#76b849"; context.fillRect(-4, -24, 8, 49); context.fillRect(-22, -10, 20, 9); context.fillRect(2, 2, 22, 9); context.fillRect(-17, 15, 15, 8);
  } else if (["squirrel", "acorn-squirrel"].includes(enemyId)) {
    portraitCircle(context, 0, 3, 15, enemyId === "acorn-squirrel" ? "#9a6537" : "#b87842"); portraitCircle(context, -17, -5, 13, "#ca8a4e"); context.fillStyle = "#ead0a2"; context.fillRect(8, -15, 8, 8);
  } else if (["dandelion", "lily-queen"].includes(enemyId)) {
    context.fillStyle = "#4f8f46"; context.fillRect(-4, -2, 8, 31); const petal = enemyId === "lily-queen" ? "#ef8fc0" : "#f0d34f";
    for (let index = 0; index < 8; index += 1) { const angle = index * Math.PI / 4; portraitCircle(context, Math.cos(angle) * 16, -10 + Math.sin(angle) * 16, 8, petal); } portraitCircle(context, 0, -10, 9, "#8d642e");
  } else if (enemyId === "groundskeeper") {
    context.fillStyle = "#d6513f"; context.fillRect(-27, -5, 54, 25); portraitCircle(context, -18, 21, 9, "#2f3430"); portraitCircle(context, 19, 21, 9, "#2f3430"); context.fillStyle = "#e3c09a"; context.fillRect(-7, -24, 16, 19);
  } else if (["goose", "pondfather"].includes(enemyId)) {
    portraitCircle(context, -2, 8, large ? 24 : 18, "#e8e2cf"); context.fillStyle = "#e8e2cf"; context.fillRect(5, -24, 10, 30); portraitCircle(context, 10, -26, 10, "#e8e2cf"); context.fillStyle = "#e69435"; context.fillRect(17, -28, 16, 6);
  } else if (["golfer", "pro-golfer"].includes(enemyId)) {
    context.fillStyle = large ? "#d8b54c" : "#7ea26b"; context.fillRect(-15, -8, 30, 33); context.fillStyle = "#dfb98f"; context.fillRect(-10, -28, 20, 20); context.strokeStyle = "#c7c9c8"; context.beginPath(); context.moveTo(13, -3); context.lineTo(25, 27); context.lineTo(36, 27); context.stroke();
  } else if (["snail", "ancient-snail"].includes(enemyId)) {
    portraitCircle(context, -8, 4, large ? 25 : 19, "#92704c"); context.strokeStyle = "#d4b47a"; context.beginPath(); context.arc(-8, 4, large ? 14 : 10, 0, Math.PI * 2); context.stroke(); context.fillStyle = "#799253"; context.fillRect(-22, 18, 50, 12); context.fillRect(16, -3, 10, 24);
  } else if (enemyId === "mosquito") {
    context.fillStyle = "#554d45"; context.fillRect(-3, -18, 6, 38); context.strokeStyle = "#b9d9d5"; context.beginPath(); context.ellipse(-13, -7, 13, 7, -0.5, 0, Math.PI * 2); context.ellipse(13, -7, 13, 7, 0.5, 0, Math.PI * 2); context.stroke(); context.fillStyle = "#d05245"; context.fillRect(-2, 18, 4, 12);
  } else if (enemyId === "deer") {
    context.fillStyle = "#9b6a40"; context.fillRect(-17, -8, 34, 27); context.fillRect(8, -27, 15, 24); context.strokeStyle = "#d5b47e"; context.beginPath(); context.moveTo(15, -25); context.lineTo(7, -40); context.moveTo(19, -25); context.lineTo(28, -40); context.stroke();
  } else if (["rogue-soccer-ball", "basketball"].includes(enemyId)) {
    portraitCircle(context, 0, 0, 22, enemyId === "basketball" ? "#d77d2e" : "#eee9dc"); context.strokeStyle = "#423a31"; context.beginPath(); context.arc(0, 0, 14, 0, Math.PI * 2); context.moveTo(-20, 0); context.lineTo(20, 0); context.stroke();
  } else if (enemyId === "sprinter") {
    portraitCircle(context, 0, -23, 9, "#d8ac83"); context.strokeStyle = "#68a4d0"; context.lineWidth = 7; context.beginPath(); context.moveTo(0, -14); context.lineTo(-7, 8); context.lineTo(-23, 25); context.moveTo(-5, 3); context.lineTo(18, 12); context.lineTo(29, 25); context.stroke();
  } else if (enemyId === "backpack") {
    context.fillStyle = "#6a7e9e"; context.fillRect(-20, -25, 40, 50); context.fillStyle = "#a8bad1"; context.fillRect(-13, -17, 26, 15); context.strokeStyle = "#31363e"; context.strokeRect(-20, -25, 40, 50);
  } else if (enemyId === "pe-teacher") {
    portraitCircle(context, 0, -22, 11, "#d4a67d"); context.fillStyle = "#d9d6c7"; context.fillRect(-19, -10, 38, 38); context.fillStyle = "#b53d36"; context.fillRect(-3, -10, 6, 35); context.fillStyle = "#404b65"; context.fillRect(-18, 26, 36, 9);
  } else if (enemyId === "ball-launcher") {
    context.fillStyle = "#69757b"; context.fillRect(-27, -20, 54, 43); portraitCircle(context, -19, 24, 9, "#373d40"); portraitCircle(context, 19, 24, 9, "#373d40"); context.fillStyle = "#d4bd58"; context.fillRect(-8, -29, 16, 18); context.fillStyle = "#252a2c"; context.fillRect(24, -10, 18, 12);
  }
  context.restore();
}

const BESTIARY_PREVIEWS = new Map();
const PREVIEW_WORLD = Object.freeze({ width: 1280, height: 720 });

export function bestiaryEnemyPreview(enemyId) {
  if (BESTIARY_PREVIEWS.has(enemyId)) return BESTIARY_PREVIEWS.get(enemyId);
  const common = { x: 0, y: 0 };
  const bossConfig = { name: "Preview", health: 1000, damage: 20, speed: 80 };
  let enemy = null;
  if (enemyId === "gnome") enemy = new Gnome({ ...common, health: GNOME_HEALTH, speed: 90, damage: 6, coinValue: 1, xpValue: 10 });
  else if (enemyId === "gopher") enemy = new Gopher(common);
  else if (enemyId === "common-weed") enemy = new CommonWeed({ ...common, bossMode: false });
  else if (enemyId === "strongweed") enemy = new CommonWeed({ ...common, bossMode: true });
  else if (enemyId === "squirrel") enemy = new Squirrel(common);
  else if (enemyId === "acorn-squirrel") enemy = new AcornSquirrel(common);
  else if (enemyId === "goose") enemy = new Goose(common);
  else if (enemyId === "golfer") enemy = new Golfer(common);
  else if (enemyId === "snail") enemy = new Snail(common);
  else if (enemyId === "mosquito") enemy = new Mosquito({ ...common, random: () => 0.5 });
  else if (enemyId === "deer") enemy = new Deer(common);
  else if (enemyId === "rogue-soccer-ball") enemy = new RogueSoccerBall(common);
  else if (enemyId === "sprinter") enemy = new Sprinter({ ...common, world: PREVIEW_WORLD, random: () => 0.75 });
  else if (enemyId === "backpack") enemy = new Backpack(common);
  else if (enemyId === "basketball") enemy = new SchoolBasketball({ ...common, random: () => 0.5 });
  else if (enemyId === "king-gnomulus") enemy = new Boss({ ...common, config: { ...bossConfig, thrownGnomeCooldown: 4, thrownGnomeSpeed: 500, throwWindupDuration: 0.5, summonCooldown: 4 } });
  else if (enemyId === "dandelion") enemy = new DandelionBoss({ ...common, config: { ...bossConfig, sporeCooldown: 0.5, aimedSporeCooldown: 2, sporeSpeed: 300, sporeDamage: 20, sporeLifetime: 3, shieldThreshold: 100, shieldStrength: 200, shieldCooldown: 10, maxShieldActivations: 5, healthRegeneration: 15 } });
  else if (enemyId === "lily-queen") enemy = new LilyQueenBoss({ ...common, config: { ...bossConfig, shieldStrength: 200, shieldRegeneration: 5, strongweedCooldown: 0.3, strongweedLaunchChance: 0.5, strongweedLaunchSpeed: 900, riverbankWeedCooldown: 1 } });
  else if (enemyId === "groundskeeper") enemy = new GroundskeeperBoss({ ...common, config: { ...bossConfig, mowCooldown: 5, clippingCooldown: 1, shieldStrength: 200, shieldRegeneration: 10 }, world: PREVIEW_WORLD });
  else if (enemyId === "pondfather") enemy = new PondfatherBoss({ ...common, config: { ...bossConfig, healthRegeneration: 15, shieldRegeneration: 50, shieldStrength: 200 }, world: PREVIEW_WORLD });
  else if (enemyId === "pro-golfer") enemy = new ProGolferBoss({ ...common, config: { ...bossConfig, attackCooldown: 3 }, world: PREVIEW_WORLD });
  else if (enemyId === "ancient-snail") enemy = new AncientSnailBoss({ ...common, config: { ...bossConfig, shieldStrength: 2000, shieldRegeneration: 40, spitCooldown: 2, shellSlamCooldown: 5, snailArmyCooldown: 4, shellSlamRadius: 180 } });
  else if (enemyId === "pe-teacher") enemy = new PeTeacherBoss({ ...common, config: { ...bossConfig, dodgeballCooldown: 2, whistleCooldown: 6, lapCooldown: 8, lapExitDistance: 220 }, world: PREVIEW_WORLD });
  else if (enemyId === "ball-launcher") enemy = new BallLauncherBoss({ ...common, config: { ...bossConfig, ballCooldown: 1, dumpCooldown: 8 } });
  else if (enemyId === "construction-worker") enemy = new ConstructionWorker(common);
  else if (enemyId === "traffic-cone") enemy = new TrafficConeEnemy(common);
  else if (enemyId === "runaway-tire") enemy = new RunawayTire({ ...common, world: PREVIEW_WORLD });
  else if (enemyId === "brick-carrier") enemy = new BrickCarrier(common);
  else if (enemyId === "safety-vest") enemy = new SafetyVestEnemy(common);
  else if (enemyId === "excavator") enemy = new ExcavatorBoss({ ...common, config: { ...bossConfig, health: 12000, speed: 52, name: "The Excavator" }, world: PREVIEW_WORLD });
  else if (enemyId === "chicken") enemy = new Chicken(common);
  else if (enemyId === "chicken-egg") enemy = new ChickenEgg(common);
  else if (enemyId === "chick") enemy = new Chick(common);
  else if (enemyId === "rooster") enemy = new Rooster(common);
  else if (enemyId === "mother-hen") enemy = new MotherHenBoss({ ...common, config: { ...bossConfig, health: 15000, speed: 88, name: "Mother Hen" }, world: PREVIEW_WORLD });
  if (!enemy) return null;
  enemy.x = 0;
  enemy.y = 0;
  enemy.hitFlash = 0;
  if ("shield" in enemy) enemy.shield = 0;
  if (enemyId === "pondfather") { enemy.form = "land"; enemy.phase = "land"; }
  BESTIARY_PREVIEWS.set(enemyId, enemy);
  return enemy;
}

function renderEnemyArtwork(context, enemy, camera, { portrait = false } = {}) {
  const smoothing = context.imageSmoothingEnabled;
  context.imageSmoothingEnabled = false;
  enemy.render(context, camera);
  renderEnemyPixelDetails(context, enemy, camera, portrait);
  context.imageSmoothingEnabled = smoothing;
}

function renderEnemyPixelDetails(context, enemy, camera, portrait) {
  if (!enemy?.active) return;
  const x = Math.round(enemy.x - camera.x);
  const y = Math.round(enemy.y - camera.y);
  const radius = Math.max(14, enemy.radius ?? 20);
  context.save();
  context.globalAlpha = portrait ? 0.95 : 0.72;
  if (enemy.isBoss) {
    context.fillStyle = "#f4da78";
    const edge = Math.min(58, radius * 0.72);
    context.fillRect(x - edge, y - radius - 8, 7, 3);
    context.fillRect(x + edge - 7, y - radius - 8, 7, 3);
    context.fillRect(x - radius - 6, y - 2, 3, 7);
    context.fillRect(x + radius + 3, y - 2, 3, 7);
  }
  if (["common-weed", "strongweed", "dandelion", "lily-queen"].includes(enemy.enemyType)) {
    context.fillStyle = enemy.enemyType === "strongweed" ? "#87efbd" : "#d6f59a";
    context.fillRect(x - 2, y - radius + 2, 4, 4);
  } else if (["snail", "ancient-snail"].includes(enemy.enemyType)) {
    context.fillStyle = "rgba(190, 238, 148, 0.8)";
    context.fillRect(x - radius * 0.55, y + radius * 0.48, 7, 3);
    context.fillRect(x + radius * 0.15, y + radius * 0.52, 5, 3);
  } else if (enemy.flying) {
    context.fillStyle = "rgba(221, 248, 244, 0.8)";
    context.fillRect(x - radius - 6, y - 3, 5, 2);
    context.fillRect(x + radius + 1, y + 2, 5, 2);
  }
  context.restore();
}

function portraitCircle(context, x, y, radius, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function ownedOrPrice(progress, weaponId) {
  const price = `${shopWeaponPrice(weaponId)} coins`;
  return progress.ownedWeapons.includes(weaponId) ? `OWNED · ${price}` : price;
}

function formatKeyCode(code) {
  return code.replace(/^Key/, "").replace(/^Digit/, "").replace(/^Arrow/, "Arrow ");
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

function createPreviewInput() {
  return {
    keys: new Set(),
    pointer: { x: 0, y: 0, inside: false, down: false },
    setKeybinds() {},
    setTextCapture() {},
    movementVector() {
      const horizontal = Number(this.keys.has("KeyD") || this.keys.has("ArrowRight"))
        - Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
      const vertical = Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"))
        - Number(this.keys.has("KeyW") || this.keys.has("ArrowUp"));
      const length = Math.hypot(horizontal, vertical);
      return length > 0 ? { x: horizontal / length, y: vertical / length } : { x: 0, y: 0 };
    },
    consumeBossSpawnRequest: () => false,
    consumeDebugToggle: () => false,
    consumePauseRequest: () => false,
    consumeUpgradeChoice: () => null,
    consumeMenuAction: () => null,
    consumeClickRequest: () => null,
    consumeWeaponSlot: () => null,
    consumeAttackRequest: () => false,
    consumeConfirmRequest: () => false,
    consumeRestartRequest: () => false,
    consumeScrollRequest: () => 0,
  };
}

class PreviewDummy {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.maxHealth = 500;
    this.health = 500;
    this.active = true;
    this.targetable = true;
    this.damage = 0;
    this.coinValue = 0;
    this.xpValue = 0;
    this.enemyType = "preview-dummy";
    this.resetTimer = 0;
  }

  takeDamage(amount) {
    if (!this.targetable || !Number.isFinite(amount) || amount <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.targetable = false;
      this.resetTimer = 0.7;
    }
    return false;
  }

  update(deltaTime) {
    if (!this.targetable) {
      this.resetTimer -= deltaTime;
      if (this.resetTimer <= 0) {
        this.health = this.maxHealth;
        this.targetable = true;
      }
    }
    return {};
  }

  render(context, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    const alive = this.targetable;
    context.fillStyle = alive ? "#d5b373" : "#66543c"; context.fillRect(x - 14, y - 23, 28, 46);
    context.fillStyle = alive ? "#df5550" : "#4a4035"; context.fillRect(x - 10, y - 15, 20, 20);
    context.fillStyle = "#2a261f"; context.fillRect(x - 18, y + 23, 36, 5);
    context.fillStyle = "#241f19"; context.fillRect(x - 18, y - 32, 36, 5);
    context.fillStyle = alive ? "#7fd36b" : "#5b5747";
    context.fillRect(x - 17, y - 31, 34 * this.health / this.maxHealth, 3);
  }
}

function weaponUpgradeLabel(progress, weapon) {
  const level = progress.weaponLevels[weapon.id];
  const maxLevel = weaponMaxLevelForMaps(progress.unlockedMaps);
  const cost = weaponUpgradeCost(level) * (progress.shieldUnlocked ? 2 : 1);
  return `${weapon.name} LV ${level} → ${level >= maxLevel ? "MAX" : `${cost} coins`}`;
}

function renderMeleePattern(context, centerX, centerY, facing, weapon, radius) {
  const forwardX = Math.cos(facing);
  const forwardY = Math.sin(facing);
  const sideX = -forwardY;
  const sideY = forwardX;
  const pixel = weapon.shape === "lane" || weapon.shape === "wheelbarrow" ? 7 : 6;
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
  } else if (weapon.shape === "wheelbarrow") {
    const halfWidth = weapon.width / 2;
    for (let distance = 22; distance <= radius; distance += 14) {
      for (let side = -halfWidth; side <= halfWidth; side += 15) drawPixel(distance, side);
    }
  } else if (weapon.shape === "snip") {
    drawPixel(radius * 0.55, -weapon.width * 0.22);
    drawPixel(radius * 0.55, weapon.width * 0.22);
  }
}
