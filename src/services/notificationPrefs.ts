/**
 * Preferencias de notificaciones por categoría (opt-out local). Todo está
 * habilitado por defecto; el usuario apaga categorías desde la pantalla de
 * preferencias. El centro de notificaciones y los programadores de avisos
 * locales consultan aquí antes de registrar o sonar.
 */
import { initDatabase } from '@/db/database';
import type { SqlExecutor } from '@/db/sqlExecutor';

export interface NotificationCategory {
  key: string;
  label: string;
  description: string;
}

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  { key: 'citas', label: 'Citas', description: 'Recordatorios y cambios de tus citas.' },
  {
    key: 'vacunas',
    label: 'Vacunas y desparasitación',
    description: 'Avisos de dosis próximas a vencer.',
  },
  {
    key: 'tratamientos',
    label: 'Tratamientos',
    description: 'Alarmas de medicación y su seguimiento.',
  },
  { key: 'pagos', label: 'Pagos', description: 'Cobros, verificaciones y vencimientos.' },
  {
    key: 'informes',
    label: 'Informes y exámenes',
    description: 'Informes médicos y resultados de laboratorio.',
  },
  { key: 'adopciones', label: 'Adopciones', description: 'Registros de adopción.' },
  {
    key: 'agenda',
    label: 'Agenda clínica',
    description: 'Resumen del día y novedades de la clínica (personal).',
  },
  {
    key: 'asistente',
    label: 'Asistente IA',
    description: 'Dictados procesados y respuestas del asistente (personal).',
  },
  {
    key: 'conectividad',
    label: 'Conexión',
    description: 'Avisos de modo sin conexión y sincronización.',
  },
];

export interface NotificationPrefs {
  isEnabled(category: string): boolean;
  setEnabled(category: string, enabled: boolean): void;
  all(): { category: string; enabled: boolean }[];
}

export function createNotificationPrefs(exec: SqlExecutor): NotificationPrefs {
  function isEnabled(category: string): boolean {
    const row = exec.get<{ enabled: number }>(
      'SELECT enabled FROM notification_prefs WHERE category = ?',
      [category],
    );
    return row ? row.enabled === 1 : true; // sin fila = habilitada
  }

  return {
    isEnabled,
    setEnabled(category, enabled) {
      exec.run(
        `INSERT INTO notification_prefs (category, enabled, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT (category) DO UPDATE SET enabled = excluded.enabled,
           updated_at = excluded.updated_at`,
        [category, enabled ? 1 : 0, new Date().toISOString()],
      );
    },
    all() {
      return NOTIFICATION_CATEGORIES.map((c) => ({
        category: c.key,
        enabled: isEnabled(c.key),
      }));
    },
  };
}

/**
 * Consulta segura desde la app (sin ejecutor a mano). Si la base local no está
 * disponible, se asume habilitada: nunca silenciar por un fallo local.
 */
export function categoryEnabled(category: string): boolean {
  try {
    return createNotificationPrefs(initDatabase()).isEnabled(category);
  } catch {
    return true;
  }
}
