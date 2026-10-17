import React, { useMemo } from 'react';
import { useSession } from '../store/sessionStore';
import { useUi } from '../store/uiStore';
import { openTab } from '../navigation/navigationRef';
import { SelectSheet } from './SelectSheet';
import { showToast } from './Toast';

/** One organization picker for the sidebar and every scope bar. */
export function OrgPickerHost() {
  const open = useUi((s) => s.orgPickerOpen);
  const setOpen = useUi((s) => s.setOrgPickerOpen);
  const closeSidebar = useUi((s) => s.closeSidebar);
  const organizations = useSession((s) => s.organizations);
  const selected = useSession((s) => s.selectedOrg);
  const selectOrg = useSession((s) => s.selectOrg);

  const options = useMemo(() => organizations.map((o) => ({ value: o.id, label: o.name, sub: o.dbSchema })), [organizations]);
  const selectedIds = useMemo(() => (selected ? [selected.id] : []), [selected]);

  return (
    <SelectSheet
      visible={open}
      title="Switch organization"
      options={options}
      selected={selectedIds}
      multi={false}
      onClose={() => setOpen(false)}
      onApply={([id]) => {
        const org = organizations.find((o) => o.id === id);
        if (!org || org.id === selected?.id) return;
        closeSidebar();
        // Data and filters belong to the old organization: start from Home.
        openTab('Home');
        void selectOrg(org).then(() => showToast(`Switched to ${org.name}`, 'info'));
      }}
    />
  );
}
