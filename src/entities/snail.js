export class Snail {
  constructor({ x, y, health = 400, speed = 45, damage = 8, coinValue = 6, xpValue = 40, bossMinion = false }) {
    this.x = x;
    this.y = y;
    this.radius = 24;
    this.maxHealth = health;
    this.health = health;
    this.speed = speed;
    this.damage = damage;
    this.coinValue = coinValue;
    this.xpValue = xpValue;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.enemyType = "snail";
    this.bossMinion = bossMinion;
    this.slimeTrailTimer = 0;
  }

  get active() { return this.health > 0; }

  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return {};
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    const slow = this.slowTime > 0 ? 0.5 : 1;
    this.x += dx / distance * this.speed * slow * deltaTime;
    this.y += dy / distance * this.speed * slow * deltaTime;
    this.slimeTrailTimer -= deltaTime;
    if (this.slimeTrailTimer <= 0) {
      this.slimeTrailTimer = 0.15;
      return { slimeTrail: { x: this.x, y: this.y, radius: 30, lifetime: 5 } };
    }
    return {};
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.health = Math.max(0, this.health - Math.max(0, amount));
    this.hitFlash = 0.1;
    return this.health === 0;
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.save();
    context.translate(x, y);
    context.fillStyle = "#264b38";
    context.fillRect(-22, 6, 44, 14);
    context.fillStyle = this.hitFlash > 0 ? "#fff4d1" : "#8d6e4c";
    context.fillRect(-14, -15, 28, 27);
    context.fillStyle = "#b99b69";
    context.fillRect(-7, -21, 18, 19);
    context.fillStyle = "#76543c";
    context.fillRect(-6, -17, 11, 4);
    context.fillRect(1, -13, 5, 9);
    context.fillRect(-3, -7, 8, 4);
    context.fillStyle = "#3d2b24";
    context.fillRect(-3, -14, 4, 4);
    context.fillRect(6, -14, 4, 4);
    context.fillStyle = "#7f5339";
    context.fillRect(-18, -4, 10, 7);
    context.fillStyle = "#9bc56e";
    context.fillRect(14, -13, 3, 14);
    context.fillRect(21, -13, 3, 14);
    context.fillStyle = "#29251e";
    context.fillRect(13, -15, 5, 4);
    context.fillRect(20, -15, 5, 4);
    context.fillStyle = "#211c18";
    context.fillRect(-20, -34, 40, 5);
    context.fillStyle = "#8fd267";
    context.fillRect(-18, -32, 36 * (this.health / this.maxHealth), 2);
    context.restore();
  }
}
