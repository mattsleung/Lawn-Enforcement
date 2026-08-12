export class CommonWeed {
  constructor({ x, y, lifetime = 5, copyInterval = 0.4 }) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.maxHealth = 10;
    this.health = 10;
    this.damage = 4;
    this.coinValue = 1;
    this.xpValue = 10;
    this.xpDropChance = 0.5;
    this.lifetime = lifetime;
    this.copyInterval = copyInterval;
    this.copyTimer = copyInterval;
    this.hasCloned = false;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.freezeTime = 0;
    this.enemyType = "common-weed";
  }

  get active() { return this.health > 0 && this.lifetime > 0; }

  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return {};
    if (this.freezeTime > 0) return {};
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) return {};
    if (this.hasCloned) return {};
    this.copyTimer -= deltaTime;
    if (this.copyTimer > 0) return {};
    this.hasCloned = true;
    const offsetX = target.x - this.x;
    const offsetY = target.y - this.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    return {
      copyWeed: {
        x: this.x + offsetX / distance * 48,
        y: this.y + offsetY / distance * 48,
      },
    };
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.health = Math.max(0, this.health - amount);
    this.hitFlash = 0.1;
    return this.health === 0;
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.save();
    context.translate(x, y);

    // A dark, blocky silhouette keeps the small enemy readable over dirt beds.
    context.fillStyle = "#17351d";
    context.fillRect(-7, -25, 14, 34);
    context.fillRect(-17, -18, 13, 13);
    context.fillRect(4, -15, 16, 13);
    context.fillRect(-13, -8, 11, 13);
    context.fillRect(-20, 2, 40, 12);

    context.fillStyle = this.hitFlash > 0 ? "#fff7c7" : "#70c94b";
    context.fillRect(-4, -22, 8, 28);
    context.fillRect(-14, -15, 10, 7);
    context.fillRect(4, -12, 13, 7);
    context.fillRect(-10, -5, 8, 7);
    context.fillStyle = this.hitFlash > 0 ? "#fff7c7" : "#3f8e36";
    context.fillRect(-17, 4, 34, 7);
    context.fillRect(-11, 10, 22, 5);
    context.fillStyle = this.hitFlash > 0 ? "#ffffff" : "#d7ef62";
    context.fillRect(-14, -15, 5, 3);
    context.fillRect(11, -12, 5, 3);
    context.fillRect(-3, -22, 5, 4);
    context.fillStyle = "#211c18";
    context.fillRect(-17, -33, 34, 7);
    context.fillStyle = "#bff35d";
    context.fillRect(-14, -31, 28 * (this.health / this.maxHealth), 3);
    context.restore();
  }
}
