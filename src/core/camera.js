export class Camera {
  constructor(viewWidth, viewHeight, worldWidth, worldHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.followSpeed = 10;
  }

  resize(width, height) {
    this.viewWidth = width;
    this.viewHeight = height;
  }

  setWorldSize(width, height) {
    this.worldWidth = width;
    this.worldHeight = height;
  }

  follow(target, deltaTime = null) {
    const maxX = Math.max(0, this.worldWidth - this.viewWidth);
    const maxY = Math.max(0, this.worldHeight - this.viewHeight);
    const desiredX = clamp(target.x - this.viewWidth / 2, 0, maxX);
    const desiredY = clamp(target.y - this.viewHeight / 2, 0, maxY);
    if (!Number.isFinite(deltaTime) || deltaTime <= 0) {
      this.x = desiredX;
      this.y = desiredY;
      return;
    }
    const followFactor = 1 - Math.exp(-this.followSpeed * deltaTime);
    this.x += (desiredX - this.x) * followFactor;
    this.y += (desiredY - this.y) * followFactor;
  }

  screenToWorld(point) {
    return { x: point.x + this.x, y: point.y + this.y };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
