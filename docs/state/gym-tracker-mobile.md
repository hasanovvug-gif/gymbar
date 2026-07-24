---
campaign: gym-tracker-mobile
status: active
started: 2026-07-22
updated: 2026-07-24 12:00
---

# Gym Tracker → Expo/React Native

## Где сейчас

**Активная работа (24.07.2026): iOS Live Activity — карточка тренировки на экране блокировки.**
Ветка `feat/live-activity`. Живая карточка + Dynamic Island: нативный отсчёт отдыха (тикает без
JS), звук в конце отдыха, интерактивная кнопка «Готово» (App Intent — тап с locked screen засчитывает
подход и запускает отдых). Собрано и **проверено на реальном iPhone Вугара** (15 Pro, iOS 26.6) через
custom dev-build (`expo run:ios --device`). Реализовал Codex Sol по спеку `docs/specs/2026-07-24-live-activity-design.md`.

**Что уже работает на устройстве:** карточка, отсчёт, звук (при включённом звонке), кнопка «Готово»
(запускает отдых). **Осталось на завтра (выбран вариант 1):** сделать кнопку после отдыха полностью
time-aware — сейчас, когда отдых кончается, вернуть карточку в состояние «активный подход» (показать
кнопку снова) может только приложение, а оно спит на locked screen. Надо: рендерить кнопку по времени
(`restEndsAt` прошёл) + `staleDate = restEndsAt` для авто-ре-рендера + ослабить guard интента для
состояния «отдых истёк». Плюс **убрать диагностический `os_log`** из `_shared/CompleteSetIntent.swift`.

**App Store (фон):** build #2 был отправлен на ревью 23.07. Live Activity поедет в **новую сборку (build #3+)**,
отдельно. Team ID `K6M569DX9E` вписан в `app.json`. App Group `group.com.gymbar.app` + Push включены в
Apple Developer, provisioning-профили созданы (automatic signing).

## Next step (продолжаем feat/live-activity)

1. [x] **Time-aware кнопка после отдыха** (native, вариант 1) — код готов, не закоммичен. Три файла:
   - `GymbarLiveActivity.swift`: `CompleteSetButton` рисуется по `canComplete` (computed) =
     `canCompleteSet || (phase=="rest" && restEndsAt<=Date.now)`.
   - `_shared/CompleteSetIntent.swift`: guard ослаблен через `canAdvance()` (принимает тап при
     истёкшем отдыхе), `staleDate = restEndsAt` при старте отдыха, **pending-флаг убран** (он
     блокировал 2-й тап на locked screen — без снятия вариант 1 работал бы только на 1 подходе;
     дебаунс теперь даёт сам `restEndsAt`), `os_log`/`intentLog` вычищены.
   - `modules/gymbar-live-activity/ios/GymbarLiveActivityModule.swift`: `activityContent()` ставит
     `staleDate = restEndsAt` для rest-фазы (start + update).
2. [ ] **Пересборка в терминале Вугара** (UTF-8): `cd mobile && npx expo run:ios --device` + тест на устройстве.
   Сценарий: locked screen → тап «Готово» → отдых → дождаться конца отдыха НЕ разблокируя →
   кнопка «Готово» должна снова появиться сама → тап засчитывает след. подход. Проверить 2-3 подхода подряд.
3. [ ] Когда стабильно — влить `feat/live-activity` в `main`, собрать build #3 (EAS), отправить в App Store.

## Done (recent first, max 10)

- 2026-07-24 — **Live Activity собрана и работает на iPhone.** Причина неработавшей кнопки «Готово»
  найдена (Codex Sol диагностировал): App Intents metadata для `LiveActivityIntent` не генерировалась
  в бандле `.app` — интент лежал только в статическом CocoaPod (Swift-символ есть, metadata нет), iOS
  не мог смаршрутизировать тап в процесс приложения. **Фикс:** перенёс `CompleteSetIntent.swift` +
  `GymbarActivityAttributes.swift` в `targets/live-activity/_shared/` — оттуда `@bacons/apple-targets`
  кладёт файлы И в app-таргет, И в widget (подтверждено `membershipExceptions` target=Gymbar в
  `Gymbar.xcodeproj`). Коммиты `e178efd`, `51e1790`, `389b928`

- 2026-07-23 — **Приложение установлено на телефон Вугара через TestFlight.** Приглашение
  ушло на `hasanov.vugar@icloud.com`, принято — Gymbar доступен и работает

