import { COLORS, PLAYER, WORLD } from "../config/game-config.js";
import { renderHeldWeaponVisual } from "./held-weapon.js";

const WALK_FRAMES_PER_SECOND = 6;
const WALK_BOB = [0, -1, 0, -1];

export class Player {
  constructor() {
    this.x = PLAYER.startX;
    this.y = PLAYER.startY;
    this.radius = PLAYER.radius;
    this.speed = PLAYER.speed;
    this.damageMultiplier = 1;
    this.damageTakenMultiplier = 1;
    this.cooldownMultiplier = 1;
    this.accuracy = 1;
    this.recoil = 0;
    this.attackHoldTime = 0;
    this.meleeRangeMultiplier = 1;
    this.pickupRadius = 90;
    this.appleCount = 1;
    this.lifestealAccumulator = 0;
    this.rangedExplosion = false;
    this.weaponBonuses = {};
    this.syrupTrail = false;
    this.autonomousMower = false;
    this.batteryPack = false;
    this.freezePulse = false;
    this.scarecrowPulse = false;
    this.flamingoTube = false;
    this.reducedMotion = false;
    this.maxHealth = 100;
    this.roundStartingMaxHealth = this.maxHealth;
    this.maxHealthCap = this.roundStartingMaxHealth * 2;
    this.health = this.maxHealth;
    this.maxShield = 0;
    this.shield = 0;
    this.shieldRegen = 0;
    this.healthRegenAmount = 0;
    this.healthRegenInterval = 0;
    this.healthRegenTimer = 0;
    this.invulnerability = 0;
    this.hitFlash = 0;
    this.facing = 0;
    this.isMoving = false;
    this.walkTime = 0;
    this.walkSprites = typeof Image === "undefined"
      ? []
      : ["homeowner-walk-1.png", "homeowner-walk-2.png"].map((filename) => {
          const image = new Image();
          image.src = `assets/sprites/${filename}`;
          return image;
        });
  }

  update(deltaTime, movement, aimPoint, world = WORLD, obstacles = []) {
    this.invulnerability = Math.max(0, this.invulnerability - deltaTime);
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    const previousX = this.x;
    const previousY = this.y;
    const inSandBunker = obstacles.some((obstacle) => obstacle.kind === "sand-bunker"
      && this.x >= obstacle.x && this.x <= obstacle.x + obstacle.width
      && this.y >= obstacle.y && this.y <= obstacle.y + obstacle.height);
    const inWater = obstacles.some((obstacle) => obstacle.kind === "river"
      && this.x >= obstacle.x && this.x <= obstacle.x + obstacle.width
      && this.y >= obstacle.y && this.y <= obstacle.y + obstacle.height);
    const onRunningTrack = obstacles.some((obstacle) => obstacle.kind === "running-track"
      && this.x >= obstacle.x && this.x <= obstacle.x + obstacle.width
      && this.y >= obstacle.y && this.y <= obstacle.y + obstacle.height);
    const inSlime = obstacles.some((obstacle) => obstacle.kind === "slime"
      && Math.hypot(this.x - obstacle.x, this.y - obstacle.y) <= obstacle.radius);
    const inDirtPile = obstacles.some((obstacle) => obstacle.kind === "temporary-dirt"
      && Math.hypot(this.x - obstacle.x, this.y - obstacle.y) <= obstacle.radius);
    const movementSpeed = inSlime ? this.speed * 0.4 : inDirtPile ? this.speed * 0.7 : (inSandBunker || inWater) ? this.speed * 0.5 : onRunningTrack ? this.speed * 1.2 : this.speed;
    if (this.maxShield > 0) this.shield = Math.min(this.maxShield, this.shield + this.shieldRegen * deltaTime);
    if (this.healthRegenAmount > 0 && this.healthRegenInterval > 0) {
      this.healthRegenTimer += deltaTime;
      while (this.healthRegenTimer >= this.healthRegenInterval) {
        this.healthRegenTimer -= this.healthRegenInterval;
        this.health = Math.min(this.maxHealth, this.health + this.healthRegenAmount);
      }
    }
    this.x = clamp(this.x + movement.x * movementSpeed * deltaTime, this.radius, world.width - this.radius);
    this.y = clamp(this.y + movement.y * movementSpeed * deltaTime, this.radius, world.height - this.radius);
    resolveObstacleCollisions(this, obstacles);
    this.facing = Math.atan2(aimPoint.y - this.y, aimPoint.x - this.x);
    this.isMoving = this.x !== previousX || this.y !== previousY;
    this.walkTime = this.isMoving ? this.walkTime + deltaTime : 0;
  }

