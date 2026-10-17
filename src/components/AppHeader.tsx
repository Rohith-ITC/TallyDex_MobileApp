import React from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Menu, type LucideIcon } from 'lucide-react-native';
import { colors, sizes, space } from '../theme';
import { AppText } from './AppText';

export interface HeaderAction {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  testID?: string;
}

interface Props {
  title: string;
  /** 'menu' on top-level screens, 'back' on pushed screens (rule R3). */
  left?: 'menu' | 'back' | 'none';
  onLeftPress?: () => void;
  /** At most two (rule R4). */
  actions?: HeaderAction[];
}

/**
 * Black bar under a black status bar (decision D1). The status bar is
 * translucent everywhere, so the header paints behind it and pads by the inset;
 * that looks the same on Android 14 and on edge-to-edge Android 15+.
 */
export function AppHeader({ title, left = 'menu', onLeftPress, actions = [] }: Props) {
  const insets = useSafeAreaInsets();
  const LeftIcon = left === 'back' ? ChevronLeft : Menu;
  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor={colors.transparent} />
      <View style={styles.bar}>
        {left !== 'none' && (
          <Pressable
            testID={left === 'back' ? 'header-back' : 'header-menu'}
            accessibilityRole="button"
            accessibilityLabel={left === 'back' ? 'Back' : 'Open menu'}
            onPress={onLeftPress}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <LeftIcon size={left === 'back' ? 26 : sizes.iconHeader} color={colors.chromeText} strokeWidth={2} />
          </Pressable>
        )}
        <AppText variant="headerTitle" color="chromeText" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        {actions.slice(0, 2).map((a) => (
          <Pressable
            key={a.label}
            testID={a.testID}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            onPress={a.onPress}
            hitSlop={8}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <a.icon size={sizes.iconHeader} color={colors.chromeText} strokeWidth={2} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.chrome },
  bar: {
    height: sizes.header,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.xxs,
  },
  iconBtn: {
    width: sizes.touch,
    height: sizes.touch,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: sizes.touch / 2,
  },
  pressed: { backgroundColor: colors.chromeActiveBg },
  title: { flex: 1, marginLeft: space.xxs, marginRight: space.xs },
});
