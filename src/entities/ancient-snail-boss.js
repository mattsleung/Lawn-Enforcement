export class AncientSnailBoss {
  constructor({ x, y, config }) {
    this.x = x; this.y = y; this.radius = 86; this.maxHealth = config.health; this.health = config.health;
    this.maxShield = config.shieldStrength; this.shield = config.shieldStrength; this.shieldRegeneration = config.shieldRegeneration;
    this.speed = config.speed; this.damage = 12; this.name = config.name; this.isBoss = true; this.enemyType = "ancient-snail";
    this.hitFlash = 0; this.slowTime = 0; this.spitCooldown = config.spitCooldown; this.spitTimer = config.spitCooldown;
    this.shellSlamCooldown = config.shellSlamCooldown; this.shellSlamTimer = config.shellSlamCooldown; this.shellSlamWarning = 0;
    this.snailArmyCooldown = config.snailArmyCooldown; this.snailArmyTimer = config.snailArmyCooldown; this.config = config; this.slimeTimer = 0; this.slamWave = 0;
  }
  get active() { return this.health > 0; }
  update(deltaTime, target) {
    const events = { spit: null, shellSlam: null, spawnSnail: false, permanentSlime: null };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime); this.slowTime = Math.max(0, this.slowTime - deltaTime);
    this.shield = Math.min(this.maxShield, this.shield + this.shieldRegeneration * deltaTime);
    if (!this.active) return events;
    const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
    if (this.shellSlamWarning <= 0) { this.x += dx / distance * this.speed * (this.slowTime > 0 ? 0.5 : 1) * deltaTime; this.y += dy / distance * this.speed * (this.slowTime > 0 ? 0.5 : 1) * deltaTime; }
    this.slimeTimer -= deltaTime;
    if (this.slimeTimer <= 0) { this.slimeTimer = 0.12; events.permanentSlime = { x: this.x, y: this.y, radius: 72, permanent: true }; }
    this.spitTimer -= deltaTime;
    if (this.spitTimer <= 0) { this.spitTimer += this.spitCooldown; events.spit = { x: this.x, y: this.y, targetX: target.x, targetY: target.y, speed: this.config.spitSpeed, damage: this.config.spitDamage, lifetime: this.config.spitLifetime, splashRadius: this.config.spitSplashRadius }; }
    if (this.shellSlamWarning > 0) {
      this.shellSlamWarning -= deltaTime;
      if (this.shellSlamWarning <= 0) { this.slamWave = 0.45; events.shellSlam = { radius: this.config.shellSlamRadius, damage: this.config.shellSlamDamage, pushback: this.config.shellSlamPushback }; }
    } else {
      this.shellSlamTimer -= deltaTime;
      if (this.shellSlamTimer <= 0) { this.shellSlamTimer += this.shellSlamCooldown; this.shellSlamWarning = 0.8; }
    }
    this.slamWave = Math.max(0, this.slamWave - deltaTime);
    this.snailArmyTimer -= deltaTime;
    if (this.snailArmyTimer <= 0) { this.snailArmyTimer += this.snailArmyCooldown; events.spawnSnail = true; }
    return events;
  }
  takeDamage(amount) {
    if (!this.active) return false;
    let remaining = Math.max(0, amount);
    const shieldDamage = Math.min(this.shield, remaining); this.shield -= shieldDamage; remaining -= shieldDamage;
    this.health = Math.max(0, this.health - remaining); this.hitFlash = 0.12; return this.health === 0;
  }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    if (this.shellSlamWarning > 0) { context.strokeStyle = "rgba(255, 215, 110, 0.75)"; context.lineWidth = 5; context.setLineDash([10, 8]); context.beginPath(); context.arc(x, y, this.config.shellSlamRadius, 0, Math.PI * 2); context.stroke(); context.setLineDash([]); }
    if (this.slamWave > 0) { context.strokeStyle = `rgba(255, 218, 125, ${this.slamWave / 0.45})`; context.lineWidth = 8; context.beginPath(); context.arc(x, y, this.config.shellSlamRadius * (1 - this.slamWave / 0.45 * 0.45), 0, Math.PI * 2); context.stroke(); }
    context.save(); context.translate(x, y);
    context.fillStyle = "rgba(17, 29, 19, 0.32)"; context.fillRect(-68, 30, 136, 22);
    context.fillStyle = this.hitFlash > 0 ? "#fff4d1" : "#7b6b52"; context.fillRect(-58, -34, 116, 70);
    context.fillStyle = "#a48b62"; context.fillRect(-40, -55, 72, 52);
    context.fillStyle = "#65503d"; context.fillRect(-28, -44, 42, 7); context.fillRect(8, -37, 7, 27); context.fillRect(-16, -16, 30, 7); context.fillRect(-23, -30, 7, 21);
    context.fillStyle = "#8eb26b"; context.fillRect(39, -48, 6, 42); context.fillRect(57, -48, 6, 42);
    context.fillStyle = "#3d3027"; context.fillRect(36, -53, 12, 7); context.fillRect(54, -53, 12, 7); context.fillRect(-15, -34, 7, 7); context.fillRect(13, -34, 7, 7);
    context.fillStyle = "#211c18"; context.fillRect(-72, -89, 144, 7); context.fillStyle = "#c87563"; context.fillRect(-68, -87, 136 * (this.health / this.maxHealth), 3);
    context.fillStyle = "#163b45"; context.fillRect(-68, -98, 136, 5); context.fillStyle = "#6ec5d3"; context.fillRect(-66, -97, 132 * (this.shield / this.maxShield), 2);
    context.restore();
  }
}
