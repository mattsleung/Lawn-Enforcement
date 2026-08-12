export class Projectile {
  constructor({
    x, y, velocityX, velocityY, damage, lifetime, kind = "apple", color = "#b83b32",
    radius = 7, explosive = false, splashRadius = 0, splashDamageMultiplier = 0.5,
    slowDuration = 0, bounces = 0, pierces = 0, knockback = 0,
    fireDamagePerSecond = 0, fireDuration = 0, fireMaxStacks = 1, freezeDuration = 0,
  }) {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.damage = damage;
    this.lifetime = lifetime;
    this.kind = kind;
    this.color = color;
    this.radius = radius;
    this.active = true;
    this.rotation = 0;
    this.explosive = explosive;
    this.splashRadius = splashRadius;
    this.splashDamageMultiplier = splashDamageMultiplier;
    this.slowDuration = slowDuration;
    this.bouncesRemaining = bounces;
    this.piercesRemaining = pierces;
    this.knockback = knockback;
    this.fireDamagePerSecond = fireDamagePerSecond;
    this.fireDuration = fireDuration;
    this.fireMaxStacks = fireMaxStacks;
    this.freezeDuration = freezeDuration;
    this.hitEnemies = new Set();
  }

  update(deltaTime) {
    this.x += this.velocityX * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.lifetime -= deltaTime;
    this.rotation += deltaTime * 9;
    this.active = this.lifetime > 0;
  }

  redirectToward(target, damageMultiplier = 0.72) {
    const speed = Math.hypot(this.velocityX, this.velocityY);
    const offsetX = target.x - this.x;
    const offsetY = target.y - this.y;
    const length = Math.hypot(offsetX, offsetY) || 1;
    this.velocityX = offsetX / length * speed;
    this.velocityY = offsetY / length * speed;
    this.damage = Math.max(1, Math.round(this.damage * damageMultiplier));
    this.bouncesRemaining -= 1;
  }

  render(context, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.save();
    context.translate(x, y);
    context.rotate(this.rotation);
    renderProjectileShape(context, this);
    context.restore();
  }
}

function renderProjectileShape(context, projectile) {
  if (projectile.kind === "flame") {
    context.fillStyle = "#ffe36a";
    context.fillRect(-8, -4, 8, 8);
    context.fillStyle = projectile.color;
    context.fillRect(-2, -6, 10, 12);
    context.fillStyle = "#d9432f";
    context.fillRect(5, -4, 7, 8);
    return;
  }
  if (projectile.kind === "water" || projectile.kind === "storm-water") {
    context.fillStyle = projectile.color;
    const length = projectile.kind === "storm-water" ? 18 : 13;
    context.fillRect(-length / 2, -3, length, 6);
    context.fillStyle = "#d9f7ff";
    context.fillRect(1, -2, length / 2, 2);
    return;
  }
  if (projectile.kind === "gust") {
    context.fillStyle = "rgba(230, 225, 190, 0.72)";
    context.fillRect(-10, -5, 17, 3);
    context.fillRect(-6, 2, 14, 3);
    return;
  }
  if (projectile.kind === "tennis-ball") {
    context.fillStyle = "#3f4620";
    context.fillRect(-7, -7, 14, 14);
    context.fillStyle = projectile.color;
    context.fillRect(-5, -5, 10, 10);
    context.fillStyle = "#f3efc2";
    context.fillRect(-5, -1, 3, 2);
    context.fillRect(2, 1, 3, 2);
    return;
  }
  if (projectile.kind === "bowling-ball") {
    context.fillStyle = "#211b2c";
    context.fillRect(-12, -12, 24, 24);
    context.fillStyle = projectile.color;
    context.fillRect(-10, -10, 20, 20);
    context.fillStyle = "#17131f";
    context.fillRect(-4, -6, 4, 4);
    context.fillRect(2, -6, 4, 4);
    context.fillRect(-1, 0, 4, 4);
    return;
  }
  if (projectile.kind === "acorn") {
    context.fillStyle = "#3b2b21";
    context.fillRect(-6, -6, 12, 5);
    context.fillStyle = projectile.color;
    context.fillRect(-5, -1, 10, 8);
    return;
  }
  if (projectile.kind === "diet-cola") {
    context.fillStyle = "#26211f";
    context.fillRect(-6, -10, 12, 20);
    context.fillStyle = projectile.color;
    context.fillRect(-4, -7, 8, 15);
    context.fillStyle = "#d8d3c6";
    context.fillRect(-4, -10, 8, 4);
    context.fillRect(-3, -2, 6, 3);
    return;
  }
  if (projectile.kind === "undefined") {
    context.fillStyle = "#22152b";
    context.fillRect(-8, -8, 16, 16);
    context.fillStyle = projectile.color;
    context.fillRect(-5, -5, 4, 4);
    context.fillRect(1, 1, 6, 6);
    return;
  }
  context.fillStyle = "#33251e";
  context.fillRect(-7, -6, 14, 13);
  context.fillStyle = projectile.color;
  context.fillRect(-5, -5, 10, 10);
  context.fillStyle = "#e06045";
  context.fillRect(-3, -4, 4, 3);
  context.fillStyle = "#4d702d";
  context.fillRect(1, -8, 6, 3);
}
