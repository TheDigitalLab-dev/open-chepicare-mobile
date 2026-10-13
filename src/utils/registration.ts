/**
 * Reglas del formulario de registro de propietario (en el teléfono, antes de
 * enviar) y mensaje general de error del alta.
 */
import { ApiError } from '@/types/api';
import type { OwnerRegistration } from '@/types/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

/** Campos que pinta el formulario (los demás errores van al mensaje general). */
const FORM_FIELDS: readonly string[] = [
  'first_name',
  'last_name',
  'identity_document',
  'email',
  'username',
  'password',
  'password_confirmation',
  'address',
  'sex',
  'phone',
  'phone_type',
];

export interface RegistrationValidation {
  canSubmit: boolean;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

/** Errores solo en campos ya escritos; `canSubmit` exige todo lo obligatorio. */
export function validateRegistration(form: OwnerRegistration): RegistrationValidation {
  const emailValid = EMAIL_RE.test(form.email.trim());
  const passwordValid = form.password.length >= MIN_PASSWORD;
  const match = form.password === form.password_confirmation;
  const required = [
    form.first_name,
    form.last_name,
    form.identity_document,
    form.username,
  ];
  const result: RegistrationValidation = {
    canSubmit:
      required.every((v) => v.trim() !== '') && emailValid && passwordValid && match,
  };
  if (form.email.length > 0 && !emailValid) result.email = 'Correo inválido.';
  if (form.password.length > 0 && !passwordValid) {
    result.password = `Mínimo ${MIN_PASSWORD} caracteres.`;
  }
  if (form.password_confirmation.length > 0 && !match) {
    result.password_confirmation = 'Las contraseñas no coinciden.';
  }
  return result;
}

/**
 * Mensaje general del alta fallida, o `undefined` si todos los errores son de
 * campos del formulario (se muestran junto a cada campo).
 */
export function registerErrorMessage(err: unknown): string | undefined {
  if (!(err instanceof ApiError)) return 'No se pudo crear la cuenta.';
  if (!err.fieldErrors) return err.message;
  const outside = Object.entries(err.fieldErrors)
    .filter(([key]) => !FORM_FIELDS.includes(key))
    .flatMap(([, messages]) => messages);
  return outside.length > 0 ? outside.join('. ') : undefined;
}