  updateRecoil(deltaTime, attacking) {
    this.attackHoldTime = attacking ? this.attackHoldTime + deltaTime : 0;
    const recovery = attacking ? 0.08 : 0.55;
    this.recoil = Math.max(0, this.recoil - recovery * deltaTime);
  }

  addRecoil(amount) {
    this.recoil = Math.min(0.32, this.recoil + amount / this.accuracy);
  }

  takeDamage(amount) {
    if (!Number.isFinite(this.health)) this.health = this.maxHealth;
    const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;
    if (this.health <= 0 || this.invulnerability > 0) {
      return false;
    }
    if (safeAmount === 0) return false;

    const multiplier = Number.isFinite(this.damageTakenMultiplier) ? Math.max(0, this.damageTakenMultiplier) : 1;
    let adjusted = safeAmount * multiplier;
    if (this.shield > 0) {
      const shieldDamage = Math.min(this.shield, adjusted);
      this.shield -= shieldDamage;
      adjusted -= shieldDamage;
    }
    this.health = Math.max(0, this.health - Math.round(adjusted));
    this.invulnerability = 0.65;
    this.hitFlash = 0.14;
    return true;
  }

  render(context, camera, heldWeapon = null) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    const walkPhase = this.isMoving
      ? Math.floor(this.walkTime * WALK_FRAMES_PER_SECOND) % 4
      : 0;
    const bobOffset = this.reducedMotion ? 0 : WALK_BOB[walkPhase];

    context.save();
    context.translate(x, y + bobOffset);
    context.globalAlpha = this.hitFlash > 0 ? 0.5 : 1;

    // Keep the same simple, front-facing block character used in the test range.
    context.fillStyle = COLORS.playerSkin;
    context.fillRect(-12, -20, 24, 25);
    context.fillStyle = "#554235";
    context.fillRect(-12, -20, 24, 5);
    context.fillStyle = "#25231f";
    context.fillRect(-7, -10, 3, 3);
    context.fillRect(4, -10, 3, 3);
    context.fillRect(-4, -3, 8, 2);
    context.fillStyle = COLORS.playerShirt;
    context.fillRect(-13, 5, 26, 20);

    const step = this.isMoving && !this.reducedMotion ? (walkPhase % 2 === 0 ? 3 : -3) : 0;
    context.fillStyle = COLORS.playerPants;
    context.fillRect(-12, 25, 10, 15 + step);
    context.fillRect(2, 25, 10, 15 - step);
    context.fillStyle = "#25231f";
    context.fillRect(-14, 36 + step, 12, 5);
    context.fillRect(2, 36 - step, 12, 5);
    context.globalAlpha = 1;

    // Compact health bar keeps the character readable during busy combat.
    context.fillStyle = "#241d18";
    context.fillRect(-18, -55, 38, 7);
    context.fillStyle = "#9e342b";
    const healthRatio = Math.max(0, Math.min(1, this.health / Math.max(1, this.maxHealth)));
    context.fillRect(-16, -53, 34 * healthRatio, 3);

    this.renderHeldWeapon(context, heldWeapon);

    context.restore();
  }

  renderHeldWeapon(context, heldWeapon) {
    context.save();
    context.translate(4, -14);
    context.rotate(this.facing);
    context.fillStyle = COLORS.playerShirt;
    context.fillRect(0, -5, 13, 10);
    context.fillStyle = COLORS.playerSkin;
    context.fillRect(12, -4, 12, 8);
    context.translate(22, 0);
    if (!renderHeldWeaponVisual(context, heldWeapon)) {
      context.fillStyle = "#4c4437";
      context.fillRect(0, -2, 19, 5);
      context.fillStyle = "#252723";
      context.fillRect(16, -3, 8, 7);
    }
    context.restore();
  }
}

function resolveObstacleCollisions(circle, obstacles) {
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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
