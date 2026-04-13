const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const sourcePath = path.join(rootDir, 'collection.user.js');
const outputPath = path.join(rootDir, 'collection.mock.user.js');
const configPath = path.join(__dirname, 'mock-userscript.config.json');

const source = fs.readFileSync(sourcePath, 'utf8');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

function replaceOnce(input, searchValue, replaceValue) {
    if (!input.includes(searchValue)) {
        throw new Error(`Unable to find snippet: ${searchValue}`);
    }

    return input.replace(searchValue, replaceValue);
}

function replaceRegex(input, pattern, replaceValue) {
    if (!pattern.test(input)) {
        throw new Error(`Unable to match pattern: ${pattern}`);
    }

    return input.replace(pattern, replaceValue);
}

let output = source;

output = replaceOnce(output, '// @name         PW collection bot', `// @name         ${config.meta.name}`);
output = replaceOnce(output, '// @namespace    http://tampermonkey.net/', `// @namespace    ${config.meta.namespace}`);
output = replaceOnce(output, '// @version      2024.12.27', `// @version      ${config.meta.version}`);
output = replaceOnce(output, '// @description  Automates the Perfect World "Collection" minigame flow', `// @description  ${config.meta.description}`);
output = replaceOnce(output, '// @updateURL    https://github.com/FairHypo/pw-collection/raw/main/collection.user.js', `// @updateURL    ${config.meta.updateUrl}`);
output = replaceOnce(output, '// @downloadURL  https://github.com/FairHypo/pw-collection/raw/main/collection.user.js', `// @downloadURL  ${config.meta.downloadUrl}`);
output = replaceOnce(output, '// @match        https://pwonline.ru/minigames.php?game=collection&doo=display*', `// @match        ${config.meta.match}`);
output = replaceOnce(output, '// @connect      pw-collection-stats.fairhypocrite.com', `// @connect      ${config.meta.connect}`);

output = replaceOnce(output, "const SCRIPT_VERSION = '2024.12.27';", `const SCRIPT_VERSION = '${config.script.version}';`);
output = replaceOnce(output, "const BASE_URL = 'https://pwonline.ru/minigames.php?game=collection';", `const BASE_URL = '${config.script.baseUrl}';`);
output = replaceOnce(output, "const INFO_URL = `${BASE_URL}&doo=info`;", "const INFO_URL = `${BASE_URL}/info`;");
output = replaceOnce(output, "const TURN_URL = `${BASE_URL}&doo=turn`;", "const TURN_URL = `${BASE_URL}/turn`;");
output = replaceOnce(output, "    baseUrl: 'https://pw-collection-stats.fairhypocrite.com',", `    baseUrl: '${config.script.statsBaseUrl}',`);
output = replaceOnce(output, "    endpoint: 'https://pw-collection-stats.fairhypocrite.com/v1/stats',", `    endpoint: '${config.script.statsBaseUrl}/v1/stats',`);
output = replaceOnce(output, "    connectPage: 'https://pw-collection-stats.fairhypocrite.com/connect',", `    connectPage: '${config.script.statsBaseUrl}/connect',`);
output = replaceOnce(output, "    connectCompleteEndpoint: 'https://pw-collection-stats.fairhypocrite.com/api/v1/connect/complete',", `    connectCompleteEndpoint: '${config.script.statsBaseUrl}/api/v1/connect/complete',`);
output = replaceOnce(output, "    refreshEndpoint: 'https://pw-collection-stats.fairhypocrite.com/api/v1/auth/refresh',", `    refreshEndpoint: '${config.script.statsBaseUrl}/api/v1/auth/refresh',`);
output = replaceOnce(output, "    dashboardUrl: 'https://pw-collection-stats.fairhypocrite.com/dashboard',", `    dashboardUrl: '${config.script.statsBaseUrl}/dashboard',`);
output = replaceOnce(output, "    connectOrigin: 'https://pw-collection-stats.fairhypocrite.com',", `    connectOrigin: '${config.script.statsBaseUrl}',`);
output = replaceOnce(output, "    storagePrefix: 'pwc_stats',", `    storagePrefix: '${config.script.storagePrefix}',`);
output = replaceOnce(output, "    clientLabel: 'Tampermonkey browser',", `    clientLabel: '${config.script.clientLabel}',`);
output = replaceRegex(output, /pageLoaded:\s*'[^']*',/, `pageLoaded: ${JSON.stringify(config.script.pageLoaded)},`);
output = replaceRegex(output, /readyToastMessage:\s*'[^']*',/, `readyToastMessage: ${JSON.stringify(config.script.readyToastMessage)},`);
output = replaceRegex(output, /function getScriptSource\(\)\s*\{[\s\S]*?\n\}/, `function getScriptSource() {\n    return typeof GM_xmlhttpRequest === 'function' ? '${config.script.scriptSourceTampermonkey}' : '${config.script.scriptSourceBrowser}';\n}`);

output = replaceRegex(output, /async loadCurrentState\(\)\s*\{[\s\S]*?\n    \}/, `async loadCurrentState() {\n        const {rows = {}, quantity = 0} = await this.fetchJson(INFO_URL);\n\n        return {\n            rows: {\n                1: parseInt(rows[1] ?? rows['1'] ?? 0, 10),\n                2: parseInt(rows[2] ?? rows['2'] ?? 0, 10),\n                3: parseInt(rows[3] ?? rows['3'] ?? 0, 10),\n                4: parseInt(rows[4] ?? rows['4'] ?? 0, 10),\n                5: parseInt(rows[5] ?? rows['5'] ?? 0, 10),\n                6: parseInt(rows[6] ?? rows['6'] ?? 0, 10)\n            },\n            quantity: parseInt(quantity, 10)\n        };\n    }`);
output = replaceRegex(output, /async openNextCard\(\)\s*\{[\s\S]*?\n    \}/, `async openNextCard() {\n        await fetch(TURN_URL, {method: 'POST'});\n    }`);
output = replaceRegex(output, /async collectReward\(category\)\s*\{[\s\S]*?\n    \}/, `async collectReward(category) {\n        try {\n            await fetch(\`${'${BASE_URL}'}/get-item\`, {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({category})\n            });\n            console.log(\`Mock reward collected for category \${category}\`);\n        } catch (error) {\n            console.error(\`Failed to collect mock reward for category \${category}:\`, error);\n        }\n    }`);
output = replaceRegex(output, /async promoteCategory\(category\)\s*\{\r?\n\s*await fetch\(`\$\{BASE_URL\}&doo=get_next&category=\$\{category\}`\);\r?\n\s*this\.updateCurrentState\(await this\.loadCurrentState\(\)\);\r?\n/, `async promoteCategory(category) {\n        await fetch(\`${'${BASE_URL}'}/get-next\`, {\n            method: 'POST',\n            headers: {'Content-Type': 'application/json'},\n            body: JSON.stringify({category})\n        });\n        this.updateCurrentState(await this.loadCurrentState());\n`);

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Generated ${path.relative(rootDir, outputPath)}`);
