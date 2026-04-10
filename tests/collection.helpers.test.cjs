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
    const sandbox = {};
    const helperSource = [
        extractConst('CATEGORY_KEYS'),
        extractConst('TOP_CATEGORY'),
        extractConst('DEFAULT_CATEGORY_LIMIT'),
        extractConst('TOP_CATEGORY_LIMIT'),
        extractFunction('createEmptyRows'),
        extractFunction('createEmptyState'),
        extractFunction('createEmptyStats'),
        extractFunction('getCategoryLimit'),
        extractFunction('isValidTargetCategory'),
        'this.helpers = { createEmptyRows, createEmptyState, createEmptyStats, getCategoryLimit, isValidTargetCategory, CATEGORY_KEYS, TOP_CATEGORY, DEFAULT_CATEGORY_LIMIT, TOP_CATEGORY_LIMIT };'
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
