export class PeTeacherBoss {
  constructor({ x, y, config, world }) {
    this.x = x; this.y = y; this.radius = 42; this.world = world; this.config = config; this.name = config.name;
    this.maxHealth = config.health; this.health = config.health; this.speed = config.speed; this.damage = config.damage ?? 20;
    this.dodgeballCooldown = config.dodgeballCooldown; this.whistleCooldown = config.whistleCooldown; this.lapCooldown = config.lapCooldown;
    this.dodgeballTimer = this.dodgeballCooldown; this.whistleTimer = this.whistleCooldown; this.lapTimer = this.lapCooldown;
    this.whistleTime = 0; this.lapTime = 0; this.lapAngle = 0; this.lapExitDistance = config.lapExitDistance ?? 220;
    this.hitFlash = 0; this.slowTime = 0; this.isBoss = true; this.enemyType = "pe-teacher";
  }
  get active() { return this.health > 0; }
  update(deltaTime, target) {
    const events = { throwDodgeball: null, whistle: false };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime); this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return events;
    this.dodgeballTimer -= deltaTime; this.whistleTimer -= deltaTime; this.lapTimer -= deltaTime;
    const distanceToTarget = Math.hypot(target.x - this.x, target.y - this.y);
    if (this.lapTime > 0 && distanceToTarget <= this.lapExitDistance) {
      // The lap is an approach pattern, not a bypass: once the teacher gets
      // close to the player, leave the perimeter immediately and pursue them.
      this.lapTime = 0;
      this.lapTimer = this.lapCooldown;
    }
    if (this.lapTime > 0) {
      this.lapTime -= deltaTime; this.lapAngle += Math.PI * 2 / 2.3 * deltaTime;
      const inset = 100; const width = this.world.width - inset * 2; const height = this.world.height - inset * 2;
      const perimeter = 2 * (width + height); const distance = (this.lapAngle % (Math.PI * 2)) / (Math.PI * 2) * perimeter;
      if (distance < width) { this.x = inset + distance; this.y = inset; }
      else if (distance < width + height) { this.x = this.world.width - inset; this.y = inset + distance - width; }
      else if (distance < width * 2 + height) { this.x = this.world.width - inset - (distance - width - height); this.y = this.world.height - inset; }
      else { this.x = inset; this.y = this.world.height - inset - (distance - width * 2 - height); }
    } else {
      this.moveToward(target, this.speed * (this.slowTime > 0 ? 0.5 : 1), deltaTime);
      if (this.lapTimer <= 0) { this.lapTime = 2.3; this.lapTimer = this.lapCooldown; }
    }
    if (this.dodgeballTimer <= 0) {
      events.throwDodgeball = {
        x: this.x,
        y: this.y,
        targetX: target.x,
        targetY: target.y,
        speed: this.config.dodgeballSpeed,
        damage: this.config.dodgeballDamage,
        knockback: this.config.dodgeballKnockback,
      };
      this.dodgeballTimer = this.dodgeballCooldown;
    }
    if (this.whistleTimer <= 0 && this.whistleTime <= 0) { events.whistle = true; this.whistleTime = 0.55; this.whistleTimer = this.whistleCooldown; }
    if (this.whistleTime > 0) this.whistleTime -= deltaTime;
    return events;
  }
  moveToward(target, speed, deltaTime) { const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1; this.x += dx / distance * speed * deltaTime; this.y += dy / distance * speed * deltaTime; }
  takeDamage(amount) { if (!this.active) return false; this.health = Math.max(0, this.health - Math.max(0, Number(amount) || 0)); this.hitFlash = 0.12; return this.health === 0; }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.save(); context.translate(x, y);
    context.fillStyle = "#2e5a96"; context.fillRect(-30, -35, 60, 56); context.fillStyle = "#efc395"; context.fillRect(-22, -58, 44, 28);
    context.fillStyle = "#242321"; context.fillRect(-13, -47, 6, 6); context.fillRect(7, -47, 6, 6); context.fillStyle = "#e9d7a1"; context.fillRect(26, -15, 20, 28);
    if (this.whistleTime > 0) { context.strokeStyle = "#fff0a4"; context.lineWidth = 4; context.beginPath(); context.arc(0, 0, 60 + (0.55 - this.whistleTime) * 260, 0, Math.PI * 2); context.stroke(); }
    context.restore();
    context.fillStyle = "#211c18"; context.fillRect(x - 42, y - 76, 84, 5); context.fillStyle = "#e25a45"; context.fillRect(x - 42, y - 76, 84 * Math.max(0, this.health / this.maxHealth), 5);
  }
}

export class PETeacherBoss extends PeTeacherBoss {}
