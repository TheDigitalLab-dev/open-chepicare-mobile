/**
 * `useAdminSchedule` (asistente de citas del personal) con datos REALES:
 * navegación por meses (antes solo el mes en curso: el día 30 quedaban 1–2
 * días y no se podía agendar para el mes siguiente) y descarte de respuestas
 * viejas al cambiar de día rápido (antes se mostraban los veterinarios del día
 * anterior con el nuevo día elegido).
 */
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useAdminSchedule } from '@/hooks/useAdminSchedule';
import * as authService from '@/services/auth';
import * as adminService from '@/services/admin';
import { clinicMonth } from '@/utils/clinicTime';
import { shiftMonth } from '@/utils/schedule';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('admin@chepicare.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

it('empieza en el mes de la clínica y navega al siguiente (y no antes del actual)', async () => {
  const { result } = renderHook(() => useAdminSchedule());
  await waitFor(() => expect(result.current.days.loading).toBe(false));
  const current = clinicMonth();
  expect(result.current.month).toEqual(current);
  expect(result.current.canGoPrevMonth).toBe(false);

  await act(() => result.current.nextMonth());
  const next = shiftMonth(current, 1);
  expect(result.current.month).toEqual(next);
  expect(result.current.canGoPrevMonth).toBe(true);
  const expected = await adminService.getAdminAvailableDays(next.month, next.year);
  expect(result.current.days.data).toEqual(expected);
  const prefix = `${next.year}-${String(next.month).padStart(2, '0')}-`;
  expect(result.current.days.data.every((d) => d.startsWith(prefix))).toBe(true);
});

it('al cambiar de día rápido se queda con los veterinarios del ÚLTIMO día', async () => {
  const current = clinicMonth();
  const next = shiftMonth(current, 1);
  const days = [
    ...(await adminService.getAdminAvailableDays(current.month, current.year)),
    ...(await adminService.getAdminAvailableDays(next.month, next.year)),
  ];
  expect(days.length).toBeGreaterThan(1);
  const [dayA, dayB] = [days[0]!, days[days.length - 1]!];

  const { result } = renderHook(() => useAdminSchedule());
  await waitFor(() => expect(result.current.days.loading).toBe(false));

  await act(async () => {
    const a = result.current.loadVets(dayA);
    const b = result.current.loadVets(dayB);
    await Promise.all([a, b]);
  });
  const expected = await adminService.getAdminAvailableVets(dayB);
  expect(result.current.vets.data.map((v) => v.id).sort()).toEqual(
    [...new Set(expected.map((v) => v.id))].sort(),
  );
  expect(result.current.vets.day).toBe(dayB);
  expect(result.current.vets.loading).toBe(false);
});

it('precarga el día que viene del calendario: su mes y sus veterinarios', async () => {
  const next = shiftMonth(clinicMonth(), 1);
  const days = await adminService.getAdminAvailableDays(next.month, next.year);
  const day = days[0]!;
  const onInitialDay = jest.fn();
  const { result } = renderHook(() =>
    useAdminSchedule({ initialDay: day, onInitialDay }),
  );
  await waitFor(() => {
    expect(result.current.days.loading).toBe(false);
    expect(result.current.vets.day).toBe(day);
    expect(result.current.vets.loading).toBe(false);
  });
  expect(result.current.month).toEqual(next);
  expect(onInitialDay).toHaveBeenCalledWith(day);
  expect(result.current.initialDayUnavailable).toBe(false);
  expect(result.current.vets.data.length).toBeGreaterThan(0);
});

it('un día del calendario sin agenda no se preselecciona', async () => {
  const next = shiftMonth(clinicMonth(), 1);
  const days = await adminService.getAdminAvailableDays(next.month, next.year);
  const prefix = `${next.year}-${String(next.month).padStart(2, '0')}-`;
  const closed = Array.from(
    { length: 28 },
    (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`,
  ).find((d) => !days.includes(d))!;
  const onInitialDay = jest.fn();
  const { result } = renderHook(() =>
    useAdminSchedule({ initialDay: closed, onInitialDay }),
  );
  await waitFor(() => expect(result.current.initialDayUnavailable).toBe(true));
  expect(result.current.month).toEqual(next);
  expect(onInitialDay).not.toHaveBeenCalled();
  expect(result.current.vets.day).toBeNull();
});
