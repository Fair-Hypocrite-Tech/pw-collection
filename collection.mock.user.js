// ==UserScript==
// @name         PW collection bot mock dev
// @namespace    https://fairhypo.dev/pw-collection/mock
// @version      2024.12.27-mock
// @description  Dev mock version for testing the PW Collection bot against the mock server
// @author       Fair Hypocrite
// @updateURL    https://github.com/Fair-Hypocrite-Tech/pw-collection/raw/main/collection.mock.user.js
// @downloadURL  https://github.com/Fair-Hypocrite-Tech/pw-collection/raw/main/collection.mock.user.js
// @match        https://dev.pw-collection-stats.fairhypocrite.com/mock-collection*
// @icon         https://pwonline.ru/favicon.ico
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @connect      dev.pw-collection-stats.fairhypocrite.com
// ==/UserScript==

const SCRIPT_VERSION = '2024.12.27-mock';
const BASE_URL = 'https://dev.pw-collection-stats.fairhypocrite.com/api/v1/mock-collection';
const INFO_URL = `${BASE_URL}/info`;
const TURN_URL = `${BASE_URL}/turn`;
const CATEGORY_KEYS = [1, 2, 3, 4, 5, 6];
const TOP_CATEGORY = 6;
const DEFAULT_CATEGORY_LIMIT = 5;
const TOP_CATEGORY_LIMIT = 10;
const STATS_CONFIG = {
    enabled: true,
    baseUrl: 'https://dev.pw-collection-stats.fairhypocrite.com',
    endpoint: 'https://dev.pw-collection-stats.fairhypocrite.com/v1/stats',
    connectPage: 'https://dev.pw-collection-stats.fairhypocrite.com/connect',
    connectCompleteEndpoint: 'https://dev.pw-collection-stats.fairhypocrite.com/api/v1/connect/complete',
    refreshEndpoint: 'https://dev.pw-collection-stats.fairhypocrite.com/api/v1/auth/refresh',
    dashboardUrl: 'https://dev.pw-collection-stats.fairhypocrite.com/dashboard',
    connectOrigin: 'https://dev.pw-collection-stats.fairhypocrite.com',
    storagePrefix: 'pwc_mock_stats',
    clientLabel: 'Tampermonkey mock browser',
    connectMessageType: 'pwc-connect-code',
    connectTimeoutMs: 10 * 60 * 1000,
    accessTokenGraceMs: 60 * 1000
};

const MESSAGES = {
    pageLoaded: "Mock page fully loaded!",
    startScript: 'Запустить скрипт разбора карточек?',
    targetCategoryPrompt: 'Введите пожалуйста целевую категорию для сбора от 1 до 6',
    invalidTargetCategory: 'Категория введена неверно.\nВы ошиблись.\nПора научиться считать до шести!',
    targetCategoryConfirmation: targetCategory => `Внимание!\nНачинаем собирать категорию номер ${targetCategory}`,
    cardsAreOut: stats => `Карточки закончились!\n${stats}`,
    targetOverachieved: stats => 'Собрана категория более высокого уровня!\n Примите решение и перезагрузите страницу для перезапуска скрипта \n' + stats,
    currentState: state => `Текущее состояние:\n${JSON.stringify(state, null, '\t')}`,
    missingQuantity: 'Ошибка:\nПараметр quantity отсутствует в newState',
    missingRows: 'Ошибка:\nПараметр rows отсутствует в newState',
    failedToResolveNewCardCategory: 'Ошибка:\nПроблема с получением выпавшей категории!!!',
    debugIntermediateCategory: category => `Дебаг!\nСобралась промежуточная ${category} категория.\nСдвигаем дальше.`,
    debugNewStateComparison: (newRows, currentRows) => (
        `Дебаг!\nНовое состояние\n${JSON.stringify(newRows, null, '\t')}\nТекущее состояние:\n${JSON.stringify(currentRows, null, '\t')}`
    ),
    debugNewCardCategory: (category, quantity) => `Дебаг!\nНовая карточка упала в ${category} категорию.\nТеперь их ${quantity}`,
    statsSent: 'Статистика отправлена на сервер.',
    statsSendFailed: 'Не удалось отправить статистику на сервер.',
    statsTemplate:
        'Время выполнения: __TIME__\n' +
        'Всего потрачено карточек: __TOTAL__\n' +
        'Из них:\n' +
        'Первая категория: __1CAT__ | __1PERCENT__%\n' +
        'Вторая категория: __2CAT__ | __2PERCENT__%\n' +
        'Третья категория: __3CAT__ | __3PERCENT__%\n' +
        'Четвертая категория: __4CAT__ | __4PERCENT__%\n' +
        'Пятая категория: __5CAT__ | __5PERCENT__%\n' +
        'Шестая категория: __6CAT__ | __6PERCENT__%\n'
};

