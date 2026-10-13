import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Avatar, SectionTitle } from '@/components/ui';
import { ListRow, TimelineItem } from '@/components/domain';
import type { OwnerHomeStackParamList, OwnerTabParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { listPets } from '@/services/pets';
import { listConsultations, listVaccinations } from '@/services/medical';
import { formatDate } from '@/utils/format';
import {
  SPECIES_EMOJI,
  SPECIES_LABEL,
  type Consultation,
  type Pet,
  type Vaccination,
} from '@/types/models';

type Nav = NativeStackNavigationProp<OwnerHomeStackParamList>;

interface HistoryData {
  pets: Pet[];
  consultations: Consultation[];
  vaccinations: Vaccination[];
}

async function loadHistory(): Promise<HistoryData> {
  const pets = await listPets();
  const perPet = await Promise.all(
    pets.map(async (p) => ({
      consultations: await listConsultations(p.id),
      vaccinations: await listVaccinations(p.id),
    })),
  );
  const byDateDesc = (a: string, b: string) => (a < b ? 1 : -1);
  const consultations = perPet
    .flatMap((x) => x.consultations)
    .sort((a, b) => byDateDesc(a.consultation_date, b.consultation_date))
    .slice(0, 5);
  const vaccinations = perPet
    .flatMap((x) => x.vaccinations)
    .sort((a, b) => byDateDesc(a.application_date, b.application_date))
    .slice(0, 5);
  return { pets, consultations, vaccinations };
}

export function OwnerMedicalHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const { data, loading, error, reload } = useAsync(loadHistory);

  // Abre la ficha de ESA mascota en la pestaña Mascotas (antes, la lista).
  const openPet = (id: number) =>
    navigation
      .getParent<BottomTabNavigationProp<OwnerTabParamList>>()
      ?.navigate('PetsTab', { screen: 'PetDetail', params: { id }, initial: false });

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Historial médico" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={data !== null && data.pets.length === 0}
        emptyIcon="paw"
        emptyTitle="Sin mascotas"
        emptyDescription="Agrega una mascota para ver su historial."
      >
        {data ? (
          <>
            <SectionTitle>Mis mascotas</SectionTitle>
            <View style={{ gap: 8 }}>
              {data.pets.map((pet) => (
                <ListRow
                  key={pet.id}
                  title={pet.name}
                  subtitle={`${SPECIES_LABEL[pet.species]}${pet.breed ? ` · ${pet.breed}` : ''}`}
                  leading={() => (
                    <Avatar
                      uri={pet.photo_url ?? undefined}
                      fallback={SPECIES_EMOJI[pet.species]}
                    />
                  )}
                  onPress={() => openPet(pet.id)}
                />
              ))}
            </View>

            {data.consultations.length > 0 ? (
              <>
                <SectionTitle>Últimas consultas</SectionTitle>
                <View>
                  {data.consultations.map((c, i) => (
                    <TimelineItem
                      key={c.id}
                      title={c.diagnosis ?? 'Consulta'}
                      date={formatDate(c.consultation_date)}
                      description={c.veterinarian.full_name}
                      last={i === data.consultations.length - 1}
                    />
                  ))}
                </View>
              </>
            ) : null}

            {data.vaccinations.length > 0 ? (
              <>
                <SectionTitle>Vacunas recientes</SectionTitle>
                <View>
                  {data.vaccinations.map((v, i) => (
                    <TimelineItem
                      key={v.id}
                      tone="success"
                      title={v.vaccine_name}
                      date={formatDate(v.application_date)}
                      description={
                        v.next_due_date
                          ? `Próxima dosis: ${formatDate(v.next_due_date)}`
                          : undefined
                      }
                      last={i === data.vaccinations.length - 1}
                    />
                  ))}
                </View>
              </>
            ) : null}
          </>
        ) : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
