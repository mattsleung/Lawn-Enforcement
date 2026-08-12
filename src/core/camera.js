export class Camera {
  constructor(viewWidth, viewHeight, worldWidth, worldHeight) {
    this.x = 0;
    this.y = 0;
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
  }

  resize(width, height) {
    this.viewWidth = width;
    this.viewHeight = height;
  }

  setWorldSize(width, height) {
    this.worldWidth = width;
    this.worldHeight = height;
  }

  follow(target) {
    const maxX = Math.max(0, this.worldWidth - this.viewWidth);
    const maxY = Math.max(0, this.worldHeight - this.viewHeight);
    this.x = clamp(target.x - this.viewWidth / 2, 0, maxX);
    this.y = clamp(target.y - this.viewHeight / 2, 0, maxY);
  }

  screenToWorld(point) {
    return { x: point.x + this.x, y: point.y + this.y };
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
