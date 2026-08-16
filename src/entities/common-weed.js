export class CommonWeed {
  constructor({ x, y, lifetime = 4, copyInterval = 0.4, bossMode = false }) {
    this.x = x;
    this.y = y;
    // Strongweeds use the same collision footprint as Common Weeds. Their
    // tougher identity is communicated through color and health, not size.
    this.radius = 15;
    this.bossMode = bossMode;
    this.maxHealth = bossMode ? 150 : 10;
    this.health = this.maxHealth;
    this.damage = 4;
    this.coinValue = 1;
    this.coinDropChance = 0.5;
    this.xpValue = 10;
    this.xpDropChance = 0.5;
    this.lifetime = bossMode ? Number.POSITIVE_INFINITY : lifetime;
    this.copyInterval = bossMode ? Number.POSITIVE_INFINITY : copyInterval;
    this.copyTimer = this.copyInterval;
    this.hasCloned = false;
    this.hasLateCloned = false;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.freezeTime = 0;
    this.shuffleTimer = 0;
    this.shuffleVelocityX = 0;
    this.shuffleVelocityY = 0;
    this.enemyType = bossMode ? "strongweed" : "common-weed";
  }

  get active() { return this.health > 0 && (this.bossMode || this.lifetime > 0); }

  enterBossMode() {
    this.bossMode = true;
    this.enemyType = "strongweed";
    this.radius = 15;
    this.maxHealth = 150;
    this.health = this.maxHealth;
    this.lifetime = Number.POSITIVE_INFINITY;
    this.copyInterval = Number.POSITIVE_INFINITY;
    this.copyTimer = this.copyInterval;
    this.hasCloned = true;
    this.hasLateCloned = true;
  }

  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return {};
    if (this.bossMode) {
      if (this.freezeTime > 0) return {};
      this.shuffleTimer -= deltaTime;
      if (this.shuffleTimer <= 0) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 14 + Math.random() * 18;
        this.shuffleVelocityX = Math.cos(angle) * speed;
        this.shuffleVelocityY = Math.sin(angle) * speed;
        this.shuffleTimer = 0.2 + Math.random() * 0.35;
      }
      this.x += this.shuffleVelocityX * deltaTime;
      this.y += this.shuffleVelocityY * deltaTime;
      return {};
    }
    if (this.freezeTime > 0) return {};
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0) return {};
    if (!this.hasCloned) {
      this.copyTimer -= deltaTime;
      if (this.copyTimer <= 0) {
        this.hasCloned = true;
        return this.makeCopy(target);
      }
    }
    if (this.hasLateCloned || this.lifetime > this.copyInterval) return {};
    this.hasLateCloned = true;
    return this.makeCopy(target);
  }

  makeCopy(target) {
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

    const stemColor = this.bossMode ? "#b765d8" : "#70c94b";
    const leafColor = this.bossMode ? "#713b9e" : "#3f8e36";
    const highlightColor = this.bossMode ? "#f0a4ff" : "#d7ef62";
    context.fillStyle = this.hitFlash > 0 ? "#fff7c7" : stemColor;
    context.fillRect(-4, -22, 8, 28);
    context.fillRect(-14, -15, 10, 7);
    context.fillRect(4, -12, 13, 7);
    context.fillRect(-10, -5, 8, 7);
    context.fillStyle = this.hitFlash > 0 ? "#fff7c7" : leafColor;
    context.fillRect(-17, 4, 34, 7);
    context.fillRect(-11, 10, 22, 5);
    context.fillStyle = this.hitFlash > 0 ? "#ffffff" : highlightColor;
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