const UI_COPY = {
    brand: 'PW Collection Stats',
    startTitle: 'Запуск скрипта',
    startConfirm: 'Запустить',
    startCancel: 'Не сейчас',
    targetTitle: 'Выбор цели',
    targetLabel: 'Целевая категория',
    targetPlaceholder: 'Введите число от 1 до 6',
    targetConfirm: 'Продолжить',
    targetCancel: 'Отмена',
    launchTitle: 'Подтверждение запуска',
    launchConfirm: 'Запустить',
    launchCancel: 'Отмена',
    ok: 'Закрыть',
    statsTitle: 'Статистика запуска',
    currentStateTitle: 'Текущее состояние',
    currentStateMessage: 'Текущее состояние бота:',
    debugTitle: 'Дебаг',
    errorTitle: 'Ошибка',
    stoppedTitle: 'Скрипт остановлен',
    cardsOutTitle: 'Карточки закончились',
    cardsOutMessage: 'Карточки закончились. Ниже итоговая статистика этого запуска.',
    overachievedTitle: 'Категория выше цели',
    overachievedMessage: 'Собралась категория выше целевой. Дальше лучше принять решение вручную.',
    readyToastTitle: 'PW Collection Stats',
    readyToastMessage: "Mock script interface is ready for test runs.",
    statsToastTitle: 'Статистика'
};

const UI_STYLE = `
.pwc-root{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.pwc-actions{position:fixed;right:20px;bottom:20px;display:flex;flex-direction:column;gap:10px;pointer-events:auto;align-items:flex-end}
.pwc-action{appearance:none;border:none;border-radius:12px;padding:12px 16px;font-size:14px;font-weight:700;cursor:pointer;color:#fff;background:#1f6feb;box-shadow:0 12px 32px rgba(15,23,42,.34);transition:transform .14s ease,box-shadow .14s ease,background .14s ease}
.pwc-action:hover{transform:translateY(-1px);background:#3b82f6}
.pwc-action:active{transform:translateY(1px)}
.pwc-toasts{position:fixed;top:20px;right:20px;display:flex;flex-direction:column;gap:12px;pointer-events:none}
.pwc-toast{min-width:260px;max-width:360px;padding:14px 16px;border-radius:18px;color:#e6edf3;background:#161b22;border:1px solid #30363d;box-shadow:0 18px 44px rgba(0,0,0,.35);transform:translateY(-8px);opacity:0;transition:opacity .18s ease,transform .18s ease}
.pwc-toast.is-visible{opacity:1;transform:translateY(0)}
.pwc-toast--success{border-color:rgba(141,219,140,.55)}
.pwc-toast--error{border-color:rgba(255,180,169,.55)}
.pwc-toast__title{margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#8b949e}
.pwc-toast__message{margin:0;font-size:14px;line-height:1.45;white-space:pre-wrap;color:#e6edf3}
.pwc-modal-layer{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(13,17,23,.72);backdrop-filter:blur(10px);pointer-events:auto}
.pwc-modal-layer.is-open{display:flex}
.pwc-modal{width:min(100%,560px);max-height:calc(100vh - 48px);overflow:auto;border-radius:18px;background:#161b22;color:#e6edf3;border:1px solid #30363d;box-shadow:0 28px 80px rgba(0,0,0,.42);position:relative}
.pwc-modal__content{position:relative;padding:24px}
.pwc-modal__eyebrow{margin:0 0 8px;color:#8b949e;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.pwc-modal__title{margin:0 0 12px;font-size:32px;line-height:1.05;color:#e6edf3}
.pwc-modal__message{margin:0;font-size:16px;line-height:1.55;color:#c9d1d9;white-space:pre-wrap}
.pwc-modal__details{margin-top:18px;padding:16px 18px;border-radius:12px;background:#0d1117;border:1px solid #30363d;font-family:Consolas,"Courier New",monospace;font-size:14px;line-height:1.55;white-space:pre-wrap;color:#e6edf3}
.pwc-modal__field{margin-top:18px}
.pwc-modal__label{display:block;margin-bottom:8px;font-size:13px;font-weight:700;color:#c9d1d9;letter-spacing:.06em;text-transform:uppercase}
.pwc-modal__input{width:100%;box-sizing:border-box;border:1px solid #30363d;background:#0d1117;border-radius:10px;padding:12px 14px;font-size:16px;color:#e6edf3;outline:none}
.pwc-modal__input:focus{border-color:#1f6feb;box-shadow:0 0 0 3px rgba(31,111,235,.24)}
.pwc-modal__actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
.pwc-modal__button{appearance:none;border:none;border-radius:10px;padding:12px 18px;min-width:132px;font-size:14px;font-weight:700;cursor:pointer;transition:transform .14s ease,box-shadow .14s ease,background .14s ease}
.pwc-modal__button:hover{transform:translateY(-1px)}
.pwc-modal__button:active{transform:translateY(1px)}
.pwc-modal__button--primary{color:#fff;background:#1f6feb;box-shadow:0 10px 24px rgba(31,111,235,.22)}
.pwc-modal__button--primary:hover{background:#3b82f6}
.pwc-modal__button--secondary{color:#e6edf3;background:#21262d;border:1px solid #30363d}
.pwc-modal__error{margin-top:12px;color:#ffb4a9;font-size:14px;line-height:1.45;min-height:20px}
@media (max-width:640px){.pwc-actions{left:12px;right:12px;bottom:12px;align-items:stretch}.pwc-action{width:100%}.pwc-toasts{left:12px;right:12px;top:12px}.pwc-toast{max-width:none}.pwc-modal-layer{padding:14px}.pwc-modal__content{padding:22px 18px}.pwc-modal__title{font-size:26px}.pwc-modal__actions{flex-direction:column}.pwc-modal__button{width:100%}}
`;

