import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boxes, ChartColumn, LayoutDashboard, type LucideIcon } from 'lucide-react-native';
import { colors, sizes } from '../theme';
import { AppText } from './AppText';

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  Home: { label: 'Home', icon: LayoutDashboard },
  Sales: { label: 'Sales', icon: ChartColumn },
  Stock: { label: 'Stock', icon: Boxes },
};

/** DataLynkr's footer layout in TallyDex colours: white bar, orange active tab. */
export function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tab = TABS[route.name];
        if (!tab) return null;
        const color = focused ? colors.accent : colors.text3;
        return (
          <Pressable
            key={route.key}
            testID={`tab-${route.name}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
            }}
            style={styles.tab}
          >
            <View style={[styles.indicator, focused && styles.indicatorOn]} />
            <tab.icon size={sizes.iconTab} color={color} strokeWidth={focused ? 2.3 : 2} />
            <AppText variant="caption" style={[styles.label, { color }]}>
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tab: { flex: 1, height: sizes.tabBar, alignItems: 'center', justifyContent: 'center', gap: 3 },
  indicator: { position: 'absolute', top: 0, width: 28, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  indicatorOn: { backgroundColor: colors.accent },
  label: { fontSize: 11, marginTop: 1 },
});

