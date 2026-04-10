# AI Agent Instructions - pw-collection

Shared instructions for repository-aware coding agents working in this project.

## Operating Modes

### DESIGN MODE

Use design mode before any non-trivial change unless the user has already approved execution for the current task.

Before writing code:
1. State what is being changed and why.
2. List what must NOT break.
3. Identify affected areas: userscript flow, site integration, stats integration, UI layer.
4. Propose a minimal step-by-step plan.

Do not write code in design mode. Wait for approval or an explicit request to proceed.

### EXECUTION MODE

- Follow the approved plan strictly.
- Make minimal changes.
- Avoid unrelated cleanup or refactoring unless the task explicitly includes it.
- Keep user-visible behavior stable unless the task requires a change.

## Hard Rules

### Stability

- This userscript is already used by real players.
- Do not change the default gameplay flow casually.
- Treat all requests to the game endpoints as sensitive behavior.
- Stats/reporting features must stay optional unless the user explicitly changes the default behavior.

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

`feat/*`, `fix/*`, `refactor/*`, `test/*`, `docs/*`, `ci/*` -> PR -> `main`

Conventions:
- Never push directly to `main` unless the user explicitly overrides the normal flow.
- One PR should have one clear responsibility.
- Commit messages: `type: short description`
- Types: `feat`, `fix`, `refactor`, `test`, `ci`, `docs`

## Project Invariants

- The userscript must keep working in Tampermonkey.
- The userscript may also be pasted into the browser console when the task allows it.
- The core game loop must not send duplicate gameplay actions.
- Frontend/UI changes must not interfere with the page controls or block the game area unexpectedly.
- External stats collection must fail safely and must not break the main card-processing flow.
- Personal stats configuration must remain isolated from the default public usage flow.

## Current Product Shape

- `collection.user.js` is the main artifact.
- `README.md` documents installation and behavior.
- The script currently combines:
  - game automation logic
  - optional personal stats sending
  - in-page UI overlays/modals

## Before Every Change

- Is this DESIGN or EXECUTION mode?
- What files will be touched?
- Does this change alter the game request order or timing?
- Does this change affect Tampermonkey grants or permissions?
- Does this change alter visible behavior for normal users?
- Is stats collection still optional and failure-safe?
- Are existing tests still valid?
- Is the change covered by a test or manual verification note?

## Golden Rule

If you are unsure whether a change preserves runtime behavior for players:
- stop
- switch to design mode
- describe the risk
- do not proceed until the approach is confirmed