const STORAGE_KEYS = {
    clientId: `${STATS_CONFIG.storagePrefix}_client_id`,
    authState: `${STATS_CONFIG.storagePrefix}_auth_state`
};

Object.assign(MESSAGES, {
    statsConnected: 'Статистика подключена к вашему кабинету.',
    statsDisconnected: 'Связь со статистикой отключена на этом клиенте.',
    statsSessionExpired: 'Сессия статистики истекла. Подключите кабинет заново.',
    statsConnectTimedOut: 'Окно подключения не передало код вовремя. Попробуйте еще раз.',
    statsConnectCancelled: 'Подключение статистики отменено.'
});

Object.assign(UI_COPY, {
    statsButton: 'Статистика',
    statsPanelTitle: 'Статистика и кабинет',
    statsPanelConnected: 'Статистика подключена к вашему кабинету.',
    statsPanelDisconnected: 'Статистика не подключена. Бот будет работать как обычно, но без сохранения истории на сервере.',
    statsPanelConnect: 'Подключить',
    statsPanelOpenDashboard: 'Кабинет',
    statsPanelDisconnect: 'Отключить',
    statsPanelClose: 'Закрыть',
    statsPanelConnecting: 'Откройте страницу подключения, войдите на сайте и подтвердите привязку текущего клиента.',
    statsPanelWaiting: 'Ожидаем одноразовый код подключения из окна кабинета...',
    statsPanelExpired: 'Сохраненная сессия истекла. Подключите кабинет заново.',
    statsPanelSessionLine: 'Сессия активна до: ',
    statsPanelClientLine: 'Client ID: ',
    statsPanelInstructions: 'После подключения userscript сможет отправлять итоговую статистику автоматически, а в кабинете появится история запусков.'
});

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function createEmptyRows() {
    return CATEGORY_KEYS.reduce((rows, category) => {
        rows[category] = 0;
        return rows;
    }, {});
}

function createEmptyState() {
    return {
        rows: createEmptyRows(),
        quantity: 0
    };
}

function createEmptyStats() {
    return CATEGORY_KEYS.reduce((stats, category) => {
        stats[category] = 0;
        return stats;
    }, {total: 0});
}

function getCategoryLimit(category) {
    return category === TOP_CATEGORY ? TOP_CATEGORY_LIMIT : DEFAULT_CATEGORY_LIMIT;
}

function isValidTargetCategory(targetCategory) {
    if (
        targetCategory === null
        || targetCategory === ''
        || isNaN(targetCategory)
    ) {
        return false;
    }

    const parsedTargetCategory = parseInt(targetCategory, 10);
    return parsedTargetCategory >= CATEGORY_KEYS[0] && parsedTargetCategory <= TOP_CATEGORY;
}

async function requestTargetCategory() {
    return ui.prompt(UI_COPY.targetTitle, MESSAGES.targetCategoryPrompt, {
        label: UI_COPY.targetLabel,
        placeholder: UI_COPY.targetPlaceholder,
        confirmText: UI_COPY.targetConfirm,
        cancelText: UI_COPY.targetCancel,
        validate: value => isValidTargetCategory(value) ? true : MESSAGES.invalidTargetCategory
    });
}

function getScriptSource() {
    return typeof GM_xmlhttpRequest === 'function' ? 'mock-tampermonkey' : 'mock-browser-console';
}

function getStoredValue(key, fallback = null) {
    if (typeof GM_getValue === 'function') {
        return GM_getValue(key, fallback);
    }

    try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : value;
    } catch (error) {
        console.warn('Failed to read storage value:', error);
        return fallback;
    }
}

function setStoredValue(key, value) {
    if (typeof GM_setValue === 'function') {
        GM_setValue(key, value);
        return;
    }

    try {
        window.localStorage.setItem(key, value);
    } catch (error) {
        console.warn('Failed to write storage value:', error);
    }
}

function deleteStoredValue(key) {
    if (typeof GM_deleteValue === 'function') {
        GM_deleteValue(key);
        return;
    }

    try {
        window.localStorage.removeItem(key);
    } catch (error) {
        console.warn('Failed to remove storage value:', error);
    }
}

function parseStoredJSON(value) {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn('Failed to parse stored JSON:', error);
        return null;
    }
}

function isFutureTimestamp(value, nowMs = Date.now()) {
    if (!value) {
        return false;
    }

    const expiresAt = new Date(value).getTime();
    return Number.isFinite(expiresAt) && expiresAt > nowMs;
}

function normalizeStatsAuthState(rawState) {
    if (!rawState || typeof rawState !== 'object') {
        return null;
    }

    const normalizedState = {
        clientId: typeof rawState.clientId === 'string' ? rawState.clientId.trim() : '',
        accessToken: typeof rawState.accessToken === 'string' ? rawState.accessToken.trim() : '',
        refreshToken: typeof rawState.refreshToken === 'string' ? rawState.refreshToken.trim() : '',
        accessExpiresAt: typeof rawState.accessExpiresAt === 'string' ? rawState.accessExpiresAt : '',
        refreshExpiresAt: typeof rawState.refreshExpiresAt === 'string' ? rawState.refreshExpiresAt : ''
    };

    if (!normalizedState.clientId || !normalizedState.refreshToken || !normalizedState.refreshExpiresAt) {
        return null;
    }

    return normalizedState;
}

