import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, space } from '../theme';
import { useDialogStore } from '../utils/dialog';
import { AppText } from './AppText';
import { Button } from './Button';

/** Renders every showDialog() call; mounted once at the app root. */
export function DialogHost() {
  const dialog = useDialogStore((s) => s.dialog);
  const resolve = useDialogStore((s) => s.resolve);
  if (!dialog) return null;
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => resolve(false)}>
      <Pressable style={styles.overlay} onPress={() => resolve(false)} accessibilityLabel="Dismiss">
        <Pressable style={styles.card} onPress={() => {}} accessible={false}>
          <AppText variant="title" style={styles.title}>
            {dialog.title}
          </AppText>
          {dialog.message ? (
            <AppText variant="body" color="text2" style={styles.message}>
              {dialog.message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            {dialog.cancelLabel ? (
              <Button label={dialog.cancelLabel} variant="ghost" size="sm" onPress={() => resolve(false)} style={styles.btn} />
            ) : null}
            <Button
              label={dialog.confirmLabel ?? 'OK'}
              variant={dialog.destructive ? 'danger' : 'dark'}
              size="sm"
              onPress={() => resolve(true)}
              style={styles.btn}
              testID="dialog-confirm"
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: space.xl },
  card: { width: '100%', maxWidth: 420, backgroundColor: colors.surface, borderRadius: radii.card, padding: space.lg },
  title: { fontSize: 17 },
  message: { marginTop: space.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.xs, marginTop: space.lg },
  btn: { minWidth: 96, paddingHorizontal: space.xs },
});
