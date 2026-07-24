import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Heading, OutlineButton, PrimaryButton, ProgressBar, Screen, Segmented, Tappable } from '@/components/ui';
import { fonts, Palette } from '@/constants/theme';
import { dateKey } from '@/data/supplementData';
import { useTheme } from '@/hooks/useTheme';
import { type TranslationKey, useT } from '@/i18n';
import { resolveDose, resolveName, resolveStockUnit } from '@/i18n/displayName';
import { useGymStore } from '@/store/useGymStore';
import { SUPPLEMENT_SLOTS, type SupplementSlot } from '@/types/supplement';
import { formatNumber } from '@/utils/format';
import { adherenceForMonth, calculateSupplementStreak, isDayComplete } from '@/utils/supplements';

type SupplementTab = 'today' | 'stock' | 'progress' | 'schedule';

const supplementSlotKeys = {
  morning: 'supplements.morning',
  pre_workout: 'supplements.preWorkout',
  evening: 'supplements.evening',
} satisfies Record<SupplementSlot, TranslationKey>;

function useThemedStyles() {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  return { c, styles };
}

export default function SupplementsScreen() {
  const { styles } = useThemedStyles();
  const { t } = useT();
  const [tab, setTab] = useState<SupplementTab>('today');
  const store = useGymStore();
  const streak = calculateSupplementStreak(store.supplements, store.supplementLogs);
  const tabs: { label: string; value: SupplementTab }[] = [
    { label: t('supplements.today'), value: 'today' },
    { label: t('supplements.stock'), value: 'stock' },
    { label: t('supplements.progress'), value: 'progress' },
    { label: t('supplements.schedule'), value: 'schedule' },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <Heading>{t('supplements.title')}</Heading>
        {tab === 'today' && <View style={styles.streakBadge}><Text style={styles.streakBadgeText}>{t('supplements.streak', { count: streak })}</Text></View>}
      </View>
      <Segmented options={tabs} value={tab} onChange={setTab} />
      {tab === 'today' && <TodayTab />}
      {tab === 'stock' && <StockTab />}
      {tab === 'progress' && <ProgressTab />}
      {tab === 'schedule' && <ScheduleTab />}
    </Screen>
  );
}