function hasUsableAccessToken(authState, nowMs = Date.now()) {
    if (!authState || !authState.accessToken) {
        return false;
    }

    const expiresAt = new Date(authState.accessExpiresAt).getTime();
    return Number.isFinite(expiresAt) && expiresAt > nowMs + STATS_CONFIG.accessTokenGraceMs;
}

function canRefreshStatsSession(authState, nowMs = Date.now()) {
    return Boolean(
        authState
        && authState.clientId
        && authState.refreshToken
        && isFutureTimestamp(authState.refreshExpiresAt, nowMs)
    );
}

function loadStatsAuthState() {
    return normalizeStatsAuthState(parseStoredJSON(getStoredValue(STORAGE_KEYS.authState, '')));
}

function saveStatsAuthState(authState) {
    const normalizedState = normalizeStatsAuthState(authState);
    if (!normalizedState) {
        return;
    }

    setStoredValue(STORAGE_KEYS.authState, JSON.stringify(normalizedState));
}

function clearStatsAuthState() {
    deleteStoredValue(STORAGE_KEYS.authState);
}

function createRandomId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    return `pwc-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function getStatsClientId() {
    const storedClientId = String(getStoredValue(STORAGE_KEYS.clientId, '') || '').trim();
    if (storedClientId) {
        return storedClientId;
    }

    const clientId = createRandomId();
    setStoredValue(STORAGE_KEYS.clientId, clientId);
    return clientId;
}

function getStatsStatusSnapshot(nowMs = Date.now()) {
    const authState = loadStatsAuthState();

    return {
        connected: hasUsableAccessToken(authState, nowMs) || canRefreshStatsSession(authState, nowMs),
        clientId: authState?.clientId || getStatsClientId(),
        authState
    };
}

function isStatsEnabled() {
    return Boolean(STATS_CONFIG.enabled && STATS_CONFIG.endpoint);
}

function requestWithGM(options) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: options.method,
            url: options.url,
            headers: options.headers,
            data: options.body,
            onload: response => {
                if (response.status >= 200 && response.status < 300) {
                    resolve({
                        status: response.status,
                        text: response.responseText || ''
                    });
                    return;
                }

                reject(new Error(`Stats server responded with status ${response.status}`));
            },
            onerror: error => {
                reject(new Error(`Stats request failed: ${JSON.stringify(error)}`));
            }
        });
    });
}

async function requestJson(url, options = {}) {
    const method = options.method || 'GET';
    const headers = {
        ...(options.headers || {})
    };
    const body = options.body ? JSON.stringify(options.body) : undefined;

    if (typeof GM_xmlhttpRequest === 'function') {
        const response = await requestWithGM({
            method,
            url,
            headers,
            body
        });

        return response.text ? JSON.parse(response.text) : null;
    }

    const response = await fetch(url, {
        method,
        headers,
        body
    });

    if (!response.ok) {
        throw new Error(`Stats server responded with status ${response.status}`);
    }

    const responseText = await response.text();
    return responseText ? JSON.parse(responseText) : null;
}

async function refreshStatsSession(authState) {
    const response = await requestJson(STATS_CONFIG.refreshEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            clientId: authState.clientId,
            refreshToken: authState.refreshToken
        }
    });

    const nextState = normalizeStatsAuthState(response);
    if (!nextState) {
        throw new Error(MESSAGES.statsSessionExpired);
    }

    saveStatsAuthState(nextState);
    return nextState;
}

async function ensureStatsAccessToken() {
    const authState = loadStatsAuthState();
    if (!authState) {
        return null;
    }

    if (hasUsableAccessToken(authState)) {
        return authState;
    }

    if (!canRefreshStatsSession(authState)) {
        clearStatsAuthState();
        ui.toast(UI_COPY.statsToastTitle, MESSAGES.statsSessionExpired, 'error', 4200);
        return null;
    }

    try {
        return await refreshStatsSession(authState);
    } catch (error) {
        clearStatsAuthState();
        throw error;
    }
}

async function sendStats(payload) {
    const authState = await ensureStatsAccessToken();
    if (!authState) {
        return false;
    }

    await requestJson(STATS_CONFIG.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authState.accessToken}`
        },
        body: payload
    });

    return true;
}

class FancyUI {
    constructor() {
        this.root = null;
        this.actionBar = null;
        this.toastStack = null;
        this.modalLayer = null;
        this.activeResolve = null;
    }

    ensureMounted() {
        if (this.root && document.body.contains(this.root)) {
            return;
        }

        const style = document.createElement('style');
        style.textContent = UI_STYLE;

        this.root = document.createElement('div');
        this.root.className = 'pwc-root';

        this.actionBar = document.createElement('div');
        this.actionBar.className = 'pwc-actions';

        this.toastStack = document.createElement('div');
        this.toastStack.className = 'pwc-toasts';

        this.modalLayer = document.createElement('div');
        this.modalLayer.className = 'pwc-modal-layer';

        this.root.append(style, this.actionBar, this.toastStack, this.modalLayer);
        document.body.appendChild(this.root);
    }

