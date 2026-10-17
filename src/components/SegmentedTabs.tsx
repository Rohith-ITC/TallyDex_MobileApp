import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radii, space } from '../theme';
import { AppText } from './AppText';

interface Props<K extends string> {
  options: Array<{ key: K; label: string }>;
  value: K;
  onChange: (k: K) => void;
}

/** 2-3 options inside a screen (rule R12). */
export function SegmentedTabs<K extends string>({ options, value, onChange }: Props<K>) {
  return (
    <View style={styles.wrap}>
      <View style={styles.track} accessibilityRole="tablist">
        {options.map((o) => {
          const on = o.key === value;
          return (
            <Pressable
              key={o.key}
              testID={`segment-${o.key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={o.label}
              onPress={() => onChange(o.key)}
              style={[styles.seg, on && styles.segOn]}
            >
              <AppText variant="label" style={[styles.text, { color: on ? colors.text : colors.text3 }]}>
                {o.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: space.gutter, paddingTop: space.sm, backgroundColor: colors.canvas },
  track: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radii.control,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: colors.line,
  },
  seg: { flex: 1, height: 36, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  segOn: {
    backgroundColor: colors.surface,
    elevation: 1,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  text: { fontSize: 13 },
});
