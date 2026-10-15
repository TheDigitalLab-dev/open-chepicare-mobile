import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Badge, Button, Card, SectionTitle } from '@/components/ui';
import { DetailHero, ListRow } from '@/components/domain';
import type { AdminMoreStackParamList } from '@/navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAsync } from '@/hooks/useAsync';
import { getAdminConsultation } from '@/services/admin';
import { formatDateTime } from '@/utils/format';
import type { Consultation } from '@/types/models';
import { VoiceDictationSection } from './components/VoiceDictationSection';

type Rt = RouteProp<AdminMoreStackParamList, 'AdminConsultationDetail'>;

function Body({ consultation }: { consultation: Consultation }) {
  const { colors } = useTheme();
  const completed = consultation.treatment_completed_at != null;
  return (
    <>
      <DetailHero
        title={consultation.diagnosis ?? 'Consulta'}
        subtitle={formatDateTime(consultation.consultation_date)}
      >
        <Badge
          label={completed ? 'Tratamiento completado' : 'En curso'}
          variant={completed ? 'success' : 'warning'}
        />
      </DetailHero>

      <ListRow title="Veterinario" subtitle={consultation.veterinarian.full_name} />
      <ListRow
        title="Tratamiento"
        subtitle={consultation.treatment ?? 'Sin especificar'}
      />
      <ListRow title="Notas" subtitle={consultation.notes ?? 'Sin notas'} />

      {consultation.prescriptions.length > 0 ? (
        <View style={{ gap: 6 }}>
          <SectionTitle>Recetas</SectionTitle>
          {consultation.prescriptions.map((p) => (
            <Card key={p.id} style={{ gap: 4 }}>
              {p.items.map((it) => (
                <Text key={it.id} style={{ fontSize: 14, color: colors.foreground }}>
                  • {it.medication_name}
                  {it.dose ? ` — ${it.dose}` : ''}
                </Text>
              ))}
            </Card>
          ))}
        </View>
      ) : null}
    </>
  );
}

export function AdminConsultationDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminMoreStackParamList>>();
  const { params } = useRoute<Rt>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() =>
    getAdminConsultation(params.id),
  );
  const consultation = data;

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Consulta" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={data !== null && consultation === null}
        emptyIcon="medkit"
        emptyTitle="Consulta no encontrada"
      >
        {consultation ? (
          <>
            <Body consultation={consultation} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label="Recetas"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('AdminPrescriptions', {
                    consultationId: consultation.id,
                  })
                }
              />
              <Button
                label="Exámenes"
                variant="outline"
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate('AdminLabExams', {
                    consultationId: consultation.id,
                  })
                }
              />
            </View>
            <VoiceDictationSection
              petId={consultation.pet_id}
              consultationId={consultation.id}
              onApplied={() => void reload()}
            />
          </>
        ) : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
