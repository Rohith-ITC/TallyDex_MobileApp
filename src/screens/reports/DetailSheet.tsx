import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '../../components/AppText';
import { BottomSheet } from '../../components/BottomSheet';
import { colors, space } from '../../theme';

export interface DetailSection {
  title?: string;
  rows: Array<[label: string, value: string]>;
}

/** Every web table column as label / value pairs, in the web's order (rule R10). */
export function DetailSheet({ visible, title, subtitle, sections, onClose }: { visible: boolean; title: string; subtitle?: string; sections: DetailSection[]; onClose: () => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} subtitle={subtitle} testID="detail-sheet">
      <ScrollView contentContainerStyle={styles.body}>
        {sections.map((s, i) => (
          <View key={s.title ?? i} style={styles.section}>
            {s.title ? (
              <AppText variant="overline" color="text4" style={styles.sectionTitle}>
                {s.title}
              </AppText>
            ) : null}
            {s.rows.map(([label, value]) => (
              <View key={label} style={styles.row}>
                <AppText variant="caption" color="text3" style={styles.label}>
                  {label}
                </AppText>
                <AppText variant="bodyMedium" style={styles.value} selectable>
                  {value}
                </AppText>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space.gutter, paddingBottom: space.lg },
  section: { marginTop: space.md },
  sectionTitle: { marginBottom: space.xxs },
  row: {
    flexDirection: 'row',
    gap: space.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineSoft,
  },
  label: { width: '38%', paddingTop: 2 },
  value: { flex: 1, textAlign: 'right', fontVariant: ['tabular-nums'] },
});
