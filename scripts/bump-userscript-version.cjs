const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const productionPath = path.join(rootDir, 'collection.user.js');
const mockConfigPath = path.join(rootDir, 'scripts', 'mock-userscript.config.json');

const nextVersion = process.argv[2];

if (!nextVersion || !/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/.test(nextVersion)) {
    console.error('Usage: node scripts/bump-userscript-version.cjs YYYY.MM.DD[.N]');
    process.exit(1);
}

function replaceOrFail(input, pattern, replacement, label) {
    if (!pattern.test(input)) {
        throw new Error(`Unable to update ${label}`);
    }

    return input.replace(pattern, replacement);
}

const mockVersion = `${nextVersion}-mock`;

let production = fs.readFileSync(productionPath, 'utf8');
production = replaceOrFail(production, /\/\/ @version\s+.+/, `// @version      ${nextVersion}`, 'production metadata version');
production = replaceOrFail(production, /const SCRIPT_VERSION = '[^']+';/, `const SCRIPT_VERSION = '${nextVersion}';`, 'production SCRIPT_VERSION');
fs.writeFileSync(productionPath, production, 'utf8');

const mockConfig = JSON.parse(fs.readFileSync(mockConfigPath, 'utf8'));
mockConfig.meta.version = mockVersion;
mockConfig.script.version = mockVersion;
fs.writeFileSync(mockConfigPath, `${JSON.stringify(mockConfig, null, 2)}\n`, 'utf8');

console.log(`Production version: ${nextVersion}`);
console.log(`Mock version: ${mockVersion}`);
console.log('Run: node scripts/build-mock-userscript.cjs');
