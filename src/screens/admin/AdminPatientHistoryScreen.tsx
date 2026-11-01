import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Button, Card, InfoBanner, SectionTitle } from '@/components/ui';
import { DetailHero, ListRow } from '@/components/domain';
import { TutorContact } from '@/components/domain/TutorContact';
import { useAsync } from '@/hooks/useAsync';
import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';
import type { AdminPatientsStackParamList } from '@/navigation/types';
import { getAdminPatientHistory, getAdminPet } from '@/services/admin';
import { formatDate, formatDateTime } from '@/utils/format';

type Nav = NativeStackNavigationProp<AdminPatientsStackParamList>;
type Rt = RouteProp<AdminPatientsStackParamList, 'AdminPatientHistory'>;

function HistorySection({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{title}</SectionTitle>
      {empty ? (
        <InfoBanner message="Sin registros para este paciente." />
      ) : (
        <Card padding={0}>{children}</Card>
      )}
    </View>
  );
}

export function AdminPatientHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Rt>();
  const { data, loading, error, reload } = useAsync(async () => {
    const [pet, history] = await Promise.all([
      getAdminPet(params.petId),
      getAdminPatientHistory(params.petId),
    ]);
    return { pet, history };
  });
  useReloadOnFocus(reload);

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Historia médica" onBack={navigation.goBack} />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <AsyncBoundary loading={loading && data === null} error={error} onRetry={reload}>
        {data ? (
          <>
            <DetailHero
              title={data.pet.name}
              subtitle={`Tutor: ${data.pet.proprietary?.full_name ?? 'No registrado'}`}
            />
            <TutorContact tutor={data.pet.proprietary} />
            <Button
              label="Perfil médico y alergias"
              variant="secondary"
              onPress={() =>
                navigation.navigate('AdminMedicalProfile', { petId: data.pet.id })
              }
            />
            <HistorySection
              title="Consultas"
              empty={data.history.consultations.length === 0}
            >
              {data.history.consultations.map((consultation) => (
                <ListRow
                  key={consultation.id}
                  title={
                    consultation.anamnesis?.trim() ||
                    consultation.diagnosis?.trim() ||
                    'Consulta'
                  }
                  subtitle={`${formatDateTime(consultation.consultation_date)} · ${consultation.veterinarian.full_name}`}
                  onPress={() =>
                    navigation.navigate('AdminPetConsultation', { id: consultation.id })
                  }
                />
              ))}
            </HistorySection>
            <HistorySection
              title="Vacunas"
              empty={data.history.vaccinations.length === 0}
            >
              {data.history.vaccinations.map((vaccination) => (
                <ListRow
                  key={vaccination.id}
                  title={vaccination.vaccine_name}
                  subtitle={`${formatDate(vaccination.application_date)}${vaccination.next_due_date ? ` · Próxima dosis: ${formatDate(vaccination.next_due_date)}` : ''}`}
                />
              ))}
            </HistorySection>
            <HistorySection
              title="Desparasitaciones"
              empty={data.history.dewormings.length === 0}
            >
              {data.history.dewormings.map((deworming) => (
                <ListRow
                  key={deworming.id}
                  title={deworming.product_name}
                  subtitle={`${formatDate(deworming.application_date)}${deworming.next_due_date ? ` · Próxima dosis: ${formatDate(deworming.next_due_date)}` : ''}`}
                />
              ))}
            </HistorySection>
            <HistorySection title="Informes" empty={data.history.reports.length === 0}>
              {data.history.reports.map((report) => (
                <ListRow
                  key={report.id}
                  title={report.title}
                  subtitle={formatDate(report.generated_at ?? report.created_at)}
                  onPress={() =>
                    navigation.navigate('AdminMedicalReportDetail', { id: report.id })
                  }
                />
              ))}
            </HistorySection>
          </>
        ) : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