function TodayTab() {
  const { styles } = useThemedStyles();
  const { t } = useT();
  const supplements = useGymStore((state) => state.supplements);
  const logs = useGymStore((state) => state.supplementLogs);
  const toggleSupplement = useGymStore((state) => state.toggleSupplement);
  const todayLog = logs.find((log) => log.date === dateKey());

  return (
    <View style={styles.tabContent}>
      {SUPPLEMENT_SLOTS.map((slot) => {
        const items = supplements.filter((supplement) => supplement.schedule.includes(slot));
        const taken = items.filter((supplement) => todayLog?.taken[`${supplement.id}:${slot}`]).length;
        if (items.length === 0) return null;
        return (
          <View key={slot} style={styles.slotSection}>
            <Text style={styles.slotLabel}>{t(supplementSlotKeys[slot])} · {taken}/{items.length}</Text>
            <View style={styles.itemStack}>
              {items.map((supplement) => {
                const checked = Boolean(todayLog?.taken[`${supplement.id}:${slot}`]);
                return (
                  <Tappable haptic="select" key={supplement.id} onPress={() => toggleSupplement(supplement.id, slot)}>
                    <Card accent={!checked && slot === 'pre_workout'} style={[styles.checkCard, checked && styles.checkedCard]}>
                      <View style={[styles.checkbox, checked && styles.checkboxDone]}>{checked && <Text style={styles.checkmark}>✓</Text>}</View>
                      <Text style={styles.checkName}>{resolveName(supplement, t)}</Text>
                      <Text style={styles.checkDose}>{resolveDose(supplement, t)}</Text>
                    </Card>
                  </Tappable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StockTab() {
  const { c, styles } = useThemedStyles();
  const { t, language } = useT();
  const supplements = useGymStore((state) => state.supplements);
  const replenish = useGymStore((state) => state.replenishSupplement);
  const low = supplements.filter((supplement) => {
    const dailyUse = supplement.unitsPerDose * Math.max(1, supplement.schedule.length);
    return Math.floor(supplement.stock / dailyUse) <= 7;
  });

  return (
    <View style={styles.tabContent}>
      {low.length > 0 && (
        <View style={styles.warningBanner}>
          <View style={styles.warningDot} />
          <Text style={styles.warningText}>{t('supplements.lowStock', { count: low.length })}</Text>
        </View>
      )}
      <View style={styles.itemStack}>
        {supplements.map((supplement) => {
          const ratio = supplement.stock / Math.max(1, supplement.capacity);
          const daily = supplement.unitsPerDose * Math.max(1, supplement.schedule.length);
          const days = Math.floor(supplement.stock / daily);
          const isLow = days <= 7;
          const estimate = days >= 60 ? t('supplements.months', { count: formatNumber(Math.round(days / 30), language) }) : t('supplements.days', { count: formatNumber(days, language) });
          return (
            <Card key={supplement.id} warning={isLow} style={styles.stockCard}>
              <View style={styles.stockHeader}>
                <Text style={styles.stockName}>{resolveName(supplement, t)}</Text>
                <View style={styles.stockRight}>
                  <Text style={[styles.stockMeta, isLow && styles.warningColor]}>{formatNumber(supplement.stock, language)} {resolveStockUnit(supplement, t)} · {estimate}</Text>
                  <Tappable haptic="success" onPress={() => replenish(supplement.id, 30)} style={styles.replenishButton}><Text style={styles.replenishText}>+30</Text></Tappable>
                </View>
              </View>
              <ProgressBar progress={ratio} color={isLow ? c.warning : c.accent} />
            </Card>
          );
        })}
      </View>
      <Text style={styles.stockHint}>{t('supplements.stockHint')}</Text>
    </View>
  );
}

function ProgressTab() {
  const { c, styles } = useThemedStyles();
  const { t, language } = useT();
  const supplements = useGymStore((state) => state.supplements);
  const logs = useGymStore((state) => state.supplementLogs);
  const streak = calculateSupplementStreak(supplements, logs);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const adherence = adherenceForMonth(supplements, logs, year, month);
  const monthName = new Intl.DateTimeFormat({ RU: 'ru-RU', UA: 'uk-UA', EN: 'en-GB' }[language], { month: 'long' }).format(now);
  const cells = useMemo(() => [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ], [daysInMonth, firstWeekday]);

  return (
    <View style={styles.tabContent}>
      <Card accent style={styles.streakCard}>
        <Text style={styles.bigStreak}>{streak}</Text>
        <Text style={styles.streakTitle}>{t('supplements.daysInRow')}</Text>
        <Text style={styles.streakMeta}>{t('supplements.record', { record: Math.max(23, streak), remaining: Math.max(0, 23 - streak) })}</Text>
      </Card>
      <Card style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Text style={styles.month}>{monthName}</Text>
          <Text style={styles.adherence}>{t('supplements.adherence', { value: formatNumber(adherence, language) })}</Text>
        </View>
        <View style={styles.calendarGrid}>
          {t('supplements.weekdays').split('|').map((label) => <View key={label} style={styles.calendarCell}><Text style={styles.weekday}>{label}</Text></View>)}
          {cells.map((day, index) => {
            if (!day) return <View key={`blank-${index}`} style={styles.calendarCell} />;
            const date = new Date(year, month, day);
            const log = logs.find((item) => item.date === dateKey(date));
            const scheduledKeys = supplements.flatMap((supplement) => supplement.schedule.map((slot) => `${supplement.id}:${slot}`));
            const takenCount = scheduledKeys.filter((key) => log?.taken[key]).length;
            const complete = isDayComplete(supplements, log);
            const future = day > now.getDate();
            const partial = !complete && takenCount > 0;
            return (
              <View key={day} style={styles.calendarCell}>
                <View style={[styles.calendarDay, complete && styles.calendarComplete, partial && styles.calendarPartial, future && styles.calendarFuture, day === now.getDate() && styles.calendarToday]}>
                  <Text style={[styles.calendarDayText, complete && styles.calendarDayTextComplete]}>{day}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.legend}>
          <Legend color={c.accent} label={t('supplements.complete')} />
          <Legend color={c.accentSurfaceStrong} label={t('supplements.partial')} />
          <Legend color={c.trackBg} label={t('supplements.ahead')} />
        </View>
      </Card>
    </View>
  );
}

function ScheduleTab() {
  const { styles } = useThemedStyles();
  const { t } = useT();
  const supplements = useGymStore((state) => state.supplements);
  const { toggleSupplementSlot, updateSupplement, addSupplement, removeSupplement } = useGymStore();
  return (
    <View style={styles.tabContent}>
      {supplements.map((supplement) => (
        <Card key={supplement.id} style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleInputs}>
              <TextInput accessibilityLabel={t('supplements.nameLabel')} value={resolveName(supplement, t)} onChangeText={(name) => updateSupplement(supplement.id, { name })} style={styles.supplementNameInput} />
              <TextInput accessibilityLabel={t('supplements.doseLabel')} value={resolveDose(supplement, t)} onChangeText={(dose) => updateSupplement(supplement.id, { dose })} style={styles.doseInput} />
            </View>
            <Tappable haptic="warn" onPress={() => removeSupplement(supplement.id)} style={styles.removeButton}><Text style={styles.removeText}>−</Text></Tappable>
          </View>
          <View style={styles.scheduleSlots}>
            {SUPPLEMENT_SLOTS.map((slot) => {
              const selected = supplement.schedule.includes(slot);
              const label = t(supplementSlotKeys[slot]);
              return (
                <Tappable haptic="select" key={slot} onPress={() => toggleSupplementSlot(supplement.id, slot)} style={[styles.slotChip, selected && styles.slotChipSelected]}>
                  <Text style={[styles.slotChipText, selected && styles.slotChipTextSelected]}>{label}</Text>
                </Tappable>
              );
            })}
          </View>
        </Card>
      ))}
      <PrimaryButton label={t('supplements.scan')} onPress={() => router.push('/supplement-scan')} />
      <OutlineButton label={t('supplements.add')} onPress={addSupplement} style={styles.addButton} />
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const { styles } = useThemedStyles();
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const createStyles = (c: Palette) => StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakBadge: { borderWidth: 1, borderColor: c.accentInk, backgroundColor: c.accentSurface, borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  streakBadgeText: { color: c.accentInk, fontFamily: fonts.bodyExtraBold, fontSize: 12 },
  tabContent: { gap: 14 },
  slotSection: { gap: 7 },
  slotLabel: { color: c.textMuted, fontFamily: fonts.bodyExtraBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4 },
  itemStack: { gap: 8 },
  checkCard: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  checkedCard: { opacity: 0.6, borderColor: c.border },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: c.borderDashed, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: c.accent, borderColor: c.accent },
  checkmark: { color: c.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 14 },
  checkName: { flex: 1, color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15 },
  checkDose: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  warningBanner: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.warningBg, borderWidth: 1, borderColor: c.warning, borderRadius: 16, paddingHorizontal: 15 },
  warningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.warning },
  warningText: { flex: 1, color: c.warning, fontFamily: fonts.bodyBold, fontSize: 12 },
  stockCard: { gap: 10, paddingVertical: 13 },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  stockName: { flex: 1, color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15 },
  stockRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockMeta: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  warningColor: { color: c.warning, fontFamily: fonts.bodyBold },
  replenishButton: { minWidth: 44, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: c.borderDashed, alignItems: 'center', justifyContent: 'center' },
  replenishText: { color: c.accentInk, fontFamily: fonts.bodyBold, fontSize: 12 },
  stockHint: { color: c.textDim, fontFamily: fonts.body, fontSize: 11, textAlign: 'center' },
  streakCard: { alignItems: 'center', borderRadius: 22, backgroundColor: c.accentSurface, paddingVertical: 20 },
  bigStreak: { color: c.accentInk, fontFamily: fonts.heading, fontSize: 62, lineHeight: 66 },
  streakTitle: { color: c.textPrimary, fontFamily: fonts.bodyExtraBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  streakMeta: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 5 },
  calendarCard: { padding: 16 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  month: { color: c.textSecondary, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  adherence: { color: c.accentInk, fontFamily: fonts.bodyExtraBold, fontSize: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 13 },
  calendarCell: { width: '14.285%', height: 36, alignItems: 'center', justifyContent: 'center' },
  weekday: { color: c.textDim, fontFamily: fonts.bodyBold, fontSize: 9 },
  calendarDay: { width: 28, height: 28, borderRadius: 8, backgroundColor: c.surfaceInset, alignItems: 'center', justifyContent: 'center' },
  calendarComplete: { backgroundColor: c.accent },
  calendarPartial: { backgroundColor: c.accentSurfaceStrong },
  calendarFuture: { backgroundColor: c.trackBg },
  calendarToday: { borderWidth: 2, borderColor: c.textPrimary },
  calendarDayText: { color: c.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 9 },
  calendarDayTextComplete: { color: c.accentText, fontFamily: fonts.bodyBold },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 10 },
  scheduleCard: { gap: 10, paddingVertical: 13 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleInputs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  supplementNameInput: { flex: 1, minHeight: 40, color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14, borderBottomWidth: 1, borderBottomColor: c.border },
  doseInput: { width: 78, minHeight: 40, color: c.textSecondary, fontFamily: fonts.body, fontSize: 12, borderBottomWidth: 1, borderBottomColor: c.border },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: c.danger, fontFamily: fonts.bodyBold, fontSize: 18 },
  scheduleSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  slotChip: { minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: c.borderDashed, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  slotChipSelected: { backgroundColor: c.accent, borderColor: c.accent },
  slotChipText: { color: c.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 11 },
  slotChipTextSelected: { color: c.accentText, fontFamily: fonts.bodyExtraBold },
  addButton: { borderStyle: 'dashed' },
});
