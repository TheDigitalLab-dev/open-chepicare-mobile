import { useNavigation } from '@react-navigation/native';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { AppHeader, MobileShell } from '@/components/layout';
import { Avatar, Button, SectionTitle } from '@/components/ui';
import { AdminModuleGrid, ListRow, ThemeToggle } from '@/components/domain';
import type { AdminMoreStackParamList, AdminTabParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { useAssistant } from '@/session/AssistantProvider';

type Nav = NativeStackNavigationProp<AdminMoreStackParamList>;

// Icono estático hoisteado para evitar recrear JSX en cada render (jsx-no-jsx-as-prop).
const SERVER_ICON = <Avatar fallback="🌐" />;

export function AdminModulesScreen() {
  const navigation = useNavigation<Nav>();
  const tabs = navigation.getParent<BottomTabNavigationProp<AdminTabParamList>>();
  const { signOut } = useAuth();
  const { availability } = useAssistant();

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Más" />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <SectionTitle>Módulos clínicos y administrativos</SectionTitle>
      <AdminModuleGrid
        modules={[
          {
            // El calendario vive en la pestaña Agenda (junto a la lista de citas).
            id: 'calendar',
            label: 'Calendario',
            icon: 'calendar-number',
            onPress: () =>
              tabs?.navigate('AgendaTab', { screen: 'AdminCalendar', initial: false }),
          },
          {
            id: 'consultations',
            label: 'Consultas',
            icon: 'medkit',
            onPress: () => navigation.navigate('AdminConsultationsList'),
          },
          {
            id: 'vaccinations',
            label: 'Vacunas',
            icon: 'bandage',
            onPress: () => navigation.navigate('AdminVaccinationsList'),
          },
          {
            id: 'dewormings',
            label: 'Desparasitaciones',
            icon: 'flask',
            onPress: () => navigation.navigate('AdminDewormingsList'),
          },
          {
            id: 'schedules',
            label: 'Esquemas de vacunación',
            icon: 'calendar-number',
            onPress: () => navigation.navigate('AdminVaccinationSchedules'),
          },
          {
            // Las adopciones viven en la pestaña Pacientes (junto a las mascotas).
            id: 'adoptions',
            label: 'Adopciones',
            icon: 'heart',
            onPress: () =>
              tabs?.navigate('PatientsTab', { screen: 'AdminAdoptionsList' }),
          },
          {
            id: 'payments',
            label: 'Pagos',
            icon: 'card',
            onPress: () => navigation.navigate('AdminPaymentsList'),
          },
          {
            id: 'reports',
            label: 'Reportes',
            icon: 'document-text',
            onPress: () => navigation.navigate('AdminMedicalReportsList'),
          },
          // Solo si el servidor tiene IA y el usuario puede usar el asistente.
          ...(availability.canChat
            ? [
                {
                  id: 'assistant',
                  label: 'Asistente IA',
                  icon: 'sparkles' as const,
                  onPress: () => navigation.navigate('AssistantChat'),
                },
              ]
            : []),
        ]}
      />

      <SectionTitle>Apariencia</SectionTitle>
      <ThemeToggle />

      <SectionTitle>Cuenta y servidor</SectionTitle>
      <View style={{ gap: 8 }}>
        <ListRow
          title="Notificaciones"
          subtitle="Preferencias por categoría"
          onPress={() => navigation.navigate('NotificationPrefs')}
        />
        <ListRow
          title="Configurar servidor"
          subtitle="Elige a qué backend se conecta la app"
          leading={SERVER_ICON}
          onPress={() => navigation.navigate('AdminServerSettings')}
        />
        <ListRow
          title="Emparejar con código QR"
          subtitle="Conecta la app a otro servidor ChepiCare"
          onPress={() => navigation.navigate('PairingScan')}
        />
      </View>

      <Button
        label="Cerrar sesión"
        variant="outline"
        fullWidth
        onPress={confirmLogout}
        style={{ marginTop: 8 }}
      />
    </MobileShell>
  );
}
