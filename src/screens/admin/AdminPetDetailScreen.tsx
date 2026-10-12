import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Button, PetAvatar } from '@/components/ui';
import { DetailHero, ListRow } from '@/components/domain';
import type { AdminPatientsStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { listAdminPets } from '@/services/admin';
import { formatDate } from '@/utils/format';
import { SEX_LABEL, SPECIES_EMOJI, SPECIES_LABEL, type Pet } from '@/types/models';
import { VoiceDictationSection } from './components/VoiceDictationSection';

type Nav = NativeStackNavigationProp<AdminPatientsStackParamList>;
type Rt = RouteProp<AdminPatientsStackParamList, 'AdminPetDetail'>;

function Body({ pet }: { pet: Pet }) {
  const navigation = useNavigation<Nav>();
  return (
    <>
      <DetailHero
        title={pet.name}
        subtitle={`${SPECIES_LABEL[pet.species]} · ${pet.breed ?? 'Sin raza'}`}
        avatar={<PetAvatar fallback={SPECIES_EMOJI[pet.species]} size="lg" />}
      />

      <ListRow title="Especie" subtitle={SPECIES_LABEL[pet.species]} />
      <ListRow title="Raza" subtitle={pet.breed ?? 'Sin especificar'} />
      <ListRow title="Sexo" subtitle={pet.sex ? SEX_LABEL[pet.sex] : 'Sin especificar'} />
      <ListRow title="Nacimiento" subtitle={formatDate(pet.birth_date)} />
      <ListRow
        title="Características"
        subtitle={pet.distinctive_features ?? 'Ninguna registrada'}
      />

      <View style={{ gap: 8, marginTop: 8 }}>
        <Button
          label="Editar paciente"
          fullWidth
          onPress={() => navigation.navigate('AdminPetForm', { id: pet.id })}
        />
        <Button
          label="Perfil médico"
          variant="secondary"
          fullWidth
          onPress={() => navigation.navigate('AdminMedicalProfile', { petId: pet.id })}
        />
      </View>

      <VoiceDictationSection
        petId={pet.id}
        onOpenConsultation={(id) => navigation.navigate('AdminPetConsultation', { id })}
      />
    </>
  );
}

export function AdminPetDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() => listAdminPets());
  const pet = (data ?? []).find((p) => p.id === params.id) ?? null;

  return (
    <MobileShell
      scroll
      header={<AppHeader title={pet?.name ?? 'Paciente'} onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={data !== null && pet === null}
        emptyIcon="paw"
        emptyTitle="Paciente no encontrado"
      >
        {pet ? <Body pet={pet} /> : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
