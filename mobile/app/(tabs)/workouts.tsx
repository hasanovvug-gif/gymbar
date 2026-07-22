import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Heading, PrimaryButton, Screen } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useGymStore } from '@/store/useGymStore';

export default function WorkoutsScreen() {
  const router = useRouter();
  const days = useGymStore((state) => state.workoutDays);
  const startWorkout = useGymStore((state) => state.startWorkout);
  const activeSession = useGymStore((state) => state.activeSession);
  const [expandedId, setExpandedId] = useState(days[1]?.id ?? days[0]?.id);

  const begin = (dayId: string) => {
    startWorkout(dayId);
    router.push('/workout-session');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Heading>Тренировки</Heading>
        <Pressable onPress={() => router.push('/plan-editor')} style={styles.editButton}>
          <Text style={styles.editText}>Ред. план</Text>
        </Pressable>
      </View>

      {activeSession && (
        <Card accent>
          <Text style={styles.eyebrow}>Тренировка уже начата</Text>
          <Text style={styles.activeTitle}>День {days.findIndex((day) => day.id === activeSession.dayId) + 1} — {activeSession.dayName}</Text>
          <PrimaryButton label={activeSession.phase === 'paused' ? 'Продолжить' : 'Вернуться к тренировке'} onPress={() => router.push('/workout-session')} style={styles.resumeButton} />
        </Card>
      )}

      {days.length === 0 ? (
        <Card><Text style={styles.empty}>План пуст. Добавьте тренировочный день в редакторе.</Text></Card>
      ) : days.map((day, index) => {
        const expanded = expandedId === day.id;
        return (
          <Pressable key={day.id} onPress={() => setExpandedId(expanded ? '' : day.id)}>
            <Card accent={expanded}>
              <View style={styles.dayHeader}>
                <View style={styles.flex}>
                  <Text style={styles.dayTitle}>День {index + 1} — {day.name}</Text>
                  <Text style={[styles.dayMeta, expanded && styles.dayMetaActive]}>{expanded ? 'Выбранный день' : `${day.exercises.length} упражнений`}</Text>
                </View>
                <Text style={[styles.chevron, expanded && styles.chevronActive]}>{expanded ? '⌄' : '›'}</Text>
              </View>
              {expanded && (
                <View style={styles.exerciseList}>
                  {day.exercises.map((exercise) => (
                    <View key={exercise.id} style={styles.exerciseRow}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMeta}>
                        {exercise.plannedSets} × {exercise.isTimeBased ? `${exercise.secondsPerSet ?? 60} с` : `${exercise.reps}${exercise.weight > 0 ? ` · ${exercise.weight} кг` : ''}`}
                      </Text>
                    </View>
                  ))}
                  <PrimaryButton
                    label={`Начать день ${index + 1}`}
                    onPress={() => begin(day.id)}
                    disabled={Boolean(activeSession) || day.exercises.length === 0}
                    style={styles.startButton}
                  />
                </View>
              )}
            </Card>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editButton: { minHeight: 44, borderWidth: 1, borderColor: colors.accent, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  editText: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  eyebrow: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  activeTitle: { color: colors.textPrimary, fontFamily: fonts.headingSemiBold, fontSize: 23, textTransform: 'uppercase', marginTop: 5 },
  resumeButton: { marginTop: 14 },
  dayHeader: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  dayTitle: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 16 },
  dayMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13, marginTop: 3 },
  dayMetaActive: { color: colors.accent, fontFamily: fonts.bodySemiBold },
  chevron: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 22, marginLeft: 12 },
  chevronActive: { color: colors.accent },
  exerciseList: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 10, gap: 9 },
  exerciseRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between', alignItems: 'baseline' },
  exerciseName: { color: colors.textPrimary, fontFamily: fonts.body, fontSize: 14, flex: 1 },
  exerciseMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  startButton: { marginTop: 6, minHeight: 48 },
  empty: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
});
