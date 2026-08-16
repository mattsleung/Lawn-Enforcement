export class Mosquito {
  constructor({ x, y, health = 50, speed = 185, damage = 5, coinValue = 2, xpValue = 20, random = Math.random, bossMinion = false }) {
    this.x = x; this.y = y; this.radius = 13;
    this.maxHealth = health; this.health = health; this.speed = speed; this.damage = damage;
    this.coinValue = coinValue; this.xpValue = xpValue; this.enemyType = "mosquito";
    this.bossMinion = bossMinion; this.hitFlash = 0; this.slowTime = 0;
    this.ignoresObstacles = true; this.flying = true;
    this.dashTimer = 1.8 + random() * 1.8; this.dashTime = 0; this.dashX = 0; this.dashY = 0;
  }
  get active() { return this.health > 0; }
  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.dashTimer -= deltaTime;
    if (this.dashTimer <= 0 && this.dashTime <= 0) {
      const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
      this.dashX = dx / distance; this.dashY = dy / distance; this.dashTime = 0.28; this.dashTimer = 2.8;
    }
    if (this.dashTime > 0) {
      this.x += this.dashX * 720 * deltaTime; this.y += this.dashY * 720 * deltaTime; this.dashTime -= deltaTime;
    } else {
      const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
      this.x += dx / distance * this.speed * deltaTime; this.y += dy / distance * this.speed * deltaTime;
    }
    return {};
  }
  takeDamage(amount) { if (!this.active) return false; this.health = Math.max(0, this.health - Math.max(0, amount)); this.hitFlash = 0.1; return this.health === 0; }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.save(); context.translate(x, y);
    context.fillStyle = "rgba(20, 24, 18, 0.25)"; context.fillRect(-9, 15, 18, 4);
    context.fillStyle = this.hitFlash > 0 ? "#fff4d1" : "#5d7e55"; context.fillRect(-5, -10, 10, 21);
    context.fillStyle = "#2b3224"; context.fillRect(-3, -14, 6, 6);
    context.fillStyle = "#a3c3d1"; context.fillRect(-18, -8, 12, 5); context.fillRect(6, -8, 12, 5);
    context.fillStyle = "#35251e"; context.fillRect(9, -3, 10, 3);
    context.restore();
  }
}
