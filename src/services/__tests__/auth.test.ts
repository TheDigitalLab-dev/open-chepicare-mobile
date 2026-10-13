/**
 * Integración REAL del servicio de auth contra el backend `../open-chepicare-web`
 * (`/auth/mobile/*`). No hay respuestas mockeadas: cada test pega al servidor
 * en ejecución y usa las credenciales sembradas (`db/seeds`).
 *
 * Requiere el backend corriendo en `EXPO_PUBLIC_API_BASE_URL` (localhost:3000).
 */
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import { ApiError } from '@/types/api';

const SEED_OWNER = { login: 'owner1@example.com', password: 'password123' };

afterEach(async () => {
  await secureStore.clearTokens();
});

describe('authService.login', () => {
  it('autentica a un owner sembrado y persiste el par de tokens', async () => {
    const user = await authService.login(SEED_OWNER.login, SEED_OWNER.password);

    expect(user.type).toBe('Owner');
    expect(user.email).toBe(SEED_OWNER.login);
    expect(await secureStore.getAccessToken()).toEqual(expect.any(String));
    expect(await secureStore.getRefreshToken()).toEqual(expect.any(String));
  });

  it('lanza ApiError 401 con credenciales inválidas (sin filtrar tokens)', async () => {
    await expect(
      authService.login(SEED_OWNER.login, 'contraseña-incorrecta'),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      authService.login(SEED_OWNER.login, 'contraseña-incorrecta'),
    ).rejects.toBeInstanceOf(ApiError);
    expect(await secureStore.getAccessToken()).toBeNull();
  });
});

describe('authService.fetchCurrentUser', () => {
  it('restaura la sesión con el access token guardado', async () => {
    await authService.login(SEED_OWNER.login, SEED_OWNER.password);

    const me = await authService.fetchCurrentUser();

    expect(me.email).toBe(SEED_OWNER.login);
    expect(me.type).toBe('Owner');
  });
});

describe('authService.logout', () => {
  it('revoca el refresh y limpia el almacenamiento seguro', async () => {
    await authService.login(SEED_OWNER.login, SEED_OWNER.password);

    await authService.logout();

    expect(await secureStore.getAccessToken()).toBeNull();
    expect(await secureStore.getRefreshToken()).toBeNull();
  });
});

describe('permiso de vacunación (can_vaccinate)', () => {
  it('la sesión del staff trae can_vaccinate (el admin del seed lo tiene activo)', async () => {
    await authService.login('admin@pawcare.com', 'password123');

    const me = await authService.fetchCurrentUser();

    expect(me.type).toBe('User');
    expect(me.type === 'User' ? me.can_vaccinate : undefined).toBe(true);
  });
});
