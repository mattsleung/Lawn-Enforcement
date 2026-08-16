class SchoolFieldEnemy {
  constructor({ x, y, health, speed, damage = 6, radius = 22, coinValue = 3, xpValue = 30, enemyType }) {
    this.x = x; this.y = y; this.radius = radius;
    this.maxHealth = health; this.health = health; this.speed = speed; this.damage = damage;
    this.coinValue = coinValue; this.xpValue = xpValue; this.enemyType = enemyType;
    this.bossMinion = false; this.hitFlash = 0; this.slowTime = 0; this.flying = false;
  }
  get active() { return this.health > 0; }
  takeDamage(amount) {
    if (!this.active) return false;
    this.health = Math.max(0, this.health - Math.max(0, Number(amount) || 0));
    this.hitFlash = 0.1;
    return this.health === 0;
  }
  updateStatus(deltaTime) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
  }
  moveToward(target, speed, deltaTime) {
    const dx = target.x - this.x; const dy = target.y - this.y;
    const distance = Math.hypot(dx, dy) || 1;
    this.x += dx / distance * speed * deltaTime;
    this.y += dy / distance * speed * deltaTime;
  }
  bar(context, x, y) {
    context.fillStyle = "#211c18"; context.fillRect(x - this.radius, y - this.radius - 12, this.radius * 2, 4);
    context.fillStyle = "#e25a45"; context.fillRect(x - this.radius, y - this.radius - 12, this.radius * 2 * Math.max(0, this.health / this.maxHealth), 4);
  }
}

export class RogueSoccerBall extends SchoolFieldEnemy {
  constructor({ x, y, health = 200, speed = 85, damage = 8, coinValue = 4, xpValue = 30 } = {}) {
    super({ x, y, health, speed, damage, radius: 21, coinValue, xpValue, enemyType: "rogue-soccer-ball" });
    this.acceleration = 125; this.maxSpeed = 688; this.deceleration = 260; this.minSpeed = Math.max(30, speed * 0.45);
    this.turnRate = 2.1; this.currentSpeed = speed; this.headingX = 0; this.headingY = 0; this.passedPlayer = false; this.rotation = 0;
  }
  update(deltaTime, target) {
    this.updateStatus(deltaTime);
    if (!this.active) return {};
    const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
    if (!this.passedPlayer) {
      const desiredAngle = Math.atan2(dy, dx);
      const headingLength = Math.hypot(this.headingX, this.headingY);
      if (headingLength < 0.5) {
        this.headingX = Math.cos(desiredAngle); this.headingY = Math.sin(desiredAngle);
      } else {
        const currentAngle = Math.atan2(this.headingY, this.headingX);
        const turnError = Math.atan2(Math.sin(desiredAngle - currentAngle), Math.cos(desiredAngle - currentAngle));
        const maxTurn = this.turnRate * deltaTime;
        const appliedTurn = Math.max(-maxTurn, Math.min(maxTurn, turnError));
        const nextAngle = currentAngle + appliedTurn;
        this.headingX = Math.cos(nextAngle); this.headingY = Math.sin(nextAngle);
        if (Math.abs(turnError) > 0.8) {
          this.currentSpeed = Math.max(this.minSpeed, this.currentSpeed - this.deceleration * deltaTime);
        } else {
          this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.acceleration * deltaTime);
        }
      }
    }
    this.x += this.headingX * this.currentSpeed * deltaTime; this.y += this.headingY * this.currentSpeed * deltaTime; this.rotation += this.currentSpeed * deltaTime / this.radius;
    if (distance < target.radius + this.radius + 8) this.passedPlayer = true;
    if (this.passedPlayer && distance > 260) { this.passedPlayer = false; this.currentSpeed = this.speed; }
    return {};
  }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.save(); context.translate(x, y); context.rotate(this.rotation);
    context.fillStyle = this.hitFlash > 0 ? "#fff5d3" : "#f5f1df"; context.fillRect(-20, -20, 40, 40);
    context.fillStyle = "#242521";
    context.fillRect(-5, -5, 10, 10); context.fillRect(-15, -16, 8, 8); context.fillRect(7, 8, 8, 8);
    context.fillRect(-16, 8, 7, 7); context.fillRect(9, -15, 7, 7);
    context.fillStyle = "#d8443e"; context.fillRect(-20, -3, 7, 6); context.fillRect(13, -3, 7, 6);
    context.restore(); this.bar(context, x, y);
  }
}

