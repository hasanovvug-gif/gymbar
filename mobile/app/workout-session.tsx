import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ReasonPickerModal } from '@/components/ReasonPickerModal';
import { Card, Heading, OutlineButton, PrimaryButton, ProgressBar, Screen, Tappable } from '@/components/ui';
import { fonts, Palette } from '@/constants/theme';
import { haptics, playRestDone } from '@/hooks/useFeedback';
import { useLiveActivity } from '@/hooks/useLiveActivity';
import { useNow } from '@/hooks/useNow';
import { useTheme } from '@/hooks/useTheme';
import { translateReason, useT } from '@/i18n';
import { resolveDayName, resolveExerciseName } from '@/i18n/displayName';
import { useGymStore } from '@/store/useGymStore';
import { REASON_TAGS, ReasonTag, WorkoutSession } from '@/types/workout';
import { formatDuration, formatNumber } from '@/utils/format';

type ResolutionAction = 'skipped' | 'ended_early' | null;

function useThemedStyles() {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  return { c, styles };
}

export default function WorkoutSessionScreen() {
  useLiveActivity();
  const { styles } = useThemedStyles();
  const router = useRouter();
  const now = useNow();
  const { t } = useT();
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
    haptics.success();
    if (soundEnabled) void playRestDone();
    actions.endRest();
  }, [active, actions, restRemaining, soundEnabled]);

  const finish = () => {
    const id = actions.finishWorkout();
    if (id) setSummaryId(id);
  };

  const confirmFinish = () => {
    const message = t('session.finishMessage');
    if (Platform.OS === 'web') {
      finish();
      return;
    }
    Alert.alert(t('session.finishTitle'), message, [
      { text: t('session.keepTraining'), style: 'cancel' },
      { text: t('session.finish'), style: 'destructive', onPress: finish },
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
        <Heading>{t('session.noActiveTitle')}</Heading>
        <Text style={styles.emptyText}>{t('session.noActiveText')}</Text>
        <PrimaryButton label={t('session.toWorkouts')} onPress={() => router.replace('/(tabs)/workouts')} />
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
        exerciseName={resolveExerciseName(exercise, t)}
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
          <Text style={styles.exerciseCounter}>{t('common.exercise')} {active.currentExerciseIndex + 1} <Text style={styles.dim}>/ {active.exercises.length}</Text></Text>
          <View style={styles.headerRight}>
            <Text style={styles.timer}>{formatDuration(activeSeconds)}</Text>
            <Tappable onPress={actions.pauseWorkout} style={styles.pauseButton} accessibilityLabel={t('session.pauseAction')}>
              <Text style={styles.pauseText}>❙❙ {t('common.pause')}</Text>
            </Tappable>
          </View>
        </View>
        <ProgressBar progress={progress} height={5} />

        <View style={styles.exerciseTitleBlock}>
          <Text style={styles.muscle}>{exercise.isTimeBased ? t('session.muscleCore') : t('session.muscleExercise')}</Text>
          <Heading size={34} style={styles.exerciseHeading}>{resolveExerciseName(exercise, t)}</Heading>
        </View>

        {!exercise.isTimeBased && (
          <Card style={styles.weightCard}>
            <Tappable onPress={() => actions.adjustWeight(-2.5)} style={styles.weightButton}><Text style={styles.weightMinus}>−</Text></Tappable>
            <View style={styles.weightCenter}>
              <Text style={styles.weight}>{exercise.weight} <Text style={styles.weightUnit}>{t('common.kg')}</Text></Text>
              <Text style={styles.weightLabel}>{t('session.workingWeight')}</Text>
            </View>
            <Tappable onPress={() => actions.adjustWeight(2.5)} style={styles.weightButton}><Text style={styles.weightPlus}>+</Text></Tappable>
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
                <Text style={[styles.setTitle, !complete && !current && styles.setFuture]}>{t('common.set', { count: index + 1 })}</Text>
                <Text style={styles.setMeta}>{exercise.isTimeBased ? `${exercise.secondsPerSet ?? 60} ${t('common.seconds')}` : `${t('session.reps', { count: exercise.reps })}${exercise.weight > 0 ? ` · ${exercise.weight} ${t('common.kg')}` : ''}`}</Text>
                {current && (
                  <Tappable haptic="success" onPress={() => actions.completeSet()} style={styles.doneButton}>
                    <Text style={styles.doneText}>{t('session.ready')}</Text>
                  </Tappable>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.resolutionRow}>
          <Tappable onPress={() => openResolution('skipped')} style={styles.resolutionButton}>
            <Text style={styles.resolutionTitle}>{t('session.skip')}</Text><Text style={styles.resolutionHint}>{t('session.skipHint')}</Text>
          </Tappable>
          <Tappable onPress={() => openResolution('ended_early')} style={styles.resolutionButton}>
            <Text style={styles.resolutionTitle}>{t('session.endEarly')}</Text><Text style={styles.resolutionHint}>{t('session.credited', { done: exercise.completedSets, total: exercise.plannedSets })}</Text>
          </Tappable>
        </View>

        <View style={styles.footerNav}>
          <Tappable disabled={active.currentExerciseIndex === 0} onPress={() => actions.selectExercise(active.currentExerciseIndex - 1)} style={styles.navSquare}><Text style={styles.navArrow}>‹</Text></Tappable>
          <Tappable haptic="success" onPress={confirmFinish} style={styles.finishButton}><Text style={styles.finishText}>{t('session.finish')}</Text></Tappable>
          <Tappable disabled={active.currentExerciseIndex === active.exercises.length - 1} onPress={() => actions.selectExercise(active.currentExerciseIndex + 1)} style={styles.navSquare}><Text style={styles.navArrow}>›</Text></Tappable>
        </View>
      </ScrollView>

      <ReasonPickerModal
        visible={Boolean(resolutionAction)}
        title={resolutionAction === 'skipped' ? t('session.skipExercise') : t('session.endEarly')}
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
  const { c, styles } = useThemedStyles();
  const { t } = useT();
  const circumference = 2 * Math.PI * 98;
  const timerProgress = Math.max(0, Math.min(1, remaining / 90));
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.restTop}>
        <View style={styles.sessionHeader}>
          <Text style={styles.exerciseCounter}>{t('common.exercise')} {exerciseIndex + 1} / {totalExercises}</Text>
          <View style={styles.headerRight}><Text style={styles.timer}>{formatDuration(activeSeconds)}</Text><Tappable onPress={onPause} style={styles.pauseButton}><Text style={styles.pauseText}>❙❙ {t('common.pause')}</Text></Tappable></View>
        </View>
        <ProgressBar progress={progress} height={5} />
        <Heading size={29} style={styles.restExercise}>{exerciseName}</Heading>
      </View>
      <View style={styles.restCenter}>
        <Text style={styles.restLabel}>{t('session.rest')}</Text>
        <View style={styles.ringWrap}>
          <Svg width={230} height={230} viewBox="0 0 230 230" style={styles.ringSvg}>
            <Circle cx="115" cy="115" r="98" stroke={c.trackBg} strokeWidth="8" fill="none" />
            <Circle cx="115" cy="115" r="98" stroke={c.accentInk} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - timerProgress)} />
          </Svg>
          <View style={styles.ringText}>
            <Text style={styles.restTime}>{formatDuration(remaining)}</Text>
            <Text style={styles.restHint}>{t('session.untilSet', { count: nextSet })}</Text>
          </View>
        </View>
        <View style={styles.restActions}>
          <OutlineButton label={`+30 ${t('common.seconds')}`} onPress={onAdd} style={styles.restAction} />
          <PrimaryButton label={t('session.startNow')} onPress={onStart} style={styles.restAction} />
        </View>
        <Text style={styles.signalHint}>{t('session.restHint')}</Text>
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
  const { c, styles } = useThemedStyles();
  const { t, language } = useT();
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.pauseSafe}>
      <View style={styles.pauseCenter}>
        <View style={styles.pauseIcon}><Text style={styles.pauseIconText}>❙❙</Text></View>
        <Heading size={44} style={styles.pauseHeading}>{t('common.pause')}</Heading>
        <Text style={styles.pauseDescription}>{t('session.pauseDescription')}</Text>
        <View style={styles.timeCards}>
          <Card style={styles.timeCard}><Text style={styles.timeLabel}>{t('session.activeTime')}</Text><Text style={styles.timeValue}>{formatDuration(activeSeconds)}</Text></Card>
          <Card warning style={styles.timeCard}><Text style={[styles.timeLabel, { color: c.warning }]}>{t('session.pausedTime')}</Text><Text style={[styles.timeValue, { color: c.warning }]}>{formatDuration(pausedSeconds)}</Text></Card>
        </View>
        <Text style={styles.reasonLabel}>{t('session.reasonLabel')}</Text>
        <View style={styles.pauseTags}>
          {REASON_TAGS.map((tag) => {
            const selected = reason === tag;
            return (
              <Tappable haptic="select" key={tag} onPress={() => onReason(selected ? undefined : tag)} style={[styles.pauseTag, selected && styles.pauseTagSelected]}>
                <Text style={[styles.pauseTagText, selected && styles.pauseTagTextSelected]}>{translateReason(language, tag)}</Text>
              </Tappable>
            );
          })}
        </View>
      </View>
      <View style={styles.pauseFooter}>
        <PrimaryButton label={t('common.continue')} onPress={onResume} />
        <Tappable haptic="success" onPress={onFinish} style={styles.pauseFinish}><Text style={styles.pauseFinishText}>{t('session.finish')}</Text></Tappable>
      </View>
    </SafeAreaView>
  );
}

