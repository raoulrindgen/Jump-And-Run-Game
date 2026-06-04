# Sunny Sprout Sprint

A local, browser-based 2D platformer built with HTML, CSS, JavaScript, and HTML5 Canvas.

## Run

Open `index.html` in a browser. No backend, package install, or build step is required.

## Controls

- Move: `A` / `D` or left / right arrow keys
- Jump: `Space`
- Mobile: on-screen buttons

## Project Structure

- `index.html` - static page and script loading order
- `css/styles.css` - responsive layout, HUD, menu, and touch controls
- `js/config.js` - shared constants and helpers
- `js/audio.js` - placeholder Web Audio sound effects
- `js/input.js` - keyboard and touch input
- `js/levels.js` - three level definitions
- `js/particles.js` - jump, hit, checkpoint, and coin particles
- `js/entities.js` - player, enemies, coins, checkpoints, and flags
- `js/renderer.js` - Canvas drawing code
- `js/game.js` - game loop, state, camera, scoring, and level progression
