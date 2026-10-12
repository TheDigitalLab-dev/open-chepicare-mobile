/**
 * Mensajes de error de los formularios de acceso (login y recuperación).
 *
 * El backend devuelve 401 tanto para credenciales inválidas como para cuentas
 * eliminadas (no revela cuál), y "Account is inactive" solo cuando la
 * contraseña es correcta. Login, forgot y reset tienen límite por IP (429).
 */
import { ApiError } from '@/types/api';

const INVALID_CREDENTIALS = 'Correo/usuario o contraseña incorrectos.';
const INACTIVE_ACCOUNT = 'Tu cuenta está inactiva. Contacta a la clínica.';

export function loginErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return 'No se pudo iniciar sesión.';
  if (err.status === 401) {
    return err.message === INACTIVE_ACCOUNT ? INACTIVE_ACCOUNT : INVALID_CREDENTIALS;
  }
  return err.message;
}

/**
 * Error a mostrar al pedir el correo de recuperación, o `null` para mostrar el
 * aviso genérico ("si el correo existe…") que no revela si la cuenta existe.
 */
export function forgotPasswordErrorMessage(err: unknown): string | null {
  if (!(err instanceof ApiError)) return null;
  if (
    err.kind === 'rateLimited' ||
    err.kind === 'network' ||
    err.kind === 'timeout' ||
    err.kind === 'server'
  ) {
    return err.message;
  }
  return null;
}
