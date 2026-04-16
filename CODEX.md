# Codex Notes

Read [AGENTS.md](AGENTS.md) first.

Codex-specific reminders for this repository:

- Keep progress updates short and explicit: what is being checked, changed, or verified.
- Prefer small, reviewable patches. This project is user-facing during live game events.
- Before editing `collection.user.js`, identify whether the change can affect real Perfect World requests.
- Treat Tampermonkey metadata changes as behavior changes; mention them in the final summary.
- Preserve the default public flow. Stats and mock behavior must not become required for normal users.
- For UI work, verify that overlays are distinguishable from the game page and do not block the play area unexpectedly.
- For mock work, regenerate `collection.mock.user.js` through `scripts/build-mock-userscript.cjs` instead of hand-editing generated sections unless the task explicitly requires it.
- If runtime behavior is unclear, pause in design mode rather than guessing.
