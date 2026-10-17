import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { DialogHost } from './src/components/DialogHost';
import { ToastHost } from './src/components/Toast';
import { RootNavigator } from './src/navigation/RootNavigator';
import { queryClient } from './src/store/queryClient';
import { startSyncController } from './src/store/syncStore';
import { colors } from './src/theme';

// Background downloads follow sign-in, organization and app-foreground changes.
startSyncController();

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <View style={styles.root}>
          <RootNavigator />
          {/* Above every screen and sheet. */}
          <ToastHost />
          <DialogHost />
        </View>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.chrome },
});
