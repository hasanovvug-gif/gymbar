import { useMemo } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';

import { Card, Heading, Screen, Tappable, Toggle } from '@/components/ui';
import { fonts, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useGymStore } from '@/store/useGymStore';
import { exportGymData } from '@/utils/exportData';
import { useT } from '@/i18n';

function useThemedStyles() {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  return { c, styles };
}

export default function SettingsScreen() {
  const { c, styles } = useThemedStyles();
  const historyCount = useGymStore((state) => state.history.length);
  const settings = useGymStore((state) => state.settings);
  const { setLanguage, setTheme, setPreSignalSeconds, setOnboardingSeen, toggleNotification, resetAll } = useGymStore();
  const { t, language } = useT();

  const confirmReset = () => {
    const message = t('settings.resetMessage');
    if (Platform.OS === 'web') {
      if (window.confirm(`${t('settings.resetTitle')}\n\n${message}`)) resetAll();
      return;
    }
    Alert.alert(t('settings.resetTitle'), message, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('settings.reset'), style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <Screen>
      <Heading>{t('settings.title')}</Heading>
      <Card style={styles.profile}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{t('settings.name').charAt(0)}</Text></View>
        <View style={styles.flex}><Text style={styles.name}>{t('settings.name')}</Text><Text style={styles.profileMeta}>{t('settings.profile', { count: historyCount })}</Text></View>
      </Card>

      <Card style={styles.groupCard}>
        <View style={[styles.settingRow, styles.rowBorder]}>
          <Text style={styles.settingLabel}>{t('settings.language')}</Text>
          <View style={styles.choiceRow}>
            {(['RU', 'UA', 'EN'] as const).map((language) => <Choice key={language} label={language} selected={settings.language === language} onPress={() => setLanguage(language)} />)}
          </View>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('settings.theme')}</Text>
          <View style={styles.choiceRow}>
            <Choice label={t('settings.light')} selected={settings.theme === 'light'} onPress={() => setTheme('light')} />
            <Choice label={t('settings.dark')} selected={settings.theme === 'dark'} onPress={() => setTheme('dark')} />
          </View>
        </View>
      </Card>

      <Card style={styles.groupCard}>
        <SettingToggle
          title={t('settings.workoutReminder')}
          subtitle={t('settings.workoutReminderHint')}
          value={settings.notifications.workout}
          onPress={() => toggleNotification('workout')}
          border
        />
        <SettingToggle
          title={t('settings.supplementReminder')}
          subtitle={t('settings.supplementReminderHint')}
          value={settings.notifications.supplements}
          onPress={() => toggleNotification('supplements')}
          border
        />
        <SettingToggle
          title={t('settings.restSound')}
          subtitle={t('settings.restSoundHint')}
          value={settings.notifications.sound}
          onPress={() => toggleNotification('sound')}
          border
        />
        <View style={styles.settingRow}>
          <View style={styles.flex}>
            <Text style={styles.settingLabel}>{t('settings.preSignal')}</Text>
            <Text style={styles.settingSubtitle}>
              {settings.preSignalSeconds > 0
                ? t('settings.preSignalHint', { seconds: settings.preSignalSeconds })
                : t('settings.preSignalOff')}
            </Text>
          </View>
          <View style={styles.choiceRow}>
            {[0, 10, 15, 20].map((seconds) => (
              <Choice
                key={seconds}
                label={seconds === 0 ? t('settings.preSignalOff') : `${seconds}${t('common.seconds')}`}
                selected={settings.preSignalSeconds === seconds}
                onPress={() => setPreSignalSeconds(seconds)}
              />
            ))}
          </View>
        </View>
      </Card>

      <Card style={styles.groupCard}>
        <Tappable onPress={() => exportGymData(language)} style={[styles.actionRow, styles.rowBorder]}>
          <Text style={styles.actionText}>{t('settings.export')}</Text><Text style={styles.chevron}>›</Text>
        </Tappable>
        <Tappable onPress={() => setOnboardingSeen(false)} style={[styles.actionRow, styles.rowBorder]}>
          <Text style={styles.actionText}>{t('settings.showOnboarding')}</Text><Text style={styles.chevron}>›</Text>
        </Tappable>
        <Tappable haptic="warn" onPress={confirmReset} style={styles.actionRow}>
          <Text style={[styles.actionText, { color: c.danger }]}>{t('settings.reset')}</Text><Text style={styles.chevron}>›</Text>
        </Tappable>
      </Card>
    </Screen>
  );
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { styles } = useThemedStyles();
  return (
    <Tappable haptic="select" onPress={onPress} accessibilityState={{ selected }} style={[styles.choice, selected && styles.choiceSelected]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
    </Tappable>
  );
}

function SettingToggle({ title, subtitle, value, onPress, border = false }: { title: string; subtitle: string; value: boolean; onPress: () => void; border?: boolean }) {
  const { styles } = useThemedStyles();
  return (
    <View style={[styles.toggleRow, border && styles.rowBorder]}>
      <View style={styles.flex}><Text style={styles.settingLabel}>{title}</Text><Text style={styles.settingSubtitle}>{subtitle}</Text></View>
      <Toggle label={title} value={value} onPress={onPress} />
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: c.accentText, fontFamily: fonts.heading, fontSize: 20 },
  flex: { flex: 1 },
  name: { color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 16 },
  profileMeta: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 12, marginTop: 3 },
  groupCard: { paddingHorizontal: 15, paddingVertical: 2 },
  settingRow: { minHeight: 62, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.divider },
  settingLabel: { color: c.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  choiceRow: { flexDirection: 'row', gap: 5 },
  choice: { minHeight: 38, borderWidth: 1, borderColor: c.borderDashed, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { backgroundColor: c.accent, borderColor: c.accent },
  choiceText: { color: c.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 11 },
  choiceTextSelected: { color: c.accentText, fontFamily: fonts.bodyExtraBold },
  toggleRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingSubtitle: { color: c.textSecondary, fontFamily: fonts.body, fontSize: 11, marginTop: 3 },
  actionRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actionText: { color: c.textPrimary, fontFamily: fonts.bodySemiBold, fontSize: 14 },
  chevron: { color: c.textMuted, fontFamily: fonts.body, fontSize: 20 },
});
