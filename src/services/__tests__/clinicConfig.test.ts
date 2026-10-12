/**
 * Integración REAL de la configuración de la clínica (`clinic` de
 * `/auth/mobile/*`) contra el backend en `localhost:3000`.
 *
 * Cualquier sesión Bearer (propietario, veterinario, admin) recibe la zona y los
 * formatos de la clínica al iniciar sesión, al restaurarla (`/me`) y al rotar el
 * refresh. La app los aplica (mes inicial del asistente, "hoy", horas de las
 * citas, recordatorios) y los guarda para arrancar sin red.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as authService from '@/services/auth';
import {
  CLINIC_CONFIG_STORAGE_KEY,
  forgetClinicConfig,
  getClinicConfig,
  restoreClinicConfig,
} from '@/services/clinicConfig';
import { api } from '@/services/api';
import { getApiBaseUrl, resetServerUrl, setServerUrl } from '@/config/serverConfig';
import * as secureStore from '@/utils/secureStore';
import {
  clinicMonth,
  clinicToday,
  getClinicTimeZone,
  setClinicConfig,
} from '@/utils/clinicTime';

const OWNER = { login: 'owner1@example.com', password: 'password123' };
const VET = { login: 'vet@pawcare.com', password: 'password123' };

/** Lo que el backend tiene en Configuración General (vía admin, solo para comparar). */
interface GeneralConfig {
  timezone: string;
  date_format: string;
  time_format: string;
  default_appointment_duration: number;
  max_advance_days: number;
}

let general: GeneralConfig;

beforeAll(async () => {
  await authService.login('admin@pawcare.com', 'password123');
  general = await api.get<GeneralConfig>('/admin/settings/general-config');
  await authService.logout();
});

beforeEach(async () => {
  forgetClinicConfig();
  await AsyncStorage.clear();
});

afterEach(async () => {
  forgetClinicConfig();
  await secureStore.clearTokens();
});

describe('la sesión Bearer trae la configuración de la clínica', () => {
  it('el propietario la recibe al iniciar sesión, sin permiso de configuración', async () => {
    await authService.login(OWNER.login, OWNER.password);

    const clinic = getClinicConfig();
    expect(clinic).toMatchObject({
      time_zone: general.timezone,
      date_format: general.date_format,
      time_format: general.time_format,
      default_appointment_duration: general.default_appointment_duration,
      max_advance_days: general.max_advance_days,
    });
    expect(getClinicTimeZone()).toBe(general.timezone);
  });

  it('el veterinario (403 en Configuración General) también la recibe', async () => {
    await authService.login(VET.login, VET.password);

    expect(getClinicTimeZone()).toBe(general.timezone);
    await expect(api.get('/admin/settings/general-config')).rejects.toMatchObject({
      status: 403,
    });
  });

  it('al restaurar la sesión con /me se vuelve a aplicar', async () => {
    await authService.login(OWNER.login, OWNER.password);
    forgetClinicConfig();

    await authService.fetchCurrentUser();

    expect(getClinicTimeZone()).toBe(general.timezone);
  });

  it('no trae datos sensibles ni de contacto', async () => {
    await authService.login(OWNER.login, OWNER.password);

    expect(Object.keys(getClinicConfig()!).sort()).toEqual(
      [
        'allow_outside_hours',
        'date_format',
        'default_appointment_duration',
        'language',
        'max_advance_days',
        'name',
        'time_format',
        'time_zone',
      ].sort(),
    );
  });
});

describe('caché local-first', () => {
  it('arranca sin red ni sesión con la configuración guardada en el último inicio', async () => {
    await authService.login(OWNER.login, OWNER.password);
    await authService.logout();
    // Reinicio de la app: nada en memoria, sin tokens.
    forgetClinicConfig();
    expect(getClinicConfig()).toBeNull();

    const restored = await restoreClinicConfig();

    expect(restored?.time_zone).toBe(general.timezone);
    expect(getClinicTimeZone()).toBe(general.timezone);
    expect(await secureStore.hasSession()).toBe(false);
  });

  it('sin caché (primer arranque sin red) queda la zona del dispositivo', async () => {
    const restored = await restoreClinicConfig();

    expect(restored).toBeNull();
    expect(getClinicTimeZone()).toBeUndefined();
  });

  it('la caché de otro servidor no se aplica', async () => {
    await authService.login(OWNER.login, OWNER.password);
    await authService.logout();
    forgetClinicConfig();
    const original = getApiBaseUrl();
    try {
      await setServerUrl('https://otra-clinica.example.com');

      expect(await restoreClinicConfig()).toBeNull();
      expect(getClinicTimeZone()).toBeUndefined();
    } finally {
      await resetServerUrl();
      expect(getApiBaseUrl()).toBe(original);
    }
  });

  it('una caché corrupta se ignora sin lanzar', async () => {
    await AsyncStorage.setItem(CLINIC_CONFIG_STORAGE_KEY, '{no es json');

    await expect(restoreClinicConfig()).resolves.toBeNull();
  });

  it('cerrar sesión no la borra: no es un dato personal del usuario', async () => {
    await authService.login(OWNER.login, OWNER.password);

    await authService.logout();

    expect(getClinicTimeZone()).toBe(general.timezone);
  });
});

describe('asistente de citas y formularios: mes inicial y "hoy" de la clínica', () => {
  // 02:00 UTC del 1 de abril. En Caracas (UTC-4) aún es 31 de marzo; en Tokio
  // (UTC+9) ya es 1 de abril. El mes depende de la zona, no del teléfono.
  const BOUNDARY = new Date('2026-04-01T02:00:00Z');

  it('usa la zona de la clínica de la sesión aunque no se haya cargado ninguna cita', async () => {
    await authService.login(OWNER.login, OWNER.password);

    const expectedMonth = Number(
      new Intl.DateTimeFormat('en-US', {
        timeZone: general.timezone,
        month: 'numeric',
      }).format(BOUNDARY),
    );
    expect(clinicMonth(BOUNDARY)).toEqual({ month: expectedMonth, year: 2026 });
    const expectedDay = new Intl.DateTimeFormat('en-CA', {
      timeZone: general.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(BOUNDARY);
    expect(clinicToday(BOUNDARY)).toBe(expectedDay);
  });

  it('con la clínica en Caracas y el teléfono en otra zona abre en marzo, no en abril', async () => {
    await authService.login(OWNER.login, OWNER.password);
    const clinic = getClinicConfig()!;
    // Misma sesión, clínica en Caracas (el default del backend).
    setClinicConfig({ ...clinic, time_zone: 'America/Caracas' });

    expect(clinicMonth(BOUNDARY)).toEqual({ month: 3, year: 2026 });
    expect(clinicToday(BOUNDARY)).toBe('2026-03-31');
  });
});