- 2026-07-23 — **Группа Internal Testers создана через API** (`betaGroups`,
  `isInternalGroup:true`) — без этого сборки лежали в ASC, но на телефон в TestFlight
  не приходили: у Gymbar не было ни одного тестировщика. Тестировщик (`hasanov.
  vugar@icloud.com`, Account Holder) добавлен через `POST /v1/betaTesters` — прямая
  привязка через `users` relationship даёт 409, нужен отдельный `betaTesters` объект
  с email. Обе сборки (#1, #2) привязаны к группе

- 2026-07-23 — **Обе сборки в TestFlight.** Build #1 (`a5cfef6b`) собран за 16 минут,
  build #2 (`d4fac3e9`, фикс `en.common.done`) — обработка Apple заняла ~7 минут после
  загрузки. Сборка идёт по `credentialsSource: local` — профиль и p12 в
  `~/.appstoreconnect/private/gymbar/`. Проверить статус: `cd mobile && npx eas-cli
  build:list --limit 2 --non-interactive`

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

- 2026-07-24: **`LiveActivityIntent` ОБЯЗАН быть в бандле приложения**, не только в расширении.
  iOS исполняет `perform()` в процессе приложения (запускает его в фоне без UI). Положить интент в
  статический CocoaPod НЕДОСТАТОЧНО — Swift-символ линкуется, но `Metadata.appintents` для app-таргета
  не генерируется → кнопка «видна, но тап ничего не делает». В Expo решается папкой
  `targets/live-activity/_shared/` (`@bacons/apple-targets` кладёт её файлы в оба таргета). Проверка:
  `codesign -d --entitlements` + наличие `Metadata.appintents/extract.actionsdata` внутри `Gymbar.app`.
- 2026-07-24: **звук на locked screen — только при включённом звонке.** Аппаратный mute (переключатель)
  глушит обычные уведомления даже с `interruptionLevel: timeSensitive`. Пробить mute может лишь Critical
  Alerts entitlement — Apple даёт его только health/safety/security, для фитнес-таймера почти наверняка
  откажет. Вугар осознанно выбрал «держать звонок включённым», Critical Alerts не запрашиваем.
- 2026-07-24: **Live Activity обновляется локально, без push-сервера.** Приложение само стартует/обновляет/
  завершает activity через ActivityKit; отсчёт отдыха рисует система (`Text(timerInterval:)`), тикает без JS.
  Ограничение: код при истечении таймера НЕ исполняется, пока приложение спит — поэтому смена UI по времени
  требует `staleDate` + логики рендера по времени, а не апдейта из приложения.
- 2026-07-24: `expo-widgets` (официальный, Live Activity из JS-компонентов) требует **Expo SDK 57** — проект
  на 54, поэтому используем свой native widget-таргет через `@bacons/apple-targets`. Архивный
  `software-mansion/expo-live-activity` не годится — не умеет интерактивные кнопки (App Intents).
- 2026-07-24: **источник правды по объёму/истории — `useGymStore.completeSet`**, не Swift. App Intent пишет
  событие в App Group (`group.com.gymbar.app`, ключ `gymbar.completeSetEvents`) + оптимистично обновляет
  карточку; RN при возврате в foreground проигрывает события через `completeSet` (reconciliation в
  `hooks/useLiveActivity.ts`). Идемпотентность через `consumeCompleteSetEvents` (чистит очередь + флаг pending).
- 2026-07-24: `os.Logger` (unified logging) **не виден в `idevicesyslog`** — для отладки логов с устройства
  нужен Console.app или `xcrun ... log collect`. `idevicesyslog` показывает старый syslog, там пусто.

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

- Branch: **`feat/live-activity`** (НЕ в main), рабочее дерево чистое. НЕ запушено на origin.
- Worktree: `~/Documents/Projects/Gym-Tracker`
- Last commit: `389b928` — интент в `_shared` (фикс metadata). До него `51e1790`, `84d57b8`, `e178efd`
- Приложение: `mobile/`, bundle id `com.gymbar.app`, Team ID `K6M569DX9E`
- **Live Activity тест только на реальном устройстве** (не Expo Go, не всегда симулятор): custom dev-build
  `cd mobile && npx expo run:ios --device` — запускать в ТЕРМИНАЛЕ ВУГАРА (UTF-8 локаль; у Claude-shell
  локаль ASCII → `pod install` падает `Encoding::CompatibilityError`, обходится `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`)
- Тест кнопки на locked screen: разбудить экран → дать Face ID (замок открыт) → остаться на lock screen → тап
- Диагностика логов интента: `idevicesyslog` НЕ подходит (os.Logger не виден) → Console.app / `log collect`
- Файлы Live Activity: `targets/live-activity/` (виджет: `GymbarLiveActivity.swift`, `_shared/`),
  `modules/gymbar-live-activity/ios/` (native-мостик), `hooks/useLiveActivity.ts`, `utils/liveActivity.ts`
- Запуск обычный: `cd mobile && npx expo start` · симулятор — `npx expo run:ios`
