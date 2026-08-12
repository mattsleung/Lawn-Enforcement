export const VIEWPORT = Object.freeze({
  designWidth: 1280,
  designHeight: 720,
});

export const WORLD = Object.freeze({
  width: VIEWPORT.designWidth * 1.65,
  height: VIEWPORT.designHeight * 1.65,
  gridSize: 96,
});

export const PLAYER = Object.freeze({
  radius: 22,
  speed: 310,
  startX: WORLD.width / 2,
  startY: WORLD.height / 2,
});

export const COLORS = Object.freeze({
  lawnA: "#61712f",
  lawnB: "#596a2b",
  grid: "rgba(218, 235, 185, 0.06)",
  boundary: "#cdbf70",
  playerShirt: "#d6bd72",
  playerPants: "#3c5272",
  playerSkin: "#d7a26f",
  aim: "rgba(255, 244, 185, 0.8)",
});
