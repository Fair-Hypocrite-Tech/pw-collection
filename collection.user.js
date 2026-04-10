// ==UserScript==
// @name         PW collection bot
// @namespace    http://tampermonkey.net/
// @version      2024.12.27
// @description  Automates the Perfect World "Collection" minigame flow
// @author       Fair Hypocrite
// @updateURL    https://github.com/FairHypo/pw-collection/raw/main/collection.user.js
// @downloadURL  https://github.com/FairHypo/pw-collection/raw/main/collection.user.js
// @match        https://pwonline.ru/minigames.php?game=collection&doo=display*
// @icon         https://pwonline.ru/favicon.ico
// @grant        GM_xmlhttpRequest
// @connect      pw-collection-stats.fairhypocrite.com
// ==/UserScript==

const SCRIPT_VERSION = '2024.12.27';
const BASE_URL = 'https://pwonline.ru/minigames.php?game=collection';
const INFO_URL = `${BASE_URL}&doo=info`;
const TURN_URL = `${BASE_URL}&doo=turn`;
const CATEGORY_KEYS = [1, 2, 3, 4, 5, 6];
const TOP_CATEGORY = 6;
const DEFAULT_CATEGORY_LIMIT = 5;
const TOP_CATEGORY_LIMIT = 10;
const STATS_CONFIG = {
    enabled: true,
    endpoint: 'https://pw-collection-stats.fairhypocrite.com/v1/stats',
    clientId: 'fairhypo-main-browser',
    apiKey: '1cPHX8MY4UdCpgWb3A27KzNEus9kZiGewaySqrj5'
};

const MESSAGES = {
    pageLoaded: 'Страница полностью загружена!',
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
    brand: 'PW Collection Bot',
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
    readyToastTitle: 'PW Collection Bot',
    readyToastMessage: 'Интерфейс скрипта готов к запуску.',
    statsToastTitle: 'Статистика'
};

const UI_STYLE = `
.pwc-root{position:fixed;inset:0;z-index:2147483647;pointer-events:none;font-family:"Trebuchet MS","Segoe UI",sans-serif}
.pwc-toasts{position:fixed;top:20px;right:20px;display:flex;flex-direction:column;gap:12px;pointer-events:none}
.pwc-toast{min-width:250px;max-width:360px;padding:14px 16px;border-radius:16px;color:#fff6ea;background:linear-gradient(145deg,rgba(92,48,24,.96),rgba(40,22,13,.96));border:1px solid rgba(244,205,153,.42);box-shadow:0 18px 44px rgba(0,0,0,.35);transform:translateY(-8px);opacity:0;transition:opacity .18s ease,transform .18s ease}
.pwc-toast.is-visible{opacity:1;transform:translateY(0)}
.pwc-toast--success{border-color:rgba(162,220,150,.55)}
.pwc-toast--error{border-color:rgba(255,155,155,.55)}
.pwc-toast__title{margin:0 0 4px;font-size:14px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#ffe1b0}
.pwc-toast__message{margin:0;font-size:14px;line-height:1.45;white-space:pre-wrap}
.pwc-modal-layer{position:fixed;inset:0;display:none;align-items:center;justify-content:center;padding:24px;background:radial-gradient(circle at top,rgba(255,214,156,.16),transparent 30%),rgba(18,12,9,.58);backdrop-filter:blur(10px);pointer-events:auto}
.pwc-modal-layer.is-open{display:flex}
.pwc-modal{width:min(100%,520px);max-height:calc(100vh - 48px);overflow:auto;border-radius:24px;background:linear-gradient(160deg,rgba(249,235,210,.98),rgba(232,214,184,.98));color:#422919;border:1px solid rgba(137,91,48,.24);box-shadow:0 28px 80px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.55);position:relative}
.pwc-modal::before{content:"";position:absolute;inset:10px;border:1px solid rgba(145,102,54,.18);border-radius:18px;pointer-events:none}
.pwc-modal__content{position:relative;padding:28px}
.pwc-modal__eyebrow{margin:0 0 6px;color:#9f6431;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.pwc-modal__title{margin:0 0 12px;font-size:28px;line-height:1.05;color:#5a2f18}
.pwc-modal__message{margin:0;font-size:16px;line-height:1.55;color:#5c3a26;white-space:pre-wrap}
.pwc-modal__details{margin-top:18px;padding:16px 18px;border-radius:18px;background:rgba(255,250,241,.72);border:1px solid rgba(145,102,54,.14);font-family:Consolas,"Courier New",monospace;font-size:14px;line-height:1.55;white-space:pre-wrap;color:#523220}
.pwc-modal__field{margin-top:18px}
.pwc-modal__label{display:block;margin-bottom:8px;font-size:13px;font-weight:700;color:#7b4a27;letter-spacing:.06em;text-transform:uppercase}
.pwc-modal__input{width:100%;box-sizing:border-box;border:1px solid rgba(130,83,44,.24);background:rgba(255,253,248,.95);border-radius:14px;padding:14px 16px;font-size:16px;color:#4d301f;outline:none;box-shadow:inset 0 1px 4px rgba(72,45,24,.06)}
.pwc-modal__input:focus{border-color:rgba(186,117,54,.7);box-shadow:0 0 0 3px rgba(220,169,118,.22)}
.pwc-modal__actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:22px}
.pwc-modal__button{appearance:none;border:none;border-radius:999px;padding:12px 18px;min-width:132px;font-size:14px;font-weight:700;cursor:pointer;transition:transform .14s ease,box-shadow .14s ease}
.pwc-modal__button:hover{transform:translateY(-1px)}
.pwc-modal__button:active{transform:translateY(1px)}
.pwc-modal__button--primary{color:#fff8ef;background:linear-gradient(180deg,#bf7b39,#8f5328);box-shadow:0 10px 24px rgba(127,72,30,.22)}
.pwc-modal__button--secondary{color:#6c442a;background:rgba(255,249,238,.9);border:1px solid rgba(130,83,44,.16)}
.pwc-modal__error{margin-top:12px;color:#a53e2e;font-size:14px;line-height:1.45;min-height:20px}
@media (max-width:640px){.pwc-toasts{left:12px;right:12px;top:12px}.pwc-toast{max-width:none}.pwc-modal-layer{padding:14px}.pwc-modal__content{padding:22px 18px}.pwc-modal__title{font-size:24px}.pwc-modal__actions{flex-direction:column}.pwc-modal__button{width:100%}}
`;

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
    return typeof GM_xmlhttpRequest === 'function' ? 'tampermonkey' : 'browser-console';
}

