# Project State - pw-collection

Last reviewed by agent docs pass: 2026-04-16.

## Current State

The project contains a production Tampermonkey userscript for the Perfect World "Collection" minigame and a generated mock userscript for safe testbed runs.

Implemented capabilities:

- automatic card opening
- target category selection
- promotion of completed lower categories
- reward claim for the selected target category
- stop/decision behavior for risky above-target states
- in-page modal/toast UI instead of relying only on native alerts
- in-script help modal explaining launch, stats connection, presets, and mock-testbed source behavior
- runtime UI strings continue moving into `UI_COPY`/`MESSAGES` instead of inline modal logic
- lightweight preset selection before launch, including the common target 3/5/6 flows
- advanced preset builder for safe custom target behavior using the existing strict and claim-up-to-secondary policies
- local preference ordering for the last selected default or manual preset
- backend preference sync for connected stats users, with local fallback if sync fails
- optional remote stats connect/send flow
- generated mock userscript for `/mock-collection`
- CI checks for syntax, mock generation, and helper tests

## Active Design Direction

- Keep the default free/public card-processing flow stable.
- Use the mock testbed to validate behavior before live events.
- Move new user-visible text into explicit text/config layers.
- Improve observability and manual testing without changing live gameplay behavior casually.
- Keep stats and future advanced behavior optional unless explicitly approved.
- For stats-connected users, sync previously selected policy/preset choices to the stats backend and rank preferred presets first on later script launches.
- Keep preset UI lightweight: default choices should stay focused on a few common scenarios, with advanced custom policy controls behind a later expandable section.

## Known Constraints

- `collection.user.js` is intentionally still a single main artifact for Tampermonkey simplicity.
- Some browser-only behavior cannot be fully covered by Node tests.
- Production game endpoint behavior must be treated as external and sensitive.
- The generated mock script can drift if the generator is bypassed.

## Likely Next Work

- Continue extracting/localizing UI strings.
- Add tests around any new policy behavior.
- Improve dashboard visibility for connected production vs mock stats sources.
- Keep production and mock flows clearly separated.
