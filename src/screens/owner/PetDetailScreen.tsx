import { useCallback } from 'react';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
  type RouteProp,
} from '@react-navigation/native';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Avatar, Button, InfoBanner, SectionTitle } from '@/components/ui';
import { ActionTileGrid, DetailHero } from '@/components/domain';
import type { ActionTile } from '@/components/domain';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { usePetPhoto } from '@/hooks/usePetPhoto';
import { getPet } from '@/services/pets';
import { PET_SEX_LABEL, SPECIES_EMOJI, SPECIES_LABEL, type Pet } from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerPetsStackParamList>;

/** Editar la ficha y subir, cambiar o quitar la foto. */
function PetActions({
  pet,
  onEdit,
  onPhotoChange,
}: {
  pet: Pet;
  onEdit: () => void;
  onPhotoChange: () => void;
}) {
  const photo = usePetPhoto(pet.id, onPhotoChange);
  const hasPhoto = Boolean(pet.photo_url);

  const confirmRemove = () => {
    Alert.alert('Quitar foto', '¿Quitar la foto de la mascota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, quitar', style: 'destructive', onPress: () => void photo.remove() },
    ]);
  };

  return (
    <>
      {photo.error ? <InfoBanner tone="destructive" message={photo.error} /> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Button label="Editar" variant="outline" onPress={onEdit} style={{ flex: 1 }} />
        <Button
          label={hasPhoto ? 'Cambiar foto' : 'Subir foto'}
          variant="outline"
          loading={photo.busy}
          disabled={photo.busy}
          onPress={() => void photo.pickAndUpload()}
          style={{ flex: 1 }}
        />
      </View>
      {hasPhoto ? (
        <Button
          label="Quitar foto"
          variant="ghost"
          size="sm"
          disabled={photo.busy}
          onPress={confirmRemove}
        />
      ) : null}
    </>
  );
}

export function PetDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<OwnerPetsStackParamList, 'PetDetail'>>();
  const petId = route.params.id;
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data: pet, loading, error, reload } = useAsync(() => getPet(petId));
  // Al volver de editar, y tras subir o quitar la foto, se muestra lo del servidor.
  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );
  const onPhotoChange = useCallback(() => void reload(), [reload]);

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
                  accessibilityLabel={
                    pet.photo_url ? `Foto de ${pet.name}` : `${pet.name} sin foto`
                  }
                />
              }
            />

            <PetActions
              pet={pet}
              onEdit={() => navigation.navigate('PetForm', { id: pet.id })}
              onPhotoChange={onPhotoChange}
            />

            <SectionTitle>Salud</SectionTitle>
            <ActionTileGrid tiles={tiles} />
          </>
        ) : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
