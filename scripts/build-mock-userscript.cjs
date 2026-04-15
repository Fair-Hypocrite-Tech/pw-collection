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
output = replaceOnce(
    output,
    '// @match        https://pwonline.ru/minigames.php?game=collection&doo=display*',
    config.meta.matches.map(match => `// @match        ${match}`).join('\n')
);
output = replaceOnce(
    output,
    '// @connect      pw-collection-stats.fairhypocrite.com',
    config.meta.connectHosts.map(host => `// @connect      ${host}`).join('\n')
);

output = replaceOnce(output, "const SCRIPT_VERSION = '2024.12.27';", `const SCRIPT_VERSION = '${config.script.version}';`);
output = replaceOnce(output, "const BASE_URL = 'https://pwonline.ru/minigames.php?game=collection';", "const MOCK_ORIGIN = window.location.origin;\nconst BASE_URL = `${MOCK_ORIGIN}/api/v1/mock-collection`;");
output = replaceOnce(output, "const INFO_URL = `${BASE_URL}&doo=info`;", "const INFO_URL = `${BASE_URL}/info`;");
output = replaceOnce(output, "const TURN_URL = `${BASE_URL}&doo=turn`;", "const TURN_URL = `${BASE_URL}/turn`;");
output = replaceOnce(output, "    baseUrl: 'https://pw-collection-stats.fairhypocrite.com',", "    baseUrl: MOCK_ORIGIN,");
output = replaceOnce(output, "    endpoint: 'https://pw-collection-stats.fairhypocrite.com/v1/stats',", "    endpoint: `${MOCK_ORIGIN}/v1/stats`,");
output = replaceOnce(output, "    connectPage: 'https://pw-collection-stats.fairhypocrite.com/connect',", "    connectPage: `${MOCK_ORIGIN}/connect`,");
output = replaceOnce(output, "    connectCompleteEndpoint: 'https://pw-collection-stats.fairhypocrite.com/api/v1/connect/complete',", "    connectCompleteEndpoint: `${MOCK_ORIGIN}/api/v1/connect/complete`,");
output = replaceOnce(output, "    refreshEndpoint: 'https://pw-collection-stats.fairhypocrite.com/api/v1/auth/refresh',", "    refreshEndpoint: `${MOCK_ORIGIN}/api/v1/auth/refresh`,");
output = replaceOnce(output, "    dashboardUrl: 'https://pw-collection-stats.fairhypocrite.com/dashboard',", "    dashboardUrl: `${MOCK_ORIGIN}/dashboard`,");
output = replaceOnce(output, "    connectOrigin: 'https://pw-collection-stats.fairhypocrite.com',", "    connectOrigin: MOCK_ORIGIN,");
output = replaceOnce(output, "    storagePrefix: 'pwc_stats',", `    storagePrefix: '${config.script.storagePrefix}',`);
output = replaceOnce(output, "    clientLabel: 'Tampermonkey browser',", `    clientLabel: '${config.script.clientLabel}',`);
output = replaceRegex(output, /pageLoaded:\s*'[^']*',/, `pageLoaded: ${JSON.stringify(config.script.pageLoaded)},`);
output = replaceRegex(output, /readyToastMessage:\s*'[^']*',/, `readyToastMessage: ${JSON.stringify(config.script.readyToastMessage)},`);
output = replaceRegex(output, /function getScriptSource\(\)\s*\{[\s\S]*?\n\}/, `function getScriptSource() {\n    return typeof GM_xmlhttpRequest === 'function' ? '${config.script.scriptSourceTampermonkey}' : '${config.script.scriptSourceBrowser}';\n}`);
output = replaceOnce(
    output,
    "const STORAGE_KEYS = {",
    `const MOCK_POLICY_CONFIG = ${JSON.stringify(config.script.policy, null, 4)};\n\nconst STORAGE_KEYS = {`
);

