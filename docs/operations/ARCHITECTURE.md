# ARCHITECTURE

## Repo Layout

- `app` contains the playable browser game
- `docs/reports` contains numbered reports
- `docs/plans` contains numbered plans
- `docs/operations` contains standing operations docs
- `resources` is local-only reference and asset staging material and is ignored by git

## Application Direction

- Runtime: browser
- Build tool: `Vite`
- Language: `TypeScript`
- Renderer: `Three.js`
- Target: desktop-first

## System Design Rules

- New gameplay capabilities should enter through reusable systems, not isolated hacks
- Theme, tuning, and weapon definitions should be data-driven where practical
- Rendering, input, gameplay logic, and UI state should remain separated enough for parallel work
- Starter/template code should be removed quickly once the real app shell exists
- Keep public APIs and config shapes small and explicit

## Expected Source Boundaries

- `config` for themes, specials, and tuneable defaults
- `input` for action collection and device mapping
- `player` for ship behavior
- `world` for tunnel/grid presentation
- `weapons` for primary/special fire systems
- `ui` for HUD and tuning controls
- `game` or `core` for orchestration/runtime

## Definition Of Clean

- No unused starter assets left behind
- No root-level clutter
- No undocumented repo rules
- No partial feature branches pretending to be finished systems
- Docs updated when project direction changes

## References

- <https://vite.dev/guide/>
- <https://threejs.org/manual/#en/installation>
- <https://www.typescriptlang.org/docs/handbook/tsconfig-json.html>
