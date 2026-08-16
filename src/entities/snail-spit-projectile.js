export class SnailSpitProjectile {
  constructor({ x, y, velocityX, velocityY, damage = 35, lifetime = 4, splashRadius = 42 }) {
    this.x = x; this.y = y; this.velocityX = velocityX; this.velocityY = velocityY; this.damage = damage;
    this.lifetime = lifetime; this.radius = 10; this.splashRadius = splashRadius; this.bouncesRemaining = 1; this.active = true; this.bounced = false; this.impacted = false;
  }
  update(deltaTime, world) {
    if (!this.active) return;
    this.x += this.velocityX * deltaTime; this.y += this.velocityY * deltaTime; this.lifetime -= deltaTime;
    if (this.lifetime <= 0 || this.x < 10 || this.y < 10 || this.x > world.width - 10 || this.y > world.height - 10) { this.active = false; this.impacted = true; }
  }
  hitPlayer() { this.active = false; }
  bounceToward(target) { const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1; const speed = Math.hypot(this.velocityX, this.velocityY); this.velocityX = dx / distance * speed; this.velocityY = dy / distance * speed; this.bouncesRemaining -= 1; this.bounced = true; }
  render(context, camera) { if (!this.active) return; const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y); context.fillStyle = "#85b886"; context.fillRect(x - 9, y - 7, 18, 14); context.fillStyle = "#c8f0ae"; context.fillRect(x - 4, y - 5, 8, 4); }
}
