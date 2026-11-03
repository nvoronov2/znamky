# Známky

PWA для iPhone: фото почтовой марки → распознавание, состояние, оценка в CZK (диапазон), описание. Коллекция хранится локально (IndexedDB). Без бэкенда, без сборки.

## Ключ API

Ключ Gemini лежит в localStorage браузера и **публичен для любого, кто откроет приложение**. Для чужих пользователей используй режим «proxy» (`worker.js`, Cloudflare Worker): ключ остаётся у воркера, клиент его не отправляет.

## Деплой

1. Создать публичный репозиторий, залить все файлы вместе с `.nojekyll`.
2. Settings → Pages → Deploy from a branch → `main` / (root) → Save.
3. Открыть `https://USER.github.io/REPO/`, затем Safari → Sdílet → Přidat na plochu.

Локально: `npx serve .`

## Отличия от исходного ТЗ

- Модели: `gemini-flash-latest` (по умолчанию), `gemini-flash-lite-latest`, `gemini-2.5-flash`. Версии 3.8 / 3.6 / 3.5 не подтверждены документацией.
- В запись добавлено поле `image` (dataURL, 1400px, q 0.6) рядом с `thumb`; удаление записи удаляет оба.
- В `T` добавляются ключи для строк, которых не было в списке: «Začít», чипы-подсказки, подсказки по съёмке, подпись поля заметки.
- Недостающие оценки считаются множителями от `used`; нет `used` (или всего блока `estimates`) → нули, confidence 0, без падения. Ошибки везде: `Error.message` = ключ из `T`.
- Тело запроса: везде camelCase (`inlineData`, `mimeType`, `systemInstruction`).
- Манифест: иконки 192 и 512 с purpose `any`, плюс 512 с `maskable`.

## Порядок сборки

1. Оболочка: index.html, styles.css, manifest, sw.js, иконки (готово).
2. Ядро: i18n.js, state.js, db.js, image.js.
3. api.js (промпт, схема, ошибки) и worker.js.
4. Экраны по одному: home, capture, import, result, detail, settings.
5. main.js (роутинг) и проверка по критериям приёмки.

Каждый JS-файл ≤ 8 КБ (`wc -c js/*.js`).
