/**
 * Normalización de errores del backend (lógica pura, sin red): cómo se
 * convierte un status + body de Rails en el `ApiError` que ve la UI. Los
 * cuerpos de ejemplo son los que devuelve la rama `fix/functional-review-2026-10`
 * de `../pawcare-web` (copiados de sus controllers, no inventados).
 */
import { buildApiError } from '@/services/api';

describe('buildApiError', () => {
  it('429 (Rack::Attack) es "rateLimited" con un mensaje en español', () => {
    const err = buildApiError(429, { error: 'Too many requests' });
    expect(err.kind).toBe('rateLimited');
    expect(err.status).toBe(429);
    expect(err.message).toBe(
      'Demasiados intentos. Espera un minuto antes de volver a intentarlo.',
    );
  });

  it('usa los mensajes de un arreglo `errors` (full_messages) en lugar del genérico', () => {
    // DELETE /admin/appointments/:id bloqueado (422).
    const err = buildApiError(422, {
      errors: ['No se puede eliminar una cita que tiene una consulta registrada'],
    });
    expect(err.kind).toBe('validation');
    expect(err.message).toBe(
      'No se puede eliminar una cita que tiene una consulta registrada',
    );
  });

  it('owner-appointments responde { error: null, errors: [...] } al chocar horarios', () => {
    const err = buildApiError(422, {
      error: null,
      errors: ['Scheduled at se cruza con otra cita del veterinario en ese horario'],
    });
    expect(err.message).toBe(
      'La fecha y hora se cruza con otra cita del veterinario en ese horario',
    );
  });

  it('traduce el atributo de una transición de estado inválida', () => {
    const err = buildApiError(422, {
      errors: ['Status no puede pasar de Completada a Cancelada'],
    });
    expect(err.message).toBe('El estado no puede pasar de Completada a Cancelada');
  });

  it('une varios mensajes del arreglo', () => {
    const err = buildApiError(422, {
      errors: [
        'Scheduled at se cruza con otra cita del veterinario en ese horario',
        'Scheduled at se cruza con otra cita de la mascota en ese horario',
      ],
    });
    expect(err.message).toBe(
      'La fecha y hora se cruza con otra cita del veterinario en ese horario. ' +
        'La fecha y hora se cruza con otra cita de la mascota en ese horario',
    );
  });

  it('traduce la cuenta inactiva del login (401)', () => {
    const err = buildApiError(401, { error: 'Account is inactive' });
    expect(err.kind).toBe('unauthorized');
    expect(err.message).toBe('Tu cuenta está inactiva. Contacta a la clínica.');
  });

  it('las credenciales inválidas del login no se confunden con sesión expirada', () => {
    const err = buildApiError(401, { error: 'Invalid credentials' });
    expect(err.message).toBe('Credenciales inválidas.');
  });

  it('un 401 sin mensaje conocido sigue siendo "sesión expirada"', () => {
    const err = buildApiError(401, { error: 'Unauthorized' });
    expect(err.message).toBe('Tu sesión expiró. Inicia sesión nuevamente.');
  });

  it('traduce el permiso de vacunación (can_vaccinate)', () => {
    const err = buildApiError(422, {
      errors: ['Veterinarian is not authorized to vaccinate'],
    });
    expect(err.message).toBe('Tu usuario no está habilitado para registrar vacunas.');
  });

  it('conserva los errores por campo de un hash `errors` (el formulario los muestra)', () => {
    const err = buildApiError(422, {
      errors: { scheduled_at: ['se cruza con otra cita de la mascota en ese horario'] },
    });
    expect(err.fieldErrors).toEqual({
      scheduled_at: ['se cruza con otra cita de la mascota en ese horario'],
    });
    expect(err.message).toBe('Revisa los datos ingresados.');
  });
});