    setActions(actions) {
        this.ensureMounted();
        this.actionBar.innerHTML = '';

        for (const action of actions) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'pwc-action';
            button.textContent = action.label;
            button.addEventListener('click', action.onClick);
            this.actionBar.appendChild(button);
        }
    }

    toast(title, message, tone = 'info', duration = 3200) {
        this.ensureMounted();

        const toast = document.createElement('div');
        toast.className = `pwc-toast pwc-toast--${tone}`;
        toast.innerHTML = `
            <div class="pwc-toast__title">${this.escape(title)}</div>
            <div class="pwc-toast__message">${this.escape(message)}</div>
        `;

        this.toastStack.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('is-visible'));

        window.setTimeout(() => {
            toast.classList.remove('is-visible');
            window.setTimeout(() => toast.remove(), 180);
        }, duration);
    }

    async alert(title, message, details = '') {
        await this.openModal({
            title,
            message,
            details,
            buttons: [
                {label: UI_COPY.ok, value: true, variant: 'primary'}
            ]
        });
    }

    async confirm(title, message, confirmText, cancelText) {
        const result = await this.openModal({
            title,
            message,
            buttons: [
                {label: cancelText, value: false, variant: 'secondary'},
                {label: confirmText, value: true, variant: 'primary'}
            ]
        });

        return result === true;
    }

    async prompt(title, message, options) {
        const result = await this.openModal({
            title,
            message,
            field: {
                label: options.label,
                placeholder: options.placeholder || '',
                value: options.value || ''
            },
            validate: options.validate,
            buttons: [
                {label: options.cancelText || UI_COPY.targetCancel, value: null, variant: 'secondary'},
                {label: options.confirmText || UI_COPY.targetConfirm, value: 'submit', variant: 'primary'}
            ]
        });

        return result;
    }

    openModal(options) {
        this.ensureMounted();

        return new Promise(resolve => {
            this.modalLayer.innerHTML = '';
            this.modalLayer.classList.add('is-open');
            this.activeResolve = resolve;

            const modal = document.createElement('div');
            modal.className = 'pwc-modal';

            const content = document.createElement('div');
            content.className = 'pwc-modal__content';

            const eyebrow = document.createElement('div');
            eyebrow.className = 'pwc-modal__eyebrow';
            eyebrow.textContent = UI_COPY.brand;

            const title = document.createElement('h2');
            title.className = 'pwc-modal__title';
            title.textContent = options.title;

            const message = document.createElement('p');
            message.className = 'pwc-modal__message';
            message.textContent = options.message;

            content.append(eyebrow, title, message);

            let input = null;
            if (options.field) {
                const field = document.createElement('div');
                field.className = 'pwc-modal__field';

                const label = document.createElement('label');
                label.className = 'pwc-modal__label';
                label.textContent = options.field.label;

                input = document.createElement('input');
                input.className = 'pwc-modal__input';
                input.type = 'text';
                input.value = options.field.value;
                input.placeholder = options.field.placeholder;

                label.appendChild(input);
                field.appendChild(label);
                content.appendChild(field);
            }

            if (options.details) {
                const details = document.createElement('pre');
                details.className = 'pwc-modal__details';
                details.textContent = options.details;
                content.appendChild(details);
            }

            const error = document.createElement('div');
            error.className = 'pwc-modal__error';
            content.appendChild(error);

            const actions = document.createElement('div');
            actions.className = 'pwc-modal__actions';

            const close = value => {
                document.removeEventListener('keydown', onKeyDown);
                this.modalLayer.classList.remove('is-open');
                this.modalLayer.innerHTML = '';
                const done = this.activeResolve;
                this.activeResolve = null;
                done(value);
            };

            const submit = button => {
                if (button.value !== 'submit') {
                    close(button.value);
                    return;
                }

                const currentValue = input ? input.value.trim() : '';
                if (typeof options.validate === 'function') {
                    const validation = options.validate(currentValue);
                    if (validation !== true) {
                        error.textContent = validation;
                        return;
                    }
                }

                close(currentValue);
            };

            const onKeyDown = event => {
                if (event.key === 'Escape') {
                    close(null);
                    return;
                }

                if (event.key === 'Enter' && input) {
                    const submitButton = (options.buttons || []).find(button => button.value === 'submit');
                    if (submitButton) {
                        event.preventDefault();
                        submit(submitButton);
                    }
                }
            };

            document.addEventListener('keydown', onKeyDown);

            for (const button of options.buttons || []) {
                const buttonNode = document.createElement('button');
                buttonNode.type = 'button';
                buttonNode.className = `pwc-modal__button pwc-modal__button--${button.variant || 'secondary'}`;
                buttonNode.textContent = button.label;
                buttonNode.addEventListener('click', () => {
                    try {
                        if (typeof button.beforeSubmit === 'function') {
                            const shouldContinue = button.beforeSubmit();
                            if (shouldContinue === false) {
                                return;
                            }
                        }
                    } catch (buttonError) {
                        error.textContent = buttonError instanceof Error ? buttonError.message : String(buttonError);
                        return;
                    }

                    submit(button);
                });
                actions.appendChild(buttonNode);
            }

            content.appendChild(actions);
            modal.appendChild(content);
            this.modalLayer.appendChild(modal);

            if (input) {
                window.setTimeout(() => {
                    input.focus();
                    input.select();
                }, 0);
            }
        });
    }

    escape(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

const ui = new FancyUI();

function buildStatsPanelDetails() {
    const snapshot = getStatsStatusSnapshot();
    const details = [
        snapshot.connected ? UI_COPY.statsPanelConnected : UI_COPY.statsPanelDisconnected,
        UI_COPY.statsPanelClientLine + snapshot.clientId
    ];

    if (snapshot.authState?.accessExpiresAt) {
        details.push(UI_COPY.statsPanelSessionLine + snapshot.authState.accessExpiresAt);
    } else if (snapshot.authState && !snapshot.connected) {
        details.push(UI_COPY.statsPanelExpired);
    }

    details.push('');
    details.push(UI_COPY.statsPanelInstructions);
    return details.join('\n');
}

function waitForConnectCode(clientId) {
    return new Promise((resolve, reject) => {
        let timeoutId = null;

        const cleanup = () => {
            window.removeEventListener('message', onMessage);
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId);
            }
        };

        const onMessage = event => {
            if (event.origin !== STATS_CONFIG.connectOrigin) {
                return;
            }

            const data = event.data;
            if (!data || data.type !== STATS_CONFIG.connectMessageType || data.clientId !== clientId || !data.code) {
                return;
            }

            cleanup();
            resolve(String(data.code));
        };

        timeoutId = window.setTimeout(() => {
            cleanup();
            reject(new Error(MESSAGES.statsConnectTimedOut));
        }, STATS_CONFIG.connectTimeoutMs);

        window.addEventListener('message', onMessage);
    });
}

