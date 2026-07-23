---
campaign: gym-tracker-mobile
status: active
started: 2026-07-22
updated: 2026-07-23 14:25
---

# Gym Tracker → Expo/React Native

## Где сейчас

Приложение готово и собрано. **Запись Gymbar заведена в App Store Connect** —
app id `6793901080`, bundle `com.gymbar.app`, SKU `gymbar-001`. Сайт поддержки живой,
карточка на трёх языках написана, скриншоты 6.9″ сняты. **Build #1 прошёл обработку
и лежит в TestFlight** (`processingState: VALID`), build #2 с фиксом `en.common.done`
отправлен следом — ставить надо его. Всё в `main`, дерево чистое, синхронно с origin.

## Next step

Всё оставшееся — руками Вугара в UI App Store Connect, API этого не даёт:

0. **Группа внутренних тестировщиков пуста** (проверено через `/v1/apps/6793901080/betaGroups`
   → `[]`). Если в TestFlight на телефоне сборки не видно — ASC → Gymbar → TestFlight →
   Internal Testing → **+** у Testers → добавить себя. Иначе билд не приедет.
1. Загрузить скриншоты из `docs/appstore/screenshots/` (iPhone 6.9", порядок по номерам)
2. Вставить тексты из `docs/appstore/metadata.md` + оба URL сайта поддержки
3. Анкета App Privacy → **Data Not Collected**
4. Выбрать build #2 и отправить на ревью

Проверить статус второй сборки:
`cd mobile && npx eas-cli build:list --limit 2 --non-interactive`

## Done (recent first, max 10)

- 2026-07-23 — **Приложение доехало до TestFlight.** Build #1 (`a5cfef6b`) собран за
  16 минут, загружен через `eas submit` и прошёл обработку Apple. Build #2 (`d4fac3e9`,
  с фиксом перевода) отправлен следом. Сборка идёт по `credentialsSource: local` —
  профиль и p12 в `~/.appstoreconnect/private/gymbar/`

- 2026-07-23 — **Gymbar заведён в ASC** (app id `6793901080`) в обход сломанной формы:
  выпадашка Bundle ID в New App была пуста, причину вытащил из внутреннего API —
  старый bundle id числился занятым. Новый `com.gymbar.app` зарегистрирован через
  ASC API, профиль подписи выпущен туда же, `ascAppId` в `eas.json` (`86c2a5d`)

- 2026-07-23 — **Скриншоты 6.9″ сняты** (`docs/appstore/screenshots/`, 6 шт, 1320×2868,
  статус-бар 9:41 через `simctl status_bar override`). Заодно найден и починен
  `en.common.done` — на английском кнопка в итогах выводила «ГОТОВО» (`d7af326`)

- 2026-07-23 — Репозиторий переименован `Gym-Tracker` → `gymbar`, сайт переехал на
  https://hasanovvug-gif.github.io/gymbar/ (`0766acd`)

- 2026-07-23 — **Сайт поддержки живой:** https://hasanovvug-gif.github.io/gymbar/ и
  `/privacy.html`. Исходники `site/*.html` в `main`, публикация с ветки `gh-pages`.
  Оба URL отвечают 200 — можно вписывать в ASC
- 2026-07-23 — **iOS build #7 собран успешно** (`bcaef92`, IPA готов в EAS). Сборки 4–5
  падали на `npm ci`; починено пересборкой lockfile и пином Node 24
- 2026-07-23 — Карточка App Store на трёх языках: `docs/appstore/metadata.md`
  (имя **Gymbar**, subtitle, keywords, описания RU/UA/EN)

- 2026-07-23 — **Ассеты иконки собраны** (`a9891f1`): `icon.png` 1024 (фон `#0B0C0E`),
  `adaptive-icon.png` (прозрачный передний слой, арт ужат до 66 % — safe zone Android),
  `splash-icon.png` 512 прозрачный, `favicon.png` 196. Скрипт —
  `design/icon-concepts/build-assets.py` (PIL, 4× суперсэмплинг; SVG-конвертера нет)

