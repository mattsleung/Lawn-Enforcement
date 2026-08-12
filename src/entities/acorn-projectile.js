export class AcornProjectile {
  constructor({ x, y, velocityX, velocityY, damage = 12, lifetime = 2 }) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.damage = damage;
    this.lifetime = lifetime;
    this.radius = 9;
    this.active = true;
    this.spawnsWeed = false;
  }

  update(deltaTime, world) {
    if (!this.active) return;
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.lifetime -= deltaTime;
    if (this.lifetime <= 0 || this.x < 10 || this.y < 10 || this.x > world.width - 10 || this.y > world.height - 10) this.active = false;
  }

  hitPlayer() { this.active = false; }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.fillStyle = "#39281e";
    context.fillRect(x - 7, y - 5, 14, 10);
    context.fillStyle = "#9a6032";
    context.fillRect(x - 5, y - 3, 10, 8);
    context.fillStyle = "#d0a064";
    context.fillRect(x - 3, y - 2, 5, 3);
  }
}
