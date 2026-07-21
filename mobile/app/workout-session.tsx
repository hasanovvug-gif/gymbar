import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReasonPickerModal } from '@/components/ReasonPickerModal';
import { Card, Heading, OutlineButton, PrimaryButton, ProgressBar, Screen } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useNow } from '@/hooks/useNow';
import { useGymStore } from '@/store/useGymStore';
import { REASON_TAGS, ReasonTag, WorkoutSession } from '@/types/workout';
import { formatDuration, formatNumber } from '@/utils/format';

type ResolutionAction = 'skipped' | 'ended_early' | null;

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const now = useNow();
  const active = useGymStore((state) => state.activeSession);
  const history = useGymStore((state) => state.history);
  const recentSessionId = useGymStore((state) => state.recentSessionId);
  const soundEnabled = useGymStore((state) => state.settings.notifications.sound);
  const actions = useGymStore();
  const [summaryId, setSummaryId] = useState<string | null>(active ? null : recentSessionId);
  const [resolutionAction, setResolutionAction] = useState<ResolutionAction>(null);
  const [resolutionReason, setResolutionReason] = useState<ReasonTag | undefined>();

  const restRemaining = active?.phase === 'rest' && active.restEndsAt
    ? Math.max(0, Math.ceil((active.restEndsAt - now) / 1000))
    : 0;

  useEffect(() => {
    if (!active || active.phase !== 'rest' || restRemaining > 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    if (soundEnabled) Speech.speak('Пора начинать подход', { language: 'ru-RU', rate: 0.9 });
    actions.endRest();
  }, [active, actions, restRemaining, soundEnabled]);

  const finish = () => {
    const id = actions.finishWorkout();
    if (id) setSummaryId(id);
  };

  const confirmFinish = () => {
    const message = 'Сделанные подходы будут сохранены, остальные упражнения отмечены как пропущенные.';
    if (Platform.OS === 'web') {
      finish();
      return;
    }
    Alert.alert('Завершить тренировку?', message, [
      { text: 'Продолжить тренировку', style: 'cancel' },
      { text: 'Завершить', style: 'destructive', onPress: finish },
    ]);
  };

  if (summaryId) {
    const summary = history.find((session) => session.id === summaryId);
    if (summary) {
      return <WorkoutSummary session={summary} history={history} onDone={() => router.replace('/(tabs)/history')} />;
    }
  }

  if (!active) {
    return (
      <Screen>
        <Heading>Нет активной тренировки</Heading>
        <Text style={styles.emptyText}>Выберите день плана, чтобы начать сессию.</Text>
        <PrimaryButton label="К тренировкам" onPress={() => router.replace('/(tabs)/workouts')} />
      </Screen>
    );
  }

  const activeSeconds = active.activeSeconds + (active.phase === 'paused' ? 0 : Math.floor((now - active.activeStartedAt) / 1000));
  const pausedSeconds = active.pausedSeconds + (active.phase === 'paused' && active.pauseStartedAt ? Math.floor((now - active.pauseStartedAt) / 1000) : 0);

  if (active.phase === 'paused') {
    return (
      <PausedView
        activeSeconds={activeSeconds}
        pausedSeconds={pausedSeconds}
        reason={active.currentPauseReason}
        onReason={actions.setPauseReason}
        onResume={actions.resumeWorkout}
        onFinish={confirmFinish}
      />
    );
  }

  const exercise = active.exercises[active.currentExerciseIndex];
  const completedSets = active.exercises.reduce((sum, item) => sum + item.completedSets, 0);
  const totalSets = active.exercises.reduce((sum, item) => sum + item.plannedSets, 0);
  const progress = totalSets === 0 ? 0 : completedSets / totalSets;

  if (active.phase === 'rest') {
    return (
      <RestView
        exerciseName={exercise.exerciseName}
        exerciseIndex={active.currentExerciseIndex}
        totalExercises={active.exercises.length}
        activeSeconds={activeSeconds}
        progress={progress}
        remaining={restRemaining}
        nextSet={Math.min(exercise.plannedSets, exercise.completedSets + 1)}
        onAdd={() => actions.addRestTime(30)}
        onStart={actions.endRest}
        onPause={actions.pauseWorkout}
      />
    );
  }

  const openResolution = (action: Exclude<ResolutionAction, null>) => {
    setResolutionReason(undefined);
    setResolutionAction(action);
  };

  const resolve = () => {
    if (!resolutionAction) return;
    actions.resolveExercise(resolutionAction, resolutionReason);
    setResolutionAction(null);
    setResolutionReason(undefined);
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.activeContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sessionHeader}>
          <Text style={styles.exerciseCounter}>Упражнение {active.currentExerciseIndex + 1} <Text style={styles.dim}>/ {active.exercises.length}</Text></Text>
          <View style={styles.headerRight}>
            <Text style={styles.timer}>{formatDuration(activeSeconds)}</Text>
            <Pressable onPress={actions.pauseWorkout} style={styles.pauseButton} accessibilityLabel="Поставить тренировку на паузу">
              <Text style={styles.pauseText}>❙❙ Пауза</Text>
            </Pressable>
          </View>
        </View>
        <ProgressBar progress={progress} height={5} />

        <View style={styles.exerciseTitleBlock}>
          <Text style={styles.muscle}>{exercise.exerciseName === 'Планка' ? 'Кор' : 'Упражнение'}</Text>
          <Heading size={34} style={styles.exerciseHeading}>{exercise.exerciseName}</Heading>
        </View>

        {!exercise.isTimeBased && (
          <Card style={styles.weightCard}>
            <Pressable onPress={() => actions.adjustWeight(-2.5)} style={styles.weightButton}><Text style={styles.weightMinus}>−</Text></Pressable>
            <View style={styles.weightCenter}>
              <Text style={styles.weight}>{exercise.weight} <Text style={styles.weightUnit}>кг</Text></Text>
              <Text style={styles.weightLabel}>Рабочий вес</Text>
            </View>
            <Pressable onPress={() => actions.adjustWeight(2.5)} style={styles.weightButton}><Text style={styles.weightPlus}>+</Text></Pressable>
          </Card>
        )}

        <View style={styles.setList}>
          {Array.from({ length: exercise.plannedSets }, (_, index) => {
            const complete = index < exercise.completedSets;
            const current = index === exercise.completedSets && exercise.status === 'pending';
            return (
              <View key={index} style={[styles.setRow, complete && styles.setComplete, current && styles.setCurrent]}>
                <View style={[styles.setCircle, complete && styles.setCircleDone, current && styles.setCircleCurrent]}>
                  {complete && <Text style={styles.check}>✓</Text>}
                </View>
                <Text style={[styles.setTitle, !complete && !current && styles.setFuture]}>Подход {index + 1}</Text>
                <Text style={styles.setMeta}>{exercise.isTimeBased ? `${exercise.secondsPerSet ?? 60} с` : `${exercise.reps} повт${exercise.weight > 0 ? ` · ${exercise.weight} кг` : ''}`}</Text>
                {current && (
                  <Pressable onPress={() => { Haptics.selectionAsync().catch(() => undefined); actions.completeSet(); }} style={styles.doneButton}>
                    <Text style={styles.doneText}>Готово</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.resolutionRow}>
          <Pressable onPress={() => openResolution('skipped')} style={styles.resolutionButton}>
            <Text style={styles.resolutionTitle}>Пропустить</Text><Text style={styles.resolutionHint}>объём не идёт</Text>
          </Pressable>
          <Pressable onPress={() => openResolution('ended_early')} style={styles.resolutionButton}>
            <Text style={styles.resolutionTitle}>Закончить раньше</Text><Text style={styles.resolutionHint}>{exercise.completedSets} из {exercise.plannedSets} засчитаны</Text>
          </Pressable>
        </View>

        <View style={styles.footerNav}>
          <Pressable disabled={active.currentExerciseIndex === 0} onPress={() => actions.selectExercise(active.currentExerciseIndex - 1)} style={styles.navSquare}><Text style={styles.navArrow}>‹</Text></Pressable>
          <Pressable onPress={confirmFinish} style={styles.finishButton}><Text style={styles.finishText}>Завершить тренировку</Text></Pressable>
          <Pressable disabled={active.currentExerciseIndex === active.exercises.length - 1} onPress={() => actions.selectExercise(active.currentExerciseIndex + 1)} style={styles.navSquare}><Text style={styles.navArrow}>›</Text></Pressable>
        </View>
      </ScrollView>

      <ReasonPickerModal
        visible={Boolean(resolutionAction)}
        title={resolutionAction === 'skipped' ? 'Пропустить упражнение' : 'Закончить раньше'}
        selected={resolutionReason}
        onSelect={setResolutionReason}
        onConfirm={resolve}
        onClose={() => setResolutionAction(null)}
      />
    </SafeAreaView>
  );
}

function RestView({ exerciseName, exerciseIndex, totalExercises, activeSeconds, progress, remaining, nextSet, onAdd, onStart, onPause }: {
  exerciseName: string;
  exerciseIndex: number;
  totalExercises: number;
  activeSeconds: number;
  progress: number;
  remaining: number;
  nextSet: number;
  onAdd: () => void;
  onStart: () => void;
  onPause: () => void;
}) {
  const circumference = 2 * Math.PI * 98;
  const timerProgress = Math.max(0, Math.min(1, remaining / 90));
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.restTop}>
        <View style={styles.sessionHeader}>
          <Text style={styles.exerciseCounter}>Упражнение {exerciseIndex + 1} / {totalExercises}</Text>
          <View style={styles.headerRight}><Text style={styles.timer}>{formatDuration(activeSeconds)}</Text><Pressable onPress={onPause} style={styles.pauseButton}><Text style={styles.pauseText}>❙❙ Пауза</Text></Pressable></View>
        </View>
        <ProgressBar progress={progress} height={5} />
        <Heading size={29} style={styles.restExercise}>{exerciseName}</Heading>
      </View>
      <View style={styles.restCenter}>
        <Text style={styles.restLabel}>Отдых</Text>
        <View style={styles.ringWrap}>
          <Svg width={230} height={230} viewBox="0 0 230 230" style={styles.ringSvg}>
            <Circle cx="115" cy="115" r="98" stroke="#1C1F24" strokeWidth="8" fill="none" />
            <Circle cx="115" cy="115" r="98" stroke={colors.accent} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - timerProgress)} />
          </Svg>
          <View style={styles.ringText}>
            <Text style={styles.restTime}>{formatDuration(remaining)}</Text>
            <Text style={styles.restHint}>до подхода {nextSet}</Text>
          </View>
        </View>
        <View style={styles.restActions}>
          <OutlineButton label="+30 с" onPress={onAdd} style={styles.restAction} />
          <PrimaryButton label="Начать сейчас" onPress={onStart} style={styles.restAction} />
        </View>
        <Text style={styles.signalHint}>В конце — голосовой и тактильный сигнал «пора начинать»</Text>
      </View>
    </SafeAreaView>
  );
}

