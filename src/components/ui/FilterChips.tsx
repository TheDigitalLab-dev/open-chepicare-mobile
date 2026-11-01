import { useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  type ListRenderItemInfo,
} from 'react-native';

import { useTheme } from '@/theme';

export interface FilterChipOption {
  id: string;
  label: string;
}

export interface FilterChipsProps {
  options: FilterChipOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function FilterChips({ options, selectedId, onSelect }: FilterChipsProps) {
  const { colors } = useTheme();
  const scroll = useRef<FlatList<FilterChipOption>>(null);
  const selectedIndex = options.findIndex((option) => option.id === selectedId);
  const showSelected = useCallback(() => {
    if (selectedIndex >= 0)
      scroll.current?.scrollToIndex({
        index: selectedIndex,
        animated: false,
        viewPosition: 0.5,
      });
  }, [selectedIndex]);
  useEffect(() => {
    const frame = requestAnimationFrame(showSelected);
    return () => cancelAnimationFrame(frame);
  }, [showSelected]);
  const renderItem = useCallback(
    ({ item: opt }: ListRenderItemInfo<FilterChipOption>) => {
      const active = opt.id === selectedId;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
          onPress={() => onSelect(opt.id)}
          style={[
            styles.chip,
            {
              backgroundColor: active ? colors.primary : colors.card,
              borderColor: active ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={{
              color: active ? colors.primaryForeground : colors.foreground,
              fontSize: 14,
              fontWeight: '500',
            }}
          >
            {opt.label}
          </Text>
        </Pressable>
      );
    },
    [colors, onSelect, selectedId],
  );
  return (
    <FlatList
      ref={scroll}
      horizontal
      style={{ flexGrow: 0 }}
      contentContainerStyle={styles.row}
      data={options}
      keyExtractor={(option) => option.id}
      renderItem={renderItem}
      extraData={selectedId}
      initialNumToRender={options.length}
      onContentSizeChange={showSelected}
      onScrollToIndexFailed={({ averageItemLength, index }) =>
        scroll.current?.scrollToOffset({
          offset: averageItemLength * index,
          animated: false,
        })
      }
      showsHorizontalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 9999,
  },
});
