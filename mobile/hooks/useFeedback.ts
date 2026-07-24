import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const silent = () => undefined;

/** Тактильный отклик. На вебе expo-haptics молча отваливается — глушим промис. */
export const haptics = {
  /** Нажатие основной кнопки — заметный, но короткий удар. */
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(silent),
  /** Второстепенное действие, шаг счётчика. */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(silent),
  /** Переключение сегмента, тоггла, таба. */
  select: () => Haptics.selectionAsync().catch(silent),
  /** Подход засчитан, тренировка завершена. */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(silent),
  /** Удаление, сброс. */
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(silent),
};

let restPlayer: AudioPlayer | null = null;
let restSoonPlayer: AudioPlayer | null = null;
let audioModeReady = false;

async function prepareAudioMode() {
  if (audioModeReady) return;
  await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
  audioModeReady = true;
}

/**
 * Сигнал окончания отдыха. Воспроизводится и при выключенном звонке —
 * в зале телефон почти всегда на беззвучном.
 */
export async function playRestDone() {
  try {
    await prepareAudioMode();
    if (!restPlayer) restPlayer = createAudioPlayer(require('@/assets/sounds/rest-done.wav'));
    restPlayer.seekTo(0);
    restPlayer.play();
  } catch {
    // звук — не критичный путь: тактильный сигнал всё равно сработает
  }
}

/** Мягкий предупредительный сигнал перед окончанием отдыха. */
export async function playRestSoon() {
  try {
    await prepareAudioMode();
    if (!restSoonPlayer) restSoonPlayer = createAudioPlayer(require('@/assets/sounds/rest-soon.wav'));
    restSoonPlayer.seekTo(0);
    restSoonPlayer.play();
  } catch {
    // звук — не критичный путь: тактильный сигнал всё равно сработает
  }
}
