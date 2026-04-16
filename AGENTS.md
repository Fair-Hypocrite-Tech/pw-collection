# AI Agent Instructions - pw-collection

Shared instructions for repository-aware coding agents working in this project.

## Operating Modes

### DESIGN MODE

Use design mode before any non-trivial change unless the user has already approved execution for the current task.

Before writing code:
1. State what is being changed and why.
2. List what must NOT break.
3. Identify affected areas: userscript flow, site integration, stats integration, UI layer, mock testbed.
4. Propose a minimal step-by-step plan.

Do not write code in design mode. Wait for approval or an explicit request to proceed.

### EXECUTION MODE

- Follow the approved plan strictly.
- Make minimal changes.
- Avoid unrelated cleanup or refactoring unless the task explicitly includes it.
- Keep user-visible behavior stable unless the task requires a change.

## Required Project Context

Read these files before changing behavior:

- [docs/STANDARDS.md](docs/STANDARDS.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/REFERENCE.md](docs/REFERENCE.md)
- [docs/INVARIANTS.md](docs/INVARIANTS.md)
- [docs/project-state.md](docs/project-state.md)

For broad or risky work, update the relevant docs in the same PR.

## Hard Rules

### Stability

- This userscript is already used by real players.
- Do not change the default gameplay flow casually.
- Treat all requests to the game endpoints as sensitive behavior.
- Stats/reporting features must stay optional and fail-safe unless the user explicitly changes the default behavior.
- The mock userscript must not accidentally target production game endpoints.

### Tests

- Never silently modify or delete existing tests.
- If a test must change, state the reason explicitly in the commit message:
  `kept / adapted / replaced / removed - reason`
- New behavior requires a new test where practical.
- If automated tests are not available for a change, include a short manual verification plan.

### Scope

- Do not refactor code outside the task scope.
- Do not add speculative features during bug fixes.
- Do not change public script behavior just because the internal structure could be cleaner.

## Git Flow

Preferred branch flow:

`feat/*`, `fix/*`, `refactor/*`, `test/*` -> PR -> `main`

Conventions:
- Never push directly to `main` unless the user explicitly overrides the normal flow.
- One PR should have one clear responsibility.
- Commit messages: `type: short description`
- Types: `feat`, `fix`, `refactor`, `test`, `ci`, `docs`

### Git Command Sequencing

- Never run git operations in parallel.
- Do not fire-and-forget git commands.
- Execute git commands sequentially and wait for each command to finish.
- Leave a short pause between `fetch`, `merge`/`rebase`, `add`, `commit`, and `push` when automating a sequence.
- Never rewrite shared history unless the user explicitly asks for it.

## Project Invariants

- The userscript must keep working in Tampermonkey.
- The userscript may also be pasted into the browser console when the task allows it.
- The core game loop must not send duplicate gameplay actions.
- Frontend/UI changes must not interfere with the page controls or block the game area unexpectedly.
- External stats collection must fail safely and must not break the main card-processing flow.
- Personal stats configuration must remain isolated from the default public usage flow.
- The production userscript and mock userscript must stay visibly and technically separate.

## Current Product Shape

- `collection.user.js` is the main production artifact.
- `collection.mock.user.js` is the generated mock-testbed artifact.
- `scripts/build-mock-userscript.cjs` generates the mock artifact from the production script plus config overrides.
- `README.md` documents installation and behavior.
- The script currently combines:
  - game automation logic
  - optional remote stats sending
  - in-page UI overlays/modals
  - mock-only policy controls in the generated mock artifact

## Before Every Change

- Is this DESIGN or EXECUTION mode?
- What files will be touched?
- Does this change alter the game request order or timing?
- Does this change affect Tampermonkey grants, matches, or connect permissions?
- Does this change alter visible behavior for normal users?
- Is stats collection still optional and failure-safe?
- Does this affect only mock/testbed behavior or production behavior too?
- Are existing tests still valid?
- Is the change covered by a test or manual verification note?

## Golden Rule

If you are unsure whether a change preserves runtime behavior for players:
- stop
- switch to design mode
- describe the risk
- do not proceed until the approach is confirmed
