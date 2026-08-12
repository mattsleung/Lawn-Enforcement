import { Squirrel } from "./squirrel.js";

export class AcornSquirrel extends Squirrel {
  constructor(options) {
    super({ ...options, health: 120, speed: 105, damage: 4 });
    this.enemyType = "acorn-squirrel";
    this.keepDistance = 230;
    this.throwCooldown = 1.5 + Math.random() * 1.5;
    this.repositionTime = 0;
    this.repositionDirection = Math.random() < 0.5 ? -1 : 1;
  }

  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return {};
    this.throwCooldown -= deltaTime;
    this.repositionTime = Math.max(0, this.repositionTime - deltaTime);
    const offsetX = target.x - this.x;
    const offsetY = target.y - this.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    const forwardX = offsetX / distance;
    const forwardY = offsetY / distance;
    const lateralX = -forwardY * this.repositionDirection;
    const lateralY = forwardX * this.repositionDirection;
    const slow = this.slowTime > 0 ? 0.5 : 1;
    if (this.repositionTime > 0 || distance < this.keepDistance - 30) {
      this.x -= forwardX * this.speed * slow * deltaTime;
      this.y -= forwardY * this.speed * slow * deltaTime;
      this.x += lateralX * this.speed * slow * deltaTime;
      this.y += lateralY * this.speed * slow * deltaTime;
    } else if (distance > this.keepDistance + 40) {
      this.x += forwardX * this.speed * slow * deltaTime;
      this.y += forwardY * this.speed * slow * deltaTime;
    }
    if (this.throwCooldown <= 0 && this.repositionTime <= 0 && distance <= 430) {
      this.throwCooldown = 2.5 + Math.random() * 1.5;
      this.repositionTime = 0.9;
      this.repositionDirection *= -1;
      return { throwAcorn: { x: target.x, y: target.y, speed: 360 } };
    }
    return {};
  }

  render(context, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    if (!this.active) return;
    context.save(); context.translate(x, y);
    context.fillStyle = "#332a3f"; context.fillRect(-15, -12, 30, 24);
    context.fillStyle = this.hitFlash > 0 ? "#fff1c8" : "#7e5da8"; context.fillRect(-12, -16, 24, 19); context.fillRect(-8, -23, 16, 10);
    context.fillStyle = "#d0a76b"; context.fillRect(-8, -12, 16, 11);
    context.fillStyle = "#211b18"; context.fillRect(-5, -9, 3, 3); context.fillRect(3, -9, 3, 3); context.fillRect(6, -2, 6, 3);
    context.fillStyle = "#4f3c69"; context.fillRect(-19, 7, 15, 8); context.fillRect(4, 7, 15, 8);
    context.fillStyle = "#6b452b"; context.fillRect(-4, -31, 8, 8); context.fillStyle = "#3a2a20"; context.fillRect(-7, -34, 14, 4);
    context.fillStyle = "#bff35d"; context.fillRect(-13, -29, 26 * (this.health / this.maxHealth), 2);
    context.restore();
  }
}
