Original prompt: Use the Gemini CLI to kick off some agents while continuing the roadmap from the existing foundation, with enemy + collision pipeline as the next big slice.

## 2026-04-13

- Confirmed the local `gemini` CLI is installed and usable.
- `gemini-3.1-pro-preview` hit capacity limits during headless runs, so the working flash-tier fallback for this session is `gemini-3.1-flash-lite-preview`.
- Started the encounter-layer implementation inside the main app:
  - Added data-driven enemy definitions.
  - Added an enemy lifecycle/spawn system.
  - Added a collision mediator for projectile/enemy and player/enemy checks.
  - Added deterministic browser hooks via `window.advanceTime` and `window.render_game_to_text`.
- Verification:
  - `npm run check` passed.
  - `npm run lint` passed.
  - `npm run build` passed.
  - Playwright client run confirmed enemy presence and player hull loss.
  - Adaptive Playwright probe confirmed a real projectile kill and score increase (`score: 120`, `destroyedEnemies: 1`).
- Follow-up TODOs:
  - Add visible impact/VFX feedback so enemy hits read more strongly than the current HUD log alone.
  - Bias encounter pacing into clearer wave groups instead of steady trickle spawning.
  - Fold boss-stage architecture onto the new enemy/collision interfaces instead of creating a second combat path.
