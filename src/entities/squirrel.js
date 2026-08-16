export class Squirrel {
  constructor({ x, y, health = 80, speed = 170, damage = 4, coinValue = 2, xpValue = 20, random = Math.random }) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.maxHealth = health;
    this.health = health;
    this.speed = speed;
    this.damage = damage;
    this.coinValue = coinValue;
    this.xpValue = xpValue;
    this.hitFlash = 0;
    this.slowTime = 0;
    this.burstTimer = 0.7 + random() * 0.8;
    this.burstTime = 0;
    this.sideJumpTimer = 1.3 + random() * 2;
    this.sideJumpTime = 0;
    this.sideDirection = random() < 0.5 ? -1 : 1;
    this.enemyType = "squirrel";
  }

  get active() { return this.health > 0; }

  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return;
    this.burstTimer -= deltaTime;
    this.sideJumpTimer -= deltaTime;
    if (this.burstTimer <= 0) {
      this.burstTime = 0.28;
      this.burstTimer = 0.9 + Math.random() * 1.2;
    }
    if (this.sideJumpTimer <= 0) {
      this.sideJumpTime = 0.22;
      this.sideDirection *= -1;
      this.sideJumpTimer = 1.4 + Math.random() * 2.5;
    }
    this.burstTime = Math.max(0, this.burstTime - deltaTime);
    this.sideJumpTime = Math.max(0, this.sideJumpTime - deltaTime);
    const offsetX = target.x - this.x;
    const offsetY = target.y - this.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    const forwardX = offsetX / distance;
    const forwardY = offsetY / distance;
    const lateralX = -forwardY * this.sideDirection;
    const lateralY = forwardX * this.sideDirection;
    const burst = this.burstTime > 0 ? 2.1 : 1;
    const jump = this.sideJumpTime > 0 ? 2.2 : 0;
    const slow = this.slowTime > 0 ? 0.5 : 1;
    this.x += (forwardX * burst + lateralX * jump) * this.speed * slow * deltaTime;
    this.y += (forwardY * burst + lateralY * jump) * this.speed * slow * deltaTime;
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
    context.fillStyle = "#35251d";
    context.fillRect(-25, -14, 11, 27);
    context.fillRect(-31, -8, 10, 18);
    context.fillStyle = "#7d4d2d";
    context.fillRect(-28, -11, 8, 17);
    context.fillStyle = "#35251d";
    context.fillRect(-15, -12, 30, 24);
    context.fillStyle = this.hitFlash > 0 ? "#fff1c8" : "#9b673c";
    context.fillRect(-12, -16, 24, 19);
    context.fillRect(-8, -23, 16, 10);
    context.fillStyle = "#c48b56";
    context.fillRect(-8, -12, 16, 11);
    context.fillRect(-9, -27, 7, 7);
    context.fillRect(2, -27, 7, 7);
    context.fillStyle = "#211b18";
    context.fillRect(-5, -9, 3, 3);
    context.fillRect(3, -9, 3, 3);
    context.fillRect(6, -2, 6, 3);
    context.fillStyle = "#ead0a2";
    context.fillRect(-3, -3, 6, 3);
    context.fillStyle = "#543522";
    context.fillRect(-17, 9, 12, 8);
    context.fillRect(5, 9, 12, 8);
    context.fillStyle = "#211c18";
    context.fillRect(-15, -31, 30, 5);
    context.fillStyle = "#bff35d";
    context.fillRect(-13, -29, 26 * (this.health / this.maxHealth), 2);
    context.restore();
  }
}