function WorkoutSummary({ session, history, onDone }: { session: WorkoutSession; history: WorkoutSession[]; onDone: () => void }) {
  const { c, styles } = useThemedStyles();
  const { t, language } = useT();
  const totalSeconds = session.activeSeconds + session.pausedSeconds;
  const activeRatio = totalSeconds === 0 ? 1 : session.activeSeconds / totalSeconds;
  const previous = history.find((item) => item.id !== session.id && item.dayId === session.dayId);
  const change = previous && previous.totalVolume > 0 ? Math.round(((session.totalVolume - previous.totalVolume) / previous.totalVolume) * 100) : null;
  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.summaryContent} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryEyebrow}>{t('session.completed')}</Text>
          <Heading size={30}>{t('common.day')} — {resolveDayName(session, t)}</Heading>
        </View>
        <Card style={styles.summaryTimeCard}>
          <View style={styles.summaryTimes}>
            <SummaryMetric value={`${Math.ceil(totalSeconds / 60)}`} unit={t('common.minutes')} label={t('session.total')} />
            <View style={styles.divider} />
            <SummaryMetric value={`${Math.ceil(session.activeSeconds / 60)}`} unit={t('common.minutes')} label={t('session.activeTime')} accent />
            <View style={styles.divider} />
            <SummaryMetric value={`${Math.ceil(session.pausedSeconds / 60)}`} unit={t('common.minutes')} label={`${t('common.pause')} · ${session.pauseCount}`} warning />
          </View>
          <View style={styles.summaryBar}><View style={{ flex: activeRatio, backgroundColor: c.accent }} /><View style={{ flex: 1 - activeRatio, backgroundColor: c.warning }} /></View>
        </Card>
        <Card style={styles.volumeCard}>
          <Text style={styles.volumeLabel}>{t('session.volume')}</Text>
          <Text style={styles.volumeValue}>{formatNumber(session.totalVolume, language)} <Text style={styles.volumeUnit}>{t('common.kg')}</Text></Text>
          {change !== null && <Text style={[styles.change, change < 0 && { color: c.warning }]}>{t('session.vsPrevious', { value: `${change >= 0 ? '+' : ''}${change}` })}</Text>}
        </Card>
        <Card style={styles.summaryList}>
          {session.exercises.map((exercise, index) => (
            <View key={exercise.exerciseId} style={[styles.summaryExercise, index < session.exercises.length - 1 && styles.summaryExerciseBorder]}>
              <View style={styles.flex}>
                <Text style={[styles.summaryExerciseName, exercise.status === 'skipped' && styles.dim]}>{resolveExerciseName(exercise, t)}</Text>
                {exercise.status === 'ended_early' && <Text style={styles.early}>{t('session.endedEarlyStatus')}{exercise.reasonTag ? ` · ${translateReason(language, exercise.reasonTag)}` : ''}</Text>}
                {exercise.status === 'skipped' && <Text style={styles.skipped}>{t('history.skipped')}{exercise.reasonTag ? ` · ${translateReason(language, exercise.reasonTag)}` : ''}</Text>}
              </View>
              <Text style={[styles.summaryExerciseMeta, exercise.status === 'skipped' && styles.dim]}>{exercise.completedSets}/{exercise.plannedSets} · {exercise.isTimeBased ? `${exercise.secondsPerSet ?? 60} ${t('common.seconds')}` : exercise.weight > 0 ? `${exercise.weight} ${t('common.kg')}` : t('common.bodyweight')}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
      <View style={styles.summaryFooter}><PrimaryButton label={t('common.done')} onPress={onDone} /></View>
    </SafeAreaView>
  );
}

function SummaryMetric({ value, unit, label, accent, warning }: { value: string; unit: string; label: string; accent?: boolean; warning?: boolean }) {
  const { c, styles } = useThemedStyles();
  const color = accent ? c.accentInk : warning ? c.warning : c.textPrimary;
  return <View style={styles.metric}><Text style={[styles.metricValue, { color }]}>{value}<Text style={styles.metricUnit}> {unit}</Text></Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

const createStyles = (c: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: c.background },
  activeContent: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16, gap: 12 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  exerciseCounter: { color: c.textSecondary, fontFamily: fonts.bodyBold, fontSize: 13 },
  dim: { color: c.textDim },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timer: { color: c.textPrimary, fontFamily: fonts.heading, fontSize: 18 },
  pauseButton: { minHeight: 44, borderWidth: 1.5, borderColor: c.warning, borderRadius: 12, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  pauseText: { color: c.warning, fontFamily: fonts.bodyExtraBold, fontSize: 12, textTransform: 'uppercase' },
  exerciseTitleBlock: { marginTop: 8 },
  muscle: { color: c.accentInk, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  exerciseHeading: { lineHeight: 38, marginTop: 3 },
  weightCard: { paddingVertical: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weightButton: { width: 52, height: 52, borderRadius: 14, backgroundColor: c.trackBg, alignItems: 'center', justifyContent: 'center' },
  weightMinus: { color: c.textSecondary, fontFamily: fonts.bodyBold, fontSize: 24 },
  weightPlus: { color: c.accentInk, fontFamily: fonts.bodyBold, fontSize: 24 },
  weightCenter: { alignItems: 'center' },
  weight: { color: c.textPrimary, fontFamily: fonts.heading, fontSize: 34 },
  weightUnit: { fontSize: 18 },
  weightLabel: { color: c.textMuted, fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  setList: { gap: 9 },
  setRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  setComplete: { opacity: 0.58 },
  setCurrent: { minHeight: 64, borderColor: c.accentInk, borderWidth: 1.5, backgroundColor: c.accentSurface },
  setCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: c.borderDashed, alignItems: 'center', justifyContent: 'center' },
  setCircleDone: { backgroundColor: c.accent, borderColor: c.accent },
  setCircleCurrent: { borderColor: c.accentInk },
  check: { color: c.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 14 },
  setTitle: { color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15, flex: 1 },
  setFuture: { color: c.textMuted },
  setMeta: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  doneButton: { minHeight: 42, backgroundColor: c.accent, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  doneText: { color: c.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 12, textTransform: 'uppercase' },
  resolutionRow: { flexDirection: 'row', gap: 9 },
  resolutionButton: { flex: 1, minHeight: 64, borderWidth: 1, borderColor: c.borderDashed, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  resolutionTitle: { color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 12, textAlign: 'center' },
  resolutionHint: { color: c.textDim, fontFamily: fonts.body, fontSize: 10, marginTop: 3, textAlign: 'center' },
  footerNav: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  navSquare: { width: 52, height: 52, borderRadius: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  navArrow: { color: c.textSecondary, fontSize: 22 },
  finishButton: { flex: 1, minHeight: 52, backgroundColor: c.trackBg, borderRadius: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  finishText: { color: c.textPrimary, fontFamily: fonts.bodyExtraBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },
  emptyText: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 14 },
  restTop: { opacity: 0.38, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  restExercise: { marginTop: 4 },
  restCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 10 },
  restLabel: { color: c.accentInk, fontFamily: fonts.bodyExtraBold, fontSize: 13, textTransform: 'uppercase', letterSpacing: 2 },
  ringWrap: { width: 230, height: 230, alignItems: 'center', justifyContent: 'center' },
  ringSvg: { position: 'absolute' },
  ringText: { alignItems: 'center' },
  restTime: { color: c.accentInk, fontFamily: fonts.heading, fontSize: 66 },
  restHint: { color: c.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 13 },
  restActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 8 },
  restAction: { flex: 1, minHeight: 50 },
  signalHint: { color: c.textDim, fontFamily: fonts.body, fontSize: 11, textAlign: 'center' },
  pauseSafe: { flex: 1, backgroundColor: c.pauseBackground },
  pauseCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 6 },
  pauseIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: c.warning, alignItems: 'center', justifyContent: 'center' },
  pauseIconText: { color: c.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 21 },
  pauseHeading: { color: c.warning, marginTop: 8 },
  pauseDescription: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  timeCards: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 16 },
  timeCard: { flex: 1, alignItems: 'center', backgroundColor: c.pauseSurface },
  timeLabel: { color: c.textMuted, fontFamily: fonts.bodyBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  timeValue: { color: c.textPrimary, fontFamily: fonts.heading, fontSize: 30, marginTop: 3 },
  reasonLabel: { color: c.textMuted, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 14 },
  pauseTags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pauseTag: { minHeight: 42, borderWidth: 1, borderColor: c.borderDashed, borderRadius: 21, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'center' },
  pauseTagSelected: { backgroundColor: c.warning, borderColor: c.warning },
  pauseTagText: { color: c.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 12 },
  pauseTagTextSelected: { color: c.accentText, fontFamily: fonts.bodyBold },
  pauseFooter: { paddingHorizontal: 20, paddingBottom: 10, gap: 6 },
  pauseFinish: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  pauseFinishText: { color: c.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  summaryContent: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 94, gap: 14 },
  summaryHeader: { alignItems: 'center' },
  summaryEyebrow: { color: c.accentInk, fontFamily: fonts.bodyBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 2 },
  summaryTimeCard: { padding: 18 },
  summaryTimes: { flexDirection: 'row', alignItems: 'stretch' },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontFamily: fonts.heading, fontSize: 29 },
  metricUnit: { fontSize: 14 },
  metricLabel: { color: c.textSecondary, fontFamily: fonts.bodyBold, fontSize: 9, textTransform: 'uppercase', marginTop: 2 },
  divider: { width: 1, backgroundColor: c.divider },
  summaryBar: { height: 8, borderRadius: 4, overflow: 'hidden', flexDirection: 'row', marginTop: 16 },
  volumeCard: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  volumeLabel: { color: c.textSecondary, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  volumeValue: { color: c.textPrimary, fontFamily: fonts.heading, fontSize: 27 },
  volumeUnit: { fontSize: 15 },
  change: { color: c.accentInk, fontFamily: fonts.bodyBold, fontSize: 11 },
  summaryList: { paddingVertical: 4 },
  summaryExercise: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  summaryExerciseBorder: { borderBottomWidth: 1, borderBottomColor: c.divider },
  flex: { flex: 1 },
  summaryExerciseName: { color: c.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 13 },
  summaryExerciseMeta: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 12 },
  early: { color: c.warning, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  skipped: { color: c.textMuted, fontFamily: fonts.body, fontSize: 11, marginTop: 2 },
  summaryFooter: { position: 'absolute', left: 20, right: 20, bottom: 16 },
});
