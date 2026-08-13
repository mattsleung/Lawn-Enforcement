export class ProGolferBoss {
  constructor({ x, y, config, world }) {
    this.x = x; this.y = y; this.radius = 28; this.world = world;
    this.name = config.name; this.maxHealth = config.health; this.health = config.health;
    this.damage = config.damage ?? 30; this.speed = config.speed ?? 300;
    this.attackCooldown = config.attackCooldown ?? 3; this.attackPauseDuration = config.attackPauseDuration ?? 0.55;
    this.regularDamage = config.regularDamage ?? 30; this.fanDamage = config.fanDamage ?? 20;
    this.ballSpeed = config.ballSpeed ?? 700; this.fanBallSpeed = config.fanBallSpeed ?? 420;
    this.bombDamage = config.bombDamage ?? 50; this.bombWarningDuration = config.bombWarningDuration ?? 0.8;
    this.attackTimer = this.attackCooldown; this.attackPause = 0; this.pendingAttack = null; this.attackIndex = 0;
    this.hitFlash = 0; this.slowTime = 0; this.isBoss = true; this.enemyType = "pro-golfer";
    const insetX = this.world.width * 0.2;
    const insetY = this.world.height * 0.2;
    const min = this.radius + insetY;
    const minX = this.radius + insetX;
    const maxX = this.world.width - this.radius - insetX;
    const maxY = this.world.height - this.radius - insetY;
    this.patrolWaypoints = [
      { x: minX, y: min },
      { x: maxX, y: min },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
    this.patrolWaypointIndex = 0;
  }

  get active() { return this.health > 0; }

  update(deltaTime, target) {
    const events = { attack: null };
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    if (!this.active) return events;
    if (this.attackPause > 0) {
      this.attackPause -= deltaTime;
      if (this.attackPause <= 0 && this.pendingAttack !== null) {
        const type = this.pendingAttack;
        this.pendingAttack = null;
        events.attack = this.makeAttack(type, target);
      }
      return events;
    }
    this.attackTimer -= deltaTime;
    if (this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      this.pendingAttack = this.attackIndex % 3;
      this.attackIndex += 1;
      this.attackPause = this.attackPauseDuration;
      return events;
    }
    const slow = this.slowTime > 0 ? 0.5 : 1;
    this.moveAroundMap(deltaTime, slow);
    return events;
  }

  moveAroundMap(deltaTime, speedMultiplier) {
    let remaining = this.speed * speedMultiplier * deltaTime;
    while (remaining > 0) {
      const waypoint = this.patrolWaypoints[this.patrolWaypointIndex];
      const offsetX = waypoint.x - this.x;
      const offsetY = waypoint.y - this.y;
      const distance = Math.hypot(offsetX, offsetY);
      if (distance <= remaining || distance === 0) {
        this.x = waypoint.x;
        this.y = waypoint.y;
        remaining -= distance;
        this.patrolWaypointIndex = (this.patrolWaypointIndex + 1) % this.patrolWaypoints.length;
        continue;
      }
      this.x += offsetX / distance * remaining;
      this.y += offsetY / distance * remaining;
      break;
    }
  }

  makeAttack(type, target) {
    if (type === 1) return { type: "fan", targetX: target.x, targetY: target.y, speed: this.fanBallSpeed, damage: this.fanDamage };
    if (type === 2) return { type: "bomb", targetX: target.x, targetY: target.y, warningDuration: this.bombWarningDuration, damage: this.bombDamage };
    return { type: "regular", targetX: target.x, targetY: target.y, speed: this.ballSpeed, damage: this.regularDamage };
  }

  takeDamage(amount) {
    if (!this.active) return false;
    this.health = Math.max(0, this.health - Math.max(0, amount));
    this.hitFlash = 0.12;
    return this.health === 0;
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.save(); context.translate(x, y);
    context.fillStyle = "#24221e"; context.fillRect(-20, -13, 40, 38);
    context.fillStyle = this.hitFlash > 0 ? "#fff5cd" : "#e0b96d"; context.fillRect(-17, -38, 34, 27);
    context.fillStyle = "#214d38"; context.fillRect(-22, -45, 44, 8);
    context.fillStyle = "#1c201b"; context.fillRect(-10, -30, 5, 5); context.fillRect(6, -30, 5, 5);
    context.fillStyle = "#5b3e28"; context.fillRect(-15, 24, 12, 16); context.fillRect(3, 24, 12, 16);
    context.fillStyle = "#b58b4e"; context.fillRect(19, -8, 5, 42); context.fillRect(16, 31, 11, 6);
    context.fillStyle = "#211c18"; context.fillRect(-23, -51, 46, 6);
    context.fillStyle = "#bff35d"; context.fillRect(-20, -49, 40 * (this.health / this.maxHealth), 3);
    context.restore();
  }
}
