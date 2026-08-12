export class Boss {
  constructor({ x, y, config }) {
    this.x = x;
    this.y = y;
    this.radius = 42;
    this.name = config.name;
    this.maxHealth = config.health;
    this.health = config.health;
    this.damage = config.damage;
    this.speed = config.speed;
    this.thrownGnomeCooldown = config.thrownGnomeCooldown;
    this.thrownGnomeSpeed = config.thrownGnomeSpeed;
    this.throwWindupDuration = config.throwWindupDuration;
    this.summonCooldown = config.summonCooldown;
    this.throwTimer = this.thrownGnomeCooldown;
    this.summonTimer = this.summonCooldown;
    this.throwWindupTime = 0;
    this.throwTarget = null;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.isBoss = true;
    this.enemyType = "king-gnomulus";
  }

  get active() { return this.health > 0; }

  update(deltaTime, target) {
    const events = { throwGnome: null, summonGnomes: false };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return events;

    this.summonTimer -= deltaTime;
    if (this.summonTimer <= 0) {
      events.summonGnomes = true;
      this.summonTimer += this.summonCooldown;
    }

    if (this.throwWindupTime > 0) {
      this.throwWindupTime -= deltaTime;
      if (this.throwWindupTime <= 0) {
        events.throwGnome = { ...this.throwTarget, speed: this.thrownGnomeSpeed };
        this.throwTarget = null;
        this.throwTimer = this.thrownGnomeCooldown;
      }
      return events;
    }

    this.throwTimer -= deltaTime;
    if (this.throwTimer <= 0) {
      this.throwTarget = { x: target.x, y: target.y };
      this.throwWindupTime = this.throwWindupDuration;
      return events;
    }

    const offsetX = target.x - this.x;
    const offsetY = target.y - this.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    if (distance > 105) {
      const slowMultiplier = this.slowTime > 0 ? 0.5 : 1;
      this.x += offsetX / distance * this.speed * slowMultiplier * deltaTime;
      this.y += offsetY / distance * this.speed * slowMultiplier * deltaTime;
    }
    return events;
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.health = Math.max(0, this.health - amount);
    this.hitFlash = 0.12;
    return this.health === 0;
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    if (this.throwTarget) {
      const targetX = Math.round(this.throwTarget.x - camera.x);
      const targetY = Math.round(this.throwTarget.y - camera.y);
      context.strokeStyle = "rgba(238, 197, 75, 0.75)";
      context.lineWidth = 3;
      context.setLineDash([8, 8]);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(targetX, targetY);
      context.stroke();
      context.setLineDash([]);
      context.strokeRect(targetX - 14, targetY - 14, 28, 28);
    }
    context.save();
    context.translate(x, y);
    context.fillStyle = "#2a2019";
    context.fillRect(-34, -46, 68, 76);
    context.fillStyle = this.hitFlash > 0 ? "#fff3cd" : "#b72f34";
    context.fillRect(-29, -47, 58, 18);
    context.fillRect(-20, -63, 40, 18);
    context.fillRect(-9, -75, 18, 14);
    context.fillStyle = this.hitFlash > 0 ? "#ffffff" : "#d69b70";
    context.fillRect(-24, -27, 48, 35);
    context.fillStyle = "#211d19";
    context.fillRect(-13, -17, 7, 7);
    context.fillRect(7, -17, 7, 7);
    context.fillRect(-17, -2, 34, 7);
    context.fillStyle = "#d3c99f";
    context.fillRect(-27, 8, 54, 34);
    context.fillStyle = "#485c75";
    context.fillRect(-28, 36, 22, 18);
    context.fillRect(6, 36, 22, 18);
    context.restore();
  }
}
