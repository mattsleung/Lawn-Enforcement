export class LilyQueenBoss {
  constructor({ x, y, config }) {
    this.x = x;
    this.y = y;
    this.radius = 54;
    this.name = config.name;
    this.maxHealth = config.health;
    this.health = config.health;
    this.damage = config.damage;
    this.shieldStrength = config.shieldStrength;
    this.shieldRegeneration = config.shieldRegeneration;
    this.strongweedCooldown = config.strongweedCooldown;
    this.strongweedLaunchChance = config.strongweedLaunchChance ?? 0.5;
    this.strongweedLaunchSpeed = config.strongweedLaunchSpeed ?? 900;
    this.riverbankWeedCooldown = config.riverbankWeedCooldown;
    this.strongweedTimer = this.strongweedCooldown;
    this.riverbankWeedTimer = this.riverbankWeedCooldown;
    this.shield = this.shieldStrength;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.isBoss = true;
    this.enemyType = "lily-queen";
  }

  get active() { return this.health > 0; }

  update(deltaTime) {
    const events = { spawnStrongweed: false, spawnRiverbankWeed: false };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return events;
    this.shield = Math.min(this.shieldStrength, this.shield + this.shieldRegeneration * deltaTime);
    this.strongweedTimer -= deltaTime;
    if (this.strongweedTimer <= 0) {
      events.spawnStrongweed = true;
      this.strongweedTimer += this.strongweedCooldown;
    }
    this.riverbankWeedTimer -= deltaTime;
    if (this.riverbankWeedTimer <= 0) {
      events.spawnRiverbankWeed = true;
      this.riverbankWeedTimer += this.riverbankWeedCooldown;
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
    this.hitFlash = 0.12;
    return this.health === 0;
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.save();
    context.translate(x, y);
    if (this.shield > 0) {
      context.strokeStyle = "rgba(137, 224, 255, 0.82)";
      context.lineWidth = 8;
      context.beginPath();
      context.arc(0, 0, 68, 0, Math.PI * 2);
      context.stroke();
    }
    context.fillStyle = "#24533d";
    context.fillRect(-12, -12, 24, 55);
    context.fillStyle = this.hitFlash > 0 ? "#fff8c9" : "#d7ee67";
    for (let index = 0; index < 12; index += 1) {
      const angle = index / 12 * Math.PI * 2;
      context.fillRect(Math.round(Math.cos(angle) * 43) - 10, Math.round(Math.sin(angle) * 43) - 10, 20, 20);
    }
    context.fillStyle = this.hitFlash > 0 ? "#ffffff" : "#f39ac4";
    for (let index = 0; index < 8; index += 1) {
      const angle = index / 8 * Math.PI * 2;
      context.fillRect(Math.round(Math.cos(angle) * 29) - 8, Math.round(Math.sin(angle) * 29) - 8, 16, 16);
    }
    context.fillStyle = "#c68e46";
    context.fillRect(-27, -26, 54, 50);
    context.fillStyle = "#30271c";
    context.fillRect(-13, -12, 8, 8);
    context.fillRect(6, -12, 8, 8);
    context.fillRect(-16, 3, 32, 6);
    context.fillStyle = "#f2c85b";
    context.fillRect(-22, -42, 44, 7);
    context.fillRect(-18, -50, 8, 9);
    context.fillRect(-4, -55, 8, 14);
    context.fillRect(10, -50, 8, 9);
    context.restore();
  }
}
