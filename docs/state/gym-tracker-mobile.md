---
campaign: gym-tracker-mobile
status: active
started: 2026-07-22
updated: 2026-07-24 17:00
---

# Gym Tracker → Expo/React Native

## Где сейчас

**Активная работа (24.07.2026): новые фичи по спеке v2** — двухступенчатый звук отдыха, AI-ввод
спортпита (фото → карточка + рацион + напоминания), iCloud-сохранность. Спека
`docs/specs/2026-07-24-new-features-design.md` написана, **проревьюена Codex Sol** (поймал 2 фактические
ошибки v1 — финал отдыха играет уведомление, не Live Activity; AsyncStorage по умолчанию исключён из
iCloud-бэкапа — обе исправлены и проверены по коду), запушена. Решения Вугара: iCloud KV для конфига +
экспорт/импорт истории файлом; AI извлекает инструкцию, не назначает дозу; AI-анализ — отдельной фазой.
Готов бить на планы реализации по фазам (первая — звук).

**Live Activity — готова и в TestFlight** (build #6, проверена на iPhone), поедет в 1.0.1.
**App Store (фон):** 1.0 (build #2, без LA) — `WAITING_FOR_REVIEW`. Team ID `K6M569DX9E`, App Group
`group.com.gymbar.app` + Push настроены.

## Next step

1. [ ] **Реализация новых фич по фазам** (спека v2). Первая — Фаза 1 (звук, быстрый выигрыш), затем
   сохранность → Cloudflare Worker → AI-ввод добавок → (позже) AI-анализ.
2. [ ] **(Фон) Дождаться одобрения 1.0** (build #2, `WAITING_FOR_REVIEW`); после релиза → версия **1.0.1**
   с build #6 (Live Activity, уже VALID в ASC), экспортный комплаенс → на ревью (`asc.py` / UI ASC).

> **Решение Вугара (24.07):** build #2 (без Live Activity) идёт как 1.0 — не трогаем текущее ревью.
> Live Activity (build #6) уедет апдейтом 1.0.1 (влита в `main` `95b79a7`, проверена в TestFlight).

## Done (recent first, max 10)

- 2026-07-24 — **Спека новых фич v2 написана и проревьюена Codex Sol** (`e049d2d`). Брейншторм по 3 фичам
  (звук, AI-добавки, iCloud) → спека → ревью Sol/high: поймал 2 фактические ошибки (финал отдыха =
  уведомление, не LA; AsyncStorage исключён из бэкапа по умолчанию) — проверил по коду, исправил.
  Решения: iCloud KV конфиг + экспорт/импорт истории; AI не назначает дозу; AI-анализ отложен.
  `docs/specs/2026-07-24-new-features-design.md`

- 2026-07-24 — **build #6 с Live Activity в TestFlight, проверен на iPhone.** Загружен в ASC (VALID,
  `READY_FOR_BETA_TESTING`), комплаенс автоочищен через `ITSAppUsesNonExemptEncryption:false` в
  Info.plist. Не отображался у тестера — не был привязан к группе; привязал build к «Internal Testers»
  (`000fea70…`) через `POST /v1/betaGroups/{id}/relationships/builds` (`asc.py tf-attach`). Вугар
  установил, time-aware кнопка работает. build #6 остаётся кандидатом на версию 1.0.1

- 2026-07-24 — **EAS build с Live Activity собран.** Виджет — отдельный app extension
  (`com.gymbar.app.liveactivity`), для App Store сборки нужны СВОИ креды. Три падения подряд, все
  починены через ASC API (скрипт `~/.appstoreconnect/private/gymbar/asc.py`): (1) виджету не было
  профиля → выпустил App Store профиль на тот же dist-сертификат; (2) `credentials.json` мульти-таргет
  ключуется **именем таргета** (`Gymbar` / `GymbarLiveActivity`), НЕ bundle id; (3) профиль основного
  таргета был INVALID — выпущен до включения App Groups+Push, перевыпустил (подхватил
  `aps-environment`+`group.com.gymbar.app`). Оба профиля в `~/.appstoreconnect/private/gymbar/`

- 2026-07-24 — **Time-aware кнопка готова и влита в `main`** (merge `95b79a7`, feat-коммит
  `6f81653`). Кнопка «Готово» снова появляется сама, когда отдых истёк, пока приложение спит
  на locked screen: виджет рисует её по времени (`canCompleteSet || rest && restEndsAt<=now`),
  `staleDate=restEndsAt` даёт авто-ре-рендер в конце отдыха, guard интента принимает тап по
  истёкшему отдыху. **pending-флаг убран** — он блокировал 2-й тап (дебаунс теперь даёт сам
  `restEndsAt`: после тапа новый отдых в будущем → кнопка прячется до его конца). Проверено на
  iPhone Вугаром: засчитывает подходы через несколько отдыхов без разблокировки экрана

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

> Более ранние записи — `archive/gym-tracker-mobile-2026-07-23.md`

## TODO (priority)

- [ ] **Фаза 1 — двухступенчатый звук** (спека §1): единый планировщик 2 уведомлений + нативная ветка App Intent + foreground fallback
- [ ] **Фаза 2 — сохранность** (§3): iCloud KV конфиг (native-модуль) + безопасный экспорт/импорт истории
- [ ] **Фаза 3 — Cloudflare Worker** (§4): прокси + spend cap + лимиты
- [ ] **Фаза 4 — AI-ввод добавок** (§2): image-picker, предпросмотр, контракт Gemini, агрегированные напоминания
- [ ] **Фаза 5 (позже) — AI-анализ** (§3.3)
- [ ] Дождаться сборки в TestFlight и поставить на телефон
- [ ] Заполнить карточку в UI ASC: скриншоты, тексты, URL, App Privacy → отправка на ревью
- [ ] Оценить вживую тембр бипа и частоту вибрации на реальном телефоне
- [ ] Нативный share-sheet экспорта не проверен вживую — только веб-скачивание
- [ ] Drag-and-drop reorder в редакторе плана — сейчас кнопки ↑↓
- [ ] Проверить splash на нативной сборке (`expo prebuild` + `run:ios`) после замены ассетов

## Decisions (non-obvious, durable)

- 2026-07-24: **EAS local-креды для мульти-таргет приложения (app + widget extension).**
  (1) `mobile/credentials.json` ключуется **именем Xcode-таргета** (`Gymbar`, `GymbarLiveActivity`),
  НЕ bundle id — при ключах-bundleid EAS ругается «credentials for targets not defined». (2) Каждый
  таргет = свой App Store provisioning-профиль на общий dist-сертификат; виджет (`com.gymbar.app.liveactivity`)
  нужен отдельно. (3) После включения новых capabilities (App Groups, Push) старые профили становятся
  **INVALID** — их надо ПЕРЕВЫПУСТИТЬ (профиль нельзя редактировать, только delete+create), иначе
  fastlane падает «profile doesn't support App Groups / aps-environment». Всё автоматизировано в
  `~/.appstoreconnect/private/gymbar/asc.py` (ASC API, JWT через `AuthKey_XC65QPNJJK.p8`):
  `python3 asc.py create` (виджет) / `create-main` (app) / `caps2` (проверить capabilities App ID).
  ⚠️ `filter[identifier]` в ASC API нестрогий (префиксный) — фильтровать точное совпадение в коде.
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
- 2026-07-24: **сохранность — AsyncStorage по умолчанию ИСКЛЮЧЁН из iCloud-бэкапа** (`RNCAsyncStorage.mm`,
  дефолт `RCTAsyncStorageExcludeFromBackup=@YES`). «Не потерять само собой» не работает → строим явно:
  iCloud Key-Value для конфига (native-модуль) + ручной экспорт/импорт истории в iCloud Drive. Плюс:
  **финальный звук отдыха — локальное уведомление** (`utils/liveActivity.ts` `scheduleRestNotification`),
  НЕ Live Activity → второй сигнал («скоро») делается тем же планировщиком. Обе ошибки поймал Codex Sol
  при ревью спеки, проверены по коду.
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
- **Спека новых фич (v2):** `docs/specs/2026-07-24-new-features-design.md` (звук · AI-добавки · iCloud) + ревью Codex Sol
- **Спека Live Activity:** `docs/specs/2026-07-24-live-activity-design.md`
- **Инструкции агентам:** `AGENTS.md` (корень), `mobile/AGENTS.md` (пин на докИ Expo v54)
- **Репозиторий:** https://github.com/hasanovvug-gif/gymbar
- **App Store Connect:** app id `6793901080` · bundle `com.gymbar.app` · SKU `gymbar-001`
- **Карточка и скриншоты:** `docs/appstore/metadata.md`, `docs/appstore/screenshots/`
- **Сайт поддержки:** https://hasanovvug-gif.github.io/gymbar/ (ветка `gh-pages`, исходники `site/`)
- **Подпись:** `~/.appstoreconnect/private/gymbar/` (профиль + p12), ключ API `AuthKey_XC65QPNJJK.p8`
- **Knowledge:** `~/Documents/Projects/mission-control/knowledge/projects/gym-tracker.md`
- **Исходная задача по дизайну:** `~/Documents/Projects/mission-control/tasks/personal/gymtracker-design.md`

## Working state

- Branch: **`main`**, дерево чистое, всё запушено. Ветка `feat/live-activity` слита и удалена.
- Worktree: `~/Documents/Projects/Gym-Tracker`
- Last commit: `e049d2d` (спека новых фич v2). Ключевое: merge LA `95b79a7`, time-aware кнопка `6f81653`
- Приложение: `mobile/`, bundle id `com.gymbar.app`, Team ID `K6M569DX9E`
- **EAS App Store сборка (мульти-таргет):** `credentialsSource: local`, `credentials.json` ключуется
  ИМЕНЕМ таргета (`Gymbar`/`GymbarLiveActivity`). Профили + скрипт перевыпуска — в
  `~/.appstoreconnect/private/gymbar/` (`asc.py`: `create`/`create-main`/`caps2`/`tf-attach`/`versions`).
  Команды: `npx eas-cli build --platform ios --non-interactive` → `submit --latest`. См. Decisions.
- **TestFlight:** build #6 (Live Activity) привязан к «Internal Testers» (`000fea70…`), проверен на iPhone.
  Кандидат на версию **1.0.1**. Версия 1.0 (build #2, без LA) — `WAITING_FOR_REVIEW`, не трогаем.
- **Live Activity тест только на реальном устройстве** (не Expo Go, не всегда симулятор): custom dev-build
  `cd mobile && npx expo run:ios --device` — запускать в ТЕРМИНАЛЕ ВУГАРА (UTF-8 локаль; у Claude-shell
  локаль ASCII → `pod install` падает `Encoding::CompatibilityError`, обходится `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`)
- Тест кнопки на locked screen: разбудить экран → дать Face ID (замок открыт) → остаться на lock screen → тап
- Диагностика логов интента: `idevicesyslog` НЕ подходит (os.Logger не виден) → Console.app / `log collect`
- Файлы Live Activity: `targets/live-activity/` (виджет: `GymbarLiveActivity.swift`, `_shared/`),
  `modules/gymbar-live-activity/ios/` (native-мостик), `hooks/useLiveActivity.ts`, `utils/liveActivity.ts`
- Запуск обычный: `cd mobile && npx expo start` · симулятор — `npx expo run:ios`
