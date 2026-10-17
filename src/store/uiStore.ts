import { create } from 'zustand';
import type { ReportView } from '../constants/modules';

interface UiState {
  sidebarOpen: boolean;
  orgPickerOpen: boolean;
  /** Where the user is, so the sidebar can mark the active item. */
  location: { tab?: string; view?: ReportView };
  openSidebar: () => void;
  closeSidebar: () => void;
  setOrgPickerOpen: (open: boolean) => void;
  setLocation: (l: { tab?: string; view?: ReportView }) => void;
}

export const useUi = create<UiState>((set) => ({
  sidebarOpen: false,
  orgPickerOpen: false,
  location: {},
  openSidebar: () => set({ sidebarOpen: true }),
  closeSidebar: () => set({ sidebarOpen: false }),
  setOrgPickerOpen: (open) => set({ orgPickerOpen: open }),
  setLocation: (location) => set({ location }),
}));
