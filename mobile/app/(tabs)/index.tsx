import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Heading, PrimaryButton, Screen } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useNow } from '@/hooks/useNow';
import { useGymStore } from '@/store/useGymStore';
import { calculateSupplementStreak } from '@/utils/supplements';
import { formatDuration, formatNumber, formatShortDate, formatToday } from '@/utils/format';

export default function HomeScreen() {
  const router = useRouter();
  const now = useNow();
  const { workoutDays, history, activeSession, supplementLogs, supplements, startWorkout } = useGymStore();
  const lastSession = history[0];
  const lastDayIndex = workoutDays.findIndex((day) => day.id === lastSession?.dayId);
  const plannedDay = workoutDays[(Math.max(0, lastDayIndex) + 1) % Math.max(1, workoutDays.length)] ?? workoutDays[0];
  const volume = history.reduce((sum, session) => sum + session.totalVolume, 0);
  const streak = calculateSupplementStreak(supplements, supplementLogs);
  const activeSeconds = activeSession
    ? activeSession.activeSeconds + (activeSession.phase === 'paused' ? 0 : Math.floor((now - activeSession.activeStartedAt) / 1000))
    : 0;

  const start = () => {
    if (!plannedDay) return;
    startWorkout(plannedDay.id);
    router.push('/workout-session');
  };

  return (
    <Screen>
      <View>
        <Text style={styles.date}>{formatToday()}</Text>
        <Heading>Погнали, Вугар</Heading>
      </View>

      {activeSession ? (
        <Pressable onPress={() => router.push('/workout-session')} style={styles.activeCard}>
          <View style={styles.activeTop}>
            <Text style={styles.activeEyebrow}>{activeSession.phase === 'paused' ? 'Тренировка на паузе' : 'Тренировка идёт'}</Text>
            <View style={styles.activeDot} />
          </View>
          <Text style={styles.activeTimer}>{formatDuration(activeSeconds)}</Text>
          <Text style={styles.activeMeta}>День {workoutDays.findIndex((day) => day.id === activeSession.dayId) + 1} — {activeSession.dayName} · упражнение {activeSession.currentExerciseIndex + 1} из {activeSession.exercises.length}</Text>
          <View style={styles.continueButton}><Text style={styles.continueText}>Продолжить</Text></View>
        </Pressable>
      ) : plannedDay ? (
        <Card style={styles.planCard}>
          <Text style={styles.eyebrow}>Сегодня по плану</Text>
          <Heading size={27} style={styles.planHeading}>День {workoutDays.indexOf(plannedDay) + 1} — {plannedDay.name}</Heading>
          <Text style={styles.planMeta}>{plannedDay.exercises.length} упражнений · ~{Math.max(30, plannedDay.exercises.length * 9)} мин</Text>
          <PrimaryButton label="Старт" onPress={start} style={styles.startButton} />
        </Card>
      ) : (
        <Card><Text style={styles.planMeta}>Добавьте первый день в разделе «Тренировки».</Text></Card>
      )}

      <View style={styles.stats}>
        <Stat value={String(history.length)} label="тренировок" />
        <Stat value={`${formatNumber(volume / 1000)} т`} label="общий объём" />
        <Stat value={`${streak} дн`} label="стрик добавок" accent />
      </View>

      {lastSession && (
        <Pressable onPress={() => router.push('/(tabs)/history')}>
          <Card>
            <Text style={styles.lastEyebrow}>Последняя тренировка</Text>
            <View style={styles.lastHeader}>
              <Text style={styles.lastTitle}>День — {lastSession.dayName}</Text>
              <Text style={styles.lastDate}>{formatShortDate(lastSession.date)}</Text>
            </View>
            <View style={styles.lastStats}>
              <Text style={styles.lastMeta}>{Math.ceil((lastSession.activeSeconds + lastSession.pausedSeconds) / 60)} мин</Text>
              <Text style={styles.lastMeta}>{formatNumber(lastSession.totalVolume)} кг</Text>
              <Text style={styles.lastMeta}>{lastSession.exercises.reduce((sum, exercise) => sum + exercise.completedSets, 0)} подходов</Text>
            </View>
          </Card>
        </Pressable>
      )}
    </Screen>
  );
}

function Stat({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <Card style={styles.statCard}>
      <Text numberOfLines={1} style={[styles.statValue, accent && styles.statAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  date: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 13, marginBottom: 1 },
  planCard: { borderRadius: 24, padding: 20 },
  eyebrow: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  planHeading: { lineHeight: 34, marginTop: 4 },
  planMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, marginTop: 3 },
  startButton: { marginTop: 16 },
  activeCard: { backgroundColor: colors.accent, borderRadius: 24, padding: 20 },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeEyebrow: { color: colors.accentText, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  activeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentText },
  activeTimer: { color: colors.accentText, fontFamily: fonts.heading, fontSize: 40, marginTop: 4 },
  activeMeta: { color: 'rgba(11,12,14,0.7)', fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 18 },
  continueButton: { minHeight: 50, marginTop: 14, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  continueText: { color: colors.accent, fontFamily: fonts.bodyExtraBold, fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 },
  stats: { flexDirection: 'row', gap: 9 },
  statCard: { flex: 1, paddingHorizontal: 11, paddingVertical: 13, borderRadius: 18 },
  statValue: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 22 },
  statAccent: { color: colors.accent },
  statLabel: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 9, marginTop: 2 },
  lastEyebrow: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  lastHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'baseline', marginTop: 8 },
  lastTitle: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14, flex: 1 },
  lastDate: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  lastStats: { flexDirection: 'row', gap: 15, marginTop: 7 },
  lastMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
});
