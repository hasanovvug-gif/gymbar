import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Heading, OutlineButton, ProgressBar, Screen, Segmented } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { dateKey } from '@/data/supplementData';
import { useGymStore } from '@/store/useGymStore';
import { SUPPLEMENT_SLOTS } from '@/types/supplement';
import { adherenceForMonth, calculateSupplementStreak, isDayComplete, SLOT_LABELS } from '@/utils/supplements';

type SupplementTab = 'today' | 'stock' | 'progress' | 'schedule';

const tabs: { label: string; value: SupplementTab }[] = [
  { label: 'Сегодня', value: 'today' },
  { label: 'Склад', value: 'stock' },
  { label: 'Прогресс', value: 'progress' },
  { label: 'Расписание', value: 'schedule' },
];

export default function SupplementsScreen() {
  const [tab, setTab] = useState<SupplementTab>('today');
  const store = useGymStore();
  const streak = calculateSupplementStreak(store.supplements, store.supplementLogs);

  return (
    <Screen>
      <View style={styles.header}>
        <Heading>Добавки</Heading>
        {tab === 'today' && <View style={styles.streakBadge}><Text style={styles.streakBadgeText}>{streak} дн подряд</Text></View>}
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
            <Text style={styles.slotLabel}>{SLOT_LABELS[slot]} · {taken}/{items.length}</Text>
            <View style={styles.itemStack}>
              {items.map((supplement) => {
                const checked = Boolean(todayLog?.taken[`${supplement.id}:${slot}`]);
                return (
                  <Pressable key={supplement.id} onPress={() => toggleSupplement(supplement.id, slot)}>
                    <Card accent={!checked && slot === 'pre_workout'} style={[styles.checkCard, checked && styles.checkedCard]}>
                      <View style={[styles.checkbox, checked && styles.checkboxDone]}>{checked && <Text style={styles.checkmark}>✓</Text>}</View>
                      <Text style={styles.checkName}>{supplement.name}</Text>
                      <Text style={styles.checkDose}>{supplement.dose}</Text>
                    </Card>
                  </Pressable>
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
          <Text style={styles.warningText}>{low.length} добавки заканчиваются — пора докупить</Text>
        </View>
      )}
      <View style={styles.itemStack}>
        {supplements.map((supplement) => {
          const ratio = supplement.stock / Math.max(1, supplement.capacity);
          const daily = supplement.unitsPerDose * Math.max(1, supplement.schedule.length);
          const days = Math.floor(supplement.stock / daily);
          const isLow = days <= 7;
          const estimate = days >= 60 ? `~${Math.round(days / 30)} мес` : `~${days} дн`;
          return (
            <Card key={supplement.id} warning={isLow} style={styles.stockCard}>
              <View style={styles.stockHeader}>
                <Text style={styles.stockName}>{supplement.name}</Text>
                <View style={styles.stockRight}>
                  <Text style={[styles.stockMeta, isLow && styles.warningColor]}>{supplement.stock} {supplement.stockUnit} · {estimate}</Text>
                  <Pressable onPress={() => replenish(supplement.id, 30)} style={styles.replenishButton}><Text style={styles.replenishText}>+30</Text></Pressable>
                </View>
              </View>
              <ProgressBar progress={ratio} color={isLow ? colors.warning : colors.accent} />
            </Card>
          );
        })}
      </View>
      <Text style={styles.stockHint}>Нажмите +30 у нужной добавки, чтобы пополнить остаток.</Text>
    </View>
  );
}

function ProgressTab() {
  const supplements = useGymStore((state) => state.supplements);
  const logs = useGymStore((state) => state.supplementLogs);
  const streak = calculateSupplementStreak(supplements, logs);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const adherence = adherenceForMonth(supplements, logs, year, month);
  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(now);
  const cells = useMemo(() => [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ], [daysInMonth, firstWeekday]);

  return (
    <View style={styles.tabContent}>
      <Card accent style={styles.streakCard}>
        <Text style={styles.bigStreak}>{streak}</Text>
        <Text style={styles.streakTitle}>дней подряд</Text>
        <Text style={styles.streakMeta}>Рекорд — {Math.max(23, streak)} дня · до рекорда {Math.max(0, 23 - streak)}</Text>
      </Card>
      <Card style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Text style={styles.month}>{monthName}</Text>
          <Text style={styles.adherence}>{adherence}% приёма</Text>
        </View>
        <View style={styles.calendarGrid}>
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label) => <View key={label} style={styles.calendarCell}><Text style={styles.weekday}>{label}</Text></View>)}
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
          <Legend color={colors.accent} label="всё принято" />
          <Legend color="#37401A" label="частично" />
          <Legend color="#1C1F24" label="впереди" />
        </View>
      </Card>
    </View>
  );
}

