# Invariants - pw-collection

These rules protect the currently used public userscript.

## Gameplay

- One intended game action must result in at most one corresponding gameplay request.
- The script must not send duplicate `turn`, `get_next`, or `get_item` requests because of UI refreshes, retries, or stats failures.
- Zero-card state must stop cleanly and show an understandable message.
- Category `6` is the top category. It cannot be promoted further.
- Completed categories above the target remain risky and require explicit policy/design before automation changes.

## Tampermonkey

- The production userscript must keep working as a Tampermonkey script.
- Metadata permissions are part of runtime behavior and must not change silently.
- Stored stats/auth state must stay under the configured storage prefix.

## Stats

- Remote stats are optional.
- Stats auth, refresh, connect, or send failures must not break card processing.
- Tokens, connect codes, and secrets must not be printed to user-visible UI or logs.

## UI

- Script UI must be distinguishable from the Perfect World site.
- Modals may block input only while asking the user for a decision.
- Toasts and buttons must not cover the core game area more than necessary.

## Mock Testbed

- Mock userscript behavior must remain isolated from production userscript behavior.
- Mock endpoint configuration must not point at real game endpoints.
- `collection.mock.user.js` should be generated from `collection.user.js` plus config overrides.

## Repository Flow

- Do not push directly to `main` unless explicitly instructed.
- Use PRs from feature/fix/refactor/test branches.
- Keep PRs focused on one responsibility.
