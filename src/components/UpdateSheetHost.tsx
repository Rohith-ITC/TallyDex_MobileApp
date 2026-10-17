import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { reportAccess } from '../constants/modules';
import { useSession } from '../store/sessionStore';
import { defaultSalesRange, useSync } from '../store/syncStore';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { DateRangeSheet, type DateRange } from './DateRangeSheet';
import { showToast } from './Toast';

/**
 * "Update" re-downloads everything for the organization (there's no
 * incremental API). With sales access it first asks which sales period to
 * download; dashboard, filters and closing stock always come down in full.
 */
export function UpdateSheetHost() {
  const open = useSync((s) => s.updateSheetOpen);
  const setOpen = useSync((s) => s.setUpdateSheetOpen);
  const info = useSync((s) => s.info);
  const start = useSync((s) => s.start);
  const role = useSession((s) => s.user?.role);
  const modules = useSession((s) => s.modules);
  const hasSales = reportAccess(role, modules).sales.length > 0;
  const value = useMemo(() => defaultSalesRange(info), [info]);

  const run = (range: DateRange | null) => {
    setOpen(false);
    showToast('Updating data in the background…', 'info');
    void start(range, 'manual').then((ok) => {
      if (ok) showToast('Data updated');
      else if (useSync.getState().lastError) showToast(`Update failed: ${useSync.getState().lastError}`, 'danger');
    });
  };

  const note = (
    <View style={styles.note}>
      <Info size={16} color={colors.text3} />
      <AppText variant="caption" color="text3" style={styles.noteText}>
        Downloads sales for this period, plus the dashboard, filter options and current closing stock. Your existing data stays
        available until the download finishes.
      </AppText>
    </View>
  );

  if (hasSales) {
    return (
      <DateRangeSheet
        visible={open}
        value={value}
        title="Update data · sales period"
        confirmLabel="Download"
        presetsApply={false}
        note={note}
        onApply={(r) => run(r)}
        onClose={() => setOpen(false)}
      />
    );
  }

  return (
    <BottomSheet
      visible={open}
      onClose={() => setOpen(false)}
      title="Update data"
      footer={<Button label="Download" onPress={() => run(null)} style={styles.flex} testID="update-download" />}
    >
      <View style={styles.body}>
        <AppText variant="body" color="text2">
          Downloads the dashboard again from the server.
        </AppText>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: space.gutter },
  note: {
    flexDirection: 'row',
    gap: space.xs,
    marginTop: space.md,
    padding: space.sm,
    borderRadius: radii.control,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noteText: { flex: 1 },
});
