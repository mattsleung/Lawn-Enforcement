import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(root, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "assets"), { recursive: true });
await mkdir(resolve(output, "styles"), { recursive: true });

await Promise.all([
  cp(resolve(root, "assets"), resolve(output, "assets"), { recursive: true }),
  cp(resolve(root, "styles"), resolve(output, "styles"), { recursive: true }),
  cp(resolve(root, "index.html"), resolve(output, "index.html")),
  cp(resolve(root, "game.bundle.js"), resolve(output, "game.bundle.js")),
  writeFile(resolve(output, ".nojekyll"), ""),
]);

const html = await readFile(resolve(output, "index.html"), "utf8");
if (!html.includes('src="game.bundle.js')) {
  throw new Error("Pages output is missing the game entry script");
}

console.log("GitHub Pages artifact created in dist/.");
