// Демо-данные для скриншотов магазинов.
// Запускать в консоли браузера на http://localhost:8081 (npx expo start --web),
// затем перезагрузить страницу. Пишет прямо в persist-ключ стора.
// Ничего не выдумывает про функции — только заполняет историю и приёмы добавок,
// чтобы экраны не были пустыми.
(() => {
  const KEY = 'gym-tracker-mobile-v2';
  const raw = JSON.parse(localStorage[KEY]);
  const d = raw.data;

  const pad = (n) => String(n).padStart(2, '0');
  const dateKey = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  const daysAgo = (n, hour = 18) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - n);
    dt.setHours(hour, 12, 0, 0);
    return dt;
  };

  // --- настройки: убрать онбординг и праймер уведомлений ---
  d.settings.onboardingSeen = true;
  d.settings.notificationsPrimerSeen = true;

  // --- история: 3 тренировки в каждую календарную неделю, объём растёт ---
  // График режет историю по календарным неделям (пн–вс) и сравнивает последнюю
  // с самой старой. Поэтому текущую неделю надо тоже набить тремя тренировками —
  // из уже прошедших её дней, иначе последняя точка проваливается и висит минус.
  const days = d.workoutDays;
  const monday = new Date();
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const elapsed = Math.floor((Date.now() - monday.getTime()) / 86400000); // сколько дней текущей недели прошло

  const dates = [];
  for (let week = 7; week >= 0; week -= 1) {
    const offsets = week === 0
      ? [0, 1, 2, 3, 4].filter((o) => o <= elapsed).slice(-3)
      : [0, 2, 4];
    for (const offset of offsets) {
      const dt = new Date(monday);
      dt.setDate(dt.getDate() - week * 7 + offset);
      dt.setHours(18, 12, 0, 0);
      // Сегодняшняя тренировка не может быть «вечером», если сейчас утро —
      // иначе она уезжает в будущее и текущая неделя недобирает.
      if (dt > new Date()) dt.setTime(Date.now() - 2 * 3600 * 1000);
      if (dt > new Date()) continue;
      dates.push(dt);
    }
  }

  const history = [];
  const SESSIONS = dates.length;
  for (let i = 0; i < SESSIONS; i += 1) {
    const day = days[i % days.length];
    const dt = dates[i];
    const growth = 1 + (i / (SESSIONS - 1)) * 0.25;
    const exercises = day.exercises.map((ex, idx) => {
      const endedEarly = i % 11 === 5 && idx === day.exercises.length - 1;
      const completedSets = endedEarly ? Math.max(1, ex.plannedSets - 1) : ex.plannedSets;
      return {
        exerciseId: ex.id,
        exerciseName: ex.name,
        exerciseNameKey: ex.nameKey,
        plannedSets: ex.plannedSets,
        completedSets,
        reps: ex.reps,
        weight: Math.round(ex.weight * growth),
        isTimeBased: ex.isTimeBased,
        secondsPerSet: ex.secondsPerSet,
        status: endedEarly ? 'ended_early' : 'completed',
      };
    });
    const totalVolume = exercises.reduce(
      (sum, ex) => sum + ex.completedSets * ex.reps * ex.weight,
      0,
    );
    const pauseCount = i % 3 === 0 ? 1 : 0;
    history.push({
      id: `demo-${i}`,
      date: dt.toISOString(),
      dayId: day.id,
      dayName: day.name,
      dayNameKey: day.nameKey,
      activeSeconds: 3180 + (i % 5) * 240,
      pausedSeconds: pauseCount * 190,
      pauseCount,
      pauseRecords: pauseCount
        ? [{ startedAt: dt.getTime() + 1500000, durationSeconds: 190 }]
        : [],
      exercises,
      totalVolume,
    });
  }
  d.history = history.sort((a, b) => new Date(b.date) - new Date(a.date));
  d.activeSession = null;
  d.recentSessionId = null;

  // --- добавки: серия 18 дней, сегодня утро принято, вечер ещё нет ---
  const logs = [];
  for (let n = 18; n >= 0; n -= 1) {
    const dt = daysAgo(n);
    const taken = {};
    for (const s of d.supplements) {
      for (const slot of s.schedule) {
        if (n === 0 && slot !== 'morning') continue;
        taken[`${s.id}:${slot}`] = true;
      }
    }
    logs.push({ date: dateKey(dt), taken });
  }
  d.supplementLogs = logs;

  // --- запасы: один заканчивается, чтобы был честный бейдж ---
  if (d.supplements[2]) d.supplements[2].stock = 6;

  localStorage[KEY] = JSON.stringify(raw);
  return `history: ${d.history.length}, logs: ${d.supplementLogs.length}`;
})();
