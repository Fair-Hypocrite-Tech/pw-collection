# Standards - pw-collection

## Development Discipline

- Use design mode before non-trivial behavior changes.
- Keep changes small and scoped to the task.
- Prefer preserving current player-visible behavior unless the task explicitly changes it.
- Document manual verification when automated coverage cannot represent Tampermonkey behavior.

## User-Visible Text

- Put new production userscript strings in `MESSAGES`, `UI_COPY`, or another explicit text/config layer.
- Put mock-only text in `scripts/mock-userscript.config.json` or a mock-specific text layer.
- Do not scatter new hardcoded UI strings through runtime logic.

## Tests And Checks

Run these checks before pushing when the touched files make them relevant:

```powershell
node scripts/build-mock-userscript.cjs
node --check collection.user.js
node --check collection.mock.user.js
node --test tests/*.test.cjs
```

Required coverage expectations:

- Helper behavior changes need Node tests where practical.
- Mock generator/config changes need mock build tests or updated existing assertions.
- Tampermonkey metadata changes need a manual verification note.
- Gameplay request order or timing changes need explicit design review and a manual test plan.

## Tampermonkey Metadata

Treat these metadata fields as part of the public contract:

- `@match`
- `@grant`
- `@connect`
- `@updateURL`
- `@downloadURL`

Changing them can affect installation, browser permissions, or update behavior.

## Stats Safety

- Remote stats must stay optional for normal users.
- Failed stats requests must not stop the main collection loop.
- Auth/session storage must remain scoped by the configured storage prefix.
- Do not log secrets, access tokens, refresh tokens, or connect codes.

## Mock Safety

- The mock script must clearly identify itself in metadata and UI.
- Mock endpoints must point to the stats mock API, not the real game endpoints.
- Mock probabilities and policies are test controls, not production defaults.

## UI Standards

- Script UI should be visually distinguishable from the Perfect World page.
- Keep overlays responsive enough for smaller browser windows.
- Do not block the game area except during explicit modal prompts.
- Prefer toasts or in-page panels over native alerts for new UI.

## Scope Control

Bug fixes should not include unrelated refactors.

Refactors should avoid changing:

- request order
- stop conditions
- storage keys
- Tampermonkey permissions
- public install/update URLs