output = replaceRegex(output, /async loadCurrentState\(\)\s*\{[\s\S]*?\n    \}/, `async loadCurrentState() {\n        const {rows = {}, quantity = 0} = await this.fetchJson(INFO_URL);\n\n        return {\n            rows: {\n                1: parseInt(rows[1] ?? rows['1'] ?? 0, 10),\n                2: parseInt(rows[2] ?? rows['2'] ?? 0, 10),\n                3: parseInt(rows[3] ?? rows['3'] ?? 0, 10),\n                4: parseInt(rows[4] ?? rows['4'] ?? 0, 10),\n                5: parseInt(rows[5] ?? rows['5'] ?? 0, 10),\n                6: parseInt(rows[6] ?? rows['6'] ?? 0, 10)\n            },\n            quantity: parseInt(quantity, 10)\n        };\n    }`);
output = replaceRegex(output, /async function requestTargetCategory\(\)\s*\{[\s\S]*?\n\}/, `async function requestTargetCategory() {\n    return ui.prompt(UI_COPY.targetTitle, MESSAGES.targetCategoryPrompt, {\n        label: UI_COPY.targetLabel,\n        placeholder: UI_COPY.targetPlaceholder,\n        confirmText: UI_COPY.targetConfirm,\n        cancelText: UI_COPY.targetCancel,\n        validate: value => isValidTargetCategory(value) ? true : MESSAGES.invalidTargetCategory\n    });\n}\n\nfunction normalizeMockPolicy(rawPolicy) {\n    if (!rawPolicy || !rawPolicy.mode) {\n        return null;\n    }\n\n    const primaryTarget = parseInt(rawPolicy.primaryTarget, 10);\n    const secondaryTarget = parseInt(rawPolicy.secondaryTarget, 10);\n    const onAboveSecondary = String(rawPolicy.onAboveSecondary || MOCK_POLICY_CONFIG.defaultOnAboveSecondary);\n\n    if (!Number.isInteger(primaryTarget) || primaryTarget < 1 || primaryTarget > 6) {\n        return null;\n    }\n\n    if (!Number.isInteger(secondaryTarget) || secondaryTarget < 1 || secondaryTarget > 6 || secondaryTarget <= primaryTarget) {\n        return null;\n    }\n\n    return {\n        mode: String(rawPolicy.mode),\n        primaryTarget,\n        secondaryTarget,\n        onAboveSecondary\n    };\n}\n\nfunction getMockPolicyFromPage() {\n    const modeNode = document.getElementById('mock-policy-mode');\n    if (!modeNode) {\n        return null;\n    }\n\n    return normalizeMockPolicy({\n        mode: modeNode.value || MOCK_POLICY_CONFIG.defaultMode,\n        primaryTarget: document.getElementById('mock-policy-primary')?.value || MOCK_POLICY_CONFIG.defaultPrimaryTarget,\n        secondaryTarget: document.getElementById('mock-policy-secondary')?.value || MOCK_POLICY_CONFIG.defaultSecondaryTarget,\n        onAboveSecondary: document.getElementById('mock-policy-above')?.value || MOCK_POLICY_CONFIG.defaultOnAboveSecondary\n    });\n}\n\nfunction formatMockPolicyDetails(policy) {\n    if (!policy) {\n        return MOCK_POLICY_CONFIG.detailsNone;\n    }\n\n    return [\n        MOCK_POLICY_CONFIG.detailsMode + policy.mode,\n        MOCK_POLICY_CONFIG.detailsPrimary + policy.primaryTarget,\n        MOCK_POLICY_CONFIG.detailsSecondary + policy.secondaryTarget,\n        MOCK_POLICY_CONFIG.detailsAbove + policy.onAboveSecondary\n    ].join('\\n');\n}`);
output = replaceRegex(output, /async openNextCard\(\)\s*\{[\s\S]*?\n    \}/, `async openNextCard() {\n        await fetch(TURN_URL, {method: 'POST'});\n    }`);
output = replaceRegex(output, /async collectReward\(category\)\s*\{[\s\S]*?\n    \}/, `async collectReward(category) {\n        try {\n            await fetch(\`${'${BASE_URL}'}/get-item\`, {\n                method: 'POST',\n                headers: {'Content-Type': 'application/json'},\n                body: JSON.stringify({category})\n            });\n            console.log(\`Mock reward collected for category \${category}\`);\n        } catch (error) {\n            console.error(\`Failed to collect mock reward for category \${category}:\`, error);\n        }\n    }`);
output = replaceRegex(output, /async promoteCategory\(category\)\s*\{\r?\n\s*await fetch\(`\$\{BASE_URL\}&doo=get_next&category=\$\{category\}`\);\r?\n\s*this\.updateCurrentState\(await this\.loadCurrentState\(\)\);\r?\n/, `async promoteCategory(category) {\n        await fetch(\`${'${BASE_URL}'}/get-next\`, {\n            method: 'POST',\n            headers: {'Content-Type': 'application/json'},\n            body: JSON.stringify({category})\n        });\n        this.updateCurrentState(await this.loadCurrentState());\n`);
output = replaceRegex(output, /constructor\(targetCategory, debugModeOn\) \{\s*this\.currentState = createEmptyState\(\);[\s\S]*?this\.statsSent = false;\s*\}/, `constructor(targetCategory, debugModeOn, policy = null) {\n        this.currentState = createEmptyState();\n        this.quantityStats = createEmptyStats();\n        this.targetCategory = targetCategory;\n        this.debugModeOn = debugModeOn;\n        this.policy = policy;\n        this.startTime = performance.now();\n        this.startedAt = new Date();\n        this.statsSent = false;\n    }`);
output = replaceRegex(output, /async handleCompletedCategory\(category\) \{[\s\S]*?\n    \}/, `async handleCompletedCategory(category) {\n        if (!this.isCategoryComplete(category)) {\n            return false;\n        }\n\n        if (category < this.targetCategory) {\n            await this.promoteCategory(category);\n            return false;\n        }\n\n        if (category === this.targetCategory) {\n            await this.collectReward(this.targetCategory);\n            this.updateCurrentState(await this.loadCurrentState());\n            return false;\n        }\n\n        return this.handleCategoryAboveTarget(category);\n    }\n\n    async handleCategoryAboveTarget(category) {\n        if (!this.policy || !this.policy.mode || this.policy.mode === 'strict') {\n            await this.sayTargetOverachieved();\n            return true;\n        }\n\n        if (category <= this.policy.secondaryTarget) {\n            switch (this.policy.mode) {\n            case 'claim-up-to-secondary':\n                await this.collectReward(category);\n                this.updateCurrentState(await this.loadCurrentState());\n                return false;\n            case 'push-to-secondary':\n            case 'stop-above-secondary':\n                if (category < this.policy.secondaryTarget) {\n                    await this.promoteCategory(category);\n                } else {\n                    await this.collectReward(category);\n                    this.updateCurrentState(await this.loadCurrentState());\n                }\n                return false;\n            default:\n                await this.sayTargetOverachieved();\n                return true;\n            }\n        }\n\n        switch (this.policy.onAboveSecondary) {\n        case 'claim':\n            await this.collectReward(category);\n            this.updateCurrentState(await this.loadCurrentState());\n            return false;\n        case 'promote_once':\n            if (category >= TOP_CATEGORY) {\n                await this.sayTargetOverachieved();\n                return true;\n            }\n            await this.promoteCategory(category);\n            return false;\n        case 'stop':\n        default:\n            await this.sayTargetOverachieved();\n            return true;\n        }\n    }`);

output = replaceOnce(
    output,
    "            details: buildStatsPanelDetails(),",
    "            details: [buildStatsPanelDetails(), formatMockPolicyDetails(getMockPolicyFromPage())].join('\\n\\n'),"
);
output = replaceRegex(
    output,
    /const debugModeOn = false;\s*const roulette = new CollectionRoulette\(parseInt\(targetCategoryInput, 10\), debugModeOn\);\s*await roulette\.process\(\);/,
    "const targetCategory = parseInt(targetCategoryInput, 10);\n    const policy = getMockPolicyFromPage();\n    const debugModeOn = false;\n    const roulette = new CollectionRoulette(targetCategory, debugModeOn, policy);\n\n    if (policy && policy.primaryTarget !== targetCategory) {\n        ui.toast(MOCK_POLICY_CONFIG.toastTitle, MOCK_POLICY_CONFIG.toastTargetMismatch, 'info', 4200);\n        roulette.policy = {...policy, primaryTarget: targetCategory};\n    } else if (policy) {\n        ui.toast(MOCK_POLICY_CONFIG.toastTitle, MOCK_POLICY_CONFIG.toastLoaded, 'info', 2600);\n    } else {\n        ui.toast(MOCK_POLICY_CONFIG.toastTitle, MOCK_POLICY_CONFIG.toastDefaulted, 'info', 2600);\n    }\n\n    await roulette.process();"
);

fs.writeFileSync(outputPath, output, 'utf8');
console.log(`Generated ${path.relative(rootDir, outputPath)}`);
