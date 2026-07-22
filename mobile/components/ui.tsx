import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/constants/theme';

export function Screen({ children, scroll = true, contentStyle }: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}

export function Heading({ children, size = 30, style }: {
  children: ReactNode;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.heading, { fontSize: size }, style]}>{children}</Text>;
}

export function Card({ children, accent = false, warning = false, style }: {
  children: ReactNode;
  accent?: boolean;
  warning?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[
      styles.card,
      accent && styles.cardAccent,
      warning && styles.cardWarning,
      style,
    ]}>
      {children}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled = false, style }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, disabled && styles.disabled, pressed && styles.pressed, style]}>
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({ label, onPress, danger = false, style }: {
  label: string;
  onPress: () => void;
  danger?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.outlineButton, danger && styles.outlineDanger, pressed && styles.pressed, style]}>
      <Text style={[styles.outlineButtonText, danger && { color: colors.danger }]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({ progress, color = colors.accent, height = 6 }: {
  progress: number;
  color?: string;
  height?: number;
}) {
  return (
    <View style={[styles.progressTrack, { height, borderRadius: height / 2 }]}>
      <View style={{ width: `${Math.max(0, Math.min(1, progress)) * 100}%`, height: '100%', backgroundColor: color, borderRadius: height / 2 }} />
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && styles.pressed]}>
            <Text numberOfLines={1} style={[styles.segmentText, selected && styles.segmentTextSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onPress, label }: { value: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={onPress}
      style={[styles.toggle, value && styles.toggleOn]}>
      <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, gap: 14 },
  heading: { color: colors.textPrimary, fontFamily: fonts.heading, textTransform: 'uppercase', letterSpacing: 0.4, lineHeight: 38 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 16 },
  cardAccent: { borderColor: colors.accent },
  cardWarning: { borderColor: colors.warning, backgroundColor: colors.warningBg },
  primaryButton: { minHeight: 52, borderRadius: 16, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 14 },
  primaryButtonText: { color: colors.accentText, fontFamily: fonts.bodyExtraBold, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.9 },
  outlineButton: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.borderDashed, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  outlineDanger: { borderColor: colors.danger },
  outlineButtonText: { color: colors.textSecondary, fontFamily: fonts.bodyBold, fontSize: 13 },
  progressTrack: { width: '100%', backgroundColor: '#1C1F24', overflow: 'hidden' },
  segmented: { flexDirection: 'row', gap: 4, backgroundColor: colors.surface, padding: 4, borderRadius: 14 },
  segment: { flex: 1, minHeight: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, paddingHorizontal: 4 },
  segmentSelected: { backgroundColor: colors.accent },
  segmentText: { color: colors.textSecondary, fontFamily: fonts.bodySemiBold, fontSize: 11 },
  segmentTextSelected: { color: colors.accentText, fontFamily: fonts.bodyExtraBold },
  toggle: { width: 46, height: 28, borderRadius: 14, padding: 2, backgroundColor: colors.borderDashed, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.accent },
  toggleKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.textSecondary },
  toggleKnobOn: { alignSelf: 'flex-end', backgroundColor: colors.background },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});