- 2026-07-23 — **Иконка выбрана: K6f**, гриф в ромбе, семейство с AsbestosGuard
  (`0584856`). Отклонённые лежат рядом: мои K1–K6 в `king/`, Codex Sol V1–V4 в
  `family/`, первые 4 концепта в корне `icon-concepts/`. Витрины сравнения —
  `contact-sheet.png`, `k6-refine2.png`, `k6-geometry.png`

- 2026-07-22 — 4 концепта иконки показаны Вугару, выбор отложен. SVG + разбор
  сохранены в `design/icon-concepts/`, чтобы новая сессия не перерисовывала

> Более ранние записи — `archive/gym-tracker-mobile-2026-07-23.md`

## TODO (priority)

- [ ] Дождаться сборки в TestFlight и поставить на телефон
- [ ] Заполнить карточку в UI ASC: скриншоты, тексты, URL, App Privacy → отправка на ревью
- [ ] Оценить вживую тембр бипа и частоту вибрации на реальном телефоне
- [ ] Нативный share-sheet экспорта не проверен вживую — только веб-скачивание
- [ ] Drag-and-drop reorder в редакторе плана — сейчас кнопки ↑↓
- [ ] Проверить splash на нативной сборке (`expo prebuild` + `run:ios`) после замены ассетов

## Decisions (non-obvious, durable)

- 2026-07-23: bundle id **`com.gymbar.app`**, старый `com.vugarhasanov.gymtracker`
  сожжён навсегда. Он числится занятым в App Store (скорее всего под вторым Apple ID
  Вугара — `kutum.az@` vs `hasanov.vug@`), а bundle id уникален глобально и **не
  освобождается даже после удаления приложения**. Симптом был обманчивый: выпадашка
  Bundle ID в форме New App просто пустая, без объяснения. Настоящую причину даёт
  только внутренний API — `POST /iris/v1/apps` отвечает `ENTITY_ERROR.ATTRIBUTE.
  INVALID.DUPLICATE`. Если снова пусто в выпадашке — сразу дёргать API, не искать
  проблему в аккаунте.

- 2026-07-23: **запись приложения в ASC создаётся через `POST /iris/v1/apps`** из
  залогиненной сессии браузера (публичный `/v1/apps` этого не умеет). Тело: атрибуты
  `bundleId/primaryLocale/sku` + обязательные relationships `appInfos` и
  `appStoreVersions`, оба через `included` с плейсхолдерами `${new-...}`; имя лежит
  в `appInfoLocalizations`, не в атрибутах app. Bundle id и профиль подписи при этом
  заводятся обычным публичным API по ключу `.p8` — Xcode не нужен.

- 2026-07-23: иконка Gym Tracker строится по **грамматике иконки AsbestosGuard**, а не
  сама по себе: тёмный фирменный фон + белая внешняя форма контуром + один акцентный
  элемент цветом приложения, штрих 9,4 % стороны. Геометрия ромба скопирована точно
  (вершины 16,7 % / 83,3 %) — расхождение даже в 4 % диагонали читается как небрежность,
  когда две иконки стоят рядом в профиле разработчика. Свой у Gym Tracker только фон.
  Эталон: `~/Documents/Projects/AsbestosGuard/public/favicon.svg`.

- 2026-07-22: сигнал конца отдыха — свой WAV, не `expo-speech`. Голос в зале не
  разбираешь и он зависит от языка; бип генерируется скриптом (три тона 880/880/1175 Гц)
  и через `setAudioModeAsync({ playsInSilentMode: true })` звучит на беззвучном режиме.
- 2026-07-22: весь интерактив идёт через `Tappable` (`components/ui.tsx`) — press-scale
  плюс haptics в одной точке. Сырых `Pressable` в экранах не осталось, кроме оверлея
  модалки. Новые кнопки добавлять только через него, иначе отклик расползётся.