function buildStatsConnectUrl(clientId) {
    const connectUrl = new URL(STATS_CONFIG.connectPage);
    connectUrl.searchParams.set('clientId', clientId);
    connectUrl.searchParams.set('clientLabel', STATS_CONFIG.clientLabel);
    return connectUrl.toString();
}

function prepareStatsConnectFlow() {
    const clientId = getStatsClientId();
    return {
        clientId,
        connectPromise: waitForConnectCode(clientId)
    };
}

function openStatsConnectPopup(clientId) {
    const popup = window.open(buildStatsConnectUrl(clientId), '_blank', 'width=720,height=880');
    if (!popup) {
        throw new Error(MESSAGES.statsConnectCancelled);
    }

    return popup;
}

async function connectStatsAccount(preparedFlow = null) {
    const connectFlow = preparedFlow || prepareStatsConnectFlow();

    if (!preparedFlow) {
        openStatsConnectPopup(connectFlow.clientId);
    }

    ui.toast(UI_COPY.statsToastTitle, UI_COPY.statsPanelConnecting, 'info', 4200);
    const code = await connectFlow.connectPromise;
    ui.toast(UI_COPY.statsToastTitle, UI_COPY.statsPanelWaiting, 'info', 3200);

    const nextState = await requestJson(STATS_CONFIG.connectCompleteEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            clientId: connectFlow.clientId,
            clientLabel: STATS_CONFIG.clientLabel,
            code
        }
    });

    const normalizedState = normalizeStatsAuthState(nextState);
    if (!normalizedState) {
        throw new Error(MESSAGES.statsConnectCancelled);
    }

    saveStatsAuthState(normalizedState);
    ui.toast(UI_COPY.statsToastTitle, MESSAGES.statsConnected, 'success', 4200);
}

function disconnectStatsAccount() {
    clearStatsAuthState();
    ui.toast(UI_COPY.statsToastTitle, MESSAGES.statsDisconnected, 'success', 3200);
}

async function openStatsPanel() {
    const snapshot = getStatsStatusSnapshot();
    let preparedConnectFlow = null;
    const buttons = [
        {label: UI_COPY.statsPanelClose, value: 'close', variant: 'secondary'}
    ];

    if (snapshot.connected) {
        buttons.push({label: UI_COPY.statsPanelDisconnect, value: 'disconnect', variant: 'secondary'});
        buttons.push({label: UI_COPY.statsPanelOpenDashboard, value: 'dashboard', variant: 'primary'});
    } else {
        buttons.push({
            label: UI_COPY.statsPanelConnect,
            value: 'connect',
            variant: 'primary',
            beforeSubmit: () => {
                preparedConnectFlow = prepareStatsConnectFlow();

                try {
                    openStatsConnectPopup(preparedConnectFlow.clientId);
                } catch (error) {
                    preparedConnectFlow = null;
                    throw error;
                }

                return true;
            }
        });
    }

    const action = await ui.openModal({
        title: UI_COPY.statsPanelTitle,
        message: snapshot.connected ? UI_COPY.statsPanelConnected : UI_COPY.statsPanelDisconnected,
        details: buildStatsPanelDetails(),
        buttons
    });

    if (action === 'connect') {
        try {
            await connectStatsAccount(preparedConnectFlow);
        } catch (error) {
            console.error('Failed to connect stats:', error);
            await ui.alert(UI_COPY.errorTitle, error instanceof Error ? error.message : String(error));
        }
        return;
    }

    if (action === 'disconnect') {
        disconnectStatsAccount();
        return;
    }

    if (action === 'dashboard') {
        window.open(STATS_CONFIG.dashboardUrl, '_blank');
    }
}

