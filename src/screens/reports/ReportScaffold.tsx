import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { LocalDataGate } from '../../components/LocalDataGate';
import { Screen } from '../../components/Screen';
import { SegmentedTabs } from '../../components/SegmentedTabs';
import { ErrorState, NoAccessState, SkeletonRows } from '../../components/StateViews';
import { FAMILY_LABEL, reportAccess, VIEW_LABEL, type ReportFamily, type ReportView } from '../../constants/modules';
import type { MainTabsParamList } from '../../navigation/types';
import { useSession } from '../../store/sessionStore';
import { space } from '../../theme';

/**
 * One screen per report family. All / Mapped / Analytics are a segmented
 * control (rule R12); the sidebar's sub-items open the same screen with a view
 * param. Views the organization's modules don't allow are left out, and with
 * none left the screen shows the no-access state (rule R17).
 */
export function ReportScaffold({ family, render }: { family: ReportFamily; render: (view: ReportView) => React.ReactNode }) {
  const route = useRoute<RouteProp<MainTabsParamList, 'Sales' | 'Stock'>>();
  const navigation = useNavigation();
  const user = useSession((s) => s.user);
  const modules = useSession((s) => s.modules);
  const modulesError = useSession((s) => s.modulesError);
  const loadModules = useSession((s) => s.loadModules);
  const orgId = useSession((s) => s.selectedOrg?.id);

  const views = reportAccess(user?.role, modules)[family];
  const requested = route.params?.view;
  const view = requested && views.includes(requested) ? requested : views[0];

  let body: React.ReactNode;
  if (modules === null && !modulesError) {
    body = (
      <View style={styles.pad}>
        <SkeletonRows count={5} />
      </View>
    );
  } else if (modules === null && modulesError) {
    body = <ErrorState message="Couldn't load your organization's permissions." onRetry={() => void loadModules()} />;
  } else if (!view) {
    body = <NoAccessState />;
  } else {
    body = (
      <>
        {views.length > 1 ? (
          <SegmentedTabs
            options={views.map((v) => ({ key: v, label: VIEW_LABEL[v] }))}
            value={view}
            onChange={(v) => navigation.setParams({ view: v } as never)}
          />
        ) : null}
        {/* Keyed so switching view or organization starts with fresh filters. */}
        <View key={`${orgId}-${view}`} style={styles.flex}>
          <LocalDataGate>{render(view)}</LocalDataGate>
        </View>
      </>
    );
  }

  return (
    <Screen title={FAMILY_LABEL[family]} tenant>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: space.gutter },
});
