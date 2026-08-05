# Gymbar — карточка Google Play

Пакет `com.gymbar.app` · app ID `4974629015832287010` · аккаунт **AsbestosGuard** ·
категория Health & Fitness · бесплатно · без рекламы и покупок ·
язык по умолчанию **en-US**, локализации **ru-RU** и **uk-UA**.

> ⚠️ **Чем Android отличается от iOS.** В Android-сборке **нет Live Activity** и **нет синхронизации
> через iCloud** — оба нативных модуля объявлены `platforms: ["apple"]`. В текстах ниже они не
> упоминаются вообще: обещать в листинге то, чего в сборке нет, — прямой путь к отклонению.
>
> ⚠️ **Скан этикетки работает и на Android** (`expo-image-picker` + Worker → Gemini), поэтому во всех
> трёх языках честно сказано, что фото уходит на сервер для распознавания. Формулировка «ничего не
> покидает телефон» из карточки App Store сюда **не переносится** — она противоречила бы Data safety.

Лимиты Play: название ≤ 30 · короткое описание ≤ 80 · полное описание ≤ 4000.

---

## English (en-US, по умолчанию)

**App name** (27): `Gymbar: Workout Log & Timer`

_Альтернатива, если хочется держать бренд ровно как в App Store: `Gymbar` (6). Play индексирует
название сильнее, чем App Store, поэтому по умолчанию берём вариант с ключами._

**Short description** (77): `Plan your split, run the session, log every set. Rest timer, offline, no ads.`

**Full description**:

```
Gymbar is a training log built for one thing: getting through the session without touching your phone more than you have to.

PLAN
· Build your split as an ordered list of days — no weekday lock-in.
· Exercises with target sets, reps and weight.
· Drag days and exercises by the handle to reorder them.

SESSION
· Rest timer between sets with a sound cue that plays even on silent.
· Pause the workout at any moment — paused time is excluded from active time, so your session length stays honest.
· Skip an exercise (no volume counted) or end it early (the sets you did still count). Two different actions, two different results.
· Optional reason tags when you pause or stop early: tired, distracted, out of time, discomfort.

SUPPLEMENTS
· Checklist by time of day: morning, pre-workout, evening.
· Stock levels with a low-stock warning, so you reorder before you run out.
· Adherence streak and a monthly calendar of what you actually took.
· Add a supplement by photographing the label instead of typing the card by hand.

AFTER
· Summary with total time, active time, pauses and volume.
· Full history and an eight-week volume chart.
· Export everything to a JSON file, import it back on another phone.

YOUR DATA
Workouts, history, supplements and settings are stored on your device. No account, no ads, no analytics, and the app works fully offline.

The one exception is the optional label scan: if you choose to photograph a supplement label, the photos and your note are sent to our server and to Google Gemini to read the label, and are not stored there. Everything else stays on the phone. Full policy: https://hasanovvug-gif.github.io/gymbar/privacy.html

Dark and light themes. English, Russian and Ukrainian.
```

---

## Русский (ru-RU)

**App name** (26): `Gymbar: дневник тренировок`

**Short description** (69): `Сплит, тренировка, каждый подход. Таймер отдыха, офлайн, без рекламы.`

**Full description**:

```
Gymbar — дневник тренировок, сделанный ради одного: пройти тренировку, не залипая в телефон.

ПЛАН
· Сплит — упорядоченный список дней, без привязки к дням недели.
· Упражнения с целевыми подходами, повторами и весом.
· Дни и упражнения переставляются перетаскиванием за ручку.

ТРЕНИРОВКА
· Таймер отдыха между подходами со звуковым сигналом — слышно даже на беззвучном.
· Пауза в любой момент: время паузы не идёт в активное время, итог не врёт.
· Пропустить упражнение (объём не считается) или завершить его раньше (сделанные подходы засчитываются) — это два разных действия с разным результатом.
· Необязательные метки причины: устал, отвлёкся, не хватило времени, дискомфорт.

ДОБАВКИ
· Чек-лист по времени дня: утро, перед тренировкой, вечер.
· Остатки на складе с предупреждением — докупаешь до того, как закончилось.
· Стрик приёма и календарь месяца: что реально принято, а что нет.
· Добавку можно завести, сфотографировав этикетку, а не заполняя карточку руками.

ПОСЛЕ
· Итог: общее время, активное время, паузы, объём.
· История целиком и график объёма за восемь недель.
· Экспорт всех данных в JSON и импорт обратно на другом телефоне.

ДАННЫЕ
Тренировки, история, добавки и настройки лежат на телефоне. Без аккаунта, без рекламы, без аналитики; приложение полностью работает офлайн.

Единственное исключение — необязательный скан этикетки: если ты сам фотографируешь упаковку, фото и твоя заметка уходят на наш сервер и в Google Gemini, чтобы прочитать этикетку, и там не хранятся. Всё остальное с телефона не уходит. Полная политика: https://hasanovvug-gif.github.io/gymbar/privacy.html

Тёмная и светлая темы. Русский, украинский и английский.
```