function initStatsControls() {
    ui.setActions([
        {
            label: UI_COPY.statsButton,
            onClick: () => {
                void openStatsPanel();
            }
        }
    ]);
}

class CollectionRoulette {
    constructor(targetCategory, debugModeOn) {
        this.currentState = createEmptyState();
        this.quantityStats = createEmptyStats();
        this.targetCategory = targetCategory;
        this.debugModeOn = debugModeOn;
        this.startTime = performance.now();
        this.startedAt = new Date();
        this.statsSent = false;
    }

    async fetchJson(url) {
        const response = await fetch(url);
        return response.json();
    }

    async loadCurrentState() {
        const {rows = {}, quantity = 0} = await this.fetchJson(INFO_URL);

        return {
            rows: {
                1: parseInt(rows[1] ?? rows['1'] ?? 0, 10),
                2: parseInt(rows[2] ?? rows['2'] ?? 0, 10),
                3: parseInt(rows[3] ?? rows['3'] ?? 0, 10),
                4: parseInt(rows[4] ?? rows['4'] ?? 0, 10),
                5: parseInt(rows[5] ?? rows['5'] ?? 0, 10),
                6: parseInt(rows[6] ?? rows['6'] ?? 0, 10)
            },
            quantity: parseInt(quantity, 10)
        };
    }

    async openNextCard() {
        await fetch(TURN_URL, {method: 'POST'});
    }

