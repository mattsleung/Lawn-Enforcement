export class PondfatherBoss {
  constructor({ x, y, config, world }) {
    this.x = x; this.y = y; this.waterX = x; this.waterY = y;
    this.radius = 55; this.name = config.name; this.maxHealth = config.health; this.health = config.health;
    this.damage = 50; this.speed = 80; this.world = world; this.isBoss = true; this.enemyType = "pondfather";
    this.form = "water"; this.phase = "water"; this.phaseTime = 0; this.regenTime = 0; this.warningTime = 0;
    this.speed = config.speed ?? 200; this.healthRegeneration = config.healthRegeneration ?? 15; this.shieldRegeneration = config.shieldRegeneration ?? 25; this.shieldStrength = config.shieldStrength ?? 200; this.shield = this.shieldStrength; this.wanderTime = 0; this.wanderX = 1; this.wanderY = 0;
    this.diveTarget = null; this.hitFlash = 0; this.slowTime = 0;
  }

  get active() { return this.health > 0; }

  update(deltaTime, target) {
    const events = { divebomb: null, spawnGeese: false };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return events;

    if (this.phase === "water") {
      this.form = "water";
      this.health = Math.min(this.maxHealth, this.health + this.healthRegeneration * deltaTime);
      this.shield = Math.min(this.shieldStrength, this.shield + this.shieldRegeneration * deltaTime);
      this.regenTime += deltaTime;
      if (this.regenTime >= 5) {
        this.phase = "warning";
        this.warningTime = 1;
        this.diveTarget = { x: target.x, y: target.y };
      }
      return events;
    }

    if (this.phase === "warning") {
      this.form = "water";
      this.warningTime -= deltaTime;
      if (this.warningTime <= 0) {
        this.phase = "divebomb";
        this.form = "land";
        this.x = this.diveTarget.x;
        this.y = this.diveTarget.y;
        events.divebomb = { x: this.x, y: this.y };
        this.phaseTime = 3;
      }
      return events;
    }

    if (this.phase === "divebomb") {
      this.form = "land";
      this.phaseTime -= deltaTime;
      if (this.phaseTime <= 0) {
        this.phase = "spawn";
        this.phaseTime = 10;
        this.spawnTimer = 0;
        this.spawnedMinions = 0;
      }
      return events;
    }

    if (this.phase === "spawn") {
      this.form = "land";
      this.phaseTime -= deltaTime; this.spawnTimer -= deltaTime;
      if (this.spawnedMinions < 18 && this.spawnTimer <= 0) {
        const types = Array.from({ length: 18 }, (_, index) => ["acorn-squirrel", "squirrel", "goose"][index % 3]);
        const batchSize = this.spawnedMinions % 4 === 0 ? 2 : 1;
        events.throwMinions = types.slice(this.spawnedMinions, this.spawnedMinions + batchSize).map((type) => ({ type, x: target.x, y: target.y, speed: 1000 }));
        this.spawnedMinions += events.throwMinions.length; this.spawnTimer = 10 / 18;
      }
      if (this.phaseTime <= 0) {
        this.phase = "charge";
        this.phaseTime = 3;
      }
      return events;
    }

    if (this.phase === "charge") {
      this.form = "land";
      this.phaseTime -= deltaTime;
      this.wanderTime -= deltaTime;
      if (this.wanderTime <= 0) { this.wanderTime = 0.7 + Math.random() * 1.2; this.wanderX = Math.random() * 2 - 1; this.wanderY = Math.random() * 2 - 1; }
      const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1; const wanderDistance = Math.hypot(this.wanderX, this.wanderY) || 1;
      this.x += (this.wanderX / wanderDistance * 0.65 + dx / distance * 0.35) * this.speed * deltaTime;
      this.y += (this.wanderY / wanderDistance * 0.65 + dy / distance * 0.35) * this.speed * deltaTime;
      if (this.phaseTime <= 0) {
        this.phase = "return";
        this.phaseTime = 3;
      }
      return events;
    }

    this.form = "land";
    this.phaseTime -= deltaTime;
    const dx = this.waterX - this.x; const dy = this.waterY - this.y; const distance = Math.hypot(dx, dy) || 1;
    this.x += dx / distance * this.speed * deltaTime;
    this.y += dy / distance * this.speed * deltaTime;
    if (this.phaseTime <= 0 || distance < 12) {
      this.x = this.waterX; this.y = this.waterY; this.form = "water"; this.phase = "water"; this.regenTime = 0;
    }
    return events;
  }

  takeDamage(amount) {
    if (!this.active) return false;
    const absorbed = Math.min(this.shield, Math.max(0, amount));
    this.shield -= absorbed;
    this.health = Math.max(0, this.health - Math.max(0, amount) + absorbed);
    this.hitFlash = 0.12;
    return this.health === 0;
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    if (this.phase === "warning") {
      context.fillStyle = "rgba(255, 241, 147, 0.42)";
      context.fillRect(x - 85, y - 85, 170, 170);
      context.strokeStyle = "#fff0a2"; context.lineWidth = 5; context.strokeRect(x - 70, y - 70, 140, 140);
    }
    context.save(); context.translate(x, y);
    if (this.shield > 0) { context.strokeStyle = "rgba(137, 224, 255, 0.82)"; context.lineWidth = 7; context.beginPath(); context.arc(0, -8, 66, 0, Math.PI * 2); context.stroke(); }
    context.fillStyle = this.form === "water" ? "#477ca1" : "#e5ddbd";
    context.fillRect(-48, -22, 96, 48);
    context.fillStyle = "#c9c0a3"; context.fillRect(-25, -52, 50, 30);
    context.fillStyle = "#211d18"; context.fillRect(-15, -42, 7, 7); context.fillRect(8, -42, 7, 7);
    context.fillStyle = "#d69a3b"; context.fillRect(30, -32, 25, 8);
    context.restore();
  }
}
