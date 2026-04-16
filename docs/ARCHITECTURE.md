# Architecture - pw-collection

This repository contains the browser-side automation for the Perfect World "Collection" minigame.

## System Shape

```text
Tampermonkey / browser console
  -> collection.user.js UI layer
  -> card automation loop
  -> Perfect World collection endpoints
  -> optional stats client
  -> pw-collection-stats service

Mock testbed page
  -> collection.mock.user.js
  -> mock collection API on pw-collection-stats
```

## Main Artifacts

- `collection.user.js`
  Production userscript installed by players.
- `collection.mock.user.js`
  Generated userscript for the mock collection testbed.
- `scripts/build-mock-userscript.cjs`
  Builds the mock userscript from the production script and `scripts/mock-userscript.config.json`.
- `tests/*.test.cjs`
  Node-based syntax, helper, and mock-build checks.

## Boundaries

### Userscript flow

The core loop reads collection state, opens cards, promotes completed lower categories, claims the configured target category, and stops on risky states such as a completed category above the target.

This flow is high risk. Do not change request order, retry behavior, timing, or stop conditions without explicit design review.

### Site integration

Production integration targets the Perfect World collection page and endpoints under:

- `doo=display`
- `doo=info`
- `doo=turn`
- `doo=get_next`
- `doo=get_item`

The script must remain compatible with Tampermonkey and, where possible, browser-console execution.

### Stats integration

Remote stats are optional. If stats auth, refresh, network, or server persistence fails, the card-processing flow must continue unless the user explicitly requested otherwise.

### UI layer

The script owns in-page overlays, prompts, toasts, and action buttons. UI should be visually distinct from the game site and must not unexpectedly block game controls.

### Mock testbed

Mock behavior is a development/testing path. It must not leak into the production userscript unless explicitly planned.

## Forbidden Patterns

- Duplicate gameplay requests for one intended action.
- Making remote stats required for normal card processing.
- Hand-editing generated mock output without updating the generator/config source.
- Changing Tampermonkey metadata silently.
- Mixing production game endpoints with mock testbed endpoints.
- Adding new user-visible strings directly inside control flow when a messages/config layer is practical.