function PausedView({ activeSeconds, pausedSeconds, reason, onReason, onResume, onFinish }: {
  activeSeconds: number;
  pausedSeconds: number;
  reason?: ReasonTag;
  onReason: (reason?: ReasonTag) => void;
  onResume: () => void;
  onFinish: () => void;
}) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.pauseSafe}>
      <View style={styles.pauseCenter}>
        <View style={styles.pauseIcon}><Text style={styles.pauseIconText}>❙❙</Text></View>
        <Heading size={44} style={styles.pauseHeading}>Пауза</Heading>
        <Text style={styles.pauseDescription}>Активное время заморожено — пауза{`\n`}не войдёт в итоговое активное время</Text>
        <View style={styles.timeCards}>
          <Card style={styles.timeCard}><Text style={styles.timeLabel}>Активное</Text><Text style={styles.timeValue}>{formatDuration(activeSeconds)}</Text></Card>
          <Card warning style={styles.timeCard}><Text style={[styles.timeLabel, { color: colors.warning }]}>На паузе</Text><Text style={[styles.timeValue, { color: colors.warning }]}>{formatDuration(pausedSeconds)}</Text></Card>
        </View>
        <Text style={styles.reasonLabel}>Причина — необязательно</Text>
        <View style={styles.pauseTags}>
          {REASON_TAGS.map((tag) => {
            const selected = reason === tag;
            return (
              <Pressable key={tag} onPress={() => onReason(selected ? undefined : tag)} style={[styles.pauseTag, selected && styles.pauseTagSelected]}>
                <Text style={[styles.pauseTagText, selected && styles.pauseTagTextSelected]}>{tag}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.pauseFooter}>
        <PrimaryButton label="Продолжить" onPress={onResume} />
        <Pressable onPress={onFinish} style={styles.pauseFinish}><Text style={styles.pauseFinishText}>Завершить тренировку</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

function WorkoutSummary({ session, history, onDone }: { session: WorkoutSession; history: WorkoutSession[]; onDone: () => void }) {
  const totalSeconds = session.activeSeconds + session.pausedSeconds;
  const activeRatio = totalSeconds === 0 ? 1 : session.activeSeconds / totalSeconds;
  const previous = history.find((item) => item.id !== session.id && item.dayId === session.dayId);
  const change = previous && previous.totalVolume > 0 ? Math.round(((session.totalVolume - previous.totalVolume) / previous.totalVolume) * 100) : null;
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryEyebrow}>Тренировка завершена</Text>
          <Heading size={30}>День — {session.dayName}</Heading>
        </View>
        <Card style={styles.summaryTimeCard}>
          <View style={styles.summaryTimes}>
            <SummaryMetric value={`${Math.ceil(totalSeconds / 60)}`} unit="мин" label="Всего" />
            <View style={styles.divider} />
            <SummaryMetric value={`${Math.ceil(session.activeSeconds / 60)}`} unit="мин" label="Активно" accent />
            <View style={styles.divider} />
            <SummaryMetric value={`${Math.ceil(session.pausedSeconds / 60)}`} unit="мин" label={`Пауза · ${session.pauseCount}`} warning />
          </View>
          <View style={styles.summaryBar}><View style={{ flex: activeRatio, backgroundColor: colors.accent }} /><View style={{ flex: 1 - activeRatio, backgroundColor: colors.warning }} /></View>
        </Card>
        <Card style={styles.volumeCard}>
          <Text style={styles.volumeLabel}>Объём</Text>
          <Text style={styles.volumeValue}>{formatNumber(session.totalVolume)} <Text style={styles.volumeUnit}>кг</Text></Text>
          {change !== null && <Text style={[styles.change, change < 0 && { color: colors.warning }]}>{change >= 0 ? '+' : ''}{change}% к прошлой</Text>}
        </Card>
        <Card style={styles.summaryList}>
          {session.exercises.map((exercise, index) => (
            <View key={exercise.exerciseId} style={[styles.summaryExercise, index < session.exercises.length - 1 && styles.summaryExerciseBorder]}>
              <View style={styles.flex}>
                <Text style={[styles.summaryExerciseName, exercise.status === 'skipped' && styles.dim]}>{exercise.exerciseName}</Text>
                {exercise.status === 'ended_early' && <Text style={styles.early}>закончил раньше{exercise.reasonTag ? ` · ${exercise.reasonTag}` : ''}</Text>}
                {exercise.status === 'skipped' && <Text style={styles.skipped}>пропущено{exercise.reasonTag ? ` · ${exercise.reasonTag}` : ''}</Text>}
              </View>
              <Text style={[styles.summaryExerciseMeta, exercise.status === 'skipped' && styles.dim]}>{exercise.completedSets}/{exercise.plannedSets} · {exercise.isTimeBased ? `${exercise.secondsPerSet ?? 60} с` : exercise.weight > 0 ? `${exercise.weight} кг` : 'вес тела'}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
      <View style={styles.summaryFooter}><PrimaryButton label="Готово" onPress={onDone} /></View>
    </SafeAreaView>
  );
}

function SummaryMetric({ value, unit, label, accent, warning }: { value: string; unit: string; label: string; accent?: boolean; warning?: boolean }) {
  const color = accent ? colors.accent : warning ? colors.warning : colors.textPrimary;
  return <View style={styles.metric}><Text style={[styles.metricValue, { color }]}>{value}<Text style={styles.metricUnit}> {unit}</Text></Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  activeContent: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 12 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  exerciseCounter: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 13 },
  dim: { color: '#4A4F55' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timer: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 18 },
  pauseButton: { minHeight: 44, borderWidth: 1.5, borderColor: colors.warning, borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  pauseText: { color: colors.warning, fontFamily: fonts.bodyExtraBold, fontSize: 12, textTransform: 'uppercase' },
  exerciseTitleBlock: { marginTop: 8 },
  muscle: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  exerciseHeading: { lineHeight: 38, marginTop: 3 },
  weightCard: { paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weightButton: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#1C1F24', alignItems: 'center', justifyContent: 'center' },
  weightMinus: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 24 },
  weightPlus: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 24 },
  weightCenter: { alignItems: 'center' },
  weight: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 34 },
  weightUnit: { fontSize: 18 },
  weightLabel: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  setList: { gap: 9 },
  setRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  setComplete: { opacity: 0.58 },
  setCurrent: { minHeight: 64, borderColor: colors.accent, borderWidth: 1.5, backgroundColor: '#151A0E' },
  setCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.borderDashed, alignItems: 'center', justifyContent: 'center' },
  setCircleDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  setCircleCurrent: { borderColor: colors.accent },
  check: { color: colors.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 14 },
  setTitle: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15, flex: 1 },
  setFuture: { color: colors.textMuted },
  setMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  doneButton: { minHeight: 42, backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: colors.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 12, textTransform: 'uppercase' },
  resolutionRow: { flexDirection: 'row', gap: 9 },
  resolutionButton: { flex: 1, minHeight: 64, borderWidth: 1, borderColor: colors.borderDashed, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  resolutionTitle: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 12, textAlign: 'center' },
  resolutionHint: { color: colors.textDim, fontFamily: fonts.body, fontSize: 10, marginTop: 3, textAlign: 'center' },
  footerNav: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  navSquare: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  navArrow: { color: colors.textSecondary, fontSize: 22 },
  finishButton: { flex: 1, minHeight: 52, backgroundColor: '#1C1F24', borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  finishText: { color: colors.textPrimary, fontFamily: fonts.bodyExtraBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },
  emptyText: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14 },
  restTop: { opacity: 0.38, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  restExercise: { marginTop: 4 },
  restCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 10 },
  restLabel: { color: colors.accent, fontFamily: fonts.bodyExtraBold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },
  ringWrap: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  ringSvg: { position: 'absolute' },
  ringText: { alignItems: 'center' },
  restTime: { color: colors.accent, fontFamily: fonts.heading, fontSize: 66 },
  restHint: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 13 },
  restActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 8 },
  restAction: { flex: 1, minHeight: 50 },
  signalHint: { color: colors.textDim, fontFamily: fonts.body, fontSize: 11, textAlign: 'center' },
  pauseSafe: { flex: 1, backgroundColor: '#101008' },
  pauseCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 6 },
  pauseIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center' },
  pauseIconText: { color: colors.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 21 },
  pauseHeading: { color: colors.warning, marginTop: 8 },
  pauseDescription: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  timeCards: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 16 },
  timeCard: { flex: 1, alignItems: 'center', backgroundColor: '#16140D' },
  timeLabel: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  timeValue: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 30, marginTop: 3 },
  reasonLabel: { color: colors.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 14 },
  pauseTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pauseTag: { minHeight: 42, borderWidth: 1, borderColor: colors.borderDashed, borderRadius: 21, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  pauseTagSelected: { backgroundColor: colors.warning, borderColor: colors.warning },
  pauseTagText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 12 },
  pauseTagTextSelected: { color: colors.accentText, fontFamily: fonts.bodyBold },
  pauseFooter: { paddingHorizontal: 20, paddingBottom: 10, gap: 6 },
  pauseFinish: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pauseFinishText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  summaryContent: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 94, gap: 14 },
  summaryHeader: { alignItems: 'center' },
  summaryEyebrow: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 },
  summaryTimeCard: { padding: 18 },
  summaryTimes: { flexDirection: 'row', alignItems: 'stretch' },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontFamily: fonts.heading, fontSize: 29 },
  metricUnit: { fontSize: 14 },
  metricLabel: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase', marginTop: 2 },
  divider: { width: 1, backgroundColor: colors.border },
  summaryBar: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginTop: 16 },
  volumeCard: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  volumeLabel: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  volumeValue: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 27 },
  volumeUnit: { fontSize: 15 },
  change: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 11 },
  summaryList: { paddingVertical: 4 },
  summaryExercise: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  summaryExerciseBorder: { borderBottomWidth: 1, borderBottomColor: '#1C1F24' },
  flex: { flex: 1 },
  summaryExerciseName: { color: colors.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 13 },
  summaryExerciseMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  early: { color: colors.warning, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  skipped: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  summaryFooter: { position: 'absolute', left: 20, right: 20, bottom: 16 },
});
