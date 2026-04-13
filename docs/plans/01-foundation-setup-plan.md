# Foundation Setup Plan

Date: 2026-04-13

## Goal

Stand up a clean, documented, scalable starting point for Void Blaster so agentic implementation can begin on top of a stable foundation instead of a raw outline.

## Workstreams

### 1. Repo and Docs

- Replace the raw outline with a formal roadmap report
- Add the first numbered plan
- Add standing operations docs for architecture and agent workflow
- Update `README.md`

### 2. Tooling and Environment

- Scaffold `app` with `Vite` + `TypeScript`
- Add `Three.js`
- Add `ESLint`
- Add root `.gitignore` and `.editorconfig`

### 3. Game Foundation

- Replace starter Vite demo code
- Establish an organized source layout
- Create a render/runtime shell
- Add input handling
- Add player, camera, tunnel, theme, and tuning foundations
- Add a basic weapon/special scaffold that proves the data model in the running app

### 4. Source Control

- Initialize git
- Attach the GitHub remote
- Make the first commit
- Attempt first push

## Exit Criteria

- The app runs locally
- The app builds cleanly
- The repo conventions are documented
- `resources/` is ignored
- Docs are committed
- The codebase is ready for large delegated implementation slices

## Immediate Next Slices After This Setup

1. Enemy framework and collision pipeline
2. Boss encounter architecture
3. Expanded specials and unlock flow
4. Audio + VFX response layer
5. Theme expansion and balancing pass
