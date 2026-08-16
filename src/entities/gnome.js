export class Gnome {
  constructor({ x, y, health, speed, damage, coinValue, xpValue, bossMinion = false }) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.maxHealth = health;
    this.health = health;
    this.speed = speed;
    this.damage = damage;
    this.coinValue = coinValue;
    this.xpValue = xpValue;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.enemyType = "gnome";
    this.bossMinion = bossMinion;
  }

  get active() {
    return this.health > 0;
  }

  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) {
      return;
    }

    const offsetX = target.x - this.x;
    const offsetY = target.y - this.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    const slowMultiplier = this.slowTime > 0 ? 0.5 : 1;
    this.x += offsetX / distance * this.speed * slowMultiplier * deltaTime;
    this.y += offsetY / distance * this.speed * slowMultiplier * deltaTime;
  }

  takeDamage(amount) {
    if (!this.active) {
      return false;
    }

    this.health = Math.max(0, this.health - amount);
    this.hitFlash = 0.1;
    return this.health === 0;
  }

  render(context, camera) {
    if (!this.active) {
      return;
    }

    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    const flash = this.hitFlash > 0;
    context.save();
    context.translate(x, y);

    context.fillStyle = "#2b211b";
    context.fillRect(-14, -25, 28, 38);
    context.fillStyle = flash ? "#fff2cf" : "#b23832";
    context.fillRect(-11, -24, 22, 7);
    context.fillRect(-8, -30, 16, 7);
    context.fillRect(-4, -35, 8, 6);
    context.fillStyle = flash ? "#ffffff" : "#d8a074";
    context.fillRect(-9, -17, 18, 14);
    context.fillStyle = "#29231f";
    context.fillRect(-5, -13, 3, 3);
    context.fillRect(3, -13, 3, 3);
    context.fillStyle = flash ? "#ffffff" : "#bd7d58";
    context.fillRect(-2, -10, 5, 5);
    context.fillStyle = "#e7ddbd";
    context.fillRect(-8, -4, 16, 13);
    context.fillStyle = "#c9bea0";
    context.fillRect(-6, 0, 12, 3);
    context.fillRect(-5, 7, 10, 7);
    context.fillStyle = "#714a31";
    context.fillRect(-11, 7, 22, 4);
    context.fillStyle = "#405a74";
    context.fillRect(-10, 9, 8, 8);
    context.fillRect(2, 9, 8, 8);
    context.fillStyle = "#241d19";
    context.fillRect(-12, 15, 10, 4);
    context.fillRect(2, 15, 10, 4);

    context.fillStyle = "#211c18";
    context.fillRect(-15, -43, 30, 5);
    context.fillStyle = "#852d29";
    context.fillRect(-13, -41, 26 * (this.health / this.maxHealth), 2);
    context.restore();
  }
}
