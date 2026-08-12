import { COLORS, PLAYER, WORLD } from "../config/game-config.js";

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
    this.rangedExplosion = false;
    this.weaponBonuses = {};
    this.syrupTrail = false;
    this.autonomousMower = false;
    this.batteryPack = false;
    this.freezePulse = false;
    this.scarecrowPulse = false;
    this.reducedMotion = false;
    this.maxHealth = 100;
    this.roundStartingMaxHealth = this.maxHealth;
    this.maxHealthCap = this.roundStartingMaxHealth * 2;
    this.health = this.maxHealth;
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

  update(deltaTime, movement, aimPoint, world = WORLD) {
    this.invulnerability = Math.max(0, this.invulnerability - deltaTime);
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    const previousX = this.x;
    const previousY = this.y;
    this.x = clamp(this.x + movement.x * this.speed * deltaTime, this.radius, world.width - this.radius);
    this.y = clamp(this.y + movement.y * this.speed * deltaTime, this.radius, world.height - this.radius);
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
    this.health = Math.max(0, this.health - Math.round(safeAmount * multiplier));
    this.invulnerability = 0.65;
    this.hitFlash = 0.14;
    return true;
  }

  render(context, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    const direction = Math.cos(this.facing) >= 0 ? 1 : -1;
    const localAim = direction === 1 ? this.facing : Math.PI - this.facing;
    const walkPhase = this.isMoving
      ? Math.floor(this.walkTime * WALK_FRAMES_PER_SECOND) % 4
      : 0;
    const bobOffset = this.reducedMotion ? 0 : WALK_BOB[walkPhase];

    context.save();
    context.translate(x, y + bobOffset);

    const walkFrame = this.isMoving ? walkPhase % 2 : 0;
    const sprite = this.walkSprites[walkFrame];
    if (sprite?.complete && sprite.naturalWidth > 0) {
      const previousSmoothing = context.imageSmoothingEnabled;
      context.imageSmoothingEnabled = true;
      context.globalAlpha = this.hitFlash > 0 ? 0.45 : 1;
      context.drawImage(sprite, -24, -36, 48, 48);
      context.globalAlpha = 1;
      context.imageSmoothingEnabled = previousSmoothing;
      context.fillStyle = "#241d18";
      context.fillRect(-15, -45, 32, 6);
      context.fillStyle = "#9e342b";
      context.fillRect(-13, -43, 28, 2);
      context.restore();
      return;
    }

    // Coded fallback shown only while the bitmap sprite loads.
    context.scale(direction, 1);
    context.fillStyle = "#28251d";
    context.fillRect(-15, -25, 32, 32);
    context.fillRect(-13, -45, 27, 24);
    context.fillRect(-14, 1, 30, 25);

    // Back leg and shoe.
    context.fillStyle = "#26364d";
    context.fillRect(-12, 4, 10, 19);
    context.fillStyle = "#24231f";
    context.fillRect(-15, 19, 15, 7);

    // Front leg and shoe.
    context.fillStyle = COLORS.playerPants;
    context.fillRect(1, 3, 11, 20);
    context.fillStyle = "#34312a";
    context.fillRect(0, 19, 17, 7);
    context.fillRect(11, 16, 8, 7);

    // Shirt, belt, and suburban belly.
    context.fillStyle = "#5e794c";
    context.fillRect(-13, -22, 22, 27);
    context.fillRect(5, -17, 10, 20);
    context.fillStyle = COLORS.playerShirt;
    context.fillRect(-9, -25, 19, 25);
    context.fillRect(7, -17, 8, 16);
    context.fillStyle = "#3b3024";
    context.fillRect(-12, -1, 27, 5);
    context.fillStyle = "#d9b64c";
    context.fillRect(2, -1, 5, 5);

    // Head in side profile, including nose, hair, and moustache.
    context.fillStyle = COLORS.playerSkin;
    context.fillRect(-7, -42, 18, 19);
    context.fillRect(8, -36, 8, 9);
    context.fillRect(13, -33, 6, 5);
    context.fillStyle = "#554235";
    context.fillRect(-9, -45, 17, 6);
    context.fillRect(-11, -42, 6, 12);
    context.fillStyle = "#f3e8c8";
    context.fillRect(7, -37, 4, 4);
    context.fillStyle = "#25231f";
    context.fillRect(9, -36, 3, 3);
    context.fillRect(11, -28, 8, 3);

    // Compact health bar keeps the character readable during busy combat.
    context.fillStyle = "#241d18";
    context.fillRect(-18, -55, 38, 7);
    context.fillStyle = "#9e342b";
    context.fillRect(-16, -53, 34, 3);

    // The forward arm follows the cursor without rotating the whole sprite.
    context.save();
    context.translate(4, -14);
    context.rotate(localAim);
    context.fillStyle = COLORS.playerShirt;
    context.fillRect(0, -5, 13, 10);
    context.fillStyle = COLORS.playerSkin;
    context.fillRect(12, -4, 12, 8);
    context.fillStyle = "#4c4437";
    context.fillRect(22, -2, 19, 5);
    context.fillStyle = "#252723";
    context.fillRect(38, -3, 8, 7);
    context.restore();

    context.restore();
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
