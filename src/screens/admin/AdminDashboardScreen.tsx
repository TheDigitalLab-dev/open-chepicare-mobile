import { useNavigation } from '@react-navigation/native';
import { View } from 'react-native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, SectionTitle } from '@/components/ui';
import {
  AdminModuleGrid,
  HeroCard,
  NotificationsBell,
  StatCard,
} from '@/components/domain';
import type { AdminHomeStackParamList, AdminTabParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { useAsync } from '@/hooks/useAsync';
import { getAdminMetrics } from '@/services/admin';

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AdminHomeStackParamList>>();
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsync(() => getAdminMetrics());

  const goToTab = (tab: keyof AdminTabParamList) =>
    navigation.getParent<BottomTabNavigationProp<AdminTabParamList>>()?.navigate(tab);

  return (
    <MobileShell
      scroll
      header={
        <AppHeader
          title="Inicio"
          rightAction={
            <NotificationsBell onPress={() => navigation.navigate('Notifications')} />
          }
        />
      }
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <HeroCard
        title={`Hola, ${user?.first_name ?? ''}`.trim()}
        subtitle="Panel del personal de ChepiCare. Resumen del periodo."
      />

      <AsyncBoundary loading={loading && data === null} error={error} onRetry={reload}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <StatCard value={data?.new_patients ?? 0} label="Pacientes" />
          <StatCard value={data?.consultations ?? 0} label="Consultas" />
          <StatCard value={data?.completed_appointments ?? 0} label="Citas hechas" />
        </View>
      </AsyncBoundary>

      <View style={{ gap: 8 }}>
        <SectionTitle>Módulos</SectionTitle>
        <AdminModuleGrid
          modules={[
            {
              id: 'patients',
              label: 'Pacientes',
              icon: 'paw',
              onPress: () => goToTab('PatientsTab'),
            },
            {
              id: 'agenda',
              label: 'Agenda',
              icon: 'calendar',
              onPress: () => goToTab('AgendaTab'),
            },
            {
              id: 'more',
              label: 'Más módulos',
              icon: 'grid',
              onPress: () => goToTab('MoreTab'),
            },
          ]}
        />
      </View>
    </MobileShell>
  );
}
