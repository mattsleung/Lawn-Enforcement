export class GroundskeeperBoss {
  constructor({ x, y, config, world }) {
    this.x = x; this.y = y; this.radius = 46;
    this.name = config.name; this.maxHealth = config.health; this.health = config.health;
    this.damage = config.damage; this.speed = config.speed; this.world = world;
    this.mowCooldown = config.mowCooldown; this.clippingCooldown = config.clippingCooldown;
    this.shieldStrength = config.shieldStrength ?? 200;
    this.shieldRegeneration = config.shieldRegeneration ?? 10;
    this.shield = this.shieldStrength;
    this.canCrushObstacles = config.canCrushObstacles ?? true;
    this.summonSquirrels = config.summonSquirrels ?? true;
    this.mowTimer = this.mowCooldown; this.clippingTimer = this.clippingCooldown;
    this.warningTime = 0; this.chargeTime = 0; this.mowVector = { x: 1, y: 0 };
    this.hitFlash = 0; this.slowTime = 0; this.isBoss = true; this.enemyType = "groundskeeper";
    this.orbit = 0; this.crushedObstacles = new Set();
  }
  get active() { return this.health > 0; }
  update(deltaTime, target, obstacles = []) {
    const events = { fireClippings: null, crushObstacles: [] };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return events;
    this.shield = Math.min(this.shieldStrength, this.shield + this.shieldRegeneration * deltaTime);
    const slow = this.slowTime > 0 ? 0.5 : 1;
    this.mowTimer -= deltaTime; this.clippingTimer -= deltaTime;
    if (this.warningTime > 0) {
      this.warningTime -= deltaTime;
      if (this.warningTime <= 0) this.chargeTime = 1.45;
    } else if (this.chargeTime > 0) {
      this.chargeTime -= deltaTime;
      this.x += this.mowVector.x * 560 * slow * deltaTime;
      this.y += this.mowVector.y * 560 * slow * deltaTime;
      this.x = Math.max(this.radius, Math.min(this.world.width - this.radius, this.x));
      this.y = Math.max(this.radius, Math.min(this.world.height - this.radius, this.y));
      if (this.canCrushObstacles) {
        for (const obstacle of obstacles) {
          if (this.crushedObstacles.has(obstacle)) continue;
          if (Math.hypot(obstacle.x + obstacle.width / 2 - this.x, obstacle.y + obstacle.height / 2 - this.y) < Math.max(obstacle.width, obstacle.height) * 0.65 + this.radius) {
            this.crushedObstacles.add(obstacle); events.crushObstacles.push(obstacle);
          }
        }
      }
    } else {
      this.orbit += deltaTime * 0.55;
      const desiredX = this.world.width / 2 + Math.cos(this.orbit) * this.world.width * 0.28;
      const desiredY = this.world.height / 2 + Math.sin(this.orbit * 0.82) * this.world.height * 0.28;
      const dx = desiredX - this.x; const dy = desiredY - this.y; const distance = Math.hypot(dx, dy) || 1;
      this.x += dx / distance * this.speed * slow * deltaTime;
      this.y += dy / distance * this.speed * slow * deltaTime;
    }
    if (this.mowTimer <= 0 && this.warningTime <= 0 && this.chargeTime <= 0) {
      const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
      this.mowVector = { x: dx / distance, y: dy / distance };
      this.warningTime = 1; this.mowTimer = this.mowCooldown;
    }
    if (this.clippingTimer <= 0) {
      const aimX = target.x - this.x;
      const aimY = target.y - this.y;
      const aimDistance = Math.hypot(aimX, aimY) || 1;
      events.fireClippings = { x: this.x, y: this.y, directionX: aimX / aimDistance, directionY: aimY / aimDistance };
      this.clippingTimer = this.clippingCooldown;
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
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    if (this.warningTime > 0) {
      context.save(); context.translate(x, y); context.rotate(Math.atan2(this.mowVector.y, this.mowVector.x));
      context.fillStyle = "rgba(244, 207, 89, 0.28)"; context.fillRect(0, -26, 900, 52);
      context.strokeStyle = "rgba(255, 231, 130, 0.9)"; context.setLineDash([12, 10]); context.strokeRect(0, -26, 900, 52); context.setLineDash([]); context.restore();
    }
    context.save(); context.translate(x, y);
    if (this.shield > 0) { context.strokeStyle = "rgba(137, 224, 255, 0.82)"; context.lineWidth = 7; context.beginPath(); context.arc(0, -8, 58, 0, Math.PI * 2); context.stroke(); }
    context.fillStyle = "#27302a"; context.fillRect(-42, -18, 84, 42); context.fillStyle = this.hitFlash > 0 ? "#fff3cd" : "#4c8b53"; context.fillRect(-32, -34, 64, 24); context.fillStyle = "#171b17"; context.fillRect(-36, 20, 22, 18); context.fillRect(14, 20, 22, 18); context.fillStyle = "#c88f52"; context.fillRect(-16, -54, 32, 20); context.fillStyle = "#211d19"; context.fillRect(-9, -47, 5, 5); context.fillRect(5, -47, 5, 5); context.restore();
  }
}
