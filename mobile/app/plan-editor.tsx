import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { DragList } from '@/components/dragList';
import { Card, Heading, OutlineButton, Screen, Tappable, Toggle } from '@/components/ui';
import { fonts, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { resolveMuscleGroup, resolveName } from '@/i18n/displayName';
import { useGymStore } from '@/store/useGymStore';

const numberValue = (text: string, fallback: number) => {
  const parsed = Number(text.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
};

function useThemedStyles() {
  const c = useTheme();
  return useMemo(() => createStyles(c), [c]);
}

export default function PlanEditorScreen() {
  const styles = useThemedStyles();
  const router = useRouter();
  const { t } = useT();
  const days = useGymStore((state) => state.workoutDays);
  const { updateDay, addDay, removeDay, reorderDays, addExercise, updateExercise, removeExercise, reorderExercises } = useGymStore();
  const [expandedId, setExpandedId] = useState(days[1]?.id ?? days[0]?.id ?? '');

  const confirmRemoveDay = (dayId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${t('planEditor.deleteTitle')}\n\n${t('planEditor.deleteMessage')}`)) removeDay(dayId);
      return;
    }
    Alert.alert(t('planEditor.deleteTitle'), t('planEditor.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeDay(dayId) },
    ]);
  };

  return (
    <Screen>
      <View style={styles.nav}>
        <Tappable onPress={() => router.back()} style={styles.navButton}><Text style={styles.navText}>{t('planEditor.back')}</Text></Tappable>
        <Tappable onPress={() => router.back()} style={styles.navButton}><Text style={styles.navDone}>{t('common.done')}</Text></Tappable>
      </View>
      <Heading size={28}>{t('planEditor.title')}</Heading>
      <Text style={styles.dragHint}>{t('planEditor.dragHint')}</Text>

      <DragList
        items={days}
        keyOf={(day) => day.id}
        onReorder={reorderDays}
        gap={14}
        renderItem={(day, dayIndex, dayHandle) => {
        const expanded = expandedId === day.id;
        return (
          <Card accent={expanded} style={styles.dayCard}>
            <View style={styles.dayRow}>
              {dayHandle}
              {expanded ? (
                <TextInput
                  accessibilityLabel={t('planEditor.dayName', { count: dayIndex + 1 })}
                  value={resolveName(day, t)}
                  onChangeText={(name) => updateDay(day.id, { name })}
                  style={[styles.dayName, styles.inputUnderline]}
                />
              ) : (
                <Tappable style={styles.flex} onPress={() => setExpandedId(day.id)}>
                  <Text style={styles.dayName}>{t('home.planTitle', { day: dayIndex + 1, name: resolveName(day, t) })}</Text>
                </Tappable>
              )}
              <Tappable onPress={() => expanded ? setExpandedId('') : setExpandedId(day.id)} style={styles.iconButton}>
                <Text style={styles.editLabel}>{expanded ? t('planEditor.collapse') : t('planEditor.edit')}</Text>
              </Tappable>
            </View>

            {expanded && (
              <View style={styles.exerciseList}>
                <DragList
                  items={day.exercises}
                  keyOf={(exercise) => exercise.id}
                  onReorder={(from, to) => reorderExercises(day.id, from, to)}
                  gap={9}
                  renderItem={(exercise, exerciseIndex, exerciseHandle) => (
                  <View style={styles.exerciseCard}>
                    <View style={styles.exerciseHeader}>
                      {exerciseHandle}
                      <TextInput value={resolveName(exercise, t)} onChangeText={(name) => updateExercise(day.id, exercise.id, { name })} style={styles.exerciseNameInput} accessibilityLabel={t('planEditor.exerciseName')} />
                      <Tappable haptic="warn" onPress={() => removeExercise(day.id, exercise.id)} style={styles.miniButton}><Text style={styles.remove}>−</Text></Tappable>
                    </View>
                    <TextInput value={resolveMuscleGroup(exercise, t)} onChangeText={(muscleGroup) => updateExercise(day.id, exercise.id, { muscleGroup })} style={styles.groupInput} accessibilityLabel={t('planEditor.muscleGroup')} />
                    <View style={styles.fields}>
                      <EditorField label={t('planEditor.sets')} value={exercise.plannedSets} onChange={(plannedSets) => updateExercise(day.id, exercise.id, { plannedSets: Math.max(1, plannedSets) })} />
                      {exercise.isTimeBased ? (
                        <EditorField label={t('planEditor.time')} value={exercise.secondsPerSet ?? 60} onChange={(secondsPerSet) => updateExercise(day.id, exercise.id, { secondsPerSet: Math.max(1, secondsPerSet) })} />
                      ) : (
                        <>
                          <EditorField label={t('planEditor.reps')} value={exercise.reps} onChange={(reps) => updateExercise(day.id, exercise.id, { reps: Math.max(1, reps) })} />
                          <EditorField label={t('planEditor.weight')} value={exercise.weight} decimal onChange={(weight) => updateExercise(day.id, exercise.id, { weight: Math.max(0, weight) })} />
                        </>
                      )}
                    </View>
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>{t('planEditor.timedHint')}</Text>
                      <Toggle label={t('planEditor.timed')} value={exercise.isTimeBased} onPress={() => updateExercise(day.id, exercise.id, { isTimeBased: !exercise.isTimeBased, weight: 0, secondsPerSet: exercise.secondsPerSet ?? 60 })} />
                    </View>
                  </View>
                )}
                />
                <OutlineButton label={t('planEditor.addExercise')} onPress={() => addExercise(day.id)} style={styles.dashed} />
                <OutlineButton label={t('planEditor.deleteDay')} onPress={() => confirmRemoveDay(day.id)} danger />
              </View>
            )}
          </Card>
        );
      }}
      />

      <OutlineButton label={t('planEditor.addDay')} onPress={addDay} style={styles.dashed} />
    </Screen>
  );
}

function EditorField({ label, value, onChange, decimal = false }: { label: string; value: number; onChange: (value: number) => void; decimal?: boolean }) {
  const styles = useThemedStyles();
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

const createStyles = (c: Palette) => StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navButton: { minHeight: 44, justifyContent: 'center' },
  navText: { color: c.accentInk, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  navDone: { color: c.accentInk, fontFamily: fonts.bodyBold, fontSize: 14 },
  dragHint: { color: c.textMuted, fontFamily: fonts.body, fontSize: 12, marginTop: -6 },
  dayCard: { paddingHorizontal: 14, paddingVertical: 13 },
  dayRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1 },
  dayName: { flex: 1, color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15, paddingVertical: 7 },
  inputUnderline: { borderBottomWidth: 1, borderBottomColor: c.border },
  iconButton: { minWidth: 38, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  miniButton: { minWidth: 32, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  editLabel: { color: c.accentInk, fontFamily: fonts.bodyBold, fontSize: 11 },
  exerciseList: { borderTopWidth: 1, borderTopColor: c.border, marginTop: 8, paddingTop: 12, gap: 9 },
  exerciseCard: { backgroundColor: c.surfaceInset, borderRadius: 13, padding: 11, gap: 8 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exerciseNameInput: { flex: 1, minHeight: 40, color: c.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 14, paddingHorizontal: 5 },
  groupInput: { color: c.textMuted, fontFamily: fonts.body, fontSize: 12, borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: 6 },
  remove: { color: c.danger, fontFamily: fonts.bodyBold, fontSize: 18 },
  fields: { flexDirection: 'row', gap: 7 },
  field: { flex: 1, backgroundColor: c.inputBackground, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  fieldLabel: { color: c.textMuted, fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase' },
  fieldValue: { color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15, paddingVertical: 3 },
  toggleRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  dashed: { borderStyle: 'dashed' },
});
