/**
 * Mensajes de los formularios de acceso (lógica pura): login y recuperación de
 * contraseña con las respuestas nuevas del backend (cuenta inactiva solo tras
 * una contraseña válida, cuentas eliminadas = credenciales inválidas, 429).
 */
import { buildApiError } from '@/services/api';
import { ApiError } from '@/types/api';
import { forgotPasswordErrorMessage, loginErrorMessage } from '@/utils/authErrors';

describe('loginErrorMessage', () => {
  it('credenciales inválidas (o cuenta eliminada): mensaje genérico', () => {
    expect(loginErrorMessage(buildApiError(401, { error: 'Invalid credentials' }))).toBe(
      'Correo/usuario o contraseña incorrectos.',
    );
  });

  it('cuenta inactiva: lo dice (el backend solo lo revela con la contraseña correcta)', () => {
    expect(loginErrorMessage(buildApiError(401, { error: 'Account is inactive' }))).toBe(
      'Tu cuenta está inactiva. Contacta a la clínica.',
    );
  });

  it('429: pide esperar en lugar de decir "contraseña incorrecta"', () => {
    expect(loginErrorMessage(buildApiError(429, { error: 'Too many requests' }))).toBe(
      'Demasiados intentos. Espera un minuto antes de volver a intentarlo.',
    );
  });

  it('sin red: usa el mensaje del ApiError', () => {
    const err = new ApiError({ message: 'Sin conexión.', status: 0, kind: 'network' });
    expect(loginErrorMessage(err)).toBe('Sin conexión.');
  });

  it('una excepción desconocida usa el genérico de login', () => {
    expect(loginErrorMessage(new Error('x'))).toBe('No se pudo iniciar sesión.');
  });
});

describe('forgotPasswordErrorMessage', () => {
  it('429: muestra el límite (no "te enviamos instrucciones")', () => {
    expect(
      forgotPasswordErrorMessage(buildApiError(429, { error: 'Too many requests' })),
    ).toBe('Demasiados intentos. Espera un minuto antes de volver a intentarlo.');
  });

  it('sin red: informa el error', () => {
    const err = new ApiError({ message: 'Sin conexión.', status: 0, kind: 'network' });
    expect(forgotPasswordErrorMessage(err)).toBe('Sin conexión.');
  });

  it('cualquier otra respuesta no revela si el correo existe (null = genérico)', () => {
    expect(forgotPasswordErrorMessage(buildApiError(404, {}))).toBeNull();
  });
});
