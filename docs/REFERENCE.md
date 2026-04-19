# Reference - pw-collection

## Files

- `collection.user.js`
  Production userscript.
- `collection.mock.user.js`
  Generated mock userscript for the stats service mock page.
- `scripts/build-mock-userscript.cjs`
  Mock userscript generator.
- `scripts/mock-userscript.config.json`
  Mock metadata, endpoint, storage, copy, and policy overrides.
- `tests/collection.helpers.test.cjs`
  Helper-level tests for extracted userscript functions.
- `tests/collection.mock.build.test.cjs`
  Generated mock userscript assertions.
- `.github/workflows/ci.yml`
  Pull-request and branch CI for userscript syntax, mock generation, and tests.

## Production Userscript Metadata

Production install target:

- `https://pwonline.ru/minigames.php?game=collection&doo=display*`

Production network permission:

- `pw-collection-stats.fairhypocrite.com`

Tampermonkey grants:

- `GM_getValue`
- `GM_setValue`
- `GM_deleteValue`
- `GM_xmlhttpRequest`

## Mock Userscript Metadata

Mock page targets:

- `https://dev.pw-collection-stats.fairhypocrite.com/mock-collection*`
- `https://pw-collection-stats.fairhypocrite.com/mock-collection*`

Mock network permissions:

- `dev.pw-collection-stats.fairhypocrite.com`
- `pw-collection-stats.fairhypocrite.com`

## Important Runtime Constants

- `BASE_URL`
  Perfect World collection endpoint root in production; mock API root in the generated mock script.
- `INFO_URL`
  Reads current collection state.
- `TURN_URL`
  Opens the next card.
- `CATEGORY_KEYS`
  Categories `1` through `6`.
- `DEFAULT_CATEGORY_LIMIT`
  Required count for categories `1` through `5`.
- `TOP_CATEGORY_LIMIT`
  Required count for category `6`.
- `STATS_CONFIG`
  Optional remote stats/connect/auth configuration.
  Includes stats ingest, connect, refresh, dashboard, and script preference endpoints.
- `DEFAULT_COLLECTION_PRESETS`
  Lightweight production preset list shown before launch.
- `POLICY_MODES`
  Runtime policy modes used by production presets.
- `MESSAGES` and `UI_COPY`
  Production userscript text layers.
- `MOCK_POLICY_CONFIG`
  Mock-only policy text and defaults injected into `collection.mock.user.js`.

## External Game Actions

The production script interacts with the game through these action names:

- `doo=info`
- `doo=turn`
- `doo=get_next`
- `doo=get_item`

Any change around these calls requires extra care.

## Stats API Contract Used By The Script

- `POST /v1/stats`
  Sends final run stats.
- `GET|POST /api/v1/script/preferences`
  Loads or saves the connected client's preferred preset with bearer userscript-session auth.
- `POST /api/v1/connect/complete`
  Exchanges a one-time browser connect code for script tokens.
- `POST /api/v1/auth/refresh`
  Refreshes script tokens.
- `/connect`
  Opens the web connect flow.
- `/dashboard`
  Opens the web dashboard.

## Local Checks

```powershell
node scripts/build-mock-userscript.cjs
node --check collection.user.js
node --check collection.mock.user.js
node --test tests/*.test.cjs
```

## Pull Request Checklist

- CI passes.
- Tampermonkey metadata changes are called out.
- Gameplay request order/timing changes are called out.
- Stats collection still fails safely.
- Mock script is regenerated if generator/config changed.
- Manual verification steps are included for browser-only behavior.