export class Sprinter extends SchoolFieldEnemy {
  constructor({ x, y, world = { width: 1280, height: 720 }, health = 200, speed = 180, damage = 8, coinValue = 4, xpValue = 30, random = Math.random } = {}) {
    super({ x, y, health, speed, damage, radius: 18, coinValue, xpValue, enemyType: "sprinter" });
    this.world = world; this.random = random; this.trackInset = 55; this.chaseDistance = 220;
    this.trackSpeedMultiplier = 3; this.chaseSpeedMultiplier = 2;
    this.trackDirection = this.random() < 0.5 ? 1 : -1; this.trackDistance = null; this.chasing = false;
    this.syncTrackDistance();
  }
  get trackBounds() {
    return { left: this.trackInset, right: this.world.width - this.trackInset, top: this.trackInset, bottom: this.world.height - this.trackInset };
  }
  get trackPerimeter() {
    const bounds = this.trackBounds;
    return 2 * ((bounds.right - bounds.left) + (bounds.bottom - bounds.top));
  }
  syncTrackDistance() {
    const bounds = this.trackBounds;
    const width = bounds.right - bounds.left; const height = bounds.bottom - bounds.top;
    const candidates = [
      { distance: Math.abs(this.y - bounds.top), path: Math.max(0, Math.min(width, this.x - bounds.left)) },
      { distance: Math.abs(this.x - bounds.right), path: width + Math.max(0, Math.min(height, this.y - bounds.top)) },
      { distance: Math.abs(this.y - bounds.bottom), path: width + height + Math.max(0, Math.min(width, bounds.right - this.x)) },
      { distance: Math.abs(this.x - bounds.left), path: width * 2 + height + Math.max(0, Math.min(height, bounds.bottom - this.y)) },
    ];
    this.trackDistance = candidates.sort((a, b) => a.distance - b.distance)[0].path;
  }
  placeOnTrack() {
    const bounds = this.trackBounds;
    const width = bounds.right - bounds.left; const height = bounds.bottom - bounds.top;
    const distance = ((this.trackDistance % this.trackPerimeter) + this.trackPerimeter) % this.trackPerimeter;
    if (distance < width) { this.x = bounds.left + distance; this.y = bounds.top; }
    else if (distance < width + height) { this.x = bounds.right; this.y = bounds.top + distance - width; }
    else if (distance < width * 2 + height) { this.x = bounds.right - (distance - width - height); this.y = bounds.bottom; }
    else { this.x = bounds.left; this.y = bounds.bottom - (distance - width * 2 - height); }
  }
  update(deltaTime, target) {
    this.updateStatus(deltaTime);
    if (!this.active) return {};
    const distanceToTarget = Math.hypot(target.x - this.x, target.y - this.y);
    if (distanceToTarget <= this.chaseDistance) this.chasing = true;
    if (this.chasing) {
      this.moveToward(target, this.speed * this.chaseSpeedMultiplier, deltaTime);
      if (distanceToTarget > this.chaseDistance * 1.35) {
        this.chasing = false;
        this.syncTrackDistance();
      }
      return {};
    }
    this.trackDistance += this.trackDirection * this.speed * this.trackSpeedMultiplier * deltaTime;
    this.placeOnTrack();
    return {};
  }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    context.save(); context.translate(x, y);
    context.fillStyle = this.hitFlash > 0 ? "#fff5d3" : "#e15b47";
    context.fillRect(-13, -22, 26, 31); context.fillStyle = "#efd09e"; context.fillRect(-10, -34, 20, 14);
    context.fillStyle = "#242521"; context.fillRect(-6, -29, 4, 4); context.fillRect(4, -29, 4, 4);
    context.fillStyle = "#27384f"; context.fillRect(-14, 9, 10, 22); context.fillRect(4, 9, 10, 22);
    if (!this.chasing) { context.fillStyle = "#f3df8d"; context.fillRect(17, -23, 5, 8); context.fillRect(21, -31, 5, 8); }
    context.restore(); this.bar(context, x, y);
  }
}

