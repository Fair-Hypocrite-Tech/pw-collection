const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, '..', 'collection.user.js');
const scriptSource = fs.readFileSync(scriptPath, 'utf8');

function extractConst(name) {
    const pattern = new RegExp(`const ${name} = [\\s\\S]*?;`, 'm');
    const match = scriptSource.match(pattern);

    if (!match) {
        throw new Error(`Unable to extract constant ${name}`);
    }

    return match[0];
}

function extractFunction(name) {
    const startToken = `function ${name}(`;
    const startIndex = scriptSource.indexOf(startToken);

    if (startIndex === -1) {
        throw new Error(`Unable to extract function ${name}`);
    }

    const bodyStart = scriptSource.indexOf('{', startIndex);
    let depth = 0;
    let endIndex = -1;

    for (let index = bodyStart; index < scriptSource.length; index++) {
        const character = scriptSource[index];

        if (character === '{') {
            depth++;
        } else if (character === '}') {
            depth--;

            if (depth === 0) {
                endIndex = index + 1;
                break;
            }
        }
    }

    if (endIndex === -1) {
        throw new Error(`Unable to determine end of function ${name}`);
    }

    return scriptSource.slice(startIndex, endIndex);
}

function loadHelpers() {
    const sandbox = {
        URL,
        window: {
            location: {
                origin: 'https://pw-collection-stats.fairhypocrite.com'
            }
        }
    };
    const helperSource = [
        extractConst('CATEGORY_KEYS'),
        extractConst('TOP_CATEGORY'),
        extractConst('DEFAULT_CATEGORY_LIMIT'),
        extractConst('TOP_CATEGORY_LIMIT'),
        extractConst('STATS_CONFIG'),
        extractConst('POLICY_MODES'),
        extractConst('ABOVE_SECONDARY_ACTIONS'),
        extractConst('DEFAULT_COLLECTION_PRESETS'),
        "const UI_COPY = { targetLabel: 'Target', customPresetTitleClaim: (target, secondary) => `Target ${target}, забирать до ${secondary}`, customPresetTitleStrict: target => `Target ${target}, строгий стоп`, advancedPresetDescriptionStrict: target => `Strict ${target}`, advancedPresetDescriptionClaim: (target, secondary) => `Claim ${target}-${secondary}` };",
        extractFunction('createEmptyRows'),
        extractFunction('createEmptyState'),
        extractFunction('createEmptyStats'),
        extractFunction('getCategoryLimit'),
        extractFunction('isValidTargetCategory'),
        extractFunction('findPresetById'),
        extractFunction('normalizePresetChoice'),
        extractFunction('buildCustomPreset'),
        extractFunction('sortPresetsByPreference'),
        extractFunction('buildPresetList'),
        extractFunction('isFutureTimestamp'),
        extractFunction('normalizeStatsAuthState'),
        extractFunction('hasUsableAccessToken'),
        extractFunction('canRefreshStatsSession'),
        extractFunction('buildStatsConnectUrl'),
        'this.helpers = { createEmptyRows, createEmptyState, createEmptyStats, getCategoryLimit, isValidTargetCategory, findPresetById, normalizePresetChoice, buildCustomPreset, sortPresetsByPreference, buildPresetList, isFutureTimestamp, normalizeStatsAuthState, hasUsableAccessToken, canRefreshStatsSession, buildStatsConnectUrl, CATEGORY_KEYS, TOP_CATEGORY, DEFAULT_CATEGORY_LIMIT, TOP_CATEGORY_LIMIT, STATS_CONFIG, POLICY_MODES, ABOVE_SECONDARY_ACTIONS, DEFAULT_COLLECTION_PRESETS };'
    ].join('\n\n');

    vm.runInNewContext(helperSource, sandbox);
    return sandbox.helpers;
}

const helpers = loadHelpers();

function normalize(value) {
    return JSON.parse(JSON.stringify(value));
}

test('createEmptyRows builds all categories with zero counters', () => {
    assert.deepEqual(
        normalize(helpers.createEmptyRows()),
        {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    );
});

test('createEmptyState starts with zero quantity and zero rows', () => {
    assert.deepEqual(
        normalize(helpers.createEmptyState()),
        {
            rows: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0},
            quantity: 0
        }
    );
});

test('createEmptyStats tracks per-category counters and total', () => {
    assert.deepEqual(
        normalize(helpers.createEmptyStats()),
        {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, total: 0}
    );
});

test('getCategoryLimit keeps 10 only for the top category', () => {
    assert.equal(helpers.getCategoryLimit(1), 5);
    assert.equal(helpers.getCategoryLimit(5), 5);
    assert.equal(helpers.getCategoryLimit(6), 10);
});

test('isValidTargetCategory accepts only integer-like values from 1 to 6', () => {
    assert.equal(helpers.isValidTargetCategory('1'), true);
    assert.equal(helpers.isValidTargetCategory('6'), true);
    assert.equal(helpers.isValidTargetCategory(3), true);
    assert.equal(helpers.isValidTargetCategory('0'), false);
    assert.equal(helpers.isValidTargetCategory('7'), false);
    assert.equal(helpers.isValidTargetCategory('abc'), false);
    assert.equal(helpers.isValidTargetCategory(''), false);
    assert.equal(helpers.isValidTargetCategory(null), false);
});

