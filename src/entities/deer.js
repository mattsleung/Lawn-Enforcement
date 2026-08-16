export class Deer {
  constructor({ x, y, health = 500, speed = 55, damage = 8, coinValue = 8, xpValue = 50, bossMinion = false }) {
    this.x = x; this.y = y; this.radius = 28; this.maxHealth = health; this.health = health;
    this.speed = speed; this.damage = damage; this.coinValue = coinValue; this.xpValue = xpValue;
    this.enemyType = "deer"; this.bossMinion = bossMinion; this.hitFlash = 0; this.slowTime = 0;
    this.state = "wander"; this.prepareTime = 0; this.chargeTime = 0; this.repositionTime = 0; this.chargeX = 0; this.chargeY = 0;
  }
  get active() { return this.health > 0; }
  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime); this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return {};
    if (this.chargeTime > 0) {
      this.x += this.chargeX * 520 * deltaTime; this.y += this.chargeY * 520 * deltaTime; this.chargeTime -= deltaTime;
      if (this.chargeTime <= 0) { this.state = "reposition"; this.repositionTime = 0.9; }
      return {};
    }
    if (this.repositionTime > 0) {
      this.repositionTime -= deltaTime;
      const dx = this.x - target.x; const dy = this.y - target.y; const distance = Math.hypot(dx, dy) || 1;
      this.x += dx / distance * this.speed * deltaTime; this.y += dy / distance * this.speed * deltaTime;
      if (this.repositionTime <= 0) this.state = "wander";
      return {};
    }
    if (this.prepareTime > 0) {
      this.prepareTime -= deltaTime;
      if (this.prepareTime <= 0) {
        this.chargeTime = 0.8; this.state = "charge";
      }
      return {};
    }
    const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
    if (distance < 290) {
      // Snapshot the charge vector when the warning begins. The deer must use
      // this same vector when the telegraph ends instead of retargeting.
      this.chargeX = dx / distance;
      this.chargeY = dy / distance;
      this.prepareTime = 0.8;
      this.state = "prepare";
      return {};
    }
    this.x += dx / distance * this.speed * deltaTime; this.y += dy / distance * this.speed * deltaTime;
    return {};
  }
  takeDamage(amount) { if (!this.active) return false; this.health = Math.max(0, this.health - Math.max(0, amount)); this.hitFlash = 0.1; return this.health === 0; }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    if (this.prepareTime > 0) {
      context.strokeStyle = "rgba(255, 224, 103, 0.75)";
      context.lineWidth = 3;
      context.setLineDash([8, 8]);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x + this.chargeX * 520 * 0.8, y + this.chargeY * 520 * 0.8);
      context.stroke();
      context.setLineDash([]);
    }
    context.save(); context.translate(x, y);
    context.fillStyle = this.hitFlash > 0 ? "#fff4d1" : "#8d6543"; context.fillRect(-20, -18, 40, 34);
    context.fillStyle = "#b98d5f"; context.fillRect(-14, -27, 28, 15); context.fillRect(-18, -31, 8, 10); context.fillRect(10, -31, 8, 10);
    context.fillStyle = "#d2ad78"; context.fillRect(-15, -39, 4, 12); context.fillRect(11, -39, 4, 12); context.fillRect(-22, -42, 11, 4); context.fillRect(11, -42, 11, 4); context.fillRect(-21, -49, 4, 9); context.fillRect(17, -49, 4, 9);
    context.fillStyle = "#2b211b"; context.fillRect(-8, -21, 4, 4); context.fillRect(6, -21, 4, 4); context.fillRect(-3, -14, 7, 4);
    context.fillStyle = "#4f3828"; context.fillRect(-22, 12, 13, 11); context.fillRect(9, 12, 13, 11);
    context.fillStyle = "#211c18"; context.fillRect(-23, -39, 46, 5); context.fillStyle = "#cf7f5b"; context.fillRect(-21, -37, 42 * (this.health / this.maxHealth), 2);
    context.restore();
  }
}
