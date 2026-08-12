export class Pickup {
  constructor({ x, y, type, amount = 1, offsetX = 0, offsetY = 0 }) {
    this.x = x + offsetX;
    this.y = y + offsetY;
    this.type = type;
    this.amount = amount;
    this.radius = 8;
    this.active = true;
  }

  update(deltaTime, player) {
    const offsetX = player.x - this.x;
    const offsetY = player.y - this.y;
    const distance = Math.hypot(offsetX, offsetY) || 1;
    if (distance <= player.pickupRadius) {
      const speed = 430;
      this.x += offsetX / distance * Math.min(distance, speed * deltaTime);
      this.y += offsetY / distance * Math.min(distance, speed * deltaTime);
    }
    if (Math.hypot(player.x - this.x, player.y - this.y) <= player.radius + this.radius) {
      this.active = false;
    }
  }

  render(context, camera) {
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.fillStyle = this.type === "xp" ? "#71d98b" : "#edcc4f";
    if (this.type === "xp") {
      context.fillRect(x - 6, y - 6, 12, 12);
      context.fillStyle = "#b9f0a2";
      context.fillRect(x - 2, y - 4, 4, 4);
    } else {
      context.fillRect(x - 6, y - 7, 12, 14);
      context.fillStyle = "#fff09a";
      context.fillRect(x - 2, y - 5, 4, 10);
    }
  }
}