test('default collection presets cover the most common target flows', () => {
    assert.deepEqual(
        normalize(helpers.DEFAULT_COLLECTION_PRESETS.map(preset => ({
            id: preset.id,
            targetCategory: preset.targetCategory,
            mode: preset.policy.mode,
            secondaryTarget: preset.policy.secondaryTarget
        }))),
        [
            {
                id: 'target-3-claim-4-5',
                targetCategory: 3,
                mode: 'claim-up-to-secondary',
                secondaryTarget: 5
            },
            {
                id: 'target-5',
                targetCategory: 5,
                mode: 'strict',
                secondaryTarget: 5
            },
            {
                id: 'target-6',
                targetCategory: 6,
                mode: 'strict',
                secondaryTarget: 6
            }
        ]
    );
});

test('sortPresetsByPreference moves the remembered preset first', () => {
    const sorted = helpers.sortPresetsByPreference(helpers.DEFAULT_COLLECTION_PRESETS, 'target-6');

    assert.equal(sorted[0].id, 'target-6');
    assert.deepEqual(normalize(sorted.map(preset => preset.id).sort()), ['target-3-claim-4-5', 'target-5', 'target-6']);
});

test('buildPresetList keeps custom remembered presets available first', () => {
    const customPreset = helpers.normalizePresetChoice({
        id: 'manual-4',
        title: 'Manual 4',
        targetCategory: 4,
        policy: {mode: 'strict', secondaryTarget: 4, onAboveSecondary: 'stop'}
    });
    const presets = helpers.buildPresetList(customPreset);

    assert.equal(presets[0].id, 'manual-4');
    assert.equal(presets.length, helpers.DEFAULT_COLLECTION_PRESETS.length + 1);
});

test('normalizePresetChoice rejects invalid target categories', () => {
    assert.equal(helpers.normalizePresetChoice({id: 'bad', targetCategory: 7}), null);
    assert.equal(helpers.normalizePresetChoice(null), null);

    assert.deepEqual(
        normalize(helpers.normalizePresetChoice({
            id: 'manual-4',
            title: 'Manual 4',
            targetCategory: '4',
            policy: {mode: 'strict'}
        })),
        {
            id: 'manual-4',
            title: 'Manual 4',
            description: '',
            targetCategory: 4,
            policy: {mode: 'strict'}
        }
    );
});

test('buildCustomPreset creates strict and claim-up-to-secondary policies safely', () => {
    assert.equal(helpers.buildCustomPreset(7), null);

    assert.deepEqual(
        normalize(helpers.buildCustomPreset(4, helpers.POLICY_MODES.strict, 6)),
        {
            id: 'custom-4-strict',
            title: 'Target 4, строгий стоп',
            description: 'Strict 4',
            targetCategory: 4,
            policy: {
                mode: 'strict',
                secondaryTarget: 4,
                onAboveSecondary: 'stop'
            }
        }
    );

    assert.deepEqual(
        normalize(helpers.buildCustomPreset(3, helpers.POLICY_MODES.claimUpToSecondary, 5)),
        {
            id: 'custom-3-claim-up-to-5',
            title: 'Target 3, забирать до 5',
            description: 'Claim 3-5',
            targetCategory: 3,
            policy: {
                mode: 'claim-up-to-secondary',
                secondaryTarget: 5,
                onAboveSecondary: 'stop'
            }
        }
    );
});

test('normalizeStatsAuthState keeps only complete auth payloads', () => {
    assert.deepEqual(
        normalize(helpers.normalizeStatsAuthState({
            clientId: ' client-1 ',
            accessToken: ' token-a ',
            refreshToken: ' token-r ',
            accessExpiresAt: '2026-04-20T00:00:00.000Z',
            refreshExpiresAt: '2026-04-30T00:00:00.000Z'
        })),
        {
            clientId: 'client-1',
            accessToken: 'token-a',
            refreshToken: 'token-r',
            accessExpiresAt: '2026-04-20T00:00:00.000Z',
            refreshExpiresAt: '2026-04-30T00:00:00.000Z'
        }
    );

    assert.equal(helpers.normalizeStatsAuthState({clientId: 'x'}), null);
});

test('hasUsableAccessToken respects the grace window before expiry', () => {
    const nowMs = Date.parse('2026-04-11T10:00:00.000Z');

    assert.equal(helpers.hasUsableAccessToken({
        accessToken: 'token',
        accessExpiresAt: '2026-04-11T10:05:00.000Z'
    }, nowMs), true);

    assert.equal(helpers.hasUsableAccessToken({
        accessToken: 'token',
        accessExpiresAt: '2026-04-11T10:00:20.000Z'
    }, nowMs), false);
});

test('canRefreshStatsSession accepts only non-expired refreshable states', () => {
    const nowMs = Date.parse('2026-04-11T10:00:00.000Z');

    assert.equal(helpers.canRefreshStatsSession({
        clientId: 'client-1',
        refreshToken: 'refresh-token',
        refreshExpiresAt: '2026-04-11T11:00:00.000Z'
    }, nowMs), true);

    assert.equal(helpers.canRefreshStatsSession({
        clientId: 'client-1',
        refreshToken: 'refresh-token',
        refreshExpiresAt: '2026-04-11T09:59:59.000Z'
    }, nowMs), false);
});

test('buildStatsConnectUrl passes current page origin for connect callback', () => {
    const connectUrl = new URL(helpers.buildStatsConnectUrl('browser-1'));

    assert.equal(connectUrl.searchParams.get('clientId'), 'browser-1');
    assert.equal(connectUrl.searchParams.get('clientLabel'), helpers.STATS_CONFIG.clientLabel);
    assert.equal(connectUrl.searchParams.get('returnOrigin'), 'https://pw-collection-stats.fairhypocrite.com');
});
