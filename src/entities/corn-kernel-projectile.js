export class CornKernelProjectile {
  constructor({ x, y, velocityX, velocityY, damage = 10, lifetime = 2.2 }) {
    Object.assign(this, { x, y, velocityX, velocityY, damage, lifetime });
    this.radius = 7;
    this.active = true;
    this.spawnsWeed = false;
  }

  update(deltaTime, world) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0 || this.x < 8 || this.y < 8 || this.x > world.width - 8 || this.y > world.height - 8) this.active = false;
  }

  hitPlayer() { this.active = false; }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.fillStyle = "#4c3217"; context.fillRect(x - 5, y - 7, 10, 14);
    context.fillStyle = "#f1c743"; context.fillRect(x - 3, y - 6, 6, 11);
    context.fillStyle = "#fff09a"; context.fillRect(x - 2, y - 5, 2, 4);
  }
}
