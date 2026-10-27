import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  LayoutAnimation,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartColumn, ChevronDown, ChevronsUpDown, Database, LayoutDashboard, LogOut, Package, type LucideIcon } from 'lucide-react-native';
import { getAppVersionName } from '../config/appVersion';
import { env } from '../config/env';
import { buildMenu, type MenuGroup, type MenuLeaf } from '../navigation/menu';
import { openDataManagement, openTab } from '../navigation/navigationRef';
import { useSession } from '../store/sessionStore';
import { useUi } from '../store/uiStore';
import { colors, motion, radii, sizes, space } from '../theme';
import { showDialog } from '../utils/dialog';
import { AppText } from './AppText';
import { LogoMark, Wordmark } from './Logo';

const WIDTH = Math.min(Dimensions.get('window').width * 0.89, sizes.sidebarMaxWidth);
const ICONS: Record<MenuGroup['icon'], LucideIcon> = { dashboard: LayoutDashboard, sales: ChartColumn, stock: Package };

/**
 * The one global menu (rule R5): DataLynkr's order — logo, profile, organization
 * picker, menu, logout — in TallyDex colours (black panel, orange active bar).
 */
export function Sidebar() {
  const insets = useSafeAreaInsets();
  const open = useUi((s) => s.sidebarOpen);
  const close = useUi((s) => s.closeSidebar);
  const location = useUi((s) => s.location);
  const setOrgPickerOpen = useUi((s) => s.setOrgPickerOpen);
  const user = useSession((s) => s.user);
  const modules = useSession((s) => s.modules);
  const organizations = useSession((s) => s.organizations);
  const selectedOrg = useSession((s) => s.selectedOrg);
  const logout = useSession((s) => s.logout);

  const menu = useMemo(() => buildMenu(user?.role, modules), [user?.role, modules]);
  const activeGroup =
    location.tab === 'Sales' ? 'sales' : location.tab === 'Stock' ? 'stock' : location.tab === 'DataManagement' ? null : 'dashboard';
  const [expanded, setExpanded] = useState<string | null>(activeGroup);

  const [mounted, setMounted] = useState(open);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      setExpanded(activeGroup);
      Animated.timing(anim, { toValue: 1, duration: motion.sidebar, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(anim, { toValue: 0, duration: motion.sidebar - 60, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() =>
        setMounted(false),
      );
    }
    // activeGroup only matters at the moment the menu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Drag the panel left to close it.
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dx < -12 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_, g) => anim.setValue(Math.max(0, Math.min(1, 1 + g.dx / WIDTH))),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -WIDTH * 0.3 || g.vx < -0.5) useUi.getState().closeSidebar();
        else Animated.timing(anim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      },
    }),
  ).current;

  if (!mounted) return null;

  const go = (leaf: Pick<MenuLeaf, 'tab' | 'view'>) => {
    close();
    openTab(leaf.tab, leaf.view);
  };

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    setExpanded((e) => (e === id ? null : id));
  };

  const onLogout = async () => {
    const ok = await showDialog({
      title: 'Log out?',
      message: 'You will need your email and password to sign in again.',
      confirmLabel: 'Log out',
      cancelLabel: 'Cancel',
      destructive: true,
    });
    if (ok) {
      close();
      await logout();
    }
  };

  const canPickOrg = organizations.length > 1;
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [-WIDTH, 0] });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="Close menu" testID="sidebar-backdrop">
        <Animated.View style={[styles.scrim, { opacity: anim }]} />
      </Pressable>
      <Animated.View
        {...pan.panHandlers}
        testID="sidebar"
        style={[styles.panel, { width: WIDTH, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.md, transform: [{ translateX }] }]}
      >
        <View style={styles.logoRow} accessible accessibilityLabel={`${env.appName} version ${getAppVersionName()}`}>
          <LogoMark size={34} />
          <Wordmark onDark size={24} />
        </View>

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <AppText variant="title" color="chromeText">
              {(user?.firstName?.[0] ?? 'U').toUpperCase()}
            </AppText>
          </View>
          <View style={styles.profileText}>
            <AppText variant="title" color="chromeText" numberOfLines={1}>
              {user?.firstName || 'User'}
            </AppText>
            <AppText variant="caption" color="chromeMuted" numberOfLines={1}>
              {user?.email}
            </AppText>
          </View>
          <View style={styles.rolePill}>
            <AppText variant="overline" color="accent" style={styles.roleText}>
              {user?.role}
            </AppText>
          </View>
        </View>

        {selectedOrg ? (
          <View style={styles.orgSection}>
            <AppText variant="overline" color="chromeMuted">
              Organization
            </AppText>
            <Pressable
              testID="sidebar-org"
              accessibilityRole={canPickOrg ? 'button' : undefined}
              accessibilityLabel={`Organization ${selectedOrg.name}${canPickOrg ? ', change' : ''}`}
              disabled={!canPickOrg}
              onPress={() => setOrgPickerOpen(true)}
              style={({ pressed }) => [styles.orgBox, pressed && { backgroundColor: colors.chromeActiveBg }]}
            >
              <View style={styles.orgDot} />
              <AppText variant="bodyMedium" color="chromeText" numberOfLines={1} style={styles.orgName}>
                {selectedOrg.name}
              </AppText>
              {canPickOrg ? <ChevronsUpDown size={16} color={colors.chromeMuted} /> : null}
            </Pressable>
          </View>
        ) : null}

        <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
          {menu.map((g) => {
            const Icon = ICONS[g.icon];
            const groupActive = g.id === activeGroup;
            const isOpen = expanded === g.id && g.children.length > 0;
            return (
              <View key={g.id}>
                <Pressable
                  testID={`menu-${g.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={g.label}
                  accessibilityState={{ selected: groupActive, expanded: g.children.length ? isOpen : undefined }}
                  onPress={() => (g.tab ? go({ tab: g.tab }) : toggle(g.id))}
                  style={({ pressed }) => [styles.item, (groupActive && !g.children.length) && styles.itemActive, pressed && styles.itemPressed]}
                >
                  {groupActive && !g.children.length ? <View style={styles.activeBar} /> : null}
                  <Icon size={sizes.iconSidebar} color={groupActive ? colors.chromeText : colors.chromeMuted} strokeWidth={2.2} />
                  <AppText variant="bodyMedium" style={[styles.itemLabel, { color: groupActive ? colors.chromeText : colors.chromeMuted }]}>
                    {g.label}
                  </AppText>
                  {g.children.length ? (
                    <ChevronDown
                      size={16}
                      color={isOpen ? colors.chromeText : colors.chromeMuted}
                      style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}
                    />
                  ) : null}
                </Pressable>
                {isOpen ? (
                  <View style={styles.sub}>
                    {g.children.map((c) => {
                      const on = groupActive && (location.view ?? g.children[0].view) === c.view;
                      return (
                        <Pressable
                          key={c.id}
                          testID={`menu-${c.id}`}
                          accessibilityRole="button"
                          accessibilityLabel={`${g.label} ${c.label}`}
                          accessibilityState={{ selected: on }}
                          onPress={() => go(c)}
                          style={({ pressed }) => [styles.subItem, on && styles.itemActive, pressed && styles.itemPressed]}
                        >
                          {on ? <View style={styles.subBar} /> : null}
                          <AppText variant="bodyMedium" style={[styles.subLabel, { color: on ? colors.chromeText : colors.chromeMuted }]}>
                            {c.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            );
          })}
          <Pressable
            testID="menu-data"
            accessibilityRole="button"
            accessibilityLabel="Data Management"
            accessibilityState={{ selected: location.tab === 'DataManagement' }}
            onPress={() => {
              close();
              openDataManagement();
            }}
            style={({ pressed }) => [styles.item, location.tab === 'DataManagement' && styles.itemActive, pressed && styles.itemPressed]}
          >
            {location.tab === 'DataManagement' ? <View style={styles.activeBar} /> : null}
            <Database size={sizes.iconSidebar} color={location.tab === 'DataManagement' ? colors.chromeText : colors.chromeMuted} strokeWidth={2.2} />
            <AppText
              variant="bodyMedium"
              style={[styles.itemLabel, { color: location.tab === 'DataManagement' ? colors.chromeText : colors.chromeMuted }]}
            >
              Data Management
            </AppText>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            testID="sidebar-logout"
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={onLogout}
            style={({ pressed }) => [styles.logout, pressed && styles.itemPressed]}
          >
            <LogOut size={18} color={colors.chromeMuted} />
            <AppText variant="bodyMedium" color="chromeMuted">
              Log out
            </AppText>
          </Pressable>
          <AppText variant="caption" color="chromeMuted" align="center" style={styles.version}>
            Version {getAppVersionName()}
          </AppText>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.chrome,
    paddingHorizontal: space.md,
    elevation: 16,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.xxs, marginBottom: space.lg },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.sm,
    borderRadius: 12,
    backgroundColor: colors.chromeCard,
    borderWidth: 1,
    borderColor: colors.chromeLine,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1 },
  rolePill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: radii.pill, backgroundColor: colors.accentTint2 },
  roleText: { fontSize: 9 },
  orgSection: { marginTop: space.md, gap: 6 },
  orgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    height: 44,
    paddingHorizontal: space.sm,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.chromeBorder,
  },
  orgDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  orgName: { flex: 1 },
  menu: { flex: 1, marginTop: space.md },
  menuContent: { gap: 4, paddingBottom: space.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: sizes.touch,
    paddingHorizontal: space.md,
    borderRadius: 6,
    overflow: 'hidden',
  },
  itemActive: { backgroundColor: colors.chromeActiveBg },
  itemPressed: { backgroundColor: colors.chromePressed },
  activeBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.accent },
  itemLabel: { flex: 1, fontSize: 15 },
  sub: {
    marginLeft: 26,
    paddingLeft: space.sm,
    marginTop: 2,
    marginBottom: 4,
    gap: 2,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.chromeLine,
  },
  subItem: { minHeight: 42, justifyContent: 'center', paddingHorizontal: space.sm, borderRadius: 6 },
  subBar: { position: 'absolute', left: 0, width: 3, height: 16, borderRadius: 2, backgroundColor: colors.accent },
  subLabel: { fontSize: 14 },
  footer: { borderTopWidth: 1, borderTopColor: colors.chromeLine, paddingTop: space.md },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    height: 46,
    paddingHorizontal: space.md,
    borderRadius: radii.control,
    borderWidth: 1,
    borderColor: colors.chromeBorder,
  },
  version: { marginTop: space.sm, fontSize: 11 },
});
