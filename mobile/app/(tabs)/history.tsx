import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Card, Heading, Screen } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useGymStore } from '@/store/useGymStore';
import { WorkoutSession } from '@/types/workout';
import { formatDuration, formatNumber, formatShortDate } from '@/utils/format';

export default function HistoryScreen() {
  const history = useGymStore((state) => state.history);
  const [expandedId, setExpandedId] = useState(history[0]?.id ?? '');

  return (
    <Screen>
      <Heading>История</Heading>
      <VolumeChart history={history} />
      {history.length === 0 && <Card><Text style={styles.empty}>Завершённые тренировки появятся здесь.</Text></Card>}
      {history.map((session) => {
        const expanded = expandedId === session.id;
        return (
          <Pressable key={session.id} onPress={() => setExpandedId(expanded ? '' : session.id)}>
            <Card accent={expanded}>
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionTitle}>День — {session.dayName}</Text>
                <Text style={styles.sessionDate}>{formatShortDate(session.date)}</Text>
              </View>
              <View style={styles.metrics}>
                <Text style={styles.metric}>{Math.ceil((session.activeSeconds + session.pausedSeconds) / 60)} мин · {Math.ceil(session.activeSeconds / 60)} акт</Text>
                <Text style={styles.metric}>{formatNumber(session.totalVolume)} кг</Text>
                {session.pauseCount > 0 && <Text style={styles.pauseMetric}>{session.pauseCount} пауз{session.pauseCount === 1 ? 'а' : 'ы'}</Text>}
              </View>
              {expanded && (
                <View style={styles.details}>
                  {session.pauseRecords.length > 0 && (
                    <View style={styles.pauseDetails}>
                      <Text style={styles.pauseDetailsTitle}>Паузы</Text>
                      <Text style={styles.pauseDetailsText}>
                        {session.pauseRecords.map((record) => `${formatDuration(record.durationSeconds)}${record.reasonTag ? ` · ${record.reasonTag}` : ''}`).join('   ')}
                      </Text>
                    </View>
                  )}
                  {session.exercises.length === 0 ? (
                    <Text style={styles.empty}>Детализация подходов не сохранена для этой старой сессии.</Text>
                  ) : session.exercises.map((exercise) => (
                    <View key={exercise.exerciseId} style={styles.exerciseRow}>
                      <View style={styles.flex}>
                        <Text style={[styles.exerciseName, exercise.status === 'skipped' && styles.skipped]}>{exercise.exerciseName}</Text>
                        {exercise.status === 'ended_early' && <Text style={styles.early}>раньше{exercise.reasonTag ? ` · ${exercise.reasonTag}` : ''}</Text>}
                        {exercise.status === 'skipped' && <Text style={styles.skippedMeta}>пропущено{exercise.reasonTag ? ` · ${exercise.reasonTag}` : ''}</Text>}
                      </View>
                      <Text style={[styles.exerciseMeta, exercise.status === 'skipped' && styles.skipped]}>{exercise.completedSets}/{exercise.plannedSets} · {exercise.isTimeBased ? `${exercise.secondsPerSet ?? 60} с` : exercise.weight > 0 ? `${exercise.weight} кг` : 'вес тела'}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

function VolumeChart({ history }: { history: WorkoutSession[] }) {
  const chart = useMemo(() => {
    const currentWeek = new Date();
    currentWeek.setHours(0, 0, 0, 0);
    currentWeek.setDate(currentWeek.getDate() - ((currentWeek.getDay() + 6) % 7));
    const weeks = Array.from({ length: 8 }, (_, index) => {
      const start = new Date(currentWeek);
      start.setDate(start.getDate() - (7 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const volume = history.reduce((sum, session) => {
        const date = new Date(session.date);
        return date >= start && date < end ? sum + session.totalVolume : sum;
      }, 0);
      return { start, volume };
    });
    const volumes = weeks.map((week) => week.volume);
    const max = Math.max(...volumes, 1);
    const coordinates = volumes.map((volume, index) => ({
      x: index * 42,
      y: 96 - (volume / max) * 68,
    }));
    const baseline = volumes.slice(0, -1).find((volume) => volume > 0) ?? 0;
    const last = volumes[volumes.length - 1];
    const label = (date: Date) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date).replace('.', '');
    return {
      points: coordinates.map((point) => `${point.x},${point.y}`).join(' '),
      lastX: coordinates[coordinates.length - 1].x,
      lastY: coordinates[coordinates.length - 1].y,
      change: baseline === 0 ? 0 : Math.round(((last - baseline) / baseline) * 100),
      labels: [label(weeks[0].start), label(weeks[4].start), label(weeks[7].start)],
    };
  }, [history]);

  return (
    <Card style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>Объём за 8 недель</Text>
        <Text style={[styles.chartChange, chart.change < 0 && { color: colors.warning }]}>{chart.change >= 0 ? '↗ +' : '↘ '}{chart.change}%</Text>
      </View>
      <Svg width="100%" height={110} viewBox="0 0 300 110">
        <Line x1="0" y1="30" x2="300" y2="30" stroke="#1C1F24" strokeWidth="1" />
        <Line x1="0" y1="65" x2="300" y2="65" stroke="#1C1F24" strokeWidth="1" />
        <Line x1="0" y1="100" x2="300" y2="100" stroke="#1C1F24" strokeWidth="1" />
        <Polyline points={chart.points} fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={chart.lastX} cy={chart.lastY} r="5" fill={colors.accent} />
      </Svg>
      <View style={styles.chartLabels}>{chart.labels.map((label) => <Text key={label} style={styles.chartLabel}>{label}</Text>)}</View>
    </Card>
  );
}

const styles = StyleSheet.create({
  chartCard: { borderRadius: 20, padding: 17 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  chartTitle: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  chartChange: { color: colors.accent, fontFamily: fonts.bodyExtraBold, fontSize: 13 },
  chartLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  chartLabel: { color: colors.textDim, fontFamily: fonts.bodySemiBold, fontSize: 9 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  sessionTitle: { flex: 1, color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  sessionDate: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  metric: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  pauseMetric: { color: colors.warning, fontFamily: fonts.body, fontSize: 12 },
  details: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 11, paddingTop: 8, gap: 4 },
  pauseDetails: { paddingBottom: 8, marginBottom: 2, borderBottomWidth: 1, borderBottomColor: '#1C1F24' },
  pauseDetailsTitle: { color: colors.warning, fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  pauseDetailsText: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 3 },
  exerciseRow: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  exerciseName: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 12 },
  exerciseMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  early: { color: colors.warning, fontFamily: fonts.body, fontSize: 10 },
  skipped: { color: colors.textMuted },
  skippedMeta: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 10 },
  empty: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
});
