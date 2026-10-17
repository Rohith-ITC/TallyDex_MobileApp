import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSync } from '../store/syncStore';
import { colors, radii, space } from '../theme';
import { formatCount } from '../utils/format';
import { AppText } from './AppText';
import { Card } from './Card';
import { ErrorState } from './StateViews';

/** "Step 2 of 6 · Sales · All · 1,240 rows" */
export function progressLabel(p: { step: string; loaded: number; total?: number; stepIndex: number; stepCount: number } | null) {
  if (!p) return 'Starting…';
  const rows = p.loaded ? ` · ${formatCount(p.loaded)}${p.total ? ` of ${formatCount(p.total)}` : ''} rows` : '';
  return `Step ${p.stepIndex} of ${p.stepCount} · ${p.step}${rows}`;
}

/**
 * Screens read only from the local database. Until the first download for
 * this organization has finished, show its progress (or its error) instead.
 */
export function LocalDataGate({ children }: { children: React.ReactNode }) {
  const info = useSync((s) => s.info);
  const running = useSync((s) => s.running);
  const progress = useSync((s) => s.progress);
  const lastError = useSync((s) => s.lastError);
  const start = useSync((s) => s.start);

  if (info?.hasData) return <>{children}</>;

  if (lastError && !running) {
    return (
      <View style={styles.pad}>
        <Card>
          <ErrorState message={`The first download didn't finish: ${lastError}`} onRetry={() => void start(null, 'first')} />
        </Card>
      </View>
    );
  }

  const pct = progress ? Math.round(((progress.stepIndex - 1) / progress.stepCount) * 100) : 0;
  return (
    <View style={styles.pad}>
      <Card style={styles.card}>
        <ActivityIndicator color={colors.accent} />
        <AppText variant="title" align="center">
          Downloading your data
        </AppText>
        <AppText variant="caption" color="text3" align="center">
          This happens once. After that the app works from the saved copy and updates it in the background.
        </AppText>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(pct, 4)}%` }]} />
        </View>
        <AppText variant="caption" color="text2" align="center" testID="download-progress">
          {progressLabel(progress)}
        </AppText>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.gutter },
  card: { alignItems: 'center', gap: space.xs, paddingVertical: space.xxl },
  track: { alignSelf: 'stretch', height: 6, borderRadius: radii.pill, backgroundColor: colors.surface3, overflow: 'hidden', marginTop: space.sm },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: radii.pill },
});
