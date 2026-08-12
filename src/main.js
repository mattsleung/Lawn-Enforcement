import { Game } from "./core/game.js";

const canvas = document.querySelector("#game");
const debugOutput = document.querySelector("#debug");

if (!(canvas instanceof HTMLCanvasElement) || !(debugOutput instanceof HTMLOutputElement)) {
  throw new Error("Required game elements are missing.");
}

const game = new Game(canvas, debugOutput);
game.start();
