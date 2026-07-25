import * as Haptics from 'expo-haptics';
import { ReactNode, useMemo } from 'react';
import { LayoutChangeEvent, Platform, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { fonts, Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

const LONG_PRESS_MS = 180;
const SETTLE_MS = 150;

const tick = (style: Haptics.ImpactFeedbackStyle) => {
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(style);
};

/** Индекс, на который встанет элемент, если отпустить палец сейчас. Высоты соседей разные,
 *  поэтому идём по списку и вычитаем их, пока хватает пройденного расстояния. */
function resolveTarget(index: number, shift: number, heights: number[], gap: number) {
  'worklet';
  let target = index;
  let rest = shift;
  if (rest > 0) {
    while (target + 1 < heights.length && rest > (heights[target + 1] ?? 0) / 2 + gap / 2) {
      rest -= (heights[target + 1] ?? 0) + gap;
      target += 1;
    }
  } else {
    rest = -rest;
    while (target - 1 >= 0 && rest > (heights[target - 1] ?? 0) / 2 + gap / 2) {
      rest -= (heights[target - 1] ?? 0) + gap;
      target -= 1;
    }
  }
  return target;
}

export function DragList<T>({ items, keyOf, renderItem, onReorder, gap = 0, style }: {
  items: T[];
  keyOf: (item: T) => string;
  /** `handle` вешается на ручку «≡» — только за неё элемент и таскается. */
  renderItem: (item: T, index: number, handle: ReactNode) => ReactNode;
  onReorder: (from: number, to: number) => void;
  gap?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const heights = useSharedValue<number[]>([]);
  const activeIndex = useSharedValue(-1);
  const targetIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);

  return (
    <View style={[{ gap }, style]}>
      {items.map((item, index) => (
        <DragRow
          key={keyOf(item)}
          index={index}
          gap={gap}
          heights={heights}
          activeIndex={activeIndex}
          targetIndex={targetIndex}
          dragY={dragY}
          onReorder={onReorder}>
          {(handle) => renderItem(item, index, handle)}
        </DragRow>
      ))}
    </View>
  );
}

function DragRow({ index, gap, heights, activeIndex, targetIndex, dragY, onReorder, children }: {
  index: number;
  gap: number;
  heights: SharedValue<number[]>;
  activeIndex: SharedValue<number>;
  targetIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  onReorder: (from: number, to: number) => void;
  children: (handle: ReactNode) => ReactNode;
}) {
  const c = useTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const onLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    const next = [...heights.value];
    next[index] = height;
    heights.value = next;
  };

  const pan = useMemo(() => Gesture.Pan()
    .activateAfterLongPress(LONG_PRESS_MS)
    .onStart(() => {
      activeIndex.value = index;
      targetIndex.value = index;
      dragY.value = 0;
      runOnJS(tick)(Haptics.ImpactFeedbackStyle.Medium);
    })
    .onUpdate((event) => {
      dragY.value = event.translationY;
      const next = resolveTarget(index, event.translationY, heights.value, gap);
      if (next !== targetIndex.value) {
        targetIndex.value = next;
        runOnJS(tick)(Haptics.ImpactFeedbackStyle.Light);
      }
    })
    .onEnd(() => {
      const from = activeIndex.value;
      const to = targetIndex.value;
      if (from >= 0 && to >= 0 && from !== to) runOnJS(onReorder)(from, to);
    })
    .onFinalize(() => {
      activeIndex.value = -1;
      targetIndex.value = -1;
      dragY.value = 0;
    }), [index, gap, activeIndex, targetIndex, dragY, heights, onReorder]);

  const animatedStyle = useAnimatedStyle(() => {
    const active = activeIndex.value;
    if (active === index) {
      return { transform: [{ translateY: dragY.value }, { scale: 1.02 }], zIndex: 20, opacity: 0.96 };
    }
    if (active === -1) {
      return { transform: [{ translateY: 0 }, { scale: 1 }], zIndex: 0, opacity: 1 };
    }
    // Сосед расступается ровно на высоту поднятого элемента — и только если тот перешёл через него.
    const height = (heights.value[active] ?? 0) + gap;
    const target = targetIndex.value;
    let shift = 0;
    if (active < index && target >= index) shift = -height;
    else if (active > index && target <= index) shift = height;
    return {
      transform: [{ translateY: withTiming(shift, { duration: SETTLE_MS }) }, { scale: 1 }],
      zIndex: 0,
      opacity: 1,
    };
  });

  const handle = (
    <GestureDetector gesture={pan}>
      <View style={styles.handleArea} accessibilityRole="adjustable" accessibilityLabel="Перетащить">
        <Text style={styles.handle}>≡</Text>
      </View>
    </GestureDetector>
  );

  return (
    <Animated.View onLayout={onLayout} style={animatedStyle}>
      {children(handle)}
    </Animated.View>
  );
}

const createStyles = (c: Palette) => StyleSheet.create({
  handleArea: { minWidth: 34, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  handle: { color: c.textDim, fontFamily: fonts.bodyBold, fontSize: 18, letterSpacing: 1 },
});
