# Lawn Enforcement Development Plan

## Goal and Technical Direction

Build a playable 2D top-down survival game that runs in modern desktop browsers and deploys as a static GitHub Pages site. Use extremely blocky arcade pixel art that visually follows 20×16 to 24×24 construction, while retaining approved high-resolution masters when needed to preserve their exact colors. Characters use oversized front-facing or slight three-quarter heads, tiny bodies, and short stubby legs. Basic walking uses paired frames with an unchanged upper body and alternating leg heights. Pair these sprites with muted earthy lawns, irregular ground texture, warm lighting, and readable health bars. Movement and maps remain top-down. Start with HTML5 Canvas, CSS, and vanilla JavaScript ES modules.

## Initial Project Layout

```text
index.html
styles/main.css
src/main.js
src/core/          # loop, input, camera, collisions, game state
src/entities/      # player, enemies, projectiles, bosses
src/weapons/       # shared weapon behavior and weapon definitions
src/systems/       # spawning, combat, XP, rewards, progression
src/ui/            # HUD, menus, shop, results
src/config/        # balance values and map definitions
assets/            # sprites, audio, and fonts
tests/             # deterministic logic tests
```

## Phase 1: Browser Foundation

Create the page, canvas, responsive scaling, fixed-timestep game loop, keyboard/mouse input, and camera. Add a debug overlay showing frame rate and player coordinates.

**Complete when:** a placeholder player moves with WASD inside the scrolling lawn, aims at the cursor, and cannot leave the map.

## Phase 2: Core Combat

Implement health, damage, attack-speed cooldowns, enemy collision, and weapon switching. Add the common level-1 Weedwacker 9000 as a 180-degree mouse-facing melee attack and unlimited apples as cursor-aimed projectiles. Holding the mouse button repeatedly attacks; `1` and `2` switch weapon slots.

**Complete when:** both weapons damage and defeat a stationary test enemy, switching is reliable, and the HUD shows health, selected weapon, and cooldown.

## Phase 3: Survival Loop

Add chasing enemies, timed spawn waves, escalating health/damage/speed, coin drops, run XP, level thresholds, and temporary placeholder upgrade choices. Add pause, death, results, and return-to-menu flows.

**Playtest checkpoint:** complete. Fixed-health chasing gnomes, a 100-enemy cap, physical coin and 10-XP drops, XP levels, 15 temporary upgrades, pause, defeat, retry, and menu/results flows are implemented.

**Complete when:** a full run can start, become progressively harder, end in defeat, award kill coins, reset XP, and return to the menu without refreshing.

## Phase 4: First Map and Boss

Create the first map from reusable terrain/decor objects. Add one boss with telegraphed attacks, a health bar, and a spawn condition. Lock any later section until the boss is defeated. Treat the final boss as the map victory condition.

**Complete when:** defeating the boss ends the run, awards twice the kill coins plus a configurable completion bonus, unlocks the next-map slot, and returns to the menu.

**Status:** complete for the first playtest. The Backyard culminates in King Gnomulus after one minute. Existing enemies remain when he arrives; normal spawning stops while his diamond summon and non-tracking creature throw each run on separate four-second timers. Backyard waves contain only gnomes, and the boss throws a gnome. Frontyard mixes gophers into waves from the start, and its boss throws a gopher. The HUD displays boss health, and victory awards double run coins plus a map bonus that begins at 500 coins and increases by 500 for each map. Defeating Backyard makes the smaller Frontyard a selectable, persistently unlocked map.

## Phase 5: Permanent Progression

Persist coins, unlocked maps, owned weapons, weapon levels, character stats, settings, and keybinds in versioned `localStorage`. Build the shop, weapon upgrades capped at level 5 for the starting map and one level higher per additional unlocked map, basic common/uncommon purchases, daily rare/epic offer, and chest opening. Convert duplicates to their configured coin value. Implement chest odds exactly: 20% uncommon, 40% rare, 30% epic, 8% legendary, 1.9% mythical, and 0.1% secret.

**Complete when:** saved progress survives reloads, invalid save data fails safely, chest probabilities have automated distribution tests, and purchases cannot create negative balances.

**Status:** complete as a data-driven checkpoint. Versioned saves retain coins, maps, owned weapons, levels, four character stats, settings, and keybind defaults. The menu shop supports level 1–5 starter upgrades, permanent stats, common/uncommon purchases, and a deterministic daily rare/epic offer. Chests use the exact configured odds and convert duplicates to coins; final weapon concepts remain replaceable configuration entries.

## Phase 6: Content and Level-5 Features

Replace placeholder run upgrades and expand the weapon/enemy roster. Define each weapon's immutable rarity, five upgrade levels, values, and special level-5 behavior in data files. Add the apple explosion with area damage and a 50% slow.

**Complete when:** content can be added primarily through configuration, the apple effect is visible and timed correctly, and every weapon level has a measurable benefit.

**Status:** complete as a starter-content checkpoint. Weapon scaling and level-5 features are configuration-driven. Every level improves damage and attack speed; level-5 Apples add a visible area explosion with half splash damage and a two-second 50% slow, while the Weedwacker gains extra base range. Gophers expand the enemy roster. Final weapon concepts can replace the current prototype entries without changing economy logic.

**Arsenal expansion:** combat definitions now cover six melee and nine ranged weapons. Melee shapes include wide and precision arcs, a sword-like Tennis Racket, a shovel thrust, the Golden Rake's stem-and-branch pattern, and a rapid mower lane. Ranged behaviors include ricochet, piercing, continuous water, air, and flame streams, knockback, splash damage, and minigun spread. Each weapon has a unique level-5 modifier and pixel-rendered attack effect.

**Map expansion:** Backyard and Frontyard lead into the Community Garden, an arena of raised dirt beds populated by short-lived, self-propagating Common Weeds. Its Dandelion boss arrives after 90 seconds, launches four weed-growing spores every 10 seconds, and gains a recurring 200-damage shield below 100 health.

## Phase 7: Polish, Testing, and Accessibility

Add sprites, animation, audio controls, screen shake settings, hit feedback, tutorials, rebinding, pause behavior, and reduced-motion support. Test collision, rewards, saves, weapon math, and progression automatically; perform manual runs in current Chrome, Firefox, and Safari.

**Complete when:** there are no known progress-loss or run-blocking defects, controls are explained in-game, and performance remains smooth during peak enemy counts.

**Status:** complete as an initial polish checkpoint. A one-time tutorial explains the run, saved settings expose sound, screen shake, and reduced motion, and melee/ranged switching supports persistent live rebinding. Automated coverage protects combat, saves, economy, progression, bosses, pickups, and enemy state behavior; cross-browser release testing remains part of Phase 8.

## Phase 8: Release

Document controls and development commands, add automated tests and a GitHub Pages deployment workflow, verify asset paths under the repository subdirectory, and create a tagged playable release.

**Complete when:** a clean clone can be tested locally and the production URL loads, starts, saves, and completes the first map successfully.

**Status:** release-ready locally. The repository now builds a minimal `dist/` artifact, validates project-relative page assets, and includes an official GitHub Pages Actions workflow. Production deployment, cross-browser checks, the tagged release, and a complete first-map production playthrough remain pending until the project is committed and pushed.

## Development Rules

- Build phases in order and keep every merge playable.
- Store balance numbers in `src/config/`; do not bury them in rendering code.
- Add automated tests with each economy, save-data, or combat-math change.
- Use placeholder art freely, but track licensing before release.
- Defer additional maps, final balancing, and monetization until the first-map loop is validated.
