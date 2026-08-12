# Repository Guidelines

## Project Structure & Module Organization

Lawn Enforcement is a 2D, top-down browser game intended for GitHub Pages. Follow `DEVELOPMENT_PLAN.md` for milestones and acceptance criteria. Use:

- `index.html` for the entry point and `styles/` for CSS.
- `src/core/` for the loop, input, camera, and collisions.
- `src/entities/`, `src/weapons/`, `src/systems/`, and `src/ui/` for gameplay.
- `src/config/` for balance and map data; `assets/` for media.
- `tests/` for automated tests mirroring `src/`.

Keep simulation logic independent from rendering and centralize balance values.

## Implementation Roadmap

Build playable phases in order: foundation; weapons; survival loop; first boss and victory; saved progression and shop; content; polish and QA; then GitHub Pages release. Keep placeholder art until combat is validated. Do not start a phase until the preceding acceptance criteria pass.

## Build, Test, and Development Commands

The project uses Node's test runner but no runtime dependencies or compilation step. Keep it compatible with static hosting.

- `npm run dev`: rebuild, then serve locally at `http://localhost:8000`.
- `npm test`: run deterministic tests with `node:test`.
- `npm run build`: regenerate `game.bundle.js` and run release validation.
- `git diff --check`: detect whitespace errors before committing.

## Coding Style & Naming Conventions

Use 2-space indentation, ES modules, `const` by default, and focused functions. Use `camelCase` for variables/functions, `PascalCase` for classes, `UPPER_SNAKE_CASE` for constants, and `kebab-case` for assets (`weedwacker-swing.png`).

Edit modules under `src/`, never `game.bundle.js` directly. Commit the regenerated bundle with source changes so GitHub Pages and direct file opening both work.

Game sprites use oversized front-ish heads, tiny bodies, stubby legs, block-shaped features, and compact palettes. Preserve approved source colors and matched frame canvases; do not palette-reduce production art. Environment tiles and effects may use hard nearest-neighbor pixels, while the approved high-resolution player frames are smoothly reduced at render time.

## Testing Guidelines

Use `node:test` and name tests like `tests/weapons/apple.test.js`. Prioritize deterministic combat, economy, and save logic. Also verify movement, aiming, rendering, and browser persistence manually through a local server.

## Commit & Pull Request Guidelines

Use short, imperative commits such as `Add melee attack cooldown`. PRs must describe behavior, tests, and balance changes. Include screenshots or recordings for visual changes and link relevant issues.

## Security & Configuration

Never commit credentials or private tokens. All client-side configuration is public.
