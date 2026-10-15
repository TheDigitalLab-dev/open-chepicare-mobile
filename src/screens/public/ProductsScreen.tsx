import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, ListFooter, ProductCard, SearchBar } from '@/components';
import { usePaginatedList } from '@/hooks/usePaginatedList';
import { listProductsPage } from '@/services/public';
import { formatMoney } from '@/utils/format';
import type { Product } from '@/types/models';
import type { PublicStackParamList } from '@/navigation/types';

export function ProductsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  // Búsqueda en el servidor (con pausa al escribir) y scroll infinito.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const { items, loading, loadingMore, error, moreError, reload, loadMore } =
    usePaginatedList((page) => listProductsPage({ search }, page), search);

  const renderItem = useCallback(
    ({ item: product }: ListRenderItemInfo<Product>) => (
      <ProductCard
        name={product.name}
        priceLabel={formatMoney(Number(product.sale_price))}
        imageUri={product.image_url ?? undefined}
        inStock={product.in_stock ?? false}
        onPress={() => navigation.navigate('ProductDetail', { id: product.id })}
      />
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={
        <AppHeader
          title="Tienda"
          onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        />
      }
      contentStyle={styles.content}
    >
      <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar productos…" />

      <AsyncBoundary
        loading={loading && items.length === 0}
        error={error}
        onRetry={reload}
        empty={items.length === 0}
        emptyIcon="cart"
        emptyTitle={query ? 'Sin resultados' : 'Sin productos'}
        emptyDescription={
          query ? 'No encontramos productos para tu búsqueda.' : 'Aún no hay productos.'
        }
      >
        <FlatList
          data={items}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <ListFooter loading={loadingMore} error={moreError} onRetry={loadMore} />
          }
          keyExtractor={(product) => String(product.id)}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.column}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      </AsyncBoundary>
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  list: { flex: 1 },
  listContent: { gap: 12 },
  column: { justifyContent: 'space-between' },
});
