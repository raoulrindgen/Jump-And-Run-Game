# Midnight Rift Run

A local, browser-based 2D platformer built with HTML, CSS, JavaScript, and HTML5 Canvas. The game uses original dark fantasy canvas art with a Light-versus-Void theme.

## Run

Open `frontend/index.html` in a browser. No backend, package install, or build step is required.

## Controls

- Move: `A` / `D` or left / right arrow keys
- Jump: `Space`
- Pause: `P`, `Escape`, or the pause button
- Mobile: on-screen buttons

## Project Structure

- `frontend/index.html` - static page and script loading order
- `frontend/css/styles.css` - responsive layout, HUD, menu, and touch controls
- `frontend/js/config.js` - shared constants and helpers
- `frontend/js/audio.js` - placeholder Web Audio sound effects
- `frontend/js/input.js` - keyboard and touch input
- `frontend/js/levels.js` - three level definitions
- `frontend/js/particles.js` - jump, hit, checkpoint, and coin particles
- `frontend/js/entities.js` - player, enemies, coins, checkpoints, and flags
- `frontend/js/renderer.js` - Canvas drawing code
- `frontend/js/game.js` - game loop, state, camera, scoring, and level progression
- `backend/` - reserved for future server/API code
