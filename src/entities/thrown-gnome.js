export class ThrownGnome {
  constructor({ x, y, targetX, targetY, speed, enemyType = "gnome" }) {
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = speed;
    this.arrived = false;
    this.rotation = 0;
    this.enemyType = enemyType;
  }

  update(deltaTime) {
    const offsetX = this.targetX - this.x;
    const offsetY = this.targetY - this.y;
    const distance = Math.hypot(offsetX, offsetY);
    const travel = this.speed * deltaTime;
    if (distance <= travel || distance === 0) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.arrived = true;
      return;
    }
    this.x += offsetX / distance * travel;
    this.y += offsetY / distance * travel;
    this.rotation += deltaTime * 10;
  }

  render(context, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.save();
    context.translate(x, y);
    context.rotate(this.rotation);
    if (this.enemyType === "gopher") {
      context.fillStyle = "#3a2d21";
      context.fillRect(-11, -10, 22, 22);
      context.fillStyle = "#765037";
      context.fillRect(-8, -13, 16, 19);
      context.fillStyle = "#d5b083";
      context.fillRect(-6, -5, 12, 8);
      context.fillStyle = "#241d18";
      context.fillRect(-5, -4, 3, 3);
      context.fillRect(3, -4, 3, 3);
      context.restore();
      return;
    }
    context.fillStyle = "#b23832";
    context.fillRect(-8, -14, 16, 8);
    context.fillStyle = "#d8a074";
    context.fillRect(-7, -6, 14, 12);
    context.fillStyle = "#e7ddbd";
    context.fillRect(-8, 6, 16, 10);
    context.restore();
  }
}
