import React, { useEffect, useMemo } from 'react';
import { BackHandler } from 'react-native';
import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BottomTabBar } from '../components/BottomTabBar';
import { OrgPickerHost } from '../components/OrgPickerHost';
import { Sidebar } from '../components/Sidebar';
import { UpdateSheetHost } from '../components/UpdateSheetHost';
import { reportAccess } from '../constants/modules';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { DataManagementScreen } from '../screens/data/DataManagementScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SetPasswordScreen } from '../screens/auth/SetPasswordScreen';
import { SplashScreen } from '../screens/auth/SplashScreen';
import { SalesScreen } from '../screens/reports/SalesScreen';
import { StockScreen } from '../screens/reports/StockScreen';
import { useSession } from '../store/sessionStore';
import { useUi } from '../store/uiStore';
import { colors } from '../theme';
import { showDialog } from '../utils/dialog';
import { currentLocation, navigationRef } from './navigationRef';
import type { AuthStackParamList, MainStackParamList, MainTabsParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tabs = createBottomTabNavigator<MainTabsParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.canvas, primary: colors.accent, card: colors.surface, text: colors.text, border: colors.line },
};

function useReportTabs() {
  const role = useSession((s) => s.user?.role);
  const modules = useSession((s) => s.modules);
  const access = useMemo(() => reportAccess(role, modules), [role, modules]);
  return { showSales: access.sales.length > 0, showStock: access.stock.length > 0 };
}

/** One tab alone isn't navigation: with no report tabs the bar is hidden (decision D2). */
function TabBar(props: BottomTabBarProps) {
  const { showSales, showStock } = useReportTabs();
  return showSales || showStock ? <BottomTabBar {...props} /> : null;
}
const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

function MainTabs() {
  const { showSales, showStock } = useReportTabs();
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false, freezeOnBlur: true }} backBehavior="firstRoute" tabBar={renderTabBar}>
      <Tabs.Screen name="Home" component={DashboardScreen} />
      {showSales ? <Tabs.Screen name="Sales" component={SalesScreen} /> : null}
      {showStock ? <Tabs.Screen name="Stock" component={StockScreen} /> : null}
    </Tabs.Navigator>
  );
}

function MainNavigator() {
  return (
    <>
      <MainStack.Navigator screenOptions={{ headerShown: false }}>
        <MainStack.Screen name="Tabs" component={MainTabs} />
        <MainStack.Screen name="DataManagement" component={DataManagementScreen} options={{ animation: 'slide_from_right' }} />
      </MainStack.Navigator>
      <Sidebar />
      <OrgPickerHost />
      <UpdateSheetHost />
    </>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />
    </AuthStack.Navigator>
  );
}

/**
 * Splash while the keychain is read, then sign-in, the forced first-login
 * password screen, or the app.
 */
export function RootNavigator() {
  const status = useSession((s) => s.status);
  const mustChangePassword = useSession((s) => s.mustChangePassword);
  const restore = useSession((s) => s.restore);
  const setLocation = useUi((s) => s.setLocation);

  useEffect(() => {
    void restore();
  }, [restore]);

  // Android back (rule R7): sheets and dialogs handle it themselves (Modal
  // onRequestClose); then the sidebar; then the navigators; then ask to exit.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const ui = useUi.getState();
      if (ui.sidebarOpen) {
        ui.closeSidebar();
        return true;
      }
      if (navigationRef.isReady() && navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }
      void showDialog({ title: 'Exit Tally DEx?', confirmLabel: 'Exit', cancelLabel: 'Cancel' }).then((ok) => {
        if (ok) BackHandler.exitApp();
      });
      return true;
    });
    return () => sub.remove();
  }, []);

  if (status === 'restoring') return <SplashScreen />;

  const signedIn = status === 'signedIn';
  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      key={signedIn ? (mustChangePassword ? 'setpw' : 'main') : 'auth'}
      onReady={() => setLocation(currentLocation())}
      onStateChange={() => setLocation(currentLocation())}
    >
      {!signedIn ? <AuthNavigator /> : mustChangePassword ? <SetPasswordScreen /> : <MainNavigator />}
    </NavigationContainer>
  );
}