---

## Українська (uk-UA)

**App name** (26): `Gymbar: щоденник тренувань`

**Short description** (72): `Спліт, тренування, кожен підхід. Таймер відпочинку, офлайн, без реклами.`

**Full description**:

```
Gymbar — щоденник тренувань, зроблений заради одного: пройти тренування, не залипаючи в телефон.

ПЛАН
· Спліт — упорядкований список днів, без прив'язки до днів тижня.
· Вправи з цільовими підходами, повтореннями та вагою.
· Дні та вправи переставляються перетягуванням за ручку.

ТРЕНУВАННЯ
· Таймер відпочинку між підходами зі звуковим сигналом — чутно навіть на беззвучному.
· Пауза будь-якої миті: час паузи не йде в активний час, підсумок не бреше.
· Пропустити вправу (обсяг не рахується) або завершити її раніше (зроблені підходи зараховуються) — це дві різні дії з різним результатом.
· Необов'язкові мітки причини: втомився, відволікся, не вистачило часу, дискомфорт.

ДОБАВКИ
· Чек-лист за часом доби: ранок, перед тренуванням, вечір.
· Залишки на складі з попередженням — докуповуєш до того, як скінчилося.
· Стрик прийому та календар місяця: що справді прийнято, а що ні.
· Добавку можна завести, сфотографувавши етикетку, а не заповнюючи картку вручну.

ПІСЛЯ
· Підсумок: загальний час, активний час, паузи, обсяг.
· Історія повністю та графік обсягу за вісім тижнів.
· Експорт усіх даних у JSON та імпорт назад на іншому телефоні.

ДАНІ
Тренування, історія, добавки й налаштування лежать на телефоні. Без акаунта, без реклами, без аналітики; застосунок повністю працює офлайн.

Єдиний виняток — необов'язковий скан етикетки: якщо ти сам фотографуєш упаковку, фото та твоя нотатка йдуть на наш сервер і в Google Gemini, щоб прочитати етикетку, і там не зберігаються. Усе інше з телефона не йде. Повна політика: https://hasanovvug-gif.github.io/gymbar/privacy.html

Темна і світла теми. Українська, російська та англійська.
```

---

## Графика листинга

| Что | Требование Play | Статус |
|---|---|---|
| Скриншоты телефона | 2–8 шт., от 320 px, соотношение ≤ 2:1 | ✅ 8 шт., 1080×1920 — `docs/appstore/screenshots-play/` |
| Иконка | 512×512 PNG, 32-бит, без прозрачности | ✅ `play-graphics/icon-512.png` |
| Feature graphic | 1024×500 PNG/JPEG, без прозрачности | ✅ `play-graphics/feature-graphic-1024x500.png` |

Скриншоты сняты с реального интерфейса (Expo Web, `mobile/scripts/shoot-play-screenshots.py`),
без рамки устройства и без экранов с функциями, которых в Android-сборке нет.

**Иконка** — `mobile/assets/images/icon.png` (1024, та же, что в сборке), сведённая на фирменный
фон `#0B0C0E` и уменьшенная до 512. Альфа принудительно выставлена в 255: файл 32-битный, как
просит Play, но полупрозрачных пикселей в нём нет (после ресайза они появились бы по краям).

**Feature graphic** собирается из исходника, а не рисуется руками:
`mobile/scripts/feature-graphic.html` + `mobile/scripts/shoot-feature-graphic.py` (Playwright,
страница открывается как `file://`, дев-сервер не нужен). Шрифты Oswald 700 и Manrope берутся прямо
из `node_modules`, палитра — из `constants/theme.ts`, марка — та же иконка. Правишь HTML,
перезапускаешь скрипт. Текст держится в центре: Play обрезает графику по краям в разных раскладках.

## Ссылки для формы

- **Website:** https://hasanovvug-gif.github.io/gymbar/
- **Privacy Policy:** https://hasanovvug-gif.github.io/gymbar/privacy.html
- **Email поддержки:** — заполнить в Play Console (нужен адрес, который не жалко показать публично)

## Data safety — что заявлять

Не «данные не собираются». Приложение собирает при **необязательном** скане этикетки:

| Тип данных | Собирается | Передаётся третьим лицам | Цель | Обязательно |
|---|---|---|---|---|
| Photos (фото этикетки) | да | да — Google Gemini через наш Cloudflare Worker | App functionality | нет |
| Other user content (заметка к добавке) | да | да, туда же | App functionality | нет |

Остальное (тренировки, история, добавки, настройки, идентификаторы) — не собирается, живёт на устройстве.
Шифрование в транзите: да (HTTPS). Удаление данных: аккаунтов нет, на сервере ничего не хранится.

⚠️ **Расхождение, которое надо закрыть на стороне App Store.** В карточке App Store написано
«No account, no server, no ads» — с версии 1.0.1 это неправда из-за скана этикетки. Анкета App Privacy
уже исправлена 25.07, а текст описания — нет. Поправить при следующем обновлении.