function ScheduleTab() {
  const supplements = useGymStore((state) => state.supplements);
  const { toggleSupplementSlot, updateSupplement, addSupplement, removeSupplement } = useGymStore();
  return (
    <View style={styles.tabContent}>
      {supplements.map((supplement) => (
        <Card key={supplement.id} style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <View style={styles.scheduleInputs}>
              <TextInput accessibilityLabel="Название добавки" value={supplement.name} onChangeText={(name) => updateSupplement(supplement.id, { name })} style={styles.supplementNameInput} />
              <TextInput accessibilityLabel="Доза добавки" value={supplement.dose} onChangeText={(dose) => updateSupplement(supplement.id, { dose })} style={styles.doseInput} />
            </View>
            <Pressable onPress={() => removeSupplement(supplement.id)} style={styles.removeButton}><Text style={styles.removeText}>−</Text></Pressable>
          </View>
          <View style={styles.scheduleSlots}>
            {SUPPLEMENT_SLOTS.map((slot) => {
              const selected = supplement.schedule.includes(slot);
              const label = slot === 'pre_workout' ? 'Перед трен.' : SLOT_LABELS[slot];
              return (
                <Pressable key={slot} onPress={() => toggleSupplementSlot(supplement.id, slot)} style={[styles.slotChip, selected && styles.slotChipSelected]}>
                  <Text style={[styles.slotChipText, selected && styles.slotChipTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
      <OutlineButton label="+ Добавка" onPress={addSupplement} style={styles.addButton} />
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  streakBadge: { borderWidth: 1, borderColor: colors.accent, backgroundColor: '#151A0E', borderRadius: 14, paddingHorizontal: 11, paddingVertical: 7 },
  streakBadgeText: { color: colors.accent, fontFamily: fonts.bodyExtraBold, fontSize: 12 },
  tabContent: { gap: 14 },
  slotSection: { gap: 7 },
  slotLabel: { color: colors.textMuted, fontFamily: fonts.bodyExtraBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.4 },
  itemStack: { gap: 8 },
  checkCard: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  checkedCard: { opacity: 0.6, borderColor: colors.border },
  checkbox: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.borderDashed, alignItems: 'center', justifyContent: 'center' },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkmark: { color: colors.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 14 },
  checkName: { flex: 1, color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15 },
  checkDose: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 },
  warningBanner: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warning, borderRadius: 16, paddingHorizontal: 15 },
  warningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning },
  warningText: { flex: 1, color: colors.warning, fontFamily: fonts.bodyBold, fontSize: 12 },
  stockCard: { gap: 10, paddingVertical: 13 },
  stockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  stockName: { flex: 1, color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 15 },
  stockRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11 },
  warningColor: { color: colors.warning, fontFamily: fonts.bodyBold },
  replenishButton: { minWidth: 44, minHeight: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.borderDashed, alignItems: 'center', justifyContent: 'center' },
  replenishText: { color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 12 },
  stockHint: { color: colors.textDim, fontFamily: fonts.body, fontSize: 11, textAlign: 'center' },
  streakCard: { alignItems: 'center', borderRadius: 22, backgroundColor: '#151A0E', paddingVertical: 20 },
  bigStreak: { color: colors.accent, fontFamily: fonts.heading, fontSize: 62, lineHeight: 66 },
  streakTitle: { color: colors.textPrimary, fontFamily: fonts.bodyExtraBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2 },
  streakMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 5 },
  calendarCard: { padding: 16 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  month: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  adherence: { color: colors.accent, fontFamily: fonts.bodyExtraBold, fontSize: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 13 },
  calendarCell: { width: '14.285%', height: 36, alignItems: 'center', justifyContent: 'center' },
  weekday: { color: colors.textDim, fontFamily: fonts.bodyBold, fontSize: 9 },
  calendarDay: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surfaceInset, alignItems: 'center', justifyContent: 'center' },
  calendarComplete: { backgroundColor: colors.accent },
  calendarPartial: { backgroundColor: '#37401A' },
  calendarFuture: { backgroundColor: '#1C1F24' },
  calendarToday: { borderWidth: 2, borderColor: colors.textPrimary },
  calendarDayText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 9 },
  calendarDayTextComplete: { color: colors.accentText, fontFamily: fonts.bodyBold },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 3 },
  legendText: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 10 },
  scheduleCard: { gap: 10, paddingVertical: 13 },
  scheduleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scheduleInputs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  supplementNameInput: { flex: 1, minHeight: 40, color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  doseInput: { width: 78, minHeight: 40, color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  removeButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.danger, fontFamily: fonts.bodyBold, fontSize: 18 },
  scheduleSlots: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  slotChip: { minHeight: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.borderDashed, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  slotChipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  slotChipText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 11 },
  slotChipTextSelected: { color: colors.accentText, fontFamily: fonts.bodyExtraBold },
  addButton: { borderStyle: 'dashed' },
});
