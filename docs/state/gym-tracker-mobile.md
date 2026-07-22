---
campaign: gym-tracker-mobile
status: active
started: 2026-07-22
updated: 2026-07-22 14:52
---

# Gym Tracker → Expo/React Native

## Где сейчас

Приложение полностью реализовано на Expo/RN (SDK 54): все экраны из дизайна, полный флоу
тренировки, добавки, история, настройки. Проверено визуально в симуляторе iPhone 17 Pro
и в браузере. Ветка `feat/mobile-expo-app` запушена в origin, PR не открывался.
Старый Vite-прототип в `src/` оставлен как есть — только референс.

## Next step

Прогнать полный флоу тренировки на реальном айфоне через Expo Go (`exp://<LAN-IP>:8081`),
затем закрывать заглушки: светлая тема, переводы UA/EN, экспорт данных.

## Done (recent first, max 10)

- 2026-07-22 — Апгрейд Expo SDK 53 → 54, нативная сборка iOS проходит (`276d696`)
- 2026-07-22 — Полная реализация всех экранов и логики, сделана Codex Sol, верифицирована (`df76b0b`)
- 2026-07-22 — Скаффолд Expo + дизайн-система (цвета, Oswald/Archivo) + 5-табная навигация
- 2026-07-22 — Заведён `docs/state/`, кампания перенесена из чата в файл

## TODO (priority)

- [ ] Прогнать полный флоу тренировки на реальном айфоне (Expo Go)
- [ ] Светлая тема — сейчас выбор сохраняется, но палитра не реализована (TODO в коде)
- [ ] Переводы UA/EN — селектор работает, тексты везде русские (TODO в коде)
- [ ] Экспорт данных — сейчас заглушка-алерт «скоро»
- [ ] Drag-and-drop reorder в редакторе плана — сейчас кнопки ↑↓
- [ ] Иконка приложения и splash-графика под публикацию (сейчас дефолтные ассеты Expo)
- [ ] Публикация в App Store

## Decisions (non-obvious, durable)

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
- **Репозиторий:** https://github.com/hasanovvug-gif/Gym-Tracker
- **Knowledge:** `~/Documents/Projects/mission-control/knowledge/projects/gym-tracker.md`
- **Исходная задача по дизайну:** `~/Documents/Projects/mission-control/tasks/personal/gymtracker-design.md`

## Working state

- Branch: `feat/mobile-expo-app` (запушена, отслеживает origin; PR не открыт)
- Worktree: `~/Documents/Projects/Gym-Tracker`
- Last meaningful commit: `276d696` — chore(mobile): upgrade expo sdk to 54
- Приложение: `mobile/`, bundle id `com.vugarhasanov.gymtracker`
- Запуск: `cd mobile && npx expo start` · симулятор — `npx expo run:ios`
