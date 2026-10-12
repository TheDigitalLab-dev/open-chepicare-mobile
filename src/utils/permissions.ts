/**
 * Permisos de staff que la app aplica antes de enviar un formulario. El backend
 * los vuelve a exigir; aquí solo se evita un envío que sabemos que rechazará.
 */
import type { AuthUser } from '@/types/models';

/**
 * Registrar vacunas exige `can_vaccinate`. Solo bloquea si el backend dice
 * `false`; si el dato no viene, decide el servidor.
 */
export function canRegisterVaccinations(user: AuthUser | null | undefined): boolean {
  return user?.type === 'User' && user.can_vaccinate !== false;
}
