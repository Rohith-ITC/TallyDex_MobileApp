import { create } from 'zustand';

export interface DialogOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  /** Omit for a single-button notice. */
  cancelLabel?: string;
  destructive?: boolean;
}

interface DialogState {
  dialog: DialogOptions | null;
  pending: ((ok: boolean) => void) | null;
  resolve: (ok: boolean) => void;
}

export const useDialogStore = create<DialogState>((set, get) => ({
  dialog: null,
  pending: null,
  resolve: (ok) => {
    const p = get().pending;
    set({ dialog: null, pending: null });
    p?.(ok);
  },
}));

/** Use instead of Alert.alert. Resolves true when the confirm button is pressed. */
export function showDialog(opts: DialogOptions): Promise<boolean> {
  // A dialog already open is answered "cancel" so its caller never hangs.
  useDialogStore.getState().pending?.(false);
  return new Promise((resolve) => useDialogStore.setState({ dialog: opts, pending: resolve }));
}
