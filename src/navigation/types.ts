import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ReportView } from '../constants/modules';

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: { email?: string } | undefined;
};

export type MainTabsParamList = {
  Home: undefined;
  Sales: { view?: ReportView } | undefined;
  Stock: { view?: ReportView } | undefined;
};

export type MainStackParamList = {
  Tabs: NavigatorScreenParams<MainTabsParamList>;
  DataManagement: undefined;
};

export type TabName = keyof MainTabsParamList;
