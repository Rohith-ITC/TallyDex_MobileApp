import { createNavigationContainerRef } from '@react-navigation/native';
import type { ReportView } from '../constants/modules';
import type { MainStackParamList, TabName } from './types';

export const navigationRef = createNavigationContainerRef<MainStackParamList>();

/** Open a main tab from anywhere (the sidebar lives outside the screens). */
export function openTab(tab: TabName, view?: ReportView) {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('Tabs', { screen: tab, params: view ? { view } : undefined } as never);
}

export function openDataManagement() {
  if (!navigationRef.isReady()) return;
  navigationRef.navigate('DataManagement');
}

/** Deepest focused route name and its view param, for highlighting the menu. */
export function currentLocation(): { tab?: string; view?: ReportView } {
  if (!navigationRef.isReady()) return {};
  const r = navigationRef.getCurrentRoute();
  return { tab: r?.name, view: (r?.params as { view?: ReportView } | undefined)?.view };
}
