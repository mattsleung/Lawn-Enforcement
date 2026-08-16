export class ThrownGnome {
  constructor({ x, y, targetX, targetY, speed, enemyType = "gnome", damage = 0 }) {
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = speed;
    this.arrived = false;
    this.rotation = 0;
    this.enemyType = enemyType;
    this.damage = damage;
    this.radius = enemyType === "strongweed" ? 15 : 14;
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
    const targetX = Math.round(this.targetX - camera.x);
    const targetY = Math.round(this.targetY - camera.y);
    context.strokeStyle = "rgba(238, 197, 75, 0.78)";
    context.lineWidth = 2;
    context.strokeRect(targetX - 14, targetY - 14, 28, 28);
    context.fillRect(targetX - 2, targetY - 20, 4, 12);
    context.fillRect(targetX - 2, targetY + 8, 4, 12);
    context.fillRect(targetX - 20, targetY - 2, 12, 4);
    context.fillRect(targetX + 8, targetY - 2, 12, 4);
    context.save();
    context.translate(x, y);
    context.rotate(this.rotation);
    if (this.enemyType === "strongweed") {
      context.fillStyle = "#291b36";
      context.fillRect(-10, -18, 20, 28);
      context.fillStyle = "#b765d8";
      context.fillRect(-5, -16, 10, 22);
      context.fillRect(-14, -10, 9, 7);
      context.fillRect(5, -8, 10, 7);
      context.fillStyle = "#f0a4ff";
      context.fillRect(-9, -11, 4, 3);
      context.fillRect(5, -9, 4, 3);
      context.restore();
      return;
    }
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
