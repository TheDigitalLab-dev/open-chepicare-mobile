import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Fab, PetAvatar, SearchBar } from '@/components/ui';
import { ListRow } from '@/components/domain';
import type { AdminPatientsStackParamList } from '@/navigation/types';
import { useRemoteSearch } from '@/hooks/useRemoteSearch';
import { listAdminPets } from '@/services/admin';
import { formatDate } from '@/utils/format';
import { SPECIES_EMOJI, SPECIES_LABEL, type Pet } from '@/types/models';

type Nav = NativeStackNavigationProp<AdminPatientsStackParamList>;

const searchPets = (query: string) => listAdminPets({ search: query || undefined });

export function AdminPetsListScreen() {
  const navigation = useNavigation<Nav>();
  // Búsqueda en el servidor: la lista es paginada y filtrar en el cliente solo
  // encontraba entre los primeros 25 pacientes.
  const { query, setQuery, data, loading, error, reload } = useRemoteSearch(searchPets);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  const pets = data ?? [];

  const fab = useMemo(
    () => (
      <Fab
        accessibilityLabel="Agregar paciente"
        onPress={() => navigation.navigate('AdminPetForm', {})}
      />
    ),
    [navigation],
  );

  const renderItem = useCallback(
    ({ item: pet }: ListRenderItemInfo<Pet>) => (
      <ListRow
        title={pet.name}
        subtitle={`${SPECIES_LABEL[pet.species]} · ${pet.breed ?? 'Sin raza'} · ${formatDate(pet.birth_date)}`}
        leading={() => <PetAvatar fallback={SPECIES_EMOJI[pet.species]} size="md" />}
        onPress={() => navigation.navigate('AdminPetDetail', { id: pet.id })}
      />
    ),
    [navigation],
  );

  return (
    <MobileShell
      header={<AppHeader title="Pacientes" />}
      contentStyle={styles.content}
      fab={fab}
    >
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar paciente o dueño…"
      />

      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={() => void reload()}
        empty={!loading && pets.length === 0}
        emptyIcon="paw"
        emptyTitle="Sin pacientes"
        emptyDescription="No se encontraron mascotas con ese criterio."
      >
        <FlatList
          data={pets}
          keyExtractor={(pet) => String(pet.id)}
          renderItem={renderItem}
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
  listContent: { gap: 12, paddingBottom: 96 },
});
