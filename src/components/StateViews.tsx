import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import { CircleAlert, Inbox, Lock, WifiOff, type LucideIcon } from 'lucide-react-native';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';
import { Button } from './Button';

/** Every data screen shows one of these instead of a blank area (rule R16). */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
  action,
  accent = false,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  action?: { label: string; onPress: () => void };
  accent?: boolean;
}) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.art, accent && styles.artAccent]}>
        <Icon size={26} color={accent ? colors.accent : colors.text3} strokeWidth={1.7} />
      </View>
      <AppText variant="title" align="center" style={styles.title}>
        {title}
      </AppText>
      {hint ? (
        <AppText variant="body" color="text3" align="center" style={styles.hint}>
          {hint}
        </AppText>
      ) : null}
      {action ? <Button label={action.label} onPress={action.onPress} variant="ghost" size="sm" style={styles.action} /> : null}
    </View>
  );
}

export function ErrorState({ message, isNetwork, onRetry }: { message: string; isNetwork?: boolean; onRetry?: () => void }) {
  return (
    <EmptyState
      icon={isNetwork ? WifiOff : CircleAlert}
      title={isNetwork ? "Can't reach the server" : "Couldn't load this"}
      hint={message}
      action={onRetry ? { label: 'Try again', onPress: onRetry } : undefined}
    />
  );
}

export function NoAccessState() {
  return (
    <EmptyState
      icon={Lock}
      accent
      title="Access restricted"
      hint="This report isn't enabled for your organization. Ask your administrator to provide access."
    />
  );
}

/** A grey block that pulses while content loads. */
export function Skeleton({ width = '100%', height = 14, style }: { width?: DimensionValue; height?: number; style?: StyleProp<ViewStyle> }) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.skeleton, { width, height, opacity }, style]} />;
}

/** List placeholder shaped like report rows. */
export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <View style={styles.rows}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.row}>
          <View style={styles.rowLeft}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="50%" height={11} />
          </View>
          <Skeleton width={70} height={14} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: { borderRadius: 6, backgroundColor: colors.surface3 },
  wrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: space.xl },
  art: {
    width: 60,
    height: 60,
    borderRadius: 18,
    marginBottom: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  artAccent: { backgroundColor: colors.accentTint, borderColor: colors.accentTint2 },
  title: { marginTop: space.xxs },
  hint: { marginTop: 6, maxWidth: 300 },
  action: { marginTop: space.md, paddingHorizontal: space.xs },
  rows: { gap: space.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  rowLeft: { flex: 1, gap: 8 },
});
