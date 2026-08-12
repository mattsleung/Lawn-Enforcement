export class DandelionBoss {
  constructor({ x, y, config }) {
    this.x = x;
    this.y = y;
    this.radius = 39;
    this.name = config.name;
    this.maxHealth = config.health;
    this.health = config.health;
    this.damage = config.damage;
    this.speed = config.speed;
    this.sporeCooldown = config.sporeCooldown;
    this.aimedSporeCooldown = config.aimedSporeCooldown;
    this.sporeSpeed = config.sporeSpeed;
    this.sporeDamage = config.sporeDamage;
    this.sporeLifetime = config.sporeLifetime;
    this.sporeTimer = this.sporeCooldown;
    this.aimedSporeTimer = this.aimedSporeCooldown;
    this.shieldThreshold = config.shieldThreshold;
    this.shieldStrength = config.shieldStrength;
    this.shieldCooldown = config.shieldCooldown;
    this.maxShieldActivations = config.maxShieldActivations;
    this.shieldActivations = 0;
    this.healthRegeneration = config.healthRegeneration;
    this.shieldTimer = 0;
    this.shield = 0;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.isBoss = true;
    this.enemyType = "dandelion";
  }

  get active() { return this.health > 0; }

  update(deltaTime, target) {
    const events = { fireSpores: false, fireAimedSpore: false };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return events;
    this.health = Math.min(this.maxHealth, this.health + this.healthRegeneration * deltaTime);

    this.sporeTimer -= deltaTime;
    if (this.sporeTimer <= 0) {
      events.fireSpores = true;
      this.sporeTimer += this.sporeCooldown;
    }
    this.aimedSporeTimer -= deltaTime;
    if (this.aimedSporeTimer <= 0) {
      events.fireAimedSpore = true;
      this.aimedSporeTimer += this.aimedSporeCooldown;
    }

    this.shieldTimer = Math.max(0, this.shieldTimer - deltaTime);
    this.queueShield();

    const offsetX = target.x - this.x;
    const offsetY = target.y - this.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    if (distance > 150) {
      const slow = this.slowTime > 0 ? 0.5 : 1;
      this.x += offsetX / distance * this.speed * slow * deltaTime;
      this.y += offsetY / distance * this.speed * slow * deltaTime;
    }
    return events;
  }

  takeDamage(amount) {
    if (!this.active) return false;
    let remaining = Math.max(0, amount);
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, remaining);
      this.shield -= absorbed;
      remaining -= absorbed;
    }
    if (remaining > 0) this.health = Math.max(0, this.health - remaining);
    this.queueShield();
    this.hitFlash = 0.12;
    return this.health === 0;
  }

  queueShield() {
    if (this.health > 0 && this.health < this.shieldThreshold && this.shield <= 0
      && this.shieldTimer <= 0 && this.shieldActivations < this.maxShieldActivations) {
      this.shield = this.shieldStrength;
      this.shieldTimer = this.shieldCooldown;
      this.shieldActivations += 1;
    }
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.save();
    context.translate(x, y);
    if (this.shield > 0) {
      context.strokeStyle = "rgba(137, 224, 255, 0.82)";
      context.lineWidth = 7;
      context.beginPath();
      context.arc(0, -8, 49, 0, Math.PI * 2);
      context.stroke();
    }
    context.fillStyle = "#4c7b32";
    context.fillRect(-7, -9, 14, 55);
    context.fillRect(-31, 24, 62, 10);
    context.fillStyle = this.hitFlash > 0 ? "#fff8c9" : "#f3db4d";
    for (let index = 0; index < 12; index += 1) {
      const angle = index / 12 * Math.PI * 2;
      context.fillRect(Math.round(Math.cos(angle) * 29) - 7, Math.round(Math.sin(angle) * 29) - 18, 14, 14);
    }
    context.fillStyle = "#8f6d32";
    context.fillRect(-18, -26, 36, 36);
    context.fillStyle = "#382d22";
    context.fillRect(-9, -15, 6, 6);
    context.fillRect(5, -15, 6, 6);
    context.fillRect(-9, -2, 20, 5);
    context.restore();
  }
}
