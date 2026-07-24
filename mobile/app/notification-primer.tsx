import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Heading, OutlineButton, PrimaryButton } from '@/components/ui';
import { fonts, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { useT } from '@/i18n';
import { useGymStore } from '@/store/useGymStore';
import {
  getNotificationStatus,
  notificationsSupported,
  requestNotificationPermission,
} from '@/utils/supplementNotifications';

/**
 * Единый pre-permission экран: объясняет обе причины (отдых + добавки) до системного запроса,
 * иначе первая тренировка забрала бы системный prompt раньше добавок.
 */
export default function NotificationPrimerScreen() {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { t } = useT();
  const setNotificationsPrimerSeen = useGymStore((state) => state.setNotificationsPrimerSeen);
  // Если системный запрос уже отклонён, повторно его не показать — ведём в настройки iOS.
  const [canAsk, setCanAsk] = useState(true);

  useEffect(() => {
    if (!notificationsSupported) return;
    let active = true;
    void getNotificationStatus()
      .then((status) => { if (active) setCanAsk(status.canAskAgain && !status.granted); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  const close = () => {
    setNotificationsPrimerSeen(true);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const allow = async () => {
    if (canAsk) await requestNotificationPermission().catch(() => undefined);
    else await Linking.openSettings().catch(() => undefined);
    close();
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
      <View style={styles.shell}>
        <View style={styles.content}>
          <Text style={styles.label}>{t('notifications.label')}</Text>
          <Heading size={34} style={styles.title}>{t('notifications.title')}</Heading>
          <Text style={styles.body}>{t('notifications.body')}</Text>
          <View style={styles.reasons}>
            <Reason title={t('notifications.reasonRest')} text={t('notifications.reasonRestBody')} />
            <Reason title={t('notifications.reasonSupplements')} text={t('notifications.reasonSupplementsBody')} />
          </View>
        </View>
        <View style={styles.footer}>
          <PrimaryButton label={t(canAsk ? 'notifications.allow' : 'notifications.openSettings')} onPress={() => void allow()} />
          <OutlineButton label={t('notifications.later')} onPress={close} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Reason({ title, text }: { title: string; text: string }) {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.reason}>
      <View style={styles.bullet} />
      <View style={styles.reasonText}>
        <Text style={styles.reasonTitle}>{title}</Text>
        <Text style={styles.reasonBody}>{text}</Text>
      </View>
    </View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  safe: { flex: 1, alignItems: 'center', backgroundColor: c.background },
  shell: { flex: 1, width: '100%', maxWidth: 540 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  label: { color: c.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.4 },
  title: { marginTop: 14, maxWidth: 430, lineHeight: 40 },
  body: { marginTop: 16, maxWidth: 460, color: c.textSecondary, fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  reasons: { marginTop: 26, gap: 16 },
  reason: { flexDirection: 'row', gap: 12 },
  bullet: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: c.accent },
  reasonText: { flex: 1 },
  reasonTitle: { color: c.textPrimary, fontFamily: fonts.bodyBold, fontSize: 14 },
  reasonBody: { marginTop: 4, color: c.textSecondary, fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 16, gap: 10 },
});
