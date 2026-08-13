export class GolfBallProjectile {
  constructor({ x, y, velocityX, velocityY, damage = 8, lifetime = 2.2, radius = 7, maxDistance = null }) {
    this.x = x; this.y = y; this.velocityX = velocityX; this.velocityY = velocityY;
    this.originX = x; this.originY = y; this.distanceTraveled = 0; this.maxDistance = maxDistance;
    this.damage = damage; this.lifetime = lifetime; this.radius = radius; this.active = true; this.spawnsWeed = false;
  }
  update(deltaTime, world) {
    if (!this.active) return;
    const velocity = Math.hypot(this.velocityX, this.velocityY) || 1;
    const stepDistance = velocity * deltaTime;
    if (this.maxDistance !== null && this.distanceTraveled + stepDistance >= this.maxDistance) {
      const remaining = Math.max(0, this.maxDistance - this.distanceTraveled);
      this.x += this.velocityX / velocity * remaining;
      this.y += this.velocityY / velocity * remaining;
      this.distanceTraveled = this.maxDistance;
      this.active = false;
      return;
    }
    this.x += this.velocityX * deltaTime; this.y += this.velocityY * deltaTime;
    this.distanceTraveled += stepDistance; this.lifetime -= deltaTime;
    if (this.lifetime <= 0 || this.x < 8 || this.y < 8 || this.x > world.width - 8 || this.y > world.height - 8) this.active = false;
  }
  hitPlayer() { this.active = false; }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.fillStyle = "#3b2a19"; context.fillRect(x - 7, y - 7, 14, 14);
    context.fillStyle = "#e3b84b"; context.fillRect(x - 5, y - 5, 10, 10);
    context.fillStyle = "#fff0a2"; context.fillRect(x - 3, y - 4, 4, 4);
  }
}
