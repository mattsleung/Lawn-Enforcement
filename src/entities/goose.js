export class Goose {
  constructor({ x, y, health = 40, speed = 250, damage = 8, coinValue = 1, xpValue = 10 }) {
    this.x = x; this.y = y; this.radius = 16; this.maxHealth = health; this.health = health;
    this.speed = speed; this.damage = damage; this.coinValue = coinValue; this.xpValue = xpValue;
    this.enemyType = "goose"; this.hitFlash = 0; this.slowTime = 0; this.chargeTime = 0; this.chargeCooldown = 1.2;
  }
  get active() { return this.health > 0; }
  update(deltaTime, target) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime); this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return;
    this.chargeCooldown -= deltaTime;
    if (this.chargeCooldown <= 0) { this.chargeTime = 0.35; this.chargeCooldown = 2.2; }
    const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
    const multiplier = this.chargeTime > 0 ? 2.2 : 1; const slow = this.slowTime > 0 ? 0.5 : 1;
    this.x += dx / distance * this.speed * multiplier * slow * deltaTime; this.y += dy / distance * this.speed * multiplier * slow * deltaTime;
  }
  takeDamage(amount) { if (!this.active) return false; this.health = Math.max(0, this.health - amount); this.hitFlash = 0.1; return this.health === 0; }
  render(context, camera) { if (!this.active) return; const x=Math.round(this.x-camera.x), y=Math.round(this.y-camera.y); context.save(); context.translate(x,y); context.fillStyle="#25221d"; context.fillRect(-16,-4,32,20); context.fillStyle=this.hitFlash>0?"#fff4d0":"#e7e1c6"; context.fillRect(-13,-17,26,20); context.fillStyle="#d0c6a8"; context.fillRect(-8,-25,16,10); context.fillStyle="#211d18"; context.fillRect(-6,-16,4,4); context.fillRect(4,-16,4,4); context.fillStyle="#d69a3b"; context.fillRect(9,-10,11,5); context.fillRect(-11,14,8,7); context.fillRect(5,14,8,7); context.fillStyle="#bff35d"; context.fillRect(-13,-29,26*(this.health/this.maxHealth),2); context.restore(); }
}
