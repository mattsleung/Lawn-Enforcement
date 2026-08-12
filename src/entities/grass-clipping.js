export class GrassClipping {
  constructor({ x, y, velocityX, velocityY, damage = 16, lifetime = 1.4 }) { this.x=x; this.y=y; this.velocityX=velocityX; this.velocityY=velocityY; this.damage=damage; this.lifetime=lifetime; this.radius=8; this.active=true; this.spawnsWeed=false; }
  update(deltaTime, world) { this.x += this.velocityX * deltaTime; this.y += this.velocityY * deltaTime; this.lifetime -= deltaTime; if (this.lifetime <= 0 || this.x < 0 || this.y < 0 || this.x > world.width || this.y > world.height) this.active = false; }
  hitPlayer() { this.active = false; }
  render(context, camera) { if (!this.active) return; const x=Math.round(this.x-camera.x), y=Math.round(this.y-camera.y); context.fillStyle="#b9c45d"; context.fillRect(x-8,y-3,16,6); context.fillStyle="#71813c"; context.fillRect(x-3,y-7,6,14); }
}