    async collectReward(category) {
        try {
            await fetch(`${BASE_URL}/get-item`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({category})
            });
            console.log(`Mock reward collected for category ${category}`);
        } catch (error) {
            console.error(`Failed to collect mock reward for category ${category}:`, error);
        }
    }

    async promoteCategory(category) {
        await fetch(`${BASE_URL}/get-next`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({category})
        });
        this.updateCurrentState(await this.loadCurrentState());

        if (this.debugModeOn) {
            await ui.alert(UI_COPY.debugTitle, MESSAGES.debugIntermediateCategory(category));
        }
    }

    async handleCompletedCategory(category) {
        if (!this.isCategoryComplete(category)) {
            return false;
        }

        if (category < this.targetCategory) {
            await this.promoteCategory(category);
            return false;
        }

        if (category === this.targetCategory) {
            await this.collectReward(this.targetCategory);
            this.updateCurrentState(await this.loadCurrentState());
            return false;
        }

        await this.sayTargetOverachieved();
        return true;
    }

    isCategoryComplete(category) {
        return this.currentState.rows[category] === getCategoryLimit(category);
    }

    cardsAreOut(currentQuantity) {
        return currentQuantity === 0;
    }

    hasCardsToOpen() {
        return !this.cardsAreOut(this.currentState.quantity);
    }

    formatStats() {
        let response = MESSAGES.statsTemplate.replace('__TIME__', this.formatTime(performance.now() - this.startTime));
        response = response.replace('__TOTAL__', this.quantityStats.total);

        for (const category of CATEGORY_KEYS) {
            response = response
                .replace(`__${category}CAT__`, this.quantityStats[category])
                .replace(`__${category}PERCENT__`, this.getPercentage(category));
        }

        return response;
    }

    formatTime(durationMs) {
        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        const milliseconds = Math.floor(durationMs % 1000);

        const parts = [];
        if (hours > 0) parts.push(`${hours}ч`);
        if (minutes > 0 || hours > 0) parts.push(`${minutes}м`);
        if (seconds > 0 || minutes > 0 || hours > 0) parts.push(`${seconds}с`);
        parts.push(`${milliseconds}мс`);

        return parts.join(' ');
    }

    getPercentage(category) {
        if (this.quantityStats.total === 0) {
            return 0;
        }

        return (this.quantityStats[category] * 100) / this.quantityStats.total;
    }

    buildStatsPayload() {
        const stats = CATEGORY_KEYS.reduce((result, category) => {
            result[String(category)] = this.quantityStats[category];
            return result;
        }, {});

        return {
            clientId: getStatsClientId(),
            targetCategory: this.targetCategory,
            startedAt: this.startedAt.toISOString(),
            finishedAt: new Date().toISOString(),
            durationMs: Math.floor(performance.now() - this.startTime),
            totalCardsSpent: this.quantityStats.total,
            stats,
            scriptVersion: SCRIPT_VERSION,
            source: getScriptSource()
        };
    }

    async sendStatsIfEnabled() {
        if (!isStatsEnabled() || this.statsSent) {
            return;
        }

        try {
            const sent = await sendStats(this.buildStatsPayload());
            if (!sent) {
                return;
            }

            this.statsSent = true;
            ui.toast(UI_COPY.statsToastTitle, MESSAGES.statsSent, 'success');
        } catch (error) {
            console.error('Failed to send stats:', error);
            ui.toast(UI_COPY.statsToastTitle, MESSAGES.statsSendFailed, 'error', 4200);
        }
    }

    async sayCardsAreOut() {
        await this.sendStatsIfEnabled();
        await ui.alert(UI_COPY.cardsOutTitle, UI_COPY.cardsOutMessage, this.formatStats());
    }

    async sayTargetOverachieved() {
        await this.sendStatsIfEnabled();
        await ui.alert(UI_COPY.overachievedTitle, UI_COPY.overachievedMessage, this.formatStats());
    }

    async sayStats() {
        await ui.alert(UI_COPY.statsTitle, 'Промежуточная статистика текущего запуска.', this.formatStats());
    }

    async sayCurrentState() {
        await ui.alert(UI_COPY.currentStateTitle, UI_COPY.currentStateMessage, MESSAGES.currentState(this.currentState));
    }

    async checkCurrentTargetCategory() {
        return ui.confirm(
            UI_COPY.launchTitle,
            MESSAGES.targetCategoryConfirmation(this.targetCategory),
            UI_COPY.launchConfirm,
            UI_COPY.launchCancel
        );
    }

    updateCurrentState(newState) {
        if (Object.prototype.hasOwnProperty.call(newState, 'quantity')) {
            this.currentState.quantity = newState.quantity;
        } else {
            throw new Error(MESSAGES.missingQuantity);
        }

        if (Object.prototype.hasOwnProperty.call(newState, 'rows')) {
            this.currentState.rows = {...newState.rows};
        } else {
            throw new Error(MESSAGES.missingRows);
        }
    }

    updateStats(category) {
        this.quantityStats[category]++;
        this.quantityStats.total++;
    }

    async resolveNewCardCategory(newState) {
        if (this.debugModeOn) {
            await ui.alert(UI_COPY.debugTitle, 'Сравнение предыдущего и нового состояния.', MESSAGES.debugNewStateComparison(newState.rows, this.currentState.rows));
        }

        for (const category of CATEGORY_KEYS) {
            if (newState.rows[category] > this.currentState.rows[category]) {
                if (this.debugModeOn) {
                    await ui.alert(UI_COPY.debugTitle, MESSAGES.debugNewCardCategory(category, newState.rows[category]));
                }

                return category;
            }
        }

        throw new Error(MESSAGES.failedToResolveNewCardCategory);
    }

    async process() {
        if (await this.checkCurrentTargetCategory()) {
            await this.spin();
        }
    }

    async spin() {
        this.updateCurrentState(await this.loadCurrentState());

        if (!this.hasCardsToOpen()) {
            await this.sayCardsAreOut();
            return;
        }

        let index = 0;
        while (true) {
            if (index % 5 === 0 && this.debugModeOn) {
                await this.sayCurrentState();
                await this.sayStats();
            }

            let shouldStopHere = false;
            for (const category of CATEGORY_KEYS) {
                shouldStopHere = await this.handleCompletedCategory(category);
                if (shouldStopHere) {
                    break;
                }
            }

            if (shouldStopHere) {
                break;
            }

            if (!this.hasCardsToOpen()) {
                await this.sayCardsAreOut();
                break;
            }

            await this.openNextCard();
            const newState = await this.loadCurrentState();
            const newCardCategory = await this.resolveNewCardCategory(newState);

            this.updateStats(newCardCategory);
            this.updateCurrentState(newState);

            if (this.cardsAreOut(newState.quantity)) {
                await this.sayCardsAreOut();
                break;
            }

            index++;
        }
    }
}

async function startScript() {
    while (true) {
        const startAction = await ui.openModal({
            title: UI_COPY.startTitle,
            message: MESSAGES.startScript,
            details: buildStatsPanelDetails(),
            buttons: [
                {label: UI_COPY.startCancel, value: 'cancel', variant: 'secondary'},
                {label: UI_COPY.statsButton, value: 'stats', variant: 'secondary'},
                {label: UI_COPY.startConfirm, value: 'start', variant: 'primary'}
            ]
        });

        if (startAction === 'cancel' || startAction === null) {
            return;
        }

        if (startAction === 'stats') {
            await openStatsPanel();
            continue;
        }

        break;
    }

    const targetCategoryInput = await requestTargetCategory();
    if (!isValidTargetCategory(targetCategoryInput)) {
        if (targetCategoryInput !== null) {
            await ui.alert(UI_COPY.errorTitle, MESSAGES.invalidTargetCategory);
        }
        return;
    }

    const debugModeOn = false;
    const roulette = new CollectionRoulette(parseInt(targetCategoryInput, 10), debugModeOn);
    await roulette.process();
}

(async function run() {
    window.addEventListener('load', function() {
        console.log(MESSAGES.pageLoaded);
    });

    await delay(2000);
    ui.ensureMounted();
    initStatsControls();
    ui.toast(UI_COPY.readyToastTitle, UI_COPY.readyToastMessage, 'success', 2200);

    try {
        await startScript();
    } catch (error) {
        console.error(error);
        await ui.alert(UI_COPY.stoppedTitle, error instanceof Error ? error.message : String(error));
    }
})();
