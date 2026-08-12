export class Gopher {
  constructor({ x, y, health = 250, speed = 58, damage = 8, coinValue = 4, xpValue = 30, random = Math.random, bossMinion = false }) {
    this.x = x;
    this.y = y;
    this.radius = 17;
    this.maxHealth = health;
    this.health = health;
    this.speed = speed;
    this.damage = damage;
    this.coinValue = coinValue;
    this.xpValue = xpValue;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.weaveTime = Math.random() * Math.PI * 2;
    this.enemyType = "gopher";
    this.bossMinion = bossMinion;
    this.burrowed = true;
    this.burrowTime = 2;
    this.nextBurrowTime = 8 + random() * 6;
    this.holeTrail = [];
    this.holeTrailTimer = 0;
  }

  get active() { return this.health > 0; }
  get targetable() { return this.active && !this.burrowed; }

  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    this.weaveTime += deltaTime * 4;
    for (const hole of this.holeTrail) hole.lifetime -= deltaTime;
    this.holeTrail = this.holeTrail.filter((hole) => hole.lifetime > 0);
    if (!this.active) return;
    if (this.burrowed) {
      const undergroundX = target.x - this.x;
      const undergroundY = target.y - this.y;
      const undergroundDistance = Math.hypot(undergroundX, undergroundY) || 1;
      this.x += undergroundX / undergroundDistance * this.speed * 2 * deltaTime;
      this.y += undergroundY / undergroundDistance * this.speed * 2 * deltaTime;
      this.holeTrailTimer -= deltaTime;
      if (this.holeTrailTimer <= 0) {
        this.holeTrail.push({ x: this.x, y: this.y, lifetime: 1 });
        this.holeTrailTimer = 0.14;
      }
      this.burrowTime -= deltaTime;
      if (this.burrowTime <= 0) {
        this.burrowed = false;
        this.health = this.maxHealth;
      }
      return;
    }
    this.nextBurrowTime -= deltaTime;
    if (this.nextBurrowTime <= 0) {
      this.burrowed = true;
      this.burrowTime = 2;
      this.holeTrailTimer = 0;
      this.nextBurrowTime = 8 + Math.random() * 6;
      return;
    }
    const offsetX = target.x - this.x;
    const offsetY = target.y - this.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    const forwardX = offsetX / distance;
    const forwardY = offsetY / distance;
    const weave = Math.sin(this.weaveTime) * 0.42;
    const slow = this.slowTime > 0 ? 0.5 : 1;
    this.x += (forwardX - forwardY * weave) * this.speed * slow * deltaTime;
    this.y += (forwardY + forwardX * weave) * this.speed * slow * deltaTime;
  }

  takeDamage(amount) {
    if (!this.targetable) return false;
    this.health = Math.max(0, this.health - amount);
    this.hitFlash = 0.1;
    return this.health === 0;
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    for (const hole of this.holeTrail) {
      const holeX = Math.round(hole.x - camera.x);
      const holeY = Math.round(hole.y - camera.y);
      context.globalAlpha = Math.min(1, hole.lifetime);
      context.fillStyle = "#3a2d21";
      context.fillRect(holeX - 13, holeY + 9, 26, 6);
      context.fillStyle = "#211b16";
      context.fillRect(holeX - 9, holeY + 10, 18, 3);
    }
    context.globalAlpha = 1;
    context.save();
    context.translate(x, y);
    context.fillStyle = "#3a2d21";
    context.fillRect(-18, 8, 36, 9);
    context.fillStyle = "#211b16";
    context.fillRect(-13, 10, 26, 5);
    if (this.burrowed) {
      context.fillStyle = "#5b402b";
      context.fillRect(-23, 4, 10, 5);
      context.fillRect(13, 5, 12, 5);
      context.fillRect(-8, 17, 16, 4);
      context.restore();
      return;
    }
    context.fillStyle = this.hitFlash > 0 ? "#fff2cf" : "#765037";
    context.fillRect(-13, -15, 26, 26);
    context.fillRect(-9, -21, 18, 9);
    context.fillStyle = "#d5b083";
    context.fillRect(-9, -9, 18, 13);
    context.fillStyle = "#241d18";
    context.fillRect(-6, -6, 3, 3);
    context.fillRect(4, -6, 3, 3);
    context.fillStyle = "#211c18";
    context.fillRect(-15, -30, 30, 5);
    context.fillStyle = "#8f4533";
    context.fillRect(-13, -28, 26 * (this.health / this.maxHealth), 2);
    context.restore();
  }
}
