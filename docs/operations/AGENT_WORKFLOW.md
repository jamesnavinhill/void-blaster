# AGENT_WORKFLOW

## Intent

Use Codex as orchestrator and reviewer, and use Gemini CLI for large, efficient implementation slices when delegation is beneficial.

## Operating Model

- Codex defines the target outcome, file ownership, and acceptance criteria
- Gemini receives large, coherent tasks instead of tiny fragments
- Codex reviews Gemini output, fixes gaps, finishes integration, and updates docs
- Every session ends with docs parity

## Task Sizing

Good delegated slices:

- Core runtime and lifecycle
- Flight controller and camera behavior
- Weapon and projectile framework
- Enemy or boss systems
- UI rail or HUD subsystems
- Performance or polish passes with clear boundaries

Bad delegated slices:

- One-off micro-edits
- Vague “make it better” prompts
- Changes without file ownership or acceptance criteria

## Local Gemini Usage

The local `gemini` command is installed and can run headless in this project.

Example:

```powershell
gemini --prompt "Implement the tunnel grid system in app/src/game/world with reusable config and no placeholder template code." --output-format text
```

## Delegation Rules

- Give Gemini explicit scope
- Name the files or directories it should own when possible
- Ask for validation notes, not just code
- Review the output before treating the task as complete
- Fold results back into the roadmap and plan if the architecture shifts

## References

- <https://geminicli.com/docs/>
- <https://github.com/google-gemini/gemini-cli>
