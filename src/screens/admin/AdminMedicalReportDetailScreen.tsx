import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Text } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, Card, SectionTitle } from '@/components/ui';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { useAsync } from '@/hooks/useAsync';
import { getAdminMedicalReport } from '@/services/admin';
import { formatDate } from '@/utils/format';
import type { StaffMedicalReport } from '@/types/models';

type Rt = RouteProp<AdminMoreStackParamList, 'AdminMedicalReportDetail'>;

function Body({ report }: { report: StaffMedicalReport }) {
  const { colors } = useTheme();
  return (
    <>
      <Card style={{ gap: 6 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.foreground }}>
          {report.pet.name} — {report.title}
        </Text>
        <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
          Tutor: {report.proprietary?.full_name ?? 'No registrado'}
        </Text>
        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
          {formatDate(report.generated_at ?? report.created_at)} ·{' '}
          {report.created_by.full_name}
        </Text>
      </Card>

      {report.current_observations ? (
        <>
          <SectionTitle>Observaciones</SectionTitle>
          <Card>
            <Text style={{ fontSize: 15, color: colors.foreground }}>
              {report.current_observations}
            </Text>
          </Card>
        </>
      ) : null}

      {report.referral_reason ? (
        <>
          <SectionTitle>Motivo de remisión</SectionTitle>
          <Card>
            <Text style={{ color: colors.foreground }}>{report.referral_reason}</Text>
          </Card>
        </>
      ) : null}
      {report.content ? (
        <>
          <SectionTitle>Contenido</SectionTitle>
          <Card>
            <Text style={{ fontSize: 15, color: colors.foreground }}>
              {report.content}
            </Text>
          </Card>
        </>
      ) : null}
    </>
  );
}

export function AdminMedicalReportDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<Rt>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const { data, loading, error, reload } = useAsync(() =>
    getAdminMedicalReport(params.id),
  );

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Reporte médico" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={!loading && data === null}
        emptyIcon="reader"
        emptyTitle="Reporte no encontrado"
        emptyDescription="El reporte médico solicitado no existe o fue eliminado."
      >
        {data ? <Body report={data} /> : null}
      </AsyncBoundary>
    </MobileShell>
  );
}
