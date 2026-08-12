export class SporeProjectile {
  constructor({ x, y, velocityX, velocityY, damage = 20, lifetime = 1.6 }) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.damage = damage;
    this.lifetime = lifetime;
    this.radius = 12;
    this.active = true;
    this.spawnedWeed = false;
  }

  update(deltaTime, world) {
    if (!this.active) return;
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0 || this.x <= 12 || this.y <= 12 || this.x >= world.width - 12 || this.y >= world.height - 12) {
      this.active = false;
    }
  }

  hitPlayer() { this.active = false; }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.fillStyle = "#f4efc2";
    context.fillRect(x - 4, y - 4, 8, 8);
    context.fillStyle = "rgba(240, 239, 204, 0.65)";
    context.fillRect(x - 12, y - 2, 7, 4);
    context.fillRect(x + 5, y - 2, 7, 4);
    context.fillRect(x - 2, y - 12, 4, 7);
    context.fillRect(x - 2, y + 5, 4, 7);
  }
}
