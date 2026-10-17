import React from 'react';
import { StyleSheet, View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import dayjs from 'dayjs';
import { useSession } from '../store/sessionStore';
import { useSync } from '../store/syncStore';
import { useUi } from '../store/uiStore';
import { colors } from '../theme';
import { AppHeader, type HeaderAction } from './AppHeader';
import { ScopeBar, type ScopeStatus } from './ScopeBar';

/** "Updating…", "Updated 16 Oct, 10:42", "Update failed". */
export function useDataStatus(): ScopeStatus | undefined {
  const running = useSync((s) => s.running);
  const lastError = useSync((s) => s.lastError);
  const finished = useSync((s) => s.info?.run?.finished_at);
  if (running) return { text: 'Updating…', tone: 'busy' };
  if (lastError) return { text: 'Update failed', tone: 'danger' };
  if (finished) {
    const d = dayjs(finished);
    return { text: `Updated ${d.isSame(dayjs(), 'day') ? d.format('HH:mm') : d.format('DD MMM, HH:mm')}`, tone: 'muted' };
  }
  return undefined;
}

/**
 * Fixed layers for a top-level screen (rule R1): header with the menu icon and
 * the Update action, then the organization scope bar with the data's age,
 * then the body.
 */
export function Screen({
  title,
  tenant = false,
  actions,
  children,
}: {
  title: string;
  tenant?: boolean;
  actions?: HeaderAction[];
  children: React.ReactNode;
}) {
  const openSidebar = useUi((s) => s.openSidebar);
  const setOrgPickerOpen = useUi((s) => s.setOrgPickerOpen);
  const setUpdateSheetOpen = useSync((s) => s.setUpdateSheetOpen);
  const org = useSession((s) => s.selectedOrg);
  const canPick = useSession((s) => s.organizations.length > 1);
  const status = useDataStatus();

  const update: HeaderAction = { icon: RefreshCw, label: 'Update data', onPress: () => setUpdateSheetOpen(true), testID: 'header-update' };

  return (
    <View style={styles.root}>
      <AppHeader title={title} left="menu" onLeftPress={openSidebar} actions={[...(actions ?? []), update]} />
      {tenant && org ? <ScopeBar name={org.name} status={status} onPress={canPick ? () => setOrgPickerOpen(true) : undefined} /> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1 },
});
