/**
 * Integración REAL: las listas del personal no pueden quedarse con la primera
 * página del backend (25 por defecto). Antes de la revisión, Pagos, Consultas,
 * Vacunas… mostraban solo 25 registros, el filtro «Vencidos» filtraba esos 25 en
 * el cliente, la agenda pedía las 100 citas MÁS ANTIGUAS (y nunca veía las de
 * hoy) y el detalle de un pago fuera de la primera página decía «no encontrado».
 */
import * as authService from '@/services/auth';
import * as adminService from '@/services/admin';
import { fetchPage, PAGE_SIZE } from '@/services/pagination';
import * as secureStore from '@/utils/secureStore';
import type { PaginationMeta } from '@/types/api';
import type { Payment } from '@/types/models';

const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

async function backendGet<T>(path: string): Promise<T> {
  const token = await secureStore.getAccessToken();
  const res = await fetch(`${BASE()}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  return (await res.json()) as T;
}

async function backendTotal(path: string): Promise<number> {
  return (await backendGet<{ pagination: PaginationMeta }>(path)).pagination.total;
}

/** Recorre todas las páginas con la función de servicio (como el scroll infinito). */
async function walk<T>(
  load: (page: number) => Promise<{ items: T[]; totalPages: number }>,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const res = await load(page);
    items.push(...res.items);
    if (page >= res.totalPages) return items;
  }
}

beforeAll(async () => {
  await authService.login('admin@chepicare.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('fetchPage', () => {
  it('devuelve una página con sus metadatos', async () => {
    const total = await backendTotal('/admin/payments-list');
    const page = await fetchPage<'payments', Payment>(
      '/admin/payments-list',
      'payments',
      {
        page: 1,
      },
    );
    expect(page.page).toBe(1);
    expect(page.perPage).toBe(PAGE_SIZE);
    expect(page.total).toBe(total);
    expect(page.items.length).toBe(Math.min(total, PAGE_SIZE));
    expect(page.totalPages).toBe(Math.ceil(total / PAGE_SIZE));
  });
});

describe('listAdminAppointmentsUntil (aviso de la agenda de mañana)', () => {
  it('trae todas las próximas citas hasta el límite, y ninguna posterior', async () => {
    const all = await walk((page) =>
      adminService.listAdminAppointments({ scope: 'upcoming' }, page),
    );
    expect(all.length).toBeGreaterThan(1);
    // Límite: justo en la segunda cita (incluida).
    const limit = all[1]!.scheduled_at;
    const until = await adminService.listAdminAppointmentsUntil(limit);
    const expected = all
      .filter((a) => Date.parse(a.scheduled_at) <= Date.parse(limit))
      .map((a) => a.id);
    expect(until.map((a) => a.id).sort()).toEqual(expected.sort());
  });
});

describe('listas paginadas del personal', () => {
  it('Pagos: se llega a TODOS los pagos de la clínica, no solo a 25', async () => {
    const total = await backendTotal('/admin/payments-list');
    // El seed deja más de una página de pagos.
    expect(total).toBeGreaterThan(PAGE_SIZE);

    const all = await walk((page) => adminService.listAdminPayments({}, page));
    expect(all).toHaveLength(total);
    expect(new Set(all.map((p) => p.id)).size).toBe(total);
  });

  it('Pagos: el filtro por estado lo aplica el servidor (todas las páginas)', async () => {
    const total = await backendTotal('/admin/payments-list?status=completed');
    const res = await adminService.listAdminPayments({ status: 'completed' }, 1);
    expect(res.total).toBe(total);
    expect(res.items.every((p) => p.status === 'completed')).toBe(true);
  });

  it('Pagos: «Vencidos» incluye los pendientes con fecha pasada', async () => {
    const total = await backendTotal('/admin/payments-list?overdue=true');
    const res = await adminService.listAdminPayments({ overdue: true }, 1);
    expect(res.total).toBe(total);
    expect(res.items.every((p) => p.status === 'overdue' || p.status === 'pending')).toBe(
      true,
    );
  });

  it('Detalle de pago: encuentra un pago que no está en la primera página', async () => {
    const lastPage = await adminService.listAdminPayments({}, 2);
    const target = lastPage.items[0]!;
    const payment = await adminService.getAdminPayment(target.id);
    expect(payment.id).toBe(target.id);
  });

  it('registrar un pago ya cobrado devuelve el motivo en español', async () => {
    const { items } = await adminService.listAdminPayments({ status: 'completed' }, 1);
    const paid = items[0]!;
    await expect(
      adminService.registerAdminPayment(paid.id, { payment_method: 'cash' }),
    ).rejects.toMatchObject({
      kind: 'validation',
      message: 'Este pago ya no se puede registrar (ya fue cobrado o anulado).',
    });
  });

  it('Consultas y vacunas: más de una página, sin duplicados', async () => {
    const totalC = await backendTotal('/admin/consultations-list');
    const totalV = await backendTotal('/admin/vaccinations-list');
    expect(totalC).toBeGreaterThan(PAGE_SIZE);
    expect(totalV).toBeGreaterThan(PAGE_SIZE);

    const consultations = await walk((page) => adminService.listAdminConsultations(page));
    const vaccinations = await walk((page) => adminService.listAdminVaccinations(page));
    expect(new Set(consultations.map((c) => c.id)).size).toBe(totalC);
    expect(new Set(vaccinations.map((v) => v.id)).size).toBe(totalV);
  });

  it('Desparasitaciones, adopciones y esquemas devuelven páginas con total', async () => {
    const [d, a, s] = await Promise.all([
      adminService.listAdminDewormings(1),
      adminService.listAdminAdoptions(1),
      adminService.listVaccinationSchedules(1),
    ]);
    expect(d.total).toBe(await backendTotal('/admin/dewormings-list'));
    expect(a.total).toBe(await backendTotal('/admin/adoptions-list'));
    expect(s.total).toBe(await backendTotal('/admin/vaccination-schedules-list'));
  });

  it('Agenda «Próximas»: solo citas de hoy en adelante, en orden ascendente', async () => {
    const total = await backendTotal('/admin/appointments-list?scope=upcoming');
    const res = await adminService.listAdminAppointments({ scope: 'upcoming' }, 1);
    expect(res.total).toBe(total);
    const times = res.items.map((a) => Date.parse(a.scheduled_at));
    expect(times).toEqual([...times].sort((x, y) => x - y));
  });

  it('Agenda «Pasadas»: la más reciente primero', async () => {
    const total = await backendTotal('/admin/appointments-list?scope=past');
    expect(total).toBeGreaterThan(0);
    const res = await adminService.listAdminAppointments({ scope: 'past' }, 1);
    expect(res.total).toBe(total);
    const times = res.items.map((a) => Date.parse(a.scheduled_at));
    expect(times).toEqual([...times].sort((x, y) => y - x));
    expect(times.every((t) => t < Date.now())).toBe(true);
  });

  it('Agenda: el filtro por estado lo aplica el servidor', async () => {
    const total = await backendTotal(
      '/admin/appointments-list?scope=past&status=completed',
    );
    const res = await adminService.listAdminAppointments(
      { scope: 'past', status: 'completed' },
      1,
    );
    expect(res.total).toBe(total);
    expect(res.items.every((a) => a.status === 'completed')).toBe(true);
  });
});