- 2026-07-22: светлая палитра — `accent` (#C8F031) остаётся только **заливкой**, а как текст,
  граница и SVG-stroke идёт отдельный токен `accentInk` (#4C6B00 на светлой). Кислотный лайм
  на белом нечитаем — без этого разделения светлая тема разваливается.
- 2026-07-22: Ф5 (Fable 5) выпал из Pro-подписки, доступен только за деньги и держится
  в резерве. Дизайн-задачи теперь: палитру/токены задаю я, механику катит Codex Sol.
- 2026-07-22: имя в профиле — ключ `settings.name` (Вугар / Вугар / Vugar), аватар берёт
  первую букву. Не хардкод: критерий «ноль кириллицы в коде» иначе ломает русский UI.

- 2026-07-22: SDK 54 — не косметика, а обязательное условие. На SDK 53 (RN 0.79) нативная
  сборка падает на Xcode 26.6: старый `fmt` не компилируется новым Clang
  (`consteval ... is not a constant expression`). Откат на 53 = снова несобираемо.
- 2026-07-22: `mobile/ios/` и `mobile/android/` в `.gitignore` — генерируются `expo prebuild`.
  Один только `ios/Pods` весит 938 МБ, в репозиторий такое не кладём.
- 2026-07-22: skip vs end-early — два разных действия (фикс бага старого веба, где skip
  обнулял объём даже при частично сделанных подходах). `skipped` → объём 0;
  `ended_early` → сделанные подходы засчитываются в `totalVolume`.
- 2026-07-22: дни плана — упорядоченный список с полем `order`, привязки к дню недели нет.
  Осознанная замена старой модели `dayOfWeek` (редактор плана свободно двигает дни).
- 2026-07-22: персист — ручная гидрация из AsyncStorage + `subscribe` с guard'ом,
  а не `zustand/persist` middleware. Так обошли ошибку `import.meta` в Expo Web.
- 2026-07-22: Expo Go на iOS ставится только последней версии, откатить под старый SDK
  нельзя. Поэтому версия SDK проекта обязана совпадать с версией Expo Go на телефоне.
- 2026-07-22: AI-фичи (Gemini-советы, weekly-отчёт, чат) намеренно НЕ переносим —
  это была демо-фича AI Studio прототипа, в новом дизайне их нет.

## Links (single source for everything)

- **Дизайн (источник истины):** `design/claude-design-export/project/Gym Tracker.dc.html`
- **Инструкция handoff-бандла:** `design/claude-design-export/README.md`
- **Инструкции агентам:** `AGENTS.md` (корень), `mobile/AGENTS.md` (пин на докИ Expo v54)
- **Репозиторий:** https://github.com/hasanovvug-gif/gymbar
- **App Store Connect:** app id `6793901080` · bundle `com.gymbar.app` · SKU `gymbar-001`
- **Карточка и скриншоты:** `docs/appstore/metadata.md`, `docs/appstore/screenshots/`
- **Сайт поддержки:** https://hasanovvug-gif.github.io/gymbar/ (ветка `gh-pages`, исходники `site/`)
- **Подпись:** `~/.appstoreconnect/private/gymbar/` (профиль + p12), ключ API `AuthKey_XC65QPNJJK.p8`
- **Knowledge:** `~/Documents/Projects/mission-control/knowledge/projects/gym-tracker.md`
- **Исходная задача по дизайну:** `~/Documents/Projects/mission-control/tasks/personal/gymtracker-design.md`

## Working state

- Branch: `main`, рабочее дерево чистое, синхронно с origin
- Worktree: `~/Documents/Projects/Gym-Tracker`
- Last meaningful commit: `d7af326` — фикс `en.common.done` + скриншоты (запушен)
- Приложение: `mobile/`, bundle id `com.gymbar.app`
- Запуск: `cd mobile && npx expo start` · симулятор — `npx expo run:ios`
- На телефон без TestFlight: `npx expo start --lan` → Expo Go → Enter URL manually
