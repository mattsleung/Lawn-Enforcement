export class SchoolBallProjectile {
  constructor({ x, y, velocityX, velocityY, damage, radius = 10, kind = "soccer-ball", color = "#f3f0df", lifetime = 4, knockback = 0, bounce = false }) {
    this.x = x; this.y = y; this.velocityX = velocityX; this.velocityY = velocityY;
    this.damage = damage; this.radius = radius; this.kind = kind; this.color = color; this.lifetime = lifetime;
    this.initialLifetime = lifetime; this.knockback = knockback; this.active = true; this.bounce = bounce; this.bounced = false; this.rotation = 0;
  }
  update(deltaTime, world, target) {
    if (!this.active) return;
    this.x += this.velocityX * deltaTime; this.y += this.velocityY * deltaTime; this.rotation += deltaTime * 8; this.lifetime -= deltaTime;
    if (this.bounce && !this.bounced && this.lifetime < this.initialLifetime * 0.48 && target) {
      const speed = Math.hypot(this.velocityX, this.velocityY) || 1; const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
      this.velocityX = dx / distance * speed; this.velocityY = dy / distance * speed; this.bounced = true;
    }
    if (this.x < this.radius || this.x > world.width - this.radius) this.velocityX *= -1;
    if (this.y < this.radius || this.y > world.height - this.radius) this.velocityY *= -1;
    this.x = Math.max(this.radius, Math.min(world.width - this.radius, this.x)); this.y = Math.max(this.radius, Math.min(world.height - this.radius, this.y));
    this.active = this.lifetime > 0;
  }
  hitPlayer() { this.active = false; }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.save(); context.translate(x, y); context.rotate(this.rotation);
    context.fillStyle = this.color;
    if (this.kind === "volleyball") { context.fillRect(-16, -16, 32, 32); context.fillStyle = "#4c8f9a"; context.fillRect(-16, -3, 32, 6); }
    else if (this.kind === "tennis-ball") { context.fillRect(-7, -7, 14, 14); context.fillStyle = "#efffc0"; context.fillRect(-7, -1, 14, 3); }
    else if (this.kind === "dodgeball") { context.fillRect(-12, -12, 24, 24); context.fillStyle = "#fff0b0"; context.fillRect(-10, -2, 20, 4); }
    else { context.fillRect(-this.radius, -this.radius, this.radius * 2, this.radius * 2); context.fillStyle = "#d8443e"; context.fillRect(-3, -this.radius, 6, this.radius * 2); context.fillRect(-this.radius, -3, this.radius * 2, 6); }
    context.restore();
  }
}
