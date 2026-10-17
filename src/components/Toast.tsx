import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';

type Tone = 'ok' | 'danger' | 'info';

interface ToastState {
  toast: { id: number; message: string; tone: Tone } | null;
  show: (message: string, tone?: Tone) => void;
  hide: () => void;
}

const useToastStore = create<ToastState>((set) => ({
  toast: null,
  show: (message, tone = 'ok') => set({ toast: { id: Date.now(), message, tone } }),
  hide: () => set({ toast: null }),
}));

export const showToast = (message: string, tone?: Tone) => useToastStore.getState().show(message, tone);

const TONE_BG: Record<Tone, string> = { ok: colors.ok, danger: colors.danger, info: colors.text };

/** Bottom toast, 3 seconds (rule R18). Mounted once at the app root. */
export function ToastHost() {
  const toast = useToastStore((s) => s.toast);
  const hide = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => hide());
    }, 3000);
    return () => clearTimeout(t);
  }, [toast, anim, hide]);

  if (!toast) return null;
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          bottom: insets.bottom + 80,
          backgroundColor: TONE_BG[toast.tone],
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <AppText variant="bodyMedium" color="onAccent" align="center">
        {toast.message}
      </AppText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: space.xl,
    right: space.xl,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radii.control,
    elevation: 6,
  },
});
