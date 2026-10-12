import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { AsyncBoundary, FilterChips, SearchBar } from '@/components/ui';
import type { RemoteSearchState } from '@/hooks/useRemoteSearch';

export interface RemoteSearchPickerProps<T> {
  label: string;
  search: RemoteSearchState<T>;
  getId: (item: T) => number;
  getLabel: (item: T) => string;
  /** Elemento elegido: se mantiene visible aunque la búsqueda actual no lo traiga. */
  selected: T | null;
  onSelect: (item: T) => void;
  placeholder?: string;
  emptyIcon?: keyof typeof Ionicons.glyphMap;
  emptyTitle: string;
}

/**
 * Selector con búsqueda en el servidor (listas paginadas del backend): con la
 * búsqueda vacía muestra la primera página y al escribir busca entre todos los
 * registros. Resuelve carga, error con reintento y vacío.
 */
export function RemoteSearchPicker<T>({
  label,
  search,
  getId,
  getLabel,
  selected,
  onSelect,
  placeholder = 'Buscar…',
  emptyIcon,
  emptyTitle,
}: RemoteSearchPickerProps<T>) {
  const { colors } = useTheme();

  const items = useMemo(() => {
    const results = search.data ?? [];
    if (!selected || results.some((r) => getId(r) === getId(selected))) return results;
    return [selected, ...results];
  }, [search.data, selected, getId]);

  const byId = useMemo(
    () => new Map(items.map((i) => [String(getId(i)), i])),
    [items, getId],
  );

  return (
    <View style={styles.base}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <SearchBar
        value={search.query}
        onChangeText={search.setQuery}
        placeholder={placeholder}
      />
      <AsyncBoundary
        loading={search.loading && search.data === null}
        error={search.error}
        onRetry={() => void search.reload()}
        empty={!search.loading && items.length === 0}
        emptyIcon={emptyIcon}
        emptyTitle={emptyTitle}
        emptyDescription={search.query ? 'Prueba con otra búsqueda.' : undefined}
      >
        <FilterChips
          options={items.map((i) => ({ id: String(getId(i)), label: getLabel(i) }))}
          selectedId={selected ? String(getId(selected)) : ''}
          onSelect={(id) => {
            const item = byId.get(id);
            if (item) onSelect(item);
          }}
        />
      </AsyncBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { gap: 8 },
  label: { fontSize: 14, fontWeight: '500' },
});