function isStatsEnabled() {
    return Boolean(
        STATS_CONFIG.enabled
        && STATS_CONFIG.endpoint
        && STATS_CONFIG.clientId
        && STATS_CONFIG.apiKey
    );
}

function sendStatsWithGM(payload) {
    return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            method: 'POST',
            url: STATS_CONFIG.endpoint,
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': STATS_CONFIG.apiKey
            },
            data: JSON.stringify(payload),
            onload: response => {
                if (response.status >= 200 && response.status < 300) {
                    resolve();
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

async function sendStats(payload) {
    if (typeof GM_xmlhttpRequest === 'function') {
        await sendStatsWithGM(payload);
        return;
    }

    const response = await fetch(STATS_CONFIG.endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': STATS_CONFIG.apiKey
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Stats server responded with status ${response.status}`);
    }
}

class FancyUI {
    constructor() {
        this.root = null;
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

        this.toastStack = document.createElement('div');
        this.toastStack.className = 'pwc-toasts';

        this.modalLayer = document.createElement('div');
        this.modalLayer.className = 'pwc-modal-layer';

        this.root.append(style, this.toastStack, this.modalLayer);
        document.body.appendChild(this.root);
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
                buttonNode.addEventListener('click', () => submit(button));
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
                1: rows.row1,
                2: rows.row2,
                3: rows.row3,
                4: rows.row4,
                5: rows.row5,
                6: rows.row6
            },
            quantity: parseInt(quantity, 10)
        };
    }

    async openNextCard() {
        await fetch(TURN_URL);
    }

    async collectReward(category) {
        try {
            await fetch(`${BASE_URL}&doo=get_item&category=${category}`);
            console.log(`Reward collected for category ${category}`);
        } catch (error) {
            console.error(`Failed to collect reward for category ${category}:`, error);
        }
    }

    async promoteCategory(category) {
        await fetch(`${BASE_URL}&doo=get_next&category=${category}`);
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
            clientId: STATS_CONFIG.clientId,
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
            await sendStats(this.buildStatsPayload());
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
    const shouldStart = await ui.confirm(
        UI_COPY.startTitle,
        MESSAGES.startScript,
        UI_COPY.startConfirm,
        UI_COPY.startCancel
    );

    if (!shouldStart) {
        return;
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
    ui.toast(UI_COPY.readyToastTitle, UI_COPY.readyToastMessage, 'success', 2200);

    try {
        await startScript();
    } catch (error) {
        console.error(error);
        await ui.alert(UI_COPY.stoppedTitle, error instanceof Error ? error.message : String(error));
    }
})();
