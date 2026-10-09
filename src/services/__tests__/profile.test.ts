/**
 * Integración REAL del perfil contra `../pawcare`.
 * Idempotente: re-guarda los mismos datos y revierte, para no corromper la
 * cuenta sembrada compartida (otros tests dependen de ella).
 */
import * as authService from '@/services/auth';
import * as profileService from '@/services/profile';
import * as secureStore from '@/utils/secureStore';

beforeAll(async () => {
  await authService.login('owner1@example.com', 'password123');
});

afterAll(async () => {
  await secureStore.clearTokens();
});

describe('profileService.updateProfile', () => {
  it('actualiza la dirección y la revierte (real, no destructivo)', async () => {
    const before = await authService.fetchCurrentUser();
    const original = 'address' in before ? (before.address ?? '') : '';

    await profileService.updateProfile({ address: 'Calle de prueba 123' });
    const updated = await authService.fetchCurrentUser();
    expect('address' in updated ? updated.address : '').toBe('Calle de prueba 123');

    // Revertir al valor original.
    await profileService.updateProfile({ address: original });
  });
});

describe('profileService.deleteAccount', () => {
  it('elimina una cuenta recién registrada (real, autocontenido)', async () => {
    // Cuenta desechable única para no tocar las cuentas sembradas.
    const suffix = String(Date.now()).slice(-8);
    const email = `qa-delete-${suffix}@example.com`;
    const password = 'password123';

    await authService.register({
      first_name: 'QA',
      last_name: 'Delete',
      identity_document: `V${suffix}`,
      email,
      username: `qadelete${suffix}`,
      password,
      password_confirmation: password,
      address: 'Calle QA 1',
      sex: 'other',
      phone: '04140000000',
      phone_type: 'regular',
    });

    // La sesión activa es ya la del usuario recién creado.
    const before = await authService.fetchCurrentUser();
    expect(before).toMatchObject({ email });
    expect((before as unknown as Record<string, unknown>).deleted_at).toBeFalsy();

    // El backend hace *soft delete*: responde 204 y marca `deleted_at`.
    await expect(profileService.deleteAccount()).resolves.toBeUndefined();

    // Una cuenta eliminada ya no puede iniciar sesión (401 genérico, como
    // credenciales inválidas: no revela que existió).
    await expect(authService.login(email, password)).rejects.toMatchObject({
      status: 401,
      kind: 'unauthorized',
    });
  }, 30000);
});
