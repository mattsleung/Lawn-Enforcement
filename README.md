# Lawn Enforcement

A 2D, top-down suburban survival game for the browser. Defend the lawn from gnomes, gophers, and other creatures using the Weedwacker 9000 and an unlimited supply of apples.

## Run Locally

The current prototype uses browser-native HTML, CSS, Canvas, and JavaScript modules with no runtime dependencies.

First, enter the cloned repository (the hyphenated folder on the Desktop):

```bash
cd "/Users/matthew/Desktop/Apps/Lawn-Enforcement"
npm run dev
```

Open [http://localhost:8000](http://localhost:8000).

Alternatively, this command works from any directory:

```bash
npm --prefix "/Users/matthew/Desktop/Apps/Lawn-Enforcement" run dev
```

For convenience, `index.html` can also be opened directly. Run `npm run build` after changing source files so `game.bundle.js` stays current.

Run deterministic tests with `npm test`. Run `npm run build:pages` to produce the exact static site artifact in `dist/`.

## Current Controls

- `WASD` or arrow keys: move
- Mouse: aim
- Hold left mouse: attack repeatedly
- Click menu buttons, weapon rows, shop items, and upgrade cards to select them
- `1`: select your equipped melee weapon
- `2`: select your equipped ranged weapon
- `Escape`: pause or resume
- `Enter`: open map selection or return to the menu after defeat
- Number keys: optional keyboard shortcuts for menus and run upgrades
- `F3`: toggle debug information
- `X`: immediately spawn the current map's boss for playtesting

Weapon selection shows five items at a time; mouse-wheel and arrow scrolling moves three items per step.
- `R`: retry after the lawn is overrun

The Weedwacker damages enemies in a 180° semicircle toward the mouse. Each touching gnome deals 6 contact damage per damage tick, and simultaneous gnomes stack their damage.

## Art Assets

The player uses the approved full-resolution movement frames `assets/sprites/homeowner-walk-1.png` and `homeowner-walk-2.png`. Both share an identical transparent canvas and baseline. During actual movement, the short legs alternate at six steps per second with a synchronized one-pixel body bob. Preserve approved source colors; do not palette-reduce production art. Other gameplay assets should follow the same oversized-head, tiny-body, block-shaped style.

## Development Status

Phases 1–7 are playable, and Phase 8 is prepared for deployment. Up to 100 fixed-health gnomes spawn over time, chase the player, and deal stacking contact damage. Defeated gnomes scatter individual coins and 10-XP orbs that must be collected. Rising XP thresholds offer three random choices from 15 temporary upgrades: five repeatable Bronze stat upgrades, five one-use Silver abilities, and five Gold upgrades. Each loadout's Gold pool contains three universal upgrades plus one upgrade for the equipped melee weapon and one for the equipped ranged weapon. Gold upgrades disappear after selection for that run, except repeatable Second Wind.

The Bronze upgrades improve health, damage, movement speed, attack speed, or Accuracy. Accuracy reduces ranged recoil. Each ranged weapon has its own recoil strength; sustained fire and fast repeated attacks widen the mouse crosshair and increase shot deviation until the player stops firing. Accuracy is also available as a permanent character stat. Second Wind restores the player to their current maximum health without increasing that maximum.

Silver abilities include Pancake Syrup plus four timed abilities on fixed 5-second cooldowns: an Autonomous Mower that seeks the nearest enemy and explodes, a Battery Pack that ignites nearby enemies for 5 damage per second over 10 seconds, a Freeze Pulse, and a Scarecrow pushback pulse. Selected abilities display their live cooldowns beneath the run HUD. Fire and freeze are reusable status-effect systems, and the Secret Backyard Flamethrower applies stacking fire.

King Gnomulus arrives after one minute. Every boss arrival triggers a one-second cinematic at 20% simulation speed with separate spotlights on the player and boss. Existing enemies remain alive, while normal wave spawning stops; only the boss's summons and thrown creature add to the fight afterward. Every 4 seconds he summons four gnomes in a diamond, and on a separate 4-second timer he snapshots the player's position and throws a non-tracking creature there. Backyard contains only gnomes and King Gnomulus; his thrown creature becomes a chasing gnome. Frontyard mixes gophers into normal waves from the start, and King Gnomulus throws an above-ground gopher instead. Backyard is now 1.65 design screens square, while the smaller Frontyard is 1.25 screens wide and 1.4 screens tall. Victory awards twice the collected run coins plus a base reward: 500 in Backyard and 1,000 in Frontyard. Defeating each map unlocks the next one: Backyard → Frontyard → Community Garden → Public Park. Use the map cards or number keys on the map-selection screen to choose an unlocked map. Run upgrades cannot raise maximum health above 200% of its value at round start. Run XP and upgrades reset between runs; coins and map unlocks persist in browser storage. See [`DEVELOPMENT_PLAN.md`](DEVELOPMENT_PLAN.md) for the full roadmap.

The Community Garden is a 1.6-screen-square field filled with empty raised dirt beds. Each rooted, 10-health Common Weed grows one child 48 pixels toward the player after 0.4 seconds and a second child during its final 0.4 seconds, then naturally withers after five seconds; each child can repeat the cycle, and normal Common Weeds are capped at 100 while Strongweeds are uncapped. Frozen weeds cannot reproduce, and their clone timers pause until they thaw. A defeated weed has a 50% chance to drop one coin and one 10-XP orb. Dandelion arrives after 90 seconds with 1,000 health and regenerates 5 health per second. Every 10 seconds it fires four cardinal spores, while every 2 seconds it fires one non-tracking spore toward the player's current position. Spores deal 20 damage and grow a Common Weed where they stop. Below 100 health, Dandelion immediately raises a visible 200-damage shield with a five-second cooldown, up to five activations per fight. Once any boss arrives, it keeps a permanent soft lamp glow matching the player's light. Winning the map grants a 1,500-coin base victory bonus. The Public Park follows as a large 1.8-by-1.5-screen map with open grass, trees, benches, picnic tables, a playground, winding paths, and solid obstacle objects. Fast Squirrels have 80 health, burst movement, sideways jumps, and drop 10 XP plus 1 coin; Acorn Squirrels have 120 health, keep their distance, throw acorns at the player's snapshotted position, then reposition. The park currently reuses Dandelion as its boss until a dedicated park boss is designed.

Redwood Trail is a 1.8-by-1.8-screen forest arena with solid redwood trunks. Ordinary projectiles disappear on trunk impact, while Beach Balls bounce. Snails leave five-second slime trails that slow the player by 60%, Mosquitoes fly over obstacles and dash, and Deer telegraph straight-line charges. The Ancient Snail arrives at two minutes with 5,000 health, a 2,000-point regenerating shield, permanent boss slime, spit projectiles, shell slams, and a repeating snail army. Defeating it unlocks a permanent 10-point player shield that regenerates at 0.25 per second; the new Shield stat adds one point per upgrade, and all permanent upgrade and weapon-upgrade prices then double.

School Field is a large school sports arena surrounded by a speed-boosting running track. Its exclusive edge-spawn roster contains Rogue Soccer Balls, Sprinters, Angry Backpacks, and Basketballs. The PE Teacher arrives at two minutes with dodgeballs, whistle shockwaves, and fast laps around the track; after the configured delay, the stationary Ball Launcher fires mixed sports balls and radial ball dumps. These enemies and bosses are exclusive to School Field.

Clicking Start Run opens map selection, followed by two unrestricted weapon selections before beginning the run. The main menu provides the Shop, Season, Upgrades, Quests, Glossary, and Settings. Every owned weapon can be upgraded independently without equipping it first, and weapon upgrade prices rise at higher levels. The starting map supports weapon level 5, and each additional unlocked map raises every weapon's maximum level by one. Each unlocked map adds two available levels to every regular permanent character stat. Chest duplicates are automatically exchanged for their configured coin value.

Press `O` on the main menu for settings and accessibility. Sound, screen shake, and reduced motion preferences persist between sessions. Melee and ranged weapon-switch keys can be rebound from the same screen. New saves receive a one-time controls and objectives tutorial.

The main-menu Glossary has two tabs. Bestiary permanently records defeated enemies across all maps, including the School Field sports roster and its two bosses, revealing descriptions after the first defeat. Collection shows every unlocked weapon with its rarity and level, plus unlocked maps; locked discoveries remain hidden.

Every starter weapon level increases damage and attack speed. At level 10, the Weedwacker gains an additional 20% base range; level-10 Apples explode on impact, deal half damage to nearby enemies, and slow affected enemies by 50% for two seconds. Frontyard gophers have 250 health and slower above-ground movement. They emerge from a two-second visual hole, periodically burrow for two seconds, chase at double speed underground, and leave a dotted trail of holes that fade over one second. They cannot be hit underground and return at full health.

## Weapon Arsenal

Each weapon has immutable rarity, permanent levels capped by map progression, its own attack geometry or projectile behavior, and a distinct level-10 feature.

| Weapon | Rarity | Design |
| --- | --- | --- |
| Weedwacker 9000 | Common | Wide 180° melee sweep |
| Hedge Clippers | Uncommon | Longer 45° precision cut |
| Garden Shovel | Rare | Narrow heavy thrust with knockback |
| Golden Rake | Legendary | Forward handle ending in a wide rake branch |
| Turbo Mower | Mythical | Rapid rectangular melee lane with heavy knockback |
| Tennis Racket | Rare | Sword-like forehand arc; pairs with Tennis Balls for +1 level each |
| Apples | Common | Reliable projectile that becomes explosive |
| Tennis Balls | Rare | Low damage, two enemy ricochets, and a Tennis Racket pairing bonus |
| Acorn Slingshot | Uncommon | High-damage piercing shot |
| Garden Hose | Rare | Steady short stream of light water hits |
| Bowling Ball | Rare | Slow medium-range projectile that pierces one enemy |
| Diet Cola Launcher | Legendary | 20,000-coin shop weapon with explosive group splash damage |
| Leaf Blower | Epic | 4-damage steady gust with pushback |
| Storm Sprinkler | Mythical | Fast, inaccurate low-damage water minigun |
| Backyard Flamethrower | Secret | 10-damage short flame stream with up to two five-second, 10-DPS burn stacks |
| Ordinance Undefined | Developer | Direct-grant-only slower bouncing, piercing, explosive yard energy (double damage) |

Each weapon also has a one-use Gold run upgrade: Weedwacker range, Hedge Clipper angle, Shovel impact, Rake width, Mower width, Tennis Racket range, Apple projectile count, Tennis Ball bounces, Acorn pierces, Hose reach, Diet Cola blast radius, Leaf Blower pushback, Sprinkler projectile count, Flamethrower reach, or Ordinance projectile count and bounce. Only upgrades for the two weapons equipped at the start of the run enter that run's upgrade pool.

Tennis Balls, Hedge Clippers, the Acorn Slingshot, and the 25,000-coin Legendary Diet Cola Launcher are regular shop purchases. The daily deal rotates between the Garden Hose and Leaf Blower. Chest-only rarities provide the rest of the advanced arsenal. Weapons and maps must be unlocked through normal shop, chest, and victory progression.

## GitHub Pages Release

The deployment workflow tests the game, creates a minimal `dist/` artifact, and publishes it on pushes to `main`. All browser assets use relative paths so the game works beneath the `/Lawn-Enforcement/` project path.

Before the first deployment, open the repository's **Settings → Pages** and select **GitHub Actions** as the source. Once the release is committed and pushed, follow the **Deploy GitHub Pages** run in the Actions tab. The expected project URL is `https://mattsleung.github.io/Lawn-Enforcement/`.

## Accounts and cloud saves

The public build supports email-confirmed Supabase accounts. Usernames are private account metadata for now, but may become publicly visible when social features are introduced. Emails remain private, and passwords are handled by Supabase Auth and never enter the repository or saved game JSON. Player saves are stored in `game_saves` with Row Level Security limiting every request to the signed-in user's own row.

Before enabling cloud saves, open the Supabase project's SQL Editor and run [`supabase/schema.sql`](supabase/schema.sql) once. Keep the service-role/secret key out of this repository and out of all browser assets. The publishable key in the browser bundle is intentionally public and has no access outside the RLS policies.

Developer unlocks run only on `localhost`, `127.0.0.1`, and IPv6 loopback. Cloud synchronization is disabled on those hosts so an all-unlocked developer save cannot be uploaded into a public player account.

## Commit and Push Later

This clone is connected to `https://github.com/mattsleung/Lawn-Enforcement.git`. When a set of changes is ready:

```bash
cd "/Users/matthew/Desktop/Apps/Lawn-Enforcement"
npm run build:pages
git status
git add .
git commit -m "Describe the completed change"
git push origin main
```

Review `git status` before `git add .` so unintended files are not included. Codex can perform this workflow when requested; no changes are committed or pushed automatically.
