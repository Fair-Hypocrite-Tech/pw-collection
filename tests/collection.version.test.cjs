const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function metadataVersion(source) {
    const match = source.match(/\/\/ @version\s+(.+)/);
    assert.ok(match, 'metadata @version is missing');
    return match[1].trim();
}

function scriptVersion(source) {
    const match = source.match(/const SCRIPT_VERSION = '([^']+)';/);
    assert.ok(match, 'SCRIPT_VERSION is missing');
    return match[1];
}

test('production userscript metadata and runtime versions match', () => {
    const source = read('collection.user.js');

    assert.equal(metadataVersion(source), scriptVersion(source));
});

test('mock userscript metadata, runtime version, and config versions match', () => {
    const source = read('collection.mock.user.js');
    const config = JSON.parse(read('scripts/mock-userscript.config.json'));
    const version = metadataVersion(source);

    assert.equal(version, scriptVersion(source));
    assert.equal(version, config.meta.version);
    assert.equal(version, config.script.version);
    assert.match(version, /-mock$/);
});
