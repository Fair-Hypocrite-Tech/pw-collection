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

Установка:

### Tampermonkey

[Установить скрипт](https://github.com/FairHypo/pw-collection/raw/main/collection.user.js)

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
4. Enter the target category from `1` to `6`.
5. Wait for the script to finish.

Installation:

### Tampermonkey

[Install the script](https://github.com/FairHypo/pw-collection/raw/main/collection.user.js)

### Browser Console

Open the event page, paste the contents of `collection.user.js` into the browser console, and run it.

Current behavior notes:

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
