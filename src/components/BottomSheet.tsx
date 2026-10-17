import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Pinned under the content (Apply / Reset). */
  footer?: React.ReactNode;
  /** Fraction of the screen height the sheet may take. */
  maxHeight?: number;
  /** Give the content the full max height (for lists that scroll). */
  fill?: boolean;
  testID?: string;
}

const SCREEN_H = Dimensions.get('window').height;

/**
 * Slides up from the bottom over a dim backdrop. Back button and backdrop tap
 * both close it. Padded by the bottom inset (Modal is drawn under the nav bar).
 */
export function BottomSheet({ visible, onClose, title, subtitle, children, footer, maxHeight = 0.86, fill, testID }: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(anim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() =>
        setMounted(false),
      );
    }
  }, [visible, anim, mounted]);

  if (!mounted) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_H * 0.6, 0] });
  const sheetMax = SCREEN_H * maxHeight;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button">
        <Animated.View style={[styles.backdrop, { opacity: anim }]} />
      </Pressable>
      <Animated.View
        testID={testID}
        style={[
          styles.sheet,
          { maxHeight: sheetMax, paddingBottom: insets.bottom, transform: [{ translateY }] },
          fill && { height: sheetMax },
        ]}
      >
        <View style={styles.handle} />
        {title ? (
          <View style={styles.head}>
            <View style={styles.headText}>
              <AppText variant="title" style={styles.titleText}>
                {title}
              </AppText>
              {subtitle ? (
                <AppText variant="caption" color="text3">
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={10} style={styles.close}>
              <X size={20} color={colors.text3} />
            </Pressable>
          </View>
        ) : null}
        <View style={fill ? styles.fillBody : styles.body}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    elevation: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    marginTop: 8,
    marginBottom: 4,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.gutter,
    paddingTop: space.xs,
    paddingBottom: space.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  headText: { flex: 1 },
  titleText: { fontSize: 16 },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  body: { flexShrink: 1 },
  fillBody: { flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: space.sm,
    paddingHorizontal: space.gutter,
    paddingVertical: space.sm,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
});
