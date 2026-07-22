import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Heading, OutlineButton, Screen, Toggle } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useGymStore } from '@/store/useGymStore';

const numberValue = (text: string, fallback: number) => {
  const parsed = Number(text.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function PlanEditorScreen() {
  const router = useRouter();
  const days = useGymStore((state) => state.workoutDays);
  const { updateDay, addDay, removeDay, moveDay, addExercise, updateExercise, removeExercise, moveExercise } = useGymStore();
  const [expandedId, setExpandedId] = useState(days[1]?.id ?? days[0]?.id ?? '');

  const confirmRemoveDay = (dayId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Удалить тренировочный день?\n\nУпражнения этого дня тоже будут удалены.')) removeDay(dayId);
      return;
    }
    Alert.alert('Удалить тренировочный день?', 'Упражнения этого дня тоже будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Удалить', style: 'destructive', onPress: () => removeDay(dayId) },
    ]);
  };

  return (
    <Screen>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.navButton}><Text style={styles.navText}>‹ Тренировки</Text></Pressable>
        <Pressable onPress={() => router.back()} style={styles.navButton}><Text style={styles.navDone}>Готово</Text></Pressable>
      </View>
      <Heading size={28}>Редактор плана</Heading>

      {days.map((day, dayIndex) => {
        const expanded = expandedId === day.id;
        return (
          <Card key={day.id} accent={expanded} style={styles.dayCard}>
            <View style={styles.dayRow}>
              <Text style={styles.handle}>≡</Text>
              {expanded ? (
                <TextInput
                  accessibilityLabel={`Название дня ${dayIndex + 1}`}
                  value={day.name}
                  onChangeText={(name) => updateDay(day.id, { name })}
                  style={[styles.dayName, styles.inputUnderline]}
                />
              ) : (
                <Pressable style={styles.flex} onPress={() => setExpandedId(day.id)}>
                  <Text style={styles.dayName}>День {dayIndex + 1} — {day.name}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => moveDay(day.id, -1)} disabled={dayIndex === 0} style={styles.iconButton}><Text style={styles.orderIcon}>↑</Text></Pressable>
              <Pressable onPress={() => moveDay(day.id, 1)} disabled={dayIndex === days.length - 1} style={styles.iconButton}><Text style={styles.orderIcon}>↓</Text></Pressable>
              <Pressable onPress={() => expanded ? setExpandedId('') : setExpandedId(day.id)} style={styles.iconButton}>
                <Text style={styles.editLabel}>{expanded ? 'Сверн.' : 'Ред.'}</Text>
              </Pressable>
            </View>

            {expanded && (
              <View style={styles.exerciseList}>
                {day.exercises.map((exercise, exerciseIndex) => (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      <Text style={styles.handle}>≡</Text>
                      <TextInput value={exercise.name} onChangeText={(name) => updateExercise(day.id, exercise.id, { name })} style={styles.exerciseNameInput} accessibilityLabel="Название упражнения" />
                      <Pressable onPress={() => moveExercise(day.id, exercise.id, -1)} disabled={exerciseIndex === 0} style={styles.miniButton}><Text style={styles.orderIcon}>↑</Text></Pressable>
                      <Pressable onPress={() => moveExercise(day.id, exercise.id, 1)} disabled={exerciseIndex === day.exercises.length - 1} style={styles.miniButton}><Text style={styles.orderIcon}>↓</Text></Pressable>
                      <Pressable onPress={() => removeExercise(day.id, exercise.id)} style={styles.miniButton}><Text style={styles.remove}>−</Text></Pressable>
                    </View>
                    <TextInput value={exercise.muscleGroup} onChangeText={(muscleGroup) => updateExercise(day.id, exercise.id, { muscleGroup })} style={styles.groupInput} accessibilityLabel="Группа мышц" />
                    <View style={styles.fields}>
                      <EditorField label="Подходы" value={exercise.plannedSets} onChange={(plannedSets) => updateExercise(day.id, exercise.id, { plannedSets: Math.max(1, plannedSets) })} />
                      {exercise.isTimeBased ? (
                        <EditorField label="Время, с" value={exercise.secondsPerSet ?? 60} onChange={(secondsPerSet) => updateExercise(day.id, exercise.id, { secondsPerSet: Math.max(1, secondsPerSet) })} />
                      ) : (
                        <>
                          <EditorField label="Повторы" value={exercise.reps} onChange={(reps) => updateExercise(day.id, exercise.id, { reps: Math.max(1, reps) })} />
                          <EditorField label="Вес, кг" value={exercise.weight} decimal onChange={(weight) => updateExercise(day.id, exercise.id, { weight: Math.max(0, weight) })} />
                        </>
                      )}
                    </View>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>На время (без веса)</Text>
                      <Toggle label="На время" value={exercise.isTimeBased} onPress={() => updateExercise(day.id, exercise.id, { isTimeBased: !exercise.isTimeBased, weight: 0, secondsPerSet: exercise.secondsPerSet ?? 60 })} />
                    </View>
                  </View>
                ))}
                <OutlineButton label="+ Упражнение" onPress={() => addExercise(day.id)} style={styles.dashed} />
                <OutlineButton label="Удалить день" onPress={() => confirmRemoveDay(day.id)} danger />
              </View>
            )}
          </Card>
        );
      })}

      <OutlineButton label="+ Тренировочный день" onPress={addDay} style={styles.dashed} />
    </Screen>
  );
}

function EditorField({ label, value, onChange, decimal = false }: { label: string; value: number; onChange: (value: number) => void; decimal?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        value={String(value)}
        onChangeText={(text) => onChange(numberValue(text, value))}
        style={styles.fieldValue}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { minHeight: 44, justifyContent: 'center' },
  navText: { color: colors.accent, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  navDone: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 14 },
  dayCard: { paddingHorizontal: 14, paddingVertical: 13 },
  dayRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  handle: { color: '#4A4F55', fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: 1 },
  flex: { flex: 1 },
  dayName: { flex: 1, color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15, paddingVertical: 7 },
  inputUnderline: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconButton: { minWidth: 38, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  miniButton: { minWidth: 32, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  orderIcon: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 16 },
  editLabel: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 11 },
  exerciseList: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 12, gap: 9 },
  exerciseCard: { backgroundColor: colors.surfaceInset, borderRadius: 13, padding: 11, gap: 8 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exerciseNameInput: { flex: 1, minHeight: 40, color: colors.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 14, paddingHorizontal: 5 },
  groupInput: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 6 },
  remove: { color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 18 },
  fields: { flexDirection: 'row', gap: 7 },
  field: { flex: 1, backgroundColor: '#16191D', borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  fieldLabel: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  fieldValue: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15, paddingVertical: 3 },
  toggleRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  dashed: { borderStyle: 'dashed' },
});
