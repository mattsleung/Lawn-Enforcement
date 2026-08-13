export class GolfBombProjectile {
  constructor({ x, y, targetX, targetY, damage = 50, warningDuration = 0.8 }) {
    this.x = x; this.y = y; this.targetX = targetX; this.targetY = targetY;
    this.damage = damage; this.warningDuration = warningDuration; this.radius = 0; this.active = true;
    this.spawnsWeed = false; this.isBomb = true; this.impacted = false; this.warningRadius = 48; this.bunkerRadius = 96;
  }
  update(deltaTime) {
    if (!this.active) return;
    this.warningDuration -= deltaTime;
    if (this.warningDuration <= 0) {
      this.x = this.targetX; this.y = this.targetY; this.active = false; this.impacted = true;
    }
  }
  hitPlayer() { this.active = false; }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.targetX - camera.x); const y = Math.round(this.targetY - camera.y);
    context.fillStyle = "rgba(229, 195, 80, 0.22)"; context.fillRect(x - this.warningRadius, y - this.warningRadius, this.warningRadius * 2, this.warningRadius * 2);
    context.strokeStyle = "#ffe78c"; context.lineWidth = 3; context.setLineDash([8, 7]); context.strokeRect(x - this.warningRadius, y - this.warningRadius, this.warningRadius * 2, this.warningRadius * 2); context.setLineDash([]);
  }
}
