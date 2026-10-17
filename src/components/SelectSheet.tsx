import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Check, Search } from 'lucide-react-native';
import { colors, radii, space } from '../theme';
import { AppText, AppTextInput } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

export interface SelectOption<V extends string | number> {
  value: V;
  label: string;
  sub?: string;
}

interface Props<V extends string | number> {
  visible: boolean;
  title: string;
  options: SelectOption<V>[];
  selected: V[];
  multi?: boolean;
  /** Shown when there are no options at all (e.g. still loading). */
  emptyText?: string;
  onApply: (values: V[]) => void;
  onClose: () => void;
}

/** Single or multi select in a sheet; search appears past 8 options (rule R21). */
export function SelectSheet<V extends string | number>({ visible, title, options, selected, multi = true, emptyText, onApply, onClose }: Props<V>) {
  const [draft, setDraft] = useState<V[]>(selected);
  const [q, setQ] = useState('');

  useEffect(() => {
    if (visible) {
      setDraft(selected);
      setQ('');
    }
  }, [visible, selected]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term) || o.sub?.toLowerCase().includes(term));
  }, [options, q]);

  const toggle = (v: V) => {
    if (!multi) {
      onApply([v]);
      onClose();
      return;
    }
    setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={multi ? (draft.length ? `${draft.length} selected` : 'None selected means all') : undefined}
      fill={options.length > 8}
      footer={
        multi ? (
          <>
            <Button label="Clear" variant="ghost" onPress={() => setDraft([])} style={styles.flex} />
            <Button
              label="Done"
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={styles.flex}
            />
          </>
        ) : undefined
      }
    >
      {options.length > 8 ? (
        <View style={styles.search}>
          <Search size={18} color={colors.text4} />
          <AppTextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search"
            style={styles.searchInput}
            autoCorrect={false}
            accessibilityLabel="Search options"
          />
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(o) => String(o.value)}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        ListEmptyComponent={
          <AppText variant="body" color="text3" align="center" style={styles.none}>
            {options.length === 0 && emptyText ? emptyText : 'No matches'}
          </AppText>
        }
        renderItem={({ item }) => {
          const on = draft.includes(item.value);
          return (
            <Pressable
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: on }}
              accessibilityLabel={item.label}
              onPress={() => toggle(item.value)}
              style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface2 }]}
            >
              <View style={styles.rowText}>
                <AppText variant={on ? 'title' : 'bodyMedium'} numberOfLines={2} style={styles.label}>
                  {item.label}
                </AppText>
                {item.sub ? (
                  <AppText variant="caption" color="text3" numberOfLines={1}>
                    {item.sub}
                  </AppText>
                ) : null}
              </View>
              {multi ? (
                <View style={[styles.box, on && styles.boxOn]}>{on ? <Check size={14} color={colors.onAccent} strokeWidth={3} /> : null}</View>
              ) : on ? (
                <Check size={20} color={colors.accent} strokeWidth={2.5} />
              ) : null}
            </Pressable>
          );
        }}
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginHorizontal: space.gutter,
    marginTop: space.sm,
    marginBottom: space.xs,
    paddingHorizontal: space.sm,
    height: 44,
    borderRadius: radii.control,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, height: '100%', paddingVertical: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.gutter,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.lineSoft,
  },
  rowText: { flex: 1 },
  label: { fontSize: 14.5 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.text4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  none: { paddingVertical: space.xl },
});
