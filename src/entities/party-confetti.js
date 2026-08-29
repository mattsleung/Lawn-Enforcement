export class PartyConfetti {
  constructor({ x, y, velocityX, velocityY, damage, knockback, color }) { Object.assign(this, { x, y, velocityX, velocityY, damage, knockback, color }); this.radius = 7; this.lifetime = 3; this.active = true; this.blockable = false; }
  update(deltaTime, world) { if (!this.active) return; this.x += this.velocityX * deltaTime; this.y += this.velocityY * deltaTime; this.lifetime -= deltaTime; if (this.lifetime <= 0 || this.x < -20 || this.y < -20 || this.x > world.width + 20 || this.y > world.height + 20) this.active = false; }
  hitPlayer() { this.active = false; }
  render(context, camera) { if (!this.active) return; const x = this.x - camera.x, y = this.y - camera.y; context.save(); context.translate(x, y); context.rotate(Math.atan2(this.velocityY, this.velocityX)); context.fillStyle = this.color; context.fillRect(-8, -3, 16, 6); context.restore(); }
}
