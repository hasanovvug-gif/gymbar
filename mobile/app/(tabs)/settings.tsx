import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Heading, Screen, Toggle } from '@/components/ui';
import { colors, fonts } from '@/constants/theme';
import { useGymStore } from '@/store/useGymStore';

export default function SettingsScreen() {
  const historyCount = useGymStore((state) => state.history.length);
  const settings = useGymStore((state) => state.settings);
  const { setLanguage, setTheme, toggleNotification, resetAll } = useGymStore();

  const confirmReset = () => {
    const message = 'История и отметки приёма будут удалены. План, добавки и настройки вернутся к исходным.';
    if (Platform.OS === 'web') {
      if (window.confirm(`Сбросить все данные?\n\n${message}`)) resetAll();
      return;
    }
    Alert.alert('Сбросить все данные?', message, [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Сбросить', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <Screen>
      <Heading>Настройки</Heading>
      <Card style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>В</Text></View>
        <View style={styles.flex}><Text style={styles.name}>Вугар</Text><Text style={styles.profileMeta}>с апреля 2026 · {historyCount} тренировок</Text></View>
      </Card>

      <Card style={styles.groupCard}>
        <View style={[styles.settingRow, styles.rowBorder]}>
          <Text style={styles.settingLabel}>Язык</Text>
          <View style={styles.choiceRow}>
            {(['RU', 'UA', 'EN'] as const).map((language) => <Choice key={language} label={language} selected={settings.language === language} onPress={() => setLanguage(language)} />)}
          </View>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Тема</Text>
          <View style={styles.choiceRow}>
            {/* TODO: подключить светлую палитру; выбор уже сохраняется. */}
            <Choice label="Светлая" selected={settings.theme === 'light'} onPress={() => setTheme('light')} />
            <Choice label="Тёмная" selected={settings.theme === 'dark'} onPress={() => setTheme('dark')} />
          </View>
        </View>
        {/* TODO: локализовать тексты экранов для UA/EN; селектор состояния готов. */}
      </Card>

      <Card style={styles.groupCard}>
        <SettingToggle
          title="Напоминание о тренировке"
          subtitle="в дни по плану, 18:00"
          value={settings.notifications.workout}
          onPress={() => toggleNotification('workout')}
          border
        />
        <SettingToggle
          title="Напоминание о добавках"
          subtitle="утро · перед трен. · вечер"
          value={settings.notifications.supplements}
          onPress={() => toggleNotification('supplements')}
          border
        />
        <SettingToggle
          title="Звук rest-таймера"
          subtitle="сигнал «пора начинать подход»"
          value={settings.notifications.sound}
          onPress={() => toggleNotification('sound')}
        />
      </Card>

      <Card style={styles.groupCard}>
        <Pressable onPress={() => Alert.alert('Экспорт данных', 'Экспорт появится в следующей версии.')} style={[styles.actionRow, styles.rowBorder]}>
          <Text style={styles.actionText}>Экспорт данных</Text><Text style={styles.chevron}>›</Text>
        </Pressable>
        <Pressable onPress={confirmReset} style={styles.actionRow}>
          <Text style={[styles.actionText, { color: colors.danger }]}>Сбросить все данные</Text><Text style={styles.chevron}>›</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityState={{ selected }} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SettingToggle({ title, subtitle, value, onPress, border = false }: { title: string; subtitle: string; value: boolean; onPress: () => void; border?: boolean }) {
  return (
    <View style={[styles.toggleRow, border && styles.rowBorder]}>
      <View style={styles.flex}><Text style={styles.settingLabel}>{title}</Text><Text style={styles.settingSubtitle}>{subtitle}</Text></View>
      <Toggle label={title} value={value} onPress={onPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.accentText, fontFamily: fonts.heading, fontSize: 20 },
  flex: { flex: 1 },
  name: { color: colors.textPrimary, fontFamily: fonts.bodyBold, fontSize: 16 },
  profileMeta: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 3 },
  groupCard: { paddingHorizontal: 15, paddingVertical: 2 },
  settingRow: { minHeight: 62, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#1C1F24' },
  settingLabel: { color: colors.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  choiceRow: { flexDirection: 'row', gap: 5 },
  choice: { minHeight: 38, borderWidth: 1, borderColor: colors.borderDashed, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  choiceText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 11 },
  choiceTextSelected: { color: colors.accentText, fontFamily: fonts.bodyExtraBold },
  toggleRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingSubtitle: { color: colors.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 3 },
  actionRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { color: colors.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  chevron: { color: colors.textMuted, fontFamily: fonts.body, fontSize: 20 },
});
