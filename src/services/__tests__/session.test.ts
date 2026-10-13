/**
 * Integración REAL del ciclo de sesión contra `../open-chepicare-web` (rama
 * `fix/functional-review-2026-10`):
 *  - el refresh token se ROTA en cada uso: varias peticiones con 401 a la vez
 *    deben compartir una sola renovación (si no, la segunda usa un refresh ya
 *    revocado y la app cierra sesión sola);
 *  - cambiar la contraseña revoca las demás sesiones (refresh revocado y JWT
 *    con la huella `pwd` vieja) y entrega un par nuevo a la sesión actual;
 *  - una sesión revocada se cierra limpia: tokens borrados y UN solo aviso.
 *
 * Cuentas desechables (registro real) para no tocar las sembradas.
 */
import * as authService from '@/services/auth';
import * as profileService from '@/services/profile';
import * as secureStore from '@/utils/secureStore';
import { ApiError } from '@/types/api';
import { resetServerUrl, setServerUrl } from '@/config/serverConfig';

const PASSWORD = 'password123';
const NEW_PASSWORD = 'password456';

async function registerDisposableOwner(tag: string): Promise<string> {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(-9);
  const email = `qa-${tag}-${suffix}@example.com`;
  await authService.register({
    first_name: 'QA',
    last_name: 'Sesion',
    identity_document: `V${suffix}`,
    email,
    username: `qa${tag}${suffix}`,
    password: PASSWORD,
    password_confirmation: PASSWORD,
    address: 'Calle QA 1',
    sex: 'other',
    phone: '04140000000',
    phone_type: 'regular',
  });
  return email;
}

async function snapshotTokens(): Promise<{ access: string; refresh: string }> {
  const access = await secureStore.getAccessToken();
  const refresh = await secureStore.getRefreshToken();
  if (!access || !refresh) throw new Error('No hay sesión guardada');
  return { access, refresh };
}

const expired = jest.fn();

beforeEach(() => {
  expired.mockClear();
  authService.setOnSessionExpired(expired);
});

afterEach(async () => {
  authService.setOnSessionExpired(() => {});
  await secureStore.clearTokens();
});

describe('renovación de sesión ante 401', () => {
  it('varias peticiones con el access vencido comparten UNA renovación', async () => {
    await authService.login('owner1@example.com', PASSWORD);
    const { refresh: original } = await snapshotTokens();
    // Access inválido (equivale a uno vencido): el backend responde 401.
    await secureStore.setTokens({ access: 'token-vencido', refresh: original });

    const results = await Promise.all(
      Array.from({ length: 5 }, () => authService.fetchCurrentUser()),
    );

    expect(results.map((u) => u.email)).toEqual(Array(5).fill('owner1@example.com'));
    expect(expired).not.toHaveBeenCalled();
    const { refresh: rotated } = await snapshotTokens();
    expect(rotated).not.toBe(original);
  }, 30000);

  it('una sesión revocada se cierra limpia: tokens borrados y un solo aviso', async () => {
    const email = await registerDisposableOwner('revoke');
    const sessionA = await snapshotTokens();

    // Sesión B del mismo usuario cambia la contraseña → A queda revocada.
    await authService.login(email, PASSWORD);
    await profileService.changePassword({
      current_password: PASSWORD,
      password: NEW_PASSWORD,
      password_confirmation: NEW_PASSWORD,
    });

    await secureStore.setTokens(sessionA);
    const outcomes = await Promise.allSettled(
      Array.from({ length: 3 }, () => authService.fetchCurrentUser()),
    );

    for (const outcome of outcomes) {
      expect(outcome.status).toBe('rejected');
      const reason = (outcome as PromiseRejectedResult).reason as ApiError;
      expect(reason).toBeInstanceOf(ApiError);
      expect(reason.kind).toBe('unauthorized');
    }
    expect(expired).toHaveBeenCalledTimes(1);
    expect(await secureStore.getAccessToken()).toBeNull();
    expect(await secureStore.getRefreshToken()).toBeNull();
  }, 30000);
});

describe('profileService.changePassword', () => {
  it('guarda el par nuevo: la sesión actual sigue viva tras cambiar la contraseña', async () => {
    const email = await registerDisposableOwner('pwd');
    const before = await snapshotTokens();

    await profileService.changePassword({
      current_password: PASSWORD,
      password: NEW_PASSWORD,
      password_confirmation: NEW_PASSWORD,
    });

    const after = await snapshotTokens();
    expect(after.access).not.toBe(before.access);
    expect(after.refresh).not.toBe(before.refresh);

    // Con el par nuevo la sesión responde sin renovar ni expirar.
    const me = await authService.fetchCurrentUser();
    expect(me.email).toBe(email);
    expect(expired).not.toHaveBeenCalled();

    // El refresh de antes quedó revocado en el servidor.
    await secureStore.setTokens({ access: 'token-vencido', refresh: before.refresh });
    await expect(authService.fetchCurrentUser()).rejects.toMatchObject({
      kind: 'unauthorized',
    });
    expect(expired).toHaveBeenCalledTimes(1);
  }, 30000);

  it('contraseña actual incorrecta: 422 con mensaje y la sesión no cambia', async () => {
    await registerDisposableOwner('pwdbad');
    const before = await snapshotTokens();

    await expect(
      profileService.changePassword({
        current_password: 'incorrecta-123',
        password: NEW_PASSWORD,
        password_confirmation: NEW_PASSWORD,
      }),
    ).rejects.toBeInstanceOf(ApiError);

    expect(await snapshotTokens()).toEqual(before);
  }, 30000);
});

describe('authService.logout', () => {
  const BASE = () => process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

  async function refreshStatus(refresh: string): Promise<number> {
    const res = await fetch(`${BASE()}/auth/mobile/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    return res.status;
  }

  it('con el access vencido renueva y revoca la sesión en el servidor', async () => {
    await registerDisposableOwner('logout');
    const { refresh: original } = await snapshotTokens();
    await secureStore.setTokens({ access: 'token-vencido', refresh: original });
    const stored = jest.spyOn(secureStore, 'setTokens');

    await expect(authService.logout()).resolves.toBeUndefined();

    expect(await secureStore.getAccessToken()).toBeNull();
    expect(await secureStore.getRefreshToken()).toBeNull();
    // El refresh original se rotó y el nuevo quedó revocado por el logout.
    const rotated = stored.mock.calls.at(-1)?.[0].refresh;
    stored.mockRestore();
    expect(rotated).toEqual(expect.any(String));
    expect(rotated).not.toBe(original);
    expect(await refreshStatus(original)).toBe(401);
    expect(await refreshStatus(rotated!)).toBe(401);
  }, 30000);

  it('sin conexión cierra la sesión local igualmente (no lanza)', async () => {
    await registerDisposableOwner('logoutnet');
    await setServerUrl('http://127.0.0.1:9');
    try {
      await expect(authService.logout()).resolves.toBeUndefined();
    } finally {
      await resetServerUrl();
    }
    expect(await secureStore.getAccessToken()).toBeNull();
    expect(await secureStore.getRefreshToken()).toBeNull();
  }, 30000);
});
