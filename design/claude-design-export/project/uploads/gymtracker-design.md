---
area: personal
status: active
created: 2026-07-22
---
# 💪 Gym Tracker — редизайн в Claude Design

**Что:** переосмыслить дизайн Gym Tracker (сейчас — голый Tailwind-прототип из AI Studio) через `claude.ai/design` (модель Fable 5), забрать результат и пересобрать на Expo/React Native под App Store. Часть общего плана — см. [[gym-tracker]].

## Решения сессии (22.07.2026)

- **Объём:** редизайн существующих экранов (Dashboard, Workout, History, Settings) + новый раздел «Добавки» (чек-лист приёма, склад/остатки, прогресс/стрик, расписание) + экран редактирования плана тренировок.
- **AI-фичи убраны из дизайна полностью** (pre-workout совет, weekly-отчёт, чат-ассистент) — были в текущем прототипе через Gemini, не переносим.
- **Формат:** мобильное приложение под iPhone (не веб-макет) — дизайним сразу под перенос в Expo/RN.
- **Стиль:** не фиксировали палитру/тему — отдано на откуп Claude Design/Fable 5.
- **Новая механика — пауза/отдых во время тренировки** (по мотивам «отвлёкся/устал/захотел пропустить подход»):
  - **Rest** (как сейчас) — таймер между подходами, звуковой сигнал в конце = «пора начинать подход».
  - **Pause** (новое) — отдельная кнопка, доступна в любой момент тренировки, не только во время отдыха. Замораживает счётчик активного времени; при возврате — «Продолжить». Пауза не искажает итоговое время тренировки.
  - **Summary** показывает разбивку: общее время / активное время / кол-во и длительность пауз.
  - Разделены «Пропустить упражнение целиком» (объём не считается) и «Закончить с этим упражнением раньше» (сделанные подходы всё равно засчитаны в объём) — фикс текущего бага, где skip обнулял объём даже при частично сделанных подходах.
  - Лёгкие необязательные теги причины (Устал / Отвлёкся / Не хватило времени / Дискомфорт) при паузе/раннем завершении — просто метка в данных, без AI-анализа.
- Навигация — 5 табов: Главная · Тренировки · Добавки · История · Настройки.

## Финальный prompt для Claude Design

