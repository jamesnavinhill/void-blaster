Original prompt: Use the Gemini CLI to kick off some agents while continuing the roadmap from the existing foundation, with enemy + collision pipeline as the next big slice.

## 2026-04-13

- Confirmed the local `gemini` CLI is installed and usable.
- `gemini-3.1-pro-preview` hit capacity limits during headless runs, so the working flash-tier fallback for this session is `gemini-3.1-flash-lite-preview`.
- A later attempt to use Gemini on the default `code` project failed with `SERVICE_DISABLED` for `cloudaicompanion.googleapis.com`, so this boss/wave slice was finished locally.
- Started the encounter-layer implementation inside the main app:
  - Added data-driven enemy definitions.
  - Added an enemy lifecycle/spawn system.
  - Added a collision mediator for projectile/enemy and player/enemy checks.
  - Added deterministic browser hooks via `window.advanceTime` and `window.render_game_to_text`.
- Extended the encounter layer into boss architecture:
  - Added a directed wave controller with phase labels and boss handoff.
  - Added the first boss system on the same projectile/collision contracts.
  - Added a reward hook that unlocks `Phase Bomb Overdrive` after boss clear.
- Verification:
  - `npm run check` passed.
  - `npm run lint` passed.
  - `npm run build` passed.
  - Playwright client run confirmed enemy presence and player hull loss.
  - Adaptive Playwright probe confirmed a real projectile kill and score increase (`score: 120`, `destroyedEnemies: 1`).
  - Browser verification confirmed wave progression into a live boss state (`encounter.phase: "BOSS"`, boss HP visible).
  - Adaptive boss probe confirmed full reward flow (`encounter.phase: "REWARD"`, `score: 1800`, `phaseBombOverdrive: true`).
- Follow-up TODOs:
  - Add visible impact/VFX feedback so enemy hits read more strongly than the current HUD log alone.
  - Give the boss its own attack patterns or spawned hazards so the fight is not just a large collision target.
  - Expand the reward system from a single unlock hook into a broader progression/loadout screen.
  - Add audio response for wave transitions, boss intro, shield damage, and reward unlock moments.

## 2026-04-13 Asset + Flow Pass

- Added a first GLB-backed ship pass with procedural fallbacks still intact:
  - Player now attempts to load `wipeout_spaceship.glb`.
  - Common enemies now attempt to load `namek_spaceship.glb`.
  - The boss now attempts to load `intergalactic_spaceship_only_model.glb`.
- Added repo support for assets outside the Vite app root via `server.fs.allow`.
- Added gameplay flow controls:
  - `Esc` toggles pause during an active run.
  - `R` or `Enter` restarts after hull breach or sector clear.
  - Added a centered HUD overlay for pause / loss / clear states.
- Added reset hooks across player, weapons, enemies, and wave flow so restart is a true run reset instead of a partial soft reset.
- Pending verification:
  - Confirm the imported GLBs face the right direction and scale well in the tunnel.
  - Confirm pause freezes simulation and restart cleanly repopulates the first wave.
- Added lightweight debug hooks for verification:
  - Force a common-enemy preview.
  - Force a boss preview.
  - Force hull breach and restart.
- Swapped the common-enemy trial asset from `namek_spaceship.glb` to `stylised_spaceship.glb` after the first screenshot pass did not produce a readable enemy silhouette.
- Fixed a small HUD edge case where the unlock toast displayed at simulation time `0`.
- Removed the forced pause from asset preview hooks so verification screenshots can focus on the ships themselves.
- Verification update:
  - `npm run check` passed.
  - `npm run lint` passed.
  - `npm run build` passed.
  - Browser verification confirmed:
    - `wipeout_spaceship.glb` reads well as the player ship.
    - `stylised_spaceship.glb` is a much stronger common-enemy fit than the first trial asset.
    - `intergalactic_spaceship_only_model.glb` works as a boss silhouette, though it currently reads darker/moodier than the player.
    - `Esc` pauses the run and `R` restarts after forced breach.

## 2026-04-13 Theme Polish + Live Theme Tuning

- Expanded the theme system from 3 presets to 6 tuned presets with richer lighting and FX defaults:
  - `Neon Core`, `Sunrise Drive`, `Moonlight Prism`, `Ember Veil`, `Verdant Flux`, and `Solstice Arc`.
  - Theme definitions now carry lighting defaults, hull tones, grid palette suggestions, and glow/pulse defaults.
- Replaced the native theme `<select>` with a styled theme-card grid in the tuning rail.
  - This resolves the unreadable white popup menu issue and keeps theme selection visually aligned with the rest of the HUD.
- Added per-theme visual customization with local persistence:
  - Grid color swatch grid plus custom color input.
  - Glow intensity dial.
  - Pulse amount dial.
  - Overall lighting dial.
  - Reset button restores the current theme to its authored defaults.
- Wired the new visual tuning into the actual scene, not just the UI shell:
  - Scene fog and light intensities now follow theme + user tuning.
  - Tunnel frame opacity and pulse animate from theme FX values.
  - Player, enemies, and boss now respond to theme glow/pulse values through emissive tuning.
- Fixed a rail UX issue found during browser verification:
  - When the rail was open and scrolled, the `Hide Tuning` button could overlap the top theme card.
  - The toggle now shifts outside the rail while open so the panel scrolls cleanly.
- Verification:
  - `npm run check` passed.
  - `npm run build` passed.
  - Playwright client screenshot pass confirmed the rail opens cleanly and renders the styled theme panel.
  - Manual Playwright pass confirmed live theme switching to `Verdant Flux`, grid color changes, and persisted dial values in `render_game_to_text`.
  - Manual browser pass reported no runtime/page errors (`errors.json` was empty).
- Notes:
  - `npm run lint` is currently blocked by generated `.mjs` files under `app/output/web-game/post-opt-pass`, not by this theme slice.
