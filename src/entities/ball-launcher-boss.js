export class BallLauncherBoss {
  constructor({ x, y, config }) {
    this.x = x; this.y = y; this.radius = 58; this.name = config.name; this.maxHealth = config.health; this.health = config.health;
    this.speed = 0; this.damage = 0; this.ballCooldown = config.ballCooldown; this.dumpCooldown = config.dumpCooldown; this.ballTimer = this.ballCooldown; this.dumpTimer = this.dumpCooldown; this.dumpWarning = 0; this.aimAngle = 0; this.hitFlash = 0; this.isBoss = true; this.enemyType = "ball-launcher";
    this.config = config;
  }
  get active() { return this.health > 0; }
  update(deltaTime, target) {
    const events = { fireRandomBall: null, ballDump: false };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime); if (!this.active) return events;
    this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x); this.ballTimer -= deltaTime; this.dumpTimer -= deltaTime;
    if (this.dumpWarning > 0) { this.dumpWarning -= deltaTime; if (this.dumpWarning <= 0) events.ballDump = true; }
    else if (this.dumpTimer <= 0) { this.dumpWarning = 0.8; this.dumpTimer = this.dumpCooldown; }
    if (this.ballTimer <= 0) { events.fireRandomBall = { x: this.x, y: this.y, targetX: target.x, targetY: target.y }; this.ballTimer = this.ballCooldown; }
    return events;
  }
  takeDamage(amount) { if (!this.active) return false; this.health = Math.max(0, this.health - Math.max(0, Number(amount) || 0)); this.hitFlash = 0.12; return this.health === 0; }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    const shake = this.dumpWarning > 0 ? Math.sin(this.dumpWarning * 42) * 5 : 0;
    context.save(); context.translate(x + shake, y); context.rotate(this.aimAngle);
    if (this.dumpWarning > 0 && Math.floor(this.dumpWarning * 12) % 2 === 0) context.globalAlpha = 0.55;
    context.fillStyle = this.hitFlash > 0 ? "#fff5d3" : "#5c6571"; context.fillRect(-55, -45, 110, 90); context.fillStyle = "#222933"; context.fillRect(20, -18, 70, 36); context.fillStyle = "#d37438"; context.fillRect(72, -10, 24, 20); context.restore();
    context.globalAlpha = 1; context.fillStyle = "#211c18"; context.fillRect(x - 60, y - 78, 120, 6); context.fillStyle = "#e25a45"; context.fillRect(x - 60, y - 78, 120 * Math.max(0, this.health / this.maxHealth), 6);
  }
}
