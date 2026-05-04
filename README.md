# PW Collection Bot

Userscript для автоматизации акции "Коллекция" на сайте Perfect World.

## Русская версия

Что делает скрипт:

- открывает карточки автоматически;
- определяет, в какую категорию выпала новая карточка;
- автоматически переводит собранные промежуточные категории выше;
- забирает приз для выбранной целевой категории;
- показывает статистику по выпавшим категориям после завершения работы.

Как использовать:

1. Откройте страницу акции:
   `https://pwonline.ru/minigames.php?game=collection&doo=display`
2. Запустите скрипт через Tampermonkey или через консоль браузера.
3. Подтвердите запуск.
4. Укажите целевую категорию от `1` до `6`.
5. Дождитесь завершения работы.

Установка и обновление:

### Tampermonkey

Production-скрипт для настоящей акции:

[Установить PW collection bot](https://github.com/Fair-Hypocrite-Tech/pw-collection/blob/main/collection.user.js)

Как обновлять после нового релиза:

1. Откройте Tampermonkey Dashboard.
2. Нажмите `Utilities`.
3. Нажмите `Check for userscript updates`.
4. Откройте установленный скрипт и проверьте, что `@version` стал новым.

Tampermonkey подтягивает обновление по `@updateURL`, но обычно делает это только если версия выросла. Поэтому в PR, который меняет userscript, нужно bump-нуть версию.

Бамп версии для релиза:

```powershell
node scripts/bump-userscript-version.cjs 2026.04.21.1
node scripts/build-mock-userscript.cjs
node --check collection.user.js
node --check collection.mock.user.js
node --test tests/*.test.cjs
```

Скрипт обновит:

- `collection.user.js`: `@version` и `SCRIPT_VERSION`;
- `scripts/mock-userscript.config.json`: mock version;
- после сборки `collection.mock.user.js`: `@version` и `SCRIPT_VERSION`.

### Консоль браузера

Откройте страницу акции, вставьте содержимое `collection.user.js` в консоль браузера и выполните его.

Текущие особенности поведения:

- После получения приза целевой категории скрипт продолжает работу дальше.
- Если соберется категория выше целевой, скрипт остановится и попросит принять решение вручную.
- Debug-режим сейчас отключен для обычного использования.

Структура проекта:

- [collection.user.js](./collection.user.js): сам userscript.
- [README.md](./README.md): документация проекта.

Обратная связь:

Если скрипт сломался или вы нашли баг, пожалуйста, сообщите об этом. Идеи по улучшению тоже приветствуются.

## English Version

Userscript for automating the Perfect World "Collection" event page.

What the script does:

- opens cards automatically;
- detects which category the new card landed in;
- automatically promotes completed lower categories upward;
- collects the reward for the selected target category;
- shows final drop statistics when the run is over.

How to use it:

1. Open the event page:
   `https://pwonline.ru/minigames.php?game=collection&doo=display`
2. Start the script with Tampermonkey or from the browser console.
3. Confirm the launch.
4. Choose the primary target category with the `1`-`6` buttons.
5. Choose what to do with completed categories above the target: stop, claim up to a selected category, or configure manually.
6. Wait for the script to finish.

Installation and updates:

### Tampermonkey

Production script for the real event:

[Install PW collection bot](https://github.com/FairHypo/pw-collection/raw/main/collection.user.js)

Mock script for the testbed:

[Install PW collection bot mock dev](https://github.com/FairHypo/pw-collection/raw/main/collection.mock.user.js)

Keep production and mock as two separate Tampermonkey scripts. Production runs only on the Perfect World page, mock runs only on `/mock-collection`.

How to update after a release:

1. Open Tampermonkey Dashboard.
2. Open `Utilities`.
3. Click `Check for userscript updates`.
4. Open the installed script and verify the new `@version`.

Tampermonkey uses `@updateURL`, but usually updates only when `@version` is increased. For a PR that changes the userscript, bump versions first:

```powershell
node scripts/bump-userscript-version.cjs 2026.04.21.1
node scripts/build-mock-userscript.cjs
node --check collection.user.js
node --check collection.mock.user.js
node --test tests/*.test.cjs
```

### Browser Console

Open the event page, paste the contents of `collection.user.js` into the browser console, and run it.

Current behavior notes:

- The launch UI first asks for the primary target, then separately asks what to do with categories above that target.
- For target `3`, the second step explicitly offers `Stop above 3`, `Claim up to 4`, `Claim up to 5`, and manual configuration.
- The last selected preset is remembered locally and can be repeated from the first target-selection step.
- If stats are connected, the preferred preset is also synced through the stats backend and still falls back to local storage if sync fails.
- The script continues working after collecting the selected target category.
- If a category above the target becomes completed, the script stops and asks the user to decide what to do next.
- Debug mode is currently disabled in normal usage.

Project structure:

- [collection.user.js](./collection.user.js): the userscript itself.
- [collection.mock.user.js](./collection.mock.user.js): generated dev userscript for the mock collection testbed.
- [scripts/mock-userscript.config.json](./scripts/mock-userscript.config.json): mock userscript environment and text overrides.
- [README.md](./README.md): project documentation.

Mock testbed:

1. Open `https://dev.pw-collection-stats.fairhypocrite.com/mock-collection`
2. Install or paste `collection.mock.user.js`
3. The mock version talks only to the dev stats backend and mock collection API.

Regenerating the mock userscript:

```powershell
node scripts/build-mock-userscript.cjs
```

Feedback:

If the script breaks or you find a bug, please report it. Suggestions for improvements are welcome too.
