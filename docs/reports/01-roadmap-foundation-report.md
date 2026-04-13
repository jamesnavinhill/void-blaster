# Void Blaster Foundation Roadmap Report

Date: 2026-04-13

## Purpose

Turn the original raw outline into a production-grade roadmap that locks the initial technical direction, defines v1 scope boundaries, and sets up the repo for high-confidence agentic implementation.

## Product Definition

Void Blaster is a desktop-first browser shooter with:

- A behind-the-ship flight camera
- Four-direction movement with roll
- Mouse and keyboard control support
- Neon tunnel traversal with strong speed readability
- Blaster + special attack combat
- Escalating enemy pressure leading into a boss stage
- Boss-special unlocks that expand the player's loadout
- Minimal HUD and a right-side live-tuning rail
- Theme-driven presentation with multiple preset palettes from day one

## Decisions Locked In On 2026-04-13

- Canonical app directory: `app`
- Rendering/runtime stack: `Three.js` with `TypeScript`
- Dev/build stack: `Vite`
- Initial platform target: desktop-first browser
- Scope strategy: not a tiny throwaway vertical slice; foundation work must support multiple themes, multiple specials, and live tuning from the start
- Documentation policy: preserve the ideas from the intake outline, but rewrite them into structured numbered docs
- Git target: initialize locally, connect to `https://github.com/jamesnavinhill/void-blaster.git`, and push if local auth allows it

## Foundation Principles

- Build real systems, not disposable spikes
- Keep the repo clean and organized; no loose root clutter
- Favor data-driven systems where new themes, enemies, and specials plug into existing structure
- Avoid fragmented one-off implementations that force rewrites later
- Keep docs current after each working session
- Delegate large, coherent chunks to agents instead of scattering tiny tasks

## V1 Scope

V1 is the first serious playable foundation, not a toy prototype. It should include:

- A responsive ship controller with roll support
- A smooth follow camera from behind the ship
- A reusable tunnel/grid world presentation
- A primary blaster system
- An initial special system with multiple specials available from the start
- A clean HUD with only necessary information
- A right-side tuning rail toggleable with `F1`
- Multiple preset visual themes from day one
- A codebase structure intended to scale into enemy waves, bosses, progression, and additional content

## Recommended Architecture

### Runtime

- `Vite` for fast local iteration and straightforward browser-game delivery
- `TypeScript` in strict mode for durable systems work
- `Three.js` for direct control over render loop, scene graph, materials, lighting, and shader growth paths

### System Boundaries

- App bootstrap and lifecycle
- Input mapping and action translation
- Player flight model and camera rig
- Tunnel/world presentation
- Weapon and projectile systems
- Theme and tuning registries
- UI shell for HUD and live controls

### Why This Direction

This approach matches the design brief better than a heavier app framework or a more abstract rendering layer. It preserves control over performance, rendering, and gameplay feel while still keeping the developer experience fast.

## Roadmap

### Phase 1: Foundation and Environment

- Initialize repo, remote, and ignore rules
- Scaffold the app with `Vite` + `TypeScript` + `Three.js`
- Set up linting and baseline project conventions
- Replace starter template code with a real game shell
- Establish docs, ops rules, and agent workflow

### Phase 2: Flight Core

- Finalize movement model
- Finalize roll behavior
- Tune follow camera
- Stabilize keyboard and mouse input mapping

### Phase 3: Combat Core

- Lock the primary blaster loop
- Implement special-attack framework
- Ensure specials are data-driven and extensible
- Add projectile lifecycle and collision-readiness

### Phase 4: Encounter Layer

- Introduce enemy families
- Add wave pacing and difficulty scaling
- Add boss stage structure
- Add boss-special unlock flow

### Phase 5: Theme and Presentation Layer

- Expand theme library
- Add stronger VFX/audio hooks
- Improve tunnel readability and speed sensation
- Tune HUD clarity and low-noise presentation

### Phase 6: Production Hardening

- Performance profiling
- Asset pipeline and content workflow cleanup
- Gameplay balancing passes
- Documentation parity and ops maintenance

## Agentic Work Breakdown

These are the preferred large implementation slices for delegated work once the foundation is stable:

1. Core runtime and lifecycle
2. Flight and camera systems
3. Tunnel/grid world generation
4. Combat and projectile framework
5. Theme and tuning systems
6. HUD and right-rail UI shell
7. Enemy/boss encounter systems
8. VFX/audio/performance polish

This breakdown was cross-checked with the locally installed Gemini CLI and kept intentionally broad so each agent owns a meaningful system instead of a fragment.

## Risks and Tradeoffs

### Risk: Overbuilding Before Playability

Tradeoff:
Building for scale can slow the first playable moment.

Response:
Keep the foundation real, but make every foundational system immediately visible and testable in the running app.

### Risk: Theme and tuning systems become cosmetic bolt-ons

Tradeoff:
It is easy to leave theme switching and tuning as surface-only features.

Response:
Make themes and tuning first-class config inputs that directly affect rendering and feel.

### Risk: Agentic work creates inconsistent code

Tradeoff:
Parallel implementation can drift if ownership boundaries are weak.

Response:
Use large slices, explicit ownership, and verification on every delegated task.

## Official References

- Vite guide: <https://vite.dev/guide/>
- Three.js installation manual: <https://threejs.org/manual/#en/installation>
- TypeScript `tsconfig` documentation: <https://www.typescriptlang.org/docs/handbook/tsconfig-json.html>
- ESLint getting started: <https://eslint.org/docs/latest/use/getting-started>
- Gemini CLI docs: <https://geminicli.com/docs/>
- Gemini CLI GitHub repository: <https://github.com/google-gemini/gemini-cli>

## Outcome For This Session

This roadmap authorizes:

- Repo bootstrap
- Dev-environment setup
- Initial app scaffold
- Initial docs and ops structure
- Git initialization and remote sync attempt
