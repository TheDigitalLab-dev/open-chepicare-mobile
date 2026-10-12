import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import {
  AdminAdoptionDetailScreen,
  AdminAdoptionFormScreen,
  AdminAdoptionsListScreen,
  AdminAppointmentDetailScreen,
  AdminAppointmentsListScreen,
  AdminAppointmentWizardScreen,
  AdminConsultationDetailScreen,
  AdminConsultationFormScreen,
  AdminConsultationsListScreen,
  AdminDashboardScreen,
  AdminDewormingsListScreen,
  AdminLabExamsScreen,
  AdminMedicalProfileScreen,
  AdminMedicalReportDetailScreen,
  AdminMedicalReportsListScreen,
  AdminModulesScreen,
  AdminPaymentDetailScreen,
  AdminPaymentRegisterScreen,
  AdminPaymentsListScreen,
  AdminPetDetailScreen,
  AdminPetFormScreen,
  AdminPetsListScreen,
  AdminPrescriptionsScreen,
  AdminVaccinationFormScreen,
  AdminVaccinationSchedulesScreen,
  AdminVaccinationsListScreen,
  AssistantChatScreen,
} from '@/screens/admin';
import { PairingScanScreen, ServerSettingsScreen } from '@/screens/auth';
import { NotificationPrefsScreen, NotificationsScreen } from '@/screens/common';
import type {
  AdminAgendaStackParamList,
  AdminHomeStackParamList,
  AdminMoreStackParamList,
  AdminPatientsStackParamList,
  AdminTabParamList,
} from './types';

const HomeStack = createNativeStackNavigator<AdminHomeStackParamList>();
function AdminHomeStack() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

const PatientsStack = createNativeStackNavigator<AdminPatientsStackParamList>();
function AdminPatientsStack() {
  return (
    <PatientsStack.Navigator screenOptions={{ headerShown: false }}>
      <PatientsStack.Screen name="AdminPetsList" component={AdminPetsListScreen} />
      <PatientsStack.Screen name="AdminPetDetail" component={AdminPetDetailScreen} />
      <PatientsStack.Screen
        name="AdminPetConsultation"
        component={AdminConsultationDetailScreen}
      />
      <PatientsStack.Screen name="AdminPetForm" component={AdminPetFormScreen} />
      <PatientsStack.Screen
        name="AdminMedicalProfile"
        component={AdminMedicalProfileScreen}
      />
      <PatientsStack.Screen
        name="AdminAdoptionsList"
        component={AdminAdoptionsListScreen}
      />
      <PatientsStack.Screen
        name="AdminAdoptionDetail"
        component={AdminAdoptionDetailScreen}
      />
      <PatientsStack.Screen
        name="AdminAdoptionForm"
        component={AdminAdoptionFormScreen}
      />
    </PatientsStack.Navigator>
  );
}

const AgendaStack = createNativeStackNavigator<AdminAgendaStackParamList>();
function AdminAgendaStack() {
  return (
    <AgendaStack.Navigator screenOptions={{ headerShown: false }}>
      <AgendaStack.Screen
        name="AdminAppointmentsList"
        component={AdminAppointmentsListScreen}
      />
      <AgendaStack.Screen
        name="AdminAppointmentDetail"
        component={AdminAppointmentDetailScreen}
      />
      <AgendaStack.Screen
        name="AdminAppointmentWizard"
        component={AdminAppointmentWizardScreen}
      />
    </AgendaStack.Navigator>
  );
}

const MoreStack = createNativeStackNavigator<AdminMoreStackParamList>();
function AdminMoreStack() {
  return (
    <MoreStack.Navigator screenOptions={{ headerShown: false }}>
      <MoreStack.Screen name="AdminModules" component={AdminModulesScreen} />
      <MoreStack.Screen name="NotificationPrefs" component={NotificationPrefsScreen} />
      <MoreStack.Screen
        name="AdminConsultationsList"
        component={AdminConsultationsListScreen}
      />
      <MoreStack.Screen
        name="AdminConsultationDetail"
        component={AdminConsultationDetailScreen}
      />
      <MoreStack.Screen
        name="AdminConsultationForm"
        component={AdminConsultationFormScreen}
      />
      <MoreStack.Screen name="AdminPrescriptions" component={AdminPrescriptionsScreen} />
      <MoreStack.Screen name="AdminLabExams" component={AdminLabExamsScreen} />
      <MoreStack.Screen
        name="AdminVaccinationsList"
        component={AdminVaccinationsListScreen}
      />
      <MoreStack.Screen
        name="AdminVaccinationForm"
        component={AdminVaccinationFormScreen}
      />
      <MoreStack.Screen
        name="AdminDewormingsList"
        component={AdminDewormingsListScreen}
      />
      <MoreStack.Screen
        name="AdminVaccinationSchedules"
        component={AdminVaccinationSchedulesScreen}
      />
      <MoreStack.Screen name="AdminPaymentsList" component={AdminPaymentsListScreen} />
      <MoreStack.Screen name="AdminPaymentDetail" component={AdminPaymentDetailScreen} />
      <MoreStack.Screen
        name="AdminPaymentRegister"
        component={AdminPaymentRegisterScreen}
      />
      <MoreStack.Screen
        name="AdminMedicalReportsList"
        component={AdminMedicalReportsListScreen}
      />
      <MoreStack.Screen
        name="AdminMedicalReportDetail"
        component={AdminMedicalReportDetailScreen}
      />
      <MoreStack.Screen name="AdminServerSettings" component={ServerSettingsScreen} />
      <MoreStack.Screen name="PairingScan" component={PairingScanScreen} />
      <MoreStack.Screen name="AssistantChat" component={AssistantChatScreen} />
    </MoreStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
      }}
    >
      <Tab.Screen
        name="AdminHomeTab"
        component={AdminHomeStack}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PatientsTab"
        component={AdminPatientsStack}
        options={{
          title: 'Pacientes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AgendaTab"
        component={AdminAgendaStack}
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MoreTab"
        component={AdminMoreStack}
        options={{
          title: 'Más',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
