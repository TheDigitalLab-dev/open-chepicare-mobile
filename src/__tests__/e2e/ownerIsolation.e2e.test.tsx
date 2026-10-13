/**
 * E2E (backend real): aislamiento entre propietarios. Con la sesión de owner1,
 * la app nunca obtiene datos de owner2: sus listas no los incluyen y pedirlos
 * por id responde 404 (nunca 403, que revelaría que existen). Un enlace (push)
 * a una cita ajena muestra el error en pantalla sin datos.
 */
import { act, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';

import { findText, loginThroughUi, renderApp } from '@/testing/renderApp';
import * as appointmentsService from '@/services/appointments';
import * as authService from '@/services/auth';
import * as medicalService from '@/services/medical';
import * as paymentsService from '@/services/payments';
import * as petsService from '@/services/pets';
import * as sponsorshipsService from '@/services/sponsorships';
import * as secureStore from '@/utils/secureStore';
import type { PaginationMeta } from '@/types/api';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
const tap = (Notifications as unknown as { __tapNotification: (d: object) => void })
  .__tapNotification;

/** Ids reales de owner2, leídos con SU propio token (sin tocar la sesión). */
async function owner2Ids() {
  const login = await fetch(`${BASE()}/auth/mobile/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ login: 'owner2@example.com', password: 'password123' }),
  });
  const token = ((await login.json()) as { auth: { access_token: string } }).auth
    .access_token;
  const get = async <T,>(path: string): Promise<T> => {
    const res = await fetch(`${BASE()}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    return (await res.json()) as T;
  };
  const { pets } = await get<{ pets: { id: number }[] }>('/pets');
  const { appointments } = await get<{
    appointments: { id: number }[];
    pagination: PaginationMeta;
  }>('/owner-appointments-list?per_page=100');
  const { payments } = await get<{ payments: { id: number }[] }>(
    '/owner-payments-list?per_page=100',
  );
  return {
    pets: pets.map((p) => p.id),
    appointments: appointments.map((a) => a.id),
    payments: payments.map((p) => p.id),
  };
}

afterEach(async () => {
  await secureStore.clearTokens();
});

describe('aislamiento entre propietarios', () => {
  it('owner1 no ve ni puede abrir datos de owner2 (404)', async () => {
    const other = await owner2Ids();
    expect(other.pets.length).toBeGreaterThan(0);
    expect(other.appointments.length).toBeGreaterThan(0);
    expect(other.payments.length).toBeGreaterThan(0);

    await authService.login('owner1@example.com', 'password123');

    // Listas: ningún id de owner2.
    const [pets, appointments, payments, sponsorships] = await Promise.all([
      petsService.listPets(),
      appointmentsService.listAppointments(),
      paymentsService.listPayments(),
      sponsorshipsService.listSponsorships(),
    ]);
    expect(pets.some((p) => other.pets.includes(p.id))).toBe(false);
    expect(appointments.some((a) => other.appointments.includes(a.id))).toBe(false);
    expect(payments.some((p) => other.payments.includes(p.id))).toBe(false);
    expect(sponsorships.every((s) => s.sponsor_id === pets[0]!.proprietary_id)).toBe(
      true,
    );

    // Por id: 404 en todo.
    const notFound = { kind: 'notFound', status: 404 };
    const petId = other.pets[0]!;
    await expect(petsService.getPet(petId)).rejects.toMatchObject(notFound);
    await expect(medicalService.getMedicalProfile(petId)).rejects.toMatchObject(notFound);
    await expect(medicalService.listConsultations(petId)).rejects.toMatchObject(notFound);
    await expect(medicalService.listVaccinations(petId)).rejects.toMatchObject(notFound);
    await expect(
      appointmentsService.getAppointment(other.appointments[0]!),
    ).rejects.toMatchObject(notFound);
    await expect(
      appointmentsService.cancelAppointment(other.appointments[0]!, 'intento ajeno'),
    ).rejects.toMatchObject(notFound);
    await expect(paymentsService.getPayment(other.payments[0]!)).rejects.toMatchObject(
      notFound,
    );
    await expect(
      paymentsService.registerPayment(other.payments[0]!, { payment_method: 'cash' }),
    ).rejects.toMatchObject(notFound);
  }, 60000);

  it('el personal no usa los endpoints del propietario (403 con mensaje)', async () => {
    await authService.login('vet@pawcare.com', 'password123');
    await expect(appointmentsService.listAppointments()).rejects.toMatchObject({
      kind: 'forbidden',
      message: 'No tienes permiso para realizar esta acción.',
    });
  });

  it('una push con una cita ajena abre la pantalla de error, sin datos', async () => {
    const other = await owner2Ids();
    renderApp();
    await loginThroughUi('owner1@example.com');
    await act(async () =>
      tap({
        category: 'citas',
        entity: 'appointment',
        entity_id: other.appointments[0],
        event_key: `appointment-${other.appointments[0]}-confirmed`,
      }),
    );
    await findText('Detalle de cita');
    await findText('No se encontró el recurso solicitado.');
    expect(screen.queryByText('Rocky')).toBeNull();
  }, 60000);
});
