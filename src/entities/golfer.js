export class Golfer {
  constructor({ x, y }) {
    this.x = x; this.y = y; this.radius = 18;
    this.maxHealth = 300; this.health = 300; this.damage = 8;
    this.speed = 260; this.chargeSpeed = 320; this.coinValue = 3; this.xpValue = 30;
    this.enemyType = "golfer"; this.hitFlash = 0; this.slowTime = 0;
    this.stopDistance = 300; this.repositionDistance = this.stopDistance + 35;
    this.positionTolerance = 10; this.waitTime = 0; this.aimTime = 0; this.aimTarget = null;
    this.aimAngle = 0; this.needsReposition = false;
  }

  get active() { return this.health > 0; }

  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return {};
    const slow = this.slowTime > 0 ? 0.5 : 1;
    const dx = target.x - this.x; const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    if (this.aimTime > 0) {
      this.aimTime -= deltaTime;
      if (this.aimTime <= 0) {
        const event = {
          x: this.x, y: this.y, targetX: this.aimTarget.x, targetY: this.aimTarget.y,
          speed: 900, damage: 8, range: 500,
        };
        this.aimTarget = null;
        this.needsReposition = true;
        return { fireGolfBall: event };
      }
      return {};
    }
    if (this.waitTime > 0) {
      this.waitTime -= deltaTime;
      const targetAngle = Math.atan2(dy, dx);
      this.aimAngle = targetAngle + Math.sin((2 - this.waitTime) * 5) * 0.28;
      if (this.waitTime <= 0) {
        this.aimTarget = { x: target.x, y: target.y };
        this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
        this.aimTime = 1;
      }
      return {};
    }
    if (distance < this.stopDistance * 0.65 && (target.isMoving ?? true)) {
      this.x += dx / distance * this.chargeSpeed * slow * deltaTime;
      this.y += dy / distance * this.chargeSpeed * slow * deltaTime;
      return {};
    }
    const desiredDistance = this.needsReposition ? this.repositionDistance : this.stopDistance;
    if (distance > desiredDistance + this.positionTolerance) {
      this.x += dx / distance * this.speed * slow * deltaTime;
      this.y += dy / distance * this.speed * slow * deltaTime;
      return {};
    }
    if (distance < desiredDistance - this.positionTolerance) {
      this.x -= dx / distance * this.speed * slow * deltaTime;
      this.y -= dy / distance * this.speed * slow * deltaTime;
      return {};
    }
    this.needsReposition = false;
    this.waitTime = 2;
    this.aimAngle = Math.atan2(dy, dx);
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
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.save();
    if (this.aimTime > 0 || this.waitTime > 0) {
      context.strokeStyle = "rgba(255, 238, 151, 0.75)";
      context.lineWidth = 2; context.setLineDash([8, 7]);
      context.beginPath(); context.moveTo(x, y); context.lineTo(x + Math.cos(this.aimAngle) * 340, y + Math.sin(this.aimAngle) * 340); context.stroke(); context.setLineDash([]);
    }
    context.translate(x, y);
    context.fillStyle = "#24221e"; context.fillRect(-13, -8, 26, 28);
    context.fillStyle = this.hitFlash > 0 ? "#fff5cd" : "#d9b269"; context.fillRect(-11, -28, 22, 21);
    context.fillStyle = "#314b35"; context.fillRect(-15, -34, 30, 7);
    context.fillStyle = "#1c201b"; context.fillRect(-7, -21, 4, 4); context.fillRect(5, -21, 4, 4);
    context.fillStyle = "#5b3e28"; context.fillRect(-11, 19, 9, 13); context.fillRect(3, 19, 9, 13);
    context.fillStyle = "#af7d3f"; context.fillRect(15, -5, 4, 34); context.fillRect(13, 25, 8, 5);
    context.fillStyle = "#211c18"; context.fillRect(-14, -39, 28, 5);
    context.fillStyle = "#bff35d"; context.fillRect(-12, -37, 24 * (this.health / this.maxHealth), 2);
    context.restore();
  }
}
