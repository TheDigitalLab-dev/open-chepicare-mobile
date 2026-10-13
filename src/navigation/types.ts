/**
 * Param lists tipadas de la navegación (F5).
 * Estructura: Root decide por rol → Auth | Public | OwnerTabs | AdminTabs.
 * Cada tab tiene un native-stack propio.
 */
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// --- Auth ------------------------------------------------------------------
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token?: string };
  ServerSettings: undefined;
  /** Escáner de QR; con params viene de un deep link `pawcare://pair?...`. */
  PairingScan:
    | { v?: string; server?: string; code?: string; account?: string }
    | undefined;
};

// El árbol raíz cuando no hay sesión es el público (incluye Auth → ResetPassword).
// Augmentar RootParamList tipa el deep linking y los `useNavigation()` sin genérico.
declare global {
  namespace ReactNavigation {
    // La augmentación por declaration merging exige `interface` (no `type`);
    // la interfaz vacía que extiende otra es intencional aquí.
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends PublicStackParamList {}
  }
}

// --- Public ----------------------------------------------------------------
export type PublicStackParamList = {
  PublicLanding: undefined;
  Auth: undefined;
  Services: undefined;
  Products: undefined;
  ProductDetail: { id: number };
  Checkout: { productId: number; quantity?: number };
  UploadProof: { orderId: number };
  AdoptionLanding: undefined;
  AdoptionList: undefined;
  AdoptionDetail: { id: number };
  SponsorshipsList: undefined;
  SponsorshipDetail: { id: number };
  Contact: undefined;
  Terms: undefined;
  Privacy: undefined;
};

// --- Owner -----------------------------------------------------------------
export type OwnerTabParamList = {
  HomeTab: undefined;
  PetsTab: undefined;
  AppointmentsTab: undefined;
  ProfileTab: undefined;
};

export type OwnerHomeStackParamList = {
  OwnerDashboard: undefined;
  OwnerPayments: undefined;
  OwnerPaymentRegister: { id: number };
  OwnerMedicalHistory: undefined;
  OwnerSponsorships: undefined;
  OwnerSponsorshipDetail: { id: number };
  Notifications: undefined;
};

export type OwnerPetsStackParamList = {
  PetsList: undefined;
  PetDetail: { id: number };
  PetForm: { id?: number };
  PetMedicalHub: { petId: number };
  MedicalProfile: { petId: number };
  Vaccinations: { petId: number };
  Dewormings: { petId: number };
  Consultations: { petId: number };
  ConsultationDetail: { petId: number; id: number };
  MedicalReports: { petId: number };
  MedicalReportDetail: { petId: number; id: number };
  LabExams: { petId: number; consultationId: number };
  Treatments: undefined;
  TreatmentStart: {
    petId: number;
    petName?: string;
    prescriptionItemId?: number;
    medicationName: string;
    dose?: string;
    frequency?: string;
    duration?: string;
  };
};

export type OwnerAppointmentsStackParamList = {
  AppointmentsList: undefined;
  AppointmentDetail: { id: number };
  AppointmentWizard: { id?: number };
};

export type OwnerProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  NotificationPrefs: undefined;
  ServerSettings: undefined;
  PairingScan: undefined;
};

// --- Admin -----------------------------------------------------------------
export type AdminTabParamList = {
  AdminHomeTab: undefined;
  PatientsTab: undefined;
  AgendaTab: undefined;
  MoreTab: undefined;
};

export type AdminHomeStackParamList = {
  AdminDashboard: undefined;
  Notifications: undefined;
};

export type AdminPatientsStackParamList = {
  AdminPetsList: undefined;
  AdminPetDetail: { id: number };
  AdminPetConsultation: { id: number };
  AdminPetForm: { id?: number };
  AdminMedicalProfile: { petId: number };
  AdminAdoptionsList: undefined;
  AdminAdoptionDetail: { id: number };
  AdminAdoptionForm: undefined;
};

export type AdminAgendaStackParamList = {
  AdminAppointmentsList: undefined;
  AdminAppointmentDetail: { id: number };
  AdminAppointmentWizard: { id?: number };
};

export type AdminMoreStackParamList = {
  AdminModules: undefined;
  NotificationPrefs: undefined;
  AdminConsultationsList: undefined;
  AdminConsultationDetail: { id: number };
  AdminConsultationForm: { id?: number };
  AdminPrescriptions: { consultationId: number };
  AdminLabExams: { consultationId: number };
  AdminVaccinationsList: undefined;
  AdminVaccinationForm: { id?: number };
  AdminDewormingsList: undefined;
  AdminVaccinationSchedules: undefined;
  AdminPaymentsList: undefined;
  AdminPaymentDetail: { id: number };
  AdminPaymentRegister: { id: number };
  AdminMedicalReportsList: undefined;
  AdminMedicalReportDetail: { id: number };
  AdminServerSettings: undefined;
  PairingScan: undefined;
  AssistantChat: { conversationId?: number } | undefined;
};

// --- Helpers de props ------------------------------------------------------
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;
export type PublicScreenProps<T extends keyof PublicStackParamList> =
  NativeStackScreenProps<PublicStackParamList, T>;
export type OwnerHomeScreenProps<T extends keyof OwnerHomeStackParamList> =
  NativeStackScreenProps<OwnerHomeStackParamList, T>;
export type OwnerPetsScreenProps<T extends keyof OwnerPetsStackParamList> =
  NativeStackScreenProps<OwnerPetsStackParamList, T>;
export type OwnerAppointmentsScreenProps<
  T extends keyof OwnerAppointmentsStackParamList,
> = NativeStackScreenProps<OwnerAppointmentsStackParamList, T>;
export type OwnerProfileScreenProps<T extends keyof OwnerProfileStackParamList> =
  NativeStackScreenProps<OwnerProfileStackParamList, T>;
export type AdminPatientsScreenProps<T extends keyof AdminPatientsStackParamList> =
  NativeStackScreenProps<AdminPatientsStackParamList, T>;
export type AdminAgendaScreenProps<T extends keyof AdminAgendaStackParamList> =
  NativeStackScreenProps<AdminAgendaStackParamList, T>;
export type AdminMoreScreenProps<T extends keyof AdminMoreStackParamList> =
  NativeStackScreenProps<AdminMoreStackParamList, T>;
