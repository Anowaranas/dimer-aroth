import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticFeedbackType = 
  | 'delete'
  | 'cancel'
  | 'warning' 
  | 'error'
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'selection';

const HAPTICS_PREF_KEY = 'dim_haptics_enabled';

/**
 * Check if haptic feedback is enabled by user
 * Defaults to true for tactile mobile-first feel
 */
export function isHapticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const val = localStorage.getItem(HAPTICS_PREF_KEY);
    return val !== 'false';
  } catch {
    return true;
  }
}

/**
 * Update user preference for haptic feedback
 */
export function setHapticsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HAPTICS_PREF_KEY, enabled ? 'true' : 'false');
  } catch (e) {
    console.warn('Could not save haptics preference', e);
  }
}

// Lightweight micro-audio click synthesis for iOS Safari / desktop browsers
let audioCtx: AudioContext | null = null;
function playMicroTick(freq = 600, duration = 0.035, volume = 0.05): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!audioCtx || audioCtx.state === 'suspended') {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Ignore audio context autoplay restrictions
  }
}

/**
 * Trigger tactile haptic feedback.
 * User requirement: Haptic feedback is enabled ONLY for delete (ডিলেট করা) or cancel/remove (কেটে দেওয়া).
 * General navigation, tab taps, and clicks do not vibrate.
 */
export async function triggerHaptic(type: HapticFeedbackType = 'delete'): Promise<void> {
  if (!isHapticsEnabled()) return;

  // Strict filter: only trigger tactile feedback for delete, cancel, warning, or error actions
  const isDeleteOrCancelAction = type === 'delete' || type === 'cancel' || type === 'warning' || type === 'error';
  if (!isDeleteOrCancelAction) {
    return;
  }

  try {
    // 1. Attempt Capacitor Haptics
    switch (type) {
      case 'delete':
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        break;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        break;
      case 'cancel':
        await Haptics.impact({ style: ImpactStyle.Medium });
        break;
      default:
        break;
    }
    return;
  } catch {
    // Capacitor Haptics not active in standard browser window, fallback to web APIs
  }

  // 2. Web navigator.vibrate fallback (mobile browsers)
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      switch (type) {
        case 'delete':
          navigator.vibrate([60, 40, 80]); // Distinct double-pulse for deletion
          break;
        case 'cancel':
          navigator.vibrate(40); // Single medium pulse for cancel/close
          break;
        case 'warning':
          navigator.vibrate([40, 50, 40]);
          break;
        case 'error':
          navigator.vibrate([60, 60, 60]);
          break;
        default:
          break;
      }
      return;
    } catch {
      // Ignore vibration error
    }
  }

  // 3. Subtle audio feedback fallback for desktop and iOS Safari
  switch (type) {
    case 'delete':
      playMicroTick(400, 0.05, 0.06);
      break;
    case 'cancel':
      playMicroTick(700, 0.03, 0.04);
      break;
    case 'warning':
    case 'error':
      playMicroTick(500, 0.04, 0.05);
      break;
    default:
      break;
  }
}

// Convenient shorthand functions
// Delete action haptic feedback (ডিলিট করা)
export const hapticDelete = () => triggerHaptic('delete');

// Cancel / Close action haptic feedback (কেটে দেওয়া / বন্ধ / বাতিল)
export const hapticCancel = () => triggerHaptic('cancel');
export const hapticWarning = () => triggerHaptic('warning');
export const hapticError = () => triggerHaptic('error');

// General non-destructive actions are silenced (no vibration/tick everywhere)
export const hapticLight = () => {};
export const hapticMedium = () => {};
export const hapticHeavy = () => {};
export const hapticSuccess = () => {};
export const hapticSelection = () => {};