export class Backpack extends SchoolFieldEnemy {
  constructor({ x, y, health = 550, speed = 70, damage = 12, coinValue = 8, xpValue = 50 } = {}) {
    super({ x, y, health, speed, damage, radius: 27, coinValue, xpValue, enemyType: "backpack" });
    this.hopTime = 0; this.fallenTime = 0; this.fallTimer = 3.2;
  }
  update(deltaTime, target) {
    this.updateStatus(deltaTime);
    if (!this.active) return {};
    if (this.fallenTime > 0) { this.fallenTime -= deltaTime; return {}; }
    this.fallTimer -= deltaTime;
    if (this.fallTimer <= 0) { this.fallenTime = 0.8; this.fallTimer = 3.2; return {}; }
    this.hopTime += deltaTime * 1.7;
    if (this.hopTime >= 1) this.hopTime -= 1;
    this.moveToward(target, this.speed, deltaTime);
    return {};
  }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y);
    const hop = this.fallenTime > 0 ? 0 : Math.round(Math.abs(Math.sin(this.hopTime * Math.PI)) * 18);
    const shadowWidth = Math.max(16, 32 - Math.round(hop * 0.55));
    context.fillStyle = "rgba(18, 22, 18, 0.3)";
    context.fillRect(x - Math.round(shadowWidth / 2), y + 23, shadowWidth, 5);
    context.fillStyle = this.hitFlash > 0 ? "#fff5d3" : this.fallenTime > 0 ? "#725748" : "#734f9c";
    context.fillRect(x - 25, y - 22 - hop, 50, 44); context.fillStyle = "#d1a86c"; context.fillRect(x - 14, y - 14 - hop, 28, 8);
    context.fillStyle = "#211c28"; context.fillRect(x - 11, y + 1 - hop, 7, 7); context.fillRect(x + 5, y + 1 - hop, 7, 7);
    this.bar(context, x, y);
  }
}

export class SchoolBasketball extends SchoolFieldEnemy {
  constructor({ x, y, health = 150, speed = 280, damage = 6, coinValue = 2, xpValue = 20, random = Math.random } = {}) {
    super({ x, y, health, speed, damage, radius: 18, coinValue, xpValue, enemyType: "basketball" });
    this.random = random; this.wanderTimer = 0; this.steeringAngle = 0; this.travelAngle = null;
    this.bounceTime = 0; this.bounceHeight = 0; this.jumpHeight = 32; this.airborne = false;
  }
  chooseBounceDirection(target) {
    this.wanderTimer = 0.18 + this.random() * 0.42;
    // Keep a visible, unpredictable turn while biasing the actual jump
    // toward the player's latest position. This correction happens on every
    // landing, so the jump arc and the reposition length stay in sync.
    this.steeringAngle = (this.random() - 0.5) * 2.2;
    const desiredAngle = Math.atan2(target.y - this.y, target.x - this.x);
    this.travelAngle = desiredAngle + this.steeringAngle * 0.55;
    this.targetSnapshot = { x: target.x, y: target.y };
  }
  update(deltaTime, target) {
    this.updateStatus(deltaTime); if (!this.active) return {};
    if (this.travelAngle === null) this.chooseBounceDirection(target);
    const angleToTarget = this.travelAngle ?? Math.atan2(target.y - this.y, target.x - this.x);
    this.x += Math.cos(angleToTarget) * this.speed * deltaTime;
    this.y += Math.sin(angleToTarget) * this.speed * deltaTime;
    const wasAirborne = this.airborne;
    this.bounceTime += deltaTime * 8;
    this.bounceHeight = Math.abs(Math.sin(this.bounceTime)) * this.jumpHeight;
    this.airborne = this.bounceHeight > 2;
    if (wasAirborne && !this.airborne) this.chooseBounceDirection(target);
    return {};
  }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x); const y = Math.round(this.y - camera.y - this.bounceHeight);
    context.fillStyle = "rgba(20, 20, 20, 0.22)"; context.fillRect(x - 12, Math.round(this.y - camera.y) + 16, 24, 4);
    context.fillStyle = this.hitFlash > 0 ? "#fff5d3" : "#d47736"; context.fillRect(x - 16, y - 16, 32, 32);
    context.fillStyle = "#3b2720"; context.fillRect(x - 2, y - 16, 4, 32); context.fillRect(x - 16, y - 2, 32, 4);
    this.bar(context, x, y);
  }
}

export class Basketball extends SchoolBasketball {}
