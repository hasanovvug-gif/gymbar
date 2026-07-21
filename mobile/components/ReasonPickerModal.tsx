import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { REASON_TAGS, ReasonTag } from '@/types/workout';
import { PrimaryButton } from './ui';

export function ReasonPickerModal({ visible, title, selected, onSelect, onConfirm, onClose }: {
  visible: boolean;
  title: string;
  selected?: ReasonTag;
  onSelect: (reason?: ReasonTag) => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Закрыть окно причины" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Причина необязательна</Text>
        <View style={styles.tags}>
          {REASON_TAGS.map((reason) => {
            const active = selected === reason;
            return (
              <Pressable
                key={reason}
                onPress={() => onSelect(active ? undefined : reason)}
                style={[styles.tag, active && styles.tagActive]}>
                <Text style={[styles.tagText, active && styles.tagTextActive]}>{reason}</Text>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton label="Подтвердить" onPress={onConfirm} />
        <Pressable onPress={onClose} style={styles.cancel}><Text style={styles.cancelText}>Отмена</Text></Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, gap: 14 },
  handle: { width: 42, height: 4, borderRadius: 2, backgroundColor: colors.borderDashed, alignSelf: 'center', marginBottom: 6 },
  title: { color: colors.textPrimary, fontFamily: fonts.heading, fontSize: 26, textTransform: 'uppercase', textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontFamily: fonts.bodyMedium, fontSize: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  tag: { minHeight: 42, borderWidth: 1, borderColor: colors.borderDashed, borderRadius: 21, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  tagActive: { backgroundColor: colors.warning, borderColor: colors.warning },
  tagText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 13 },
  tagTextActive: { color: colors.accentText, fontFamily: fonts.bodyBold },
  cancel: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 14 },
});
