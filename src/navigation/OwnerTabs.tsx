import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTheme } from '@/theme';
import {
  AppointmentDetailScreen,
  AppointmentsListScreen,
  AppointmentWizardScreen,
  ChangePasswordScreen,
  ConsultationDetailScreen,
  ConsultationsScreen,
  DewormingsScreen,
  EditProfileScreen,
  LabExamDetailScreen,
  LabExamsScreen,
  MedicalProfileScreen,
  MedicalReportDetailScreen,
  MedicalReportsScreen,
  OwnerCalendarScreen,
  OwnerDashboardScreen,
  OwnerMedicalHistoryScreen,
  OwnerPaymentRegisterScreen,
  OwnerPaymentsScreen,
  OwnerSponsorshipDetailScreen,
  OwnerSponsorshipsScreen,
  PetDetailScreen,
  PetFormScreen,
  PetMedicalHubScreen,
  PetsListScreen,
  ProfileScreen,
  TreatmentsScreen,
  TreatmentStartScreen,
  VaccinationsScreen,
} from '@/screens/owner';
import { NotificationPrefsScreen, NotificationsScreen } from '@/screens/common';
import { PairingScanScreen, ServerSettingsScreen } from '@/screens/auth';
import { useTreatmentAlarmsResync } from '@/hooks/useTreatmentAlarmsResync';
import type {
  OwnerAppointmentsStackParamList,
  OwnerHomeStackParamList,
  OwnerPetsStackParamList,
  OwnerProfileStackParamList,
  OwnerTabParamList,
} from './types';

const HomeStack = createNativeStackNavigator<OwnerHomeStackParamList>();
function OwnerHomeStack() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
      <HomeStack.Screen name="OwnerPayments" component={OwnerPaymentsScreen} />
      <HomeStack.Screen
        name="OwnerPaymentRegister"
        component={OwnerPaymentRegisterScreen}
      />
      <HomeStack.Screen
        name="OwnerMedicalHistory"
        component={OwnerMedicalHistoryScreen}
      />
      <HomeStack.Screen name="OwnerSponsorships" component={OwnerSponsorshipsScreen} />
      <HomeStack.Screen
        name="OwnerSponsorshipDetail"
        component={OwnerSponsorshipDetailScreen}
      />
    </HomeStack.Navigator>
  );
}

const PetsStack = createNativeStackNavigator<OwnerPetsStackParamList>();
function OwnerPetsStack() {
  return (
    <PetsStack.Navigator screenOptions={{ headerShown: false }}>
      <PetsStack.Screen name="PetsList" component={PetsListScreen} />
      <PetsStack.Screen name="PetDetail" component={PetDetailScreen} />
      <PetsStack.Screen name="PetForm" component={PetFormScreen} />
      <PetsStack.Screen name="PetMedicalHub" component={PetMedicalHubScreen} />
      <PetsStack.Screen name="MedicalProfile" component={MedicalProfileScreen} />
      <PetsStack.Screen name="Vaccinations" component={VaccinationsScreen} />
      <PetsStack.Screen name="Dewormings" component={DewormingsScreen} />
      <PetsStack.Screen name="Consultations" component={ConsultationsScreen} />
      <PetsStack.Screen name="ConsultationDetail" component={ConsultationDetailScreen} />
      <PetsStack.Screen name="MedicalReports" component={MedicalReportsScreen} />
      <PetsStack.Screen
        name="MedicalReportDetail"
        component={MedicalReportDetailScreen}
      />
      <PetsStack.Screen name="LabExams" component={LabExamsScreen} />
      <PetsStack.Screen name="LabExamDetail" component={LabExamDetailScreen} />
      <PetsStack.Screen name="Treatments" component={TreatmentsScreen} />
      <PetsStack.Screen name="TreatmentStart" component={TreatmentStartScreen} />
    </PetsStack.Navigator>
  );
}

const ApptStack = createNativeStackNavigator<OwnerAppointmentsStackParamList>();
function OwnerAppointmentsStack() {
  return (
    <ApptStack.Navigator screenOptions={{ headerShown: false }}>
      <ApptStack.Screen name="AppointmentsList" component={AppointmentsListScreen} />
      <ApptStack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
      <ApptStack.Screen name="AppointmentWizard" component={AppointmentWizardScreen} />
      <ApptStack.Screen name="OwnerCalendar" component={OwnerCalendarScreen} />
    </ApptStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<OwnerProfileStackParamList>();
function OwnerProfileStack() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <ProfileStack.Screen name="NotificationPrefs" component={NotificationPrefsScreen} />
      <ProfileStack.Screen name="ServerSettings" component={ServerSettingsScreen} />
      <ProfileStack.Screen name="PairingScan" component={PairingScanScreen} />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<OwnerTabParamList>();

export function OwnerTabs() {
  const { colors } = useTheme();
  // Alarmas de medicación al día al abrir la app y al volver a ella.
  useTreatmentAlarmsResync();
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
        name="HomeTab"
        component={OwnerHomeStack}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PetsTab"
        component={OwnerPetsStack}
        options={{
          title: 'Mascotas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="AppointmentsTab"
        component={OwnerAppointmentsStack}
        options={{
          title: 'Citas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={OwnerProfileStack}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
