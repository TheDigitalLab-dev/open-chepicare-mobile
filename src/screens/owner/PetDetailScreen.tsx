import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Avatar, Button, SectionTitle } from '@/components/ui';
import { ActionTileGrid, DetailHero } from '@/components/domain';
import type { ActionTile } from '@/components/domain';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { getPet } from '@/services/pets';
import { PET_SEX_LABEL, SPECIES_EMOJI, SPECIES_LABEL } from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerPetsStackParamList>;

export function PetDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'PetDetail'>>();
  const petId = route.params.id;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data: pet, loading, error, reload } = useAsync(() => getPet(petId));

  const tiles: ActionTile[] = [
    {
      id: 'profile',
      label: 'Perfil médico',
      icon: 'medkit',
      onPress: () => navigation.navigate('MedicalProfile', { petId }),
    },
    {
      id: 'vaccinations',
      label: 'Vacunas',
      icon: 'bandage',
      onPress: () => navigation.navigate('Vaccinations', { petId }),
    },
    {
      id: 'dewormings',
      label: 'Desparasitaciones',
      icon: 'flask',
      onPress: () => navigation.navigate('Dewormings', { petId }),
    },
    {
      id: 'consultations',
      label: 'Consultas',
      icon: 'document-text',
      onPress: () => navigation.navigate('Consultations', { petId }),
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: 'reader',
      onPress: () => navigation.navigate('MedicalReports', { petId }),
    },
    {
      // Única entrada a los tratamientos en casa (antes solo se veían justo
      // después de iniciar uno).
      id: 'treatments',
      label: 'Tratamientos',
      icon: 'medkit',
      onPress: () => navigation.navigate('Treatments'),
    },
  ];

  const subtitle = pet
    ? [
        SPECIES_LABEL[pet.species],
        pet.breed,
        pet.sex ? PET_SEX_LABEL[pet.sex] : undefined,
      ]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <MobileShell
      scroll
      header={<AppHeader title={pet?.name ?? 'Mascota'} onBack={back} />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <AsyncBoundary loading={loading && pet === null} error={error} onRetry={reload}>
        {pet ? (
          <>
            <DetailHero
              title={pet.name}
              subtitle={subtitle}
              avatar={
                <Avatar
                  uri={pet.photo_url ?? undefined}
                  fallback={SPECIES_EMOJI[pet.species]}
                  size="lg"
                />
              }
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button
                label="Editar"
                variant="outline"
                onPress={() => navigation.navigate('PetForm', { id: pet.id })}
                style={{ flex: 1 }}
              />
            </View>

            <SectionTitle>Salud</SectionTitle>
            <ActionTileGrid tiles={tiles} />
          </>
        ) : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
