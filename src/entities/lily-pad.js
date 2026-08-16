export class LilyPad {
  constructor({ x, y, driftSpeed = 8, phase = 0 }) {
    this.x = x;
    this.y = y;
    this.radius = 28;
    this.maxHealth = 500;
    this.health = this.maxHealth;
    this.driftSpeed = driftSpeed;
    this.phase = phase;
    this.time = 0;
    this.spawnTimer = 1;
  }

  update(deltaTime, river) {
    if (this.health <= 0) return { spawnStrongweed: false };
    this.time += deltaTime;
    this.spawnTimer -= deltaTime;
    this.x += this.driftSpeed * deltaTime;
    if (this.x - this.radius > river.x + river.width) this.x = river.x - this.radius;
    return { spawnStrongweed: this.spawnTimer <= 0 };
  }

  resetSpawnTimer() {
    this.spawnTimer = 1;
  }

  takeDamage(amount) {
    if (this.health <= 0) return true;
    this.health = Math.max(0, this.health - Math.max(0, amount));
    return this.health <= 0;
  }

  render(context, camera) {
    if (this.health <= 0) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y + Math.sin(this.time * 1.2 + this.phase) * 2);
    context.fillStyle = "#254f3d";
    context.fillRect(x - 24, y - 9, 48, 22);
    context.fillStyle = "#4f9b58";
    context.fillRect(x - 20, y - 15, 38, 24);
    context.fillRect(x - 12, y - 20, 24, 30);
    context.fillStyle = "#8ac66b";
    context.fillRect(x - 3, y - 15, 5, 25);
    context.fillRect(x - 8, y - 4, 15, 4);
    context.fillStyle = "#2c6f49";
    context.fillRect(x + 16, y - 5, 8, 4);
  }
}