```xml
<context>
You are designing "Gym Tracker" — a personal workout and supplement-tracking mobile app for a single user (no login, no social features, no multi-user accounts — this app exists purely for one person's own training). It replaces a plain, generic-looking web prototype. Give it a distinctive, motivating visual identity, not corporate SaaS. Choose the style direction yourself — energetic gym-tone, calm premium minimalism, or something else — pick whatever reads as the strongest, most cohesive system, and apply it consistently across every screen, including a dark mode variant.
</context>

<platform>
Design as a native-feeling iOS mobile app: screens sized for iPhone, iOS interaction patterns (bottom tab bar, swipe gestures, sheet modals, native-style pickers). This will be rebuilt in React Native / Expo and shipped to the App Store, so design directly for that context rather than a responsive web layout.
</platform>

<navigation>
Bottom tab bar, 5 tabs: Home, Workouts, Supplements, History, Settings.
</navigation>

<screens>

<screen name="Home / Dashboard">
- Today's scheduled workout as a hero card with a clear "Start" CTA
- Quick stats row: total workouts, total volume lifted, current supplement streak
- Last workout summary (date, duration, volume)
- If a workout is currently paused/in-progress, this becomes a "Continue workout" banner instead
</screen>

<screen name="Workouts (plan overview)">
- List of training days in the split (e.g. "Day 1 — Chest & Triceps", "Day 2 — Back & Biceps"...), each showing exercise count
- Tapping a day previews its exercise list before starting
- Entry point into the Plan Editor
</screen>

<screen name="Plan Editor">
- Add / reorder / remove training days
- Per day: add / edit / remove exercises (name, sets, reps, default weight, optional "time-based" toggle for things like planks)
</screen>

<screen name="Active Workout Session">
This is the most-used screen — design it for one-handed, sometimes sweaty, mid-workout use. Large tap targets, minimal text entry.
- One exercise in focus at a time, with a progress bar across the whole session
- Set-by-set checklist, editable working weight per exercise
- REST timer: after completing a set, a programmed countdown starts automatically with a clear +30s control; when it hits zero, a sound cue plays telling the user it's time to start the next set. Make this a prominent, unmissable visual moment.
- PAUSE (distinct from Rest): a "Pause" control is always available during the session, not just during rest — for unplanned stops (fatigue, distraction, feeling off). Tapping it freezes the session's active-time counter and shows a clear "Paused" state with a "Resume" CTA. Time spent paused does NOT count toward active workout time — it's tracked separately as pause count + pause duration.
- Optional lightweight reason chips when pausing or ending an exercise early: "Tired / Distracted / Out of time / Discomfort" — just a quick one-tap label stored with the event, no explanation needed, purely for the user's own later reference.
- Two distinct end-of-exercise actions: "Skip exercise" (never started it — no volume credited) vs "End exercise early" (did some sets, e.g. 2 of 3, stopping there — the completed sets still count toward volume)
- Prev/next exercise navigation, finish workout action
</screen>

<screen name="Workout Summary">
Shown right after finishing a session.
- Time breakdown: total duration, active time, and paused time (with pause count) — e.g. "52 min total — 38 min active, 14 min paused (3 pauses)"
- Total volume lifted
- Per-exercise breakdown: sets completed vs planned, weight used, and any reason tag if a set/exercise was paused or ended early
</screen>

<screen name="History">
- Volume-over-time line chart
- List of past sessions, expandable to show exercise-level detail per session, including any pause/skip reason tags from that session
</screen>

<screen name="Supplements — Today">
- Daily checklist of supplements grouped by time of day (morning / pre-workout / evening), tap to mark taken
</screen>

<screen name="Supplements — Inventory">
- List of supplements with remaining stock (servings/amount left), a clear low-stock warning state
</screen>

<screen name="Supplements — Progress">
- Adherence streak counter and a simple calendar or trend view of consistency over time
</screen>

<screen name="Supplements — Schedule Editor">
- Add/edit/remove supplements and set what time of day each should be taken
</screen>

<screen name="Settings">
- Profile (placeholder), language selector (Russian / Ukrainian / English), theme toggle (light/dark), notification preferences
</screen>

</screens>

<constraints>
- No AI features anywhere in this design (no chat assistant, no AI-generated advice or reports) — this is a straightforward manual tracker
- No auth/login screens — single user, opens straight to Home
- Design clear, friendly empty states for History and Supplements screens when there's no data yet
</constraints>
```

## Дальше

- [ ] Вставить prompt в `claude.ai/design`, выбрать модель Fable 5, сгенерировать дизайн
- [ ] Пройтись по экранам, доитерировать конверсационно (Claude Design поддерживает уточнения/правки после первой генерации)
- [ ] Забрать результат → пересобрать на Expo/React Native (замена текущего Vite-веб-скелета)
- [ ] Реализовать модель данных: пауза/отдых (rest vs pause), частичное завершение упражнения, добавки (склад/чек-лист/стрик/расписание)
- [ ] Выложить в App Store (личное приложение, TestFlight → релиз)

## Лог
- 2026-07-22 — брейншторм объёма (редизайн + добавки), стиля (открытый), платформы (mobile-first), механики пауз/отдыха/частичного завершения подхода. Изучена документация Claude Design (запущен 17.04.2026, работает на Opus 4.7, prompt-and-refine loop, поддержка XML-структуры) и модели Fable 5 (Mythos-класс, сильна в UI-дизайне и high-fidelity реализации). Финальный prompt зафиксирован выше, готов к вставке в инструмент.
