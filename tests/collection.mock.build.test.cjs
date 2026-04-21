const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mockScriptPath = path.join(__dirname, '..', 'collection.mock.user.js');
const mockScriptSource = fs.readFileSync(mockScriptPath, 'utf8');

test('mock userscript targets both mock pages and uses the current mock origin', () => {
    assert.match(mockScriptSource, /@name\s+PW collection bot mock dev/);
    assert.match(mockScriptSource, /@match\s+https:\/\/dev\.pw-collection-stats\.fairhypocrite\.com\/mock-collection\*/);
    assert.match(mockScriptSource, /@match\s+https:\/\/pw-collection-stats\.fairhypocrite\.com\/mock-collection\*/);
    assert.match(mockScriptSource, /const MOCK_ORIGIN = window\.location\.origin;/);
    assert.match(mockScriptSource, /const BASE_URL = `\$\{MOCK_ORIGIN\}\/api\/v1\/mock-collection`;/);
    assert.match(mockScriptSource, /storagePrefix: 'pwc_mock_stats'/);
    assert.match(mockScriptSource, /connectOrigin: MOCK_ORIGIN/);
    assert.match(mockScriptSource, /connectUrl\.searchParams\.set\('returnOrigin', window\.location\.origin\);/);
    assert.match(mockScriptSource, /supportUrl: `\$\{MOCK_ORIGIN\}\/support`/);
});

test('mock userscript uses mock-compatible collection API calls', () => {
    assert.match(mockScriptSource, /await fetch\(TURN_URL, \{method: 'POST'\}\);/);
    assert.match(mockScriptSource, /await fetch\(`\$\{BASE_URL\}\/get-item`, \{/);
    assert.match(mockScriptSource, /await fetch\(`\$\{BASE_URL\}\/get-next`, \{/);
    assert.match(mockScriptSource, /return typeof GM_xmlhttpRequest === 'function' \? 'mock-tampermonkey' : 'mock-browser-console';/);
});

test('mock userscript includes dev-only policy integration for the mock testbed', () => {
    assert.match(mockScriptSource, /const MOCK_POLICY_CONFIG = \{/);
    assert.match(mockScriptSource, /function getMockPolicyFromPage\(\)/);
    assert.match(mockScriptSource, /document\.getElementById\('mock-policy-mode'\)/);
    assert.match(mockScriptSource, /async handleCategoryAboveTarget\(category\)/);
    assert.match(mockScriptSource, /formatMockPolicyDetails\(getMockPolicyFromPage\(\)\)/);
    assert.match(mockScriptSource, /MOCK_POLICY_CONFIG\.toastTargetMismatch/);
});

test('mock userscript keeps the shared help copy for stats and testbed setup', () => {
    assert.match(mockScriptSource, /scriptHelpDetails/);
    assert.match(mockScriptSource, /mock-tampermonkey/);
    assert.match(mockScriptSource, /openScriptHelpPanel/);
});
