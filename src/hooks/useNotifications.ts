/**
 * Hook del centro de notificaciones in-app (local-first): lista los avisos
 * persistidos en la base local y expone el conteo para el badge de la campana.
 * Acepta un `SqlExecutor` inyectado (tests con `node:sqlite` real).
 */
import { useCallback, useMemo, useState } from 'react';

import { initDatabase } from '@/db/database';
import type { SqlExecutor } from '@/db/sqlExecutor';
import {
  createNotificationCenter,
  type AppNotification,
} from '@/services/notificationCenter';

export interface UseNotifications {
  items: AppNotification[];
  unreadCount: number;
  markAllRead(): void;
  refresh(): void;
}

/**
 * Ejecuta una operación de la base local; si la base no abre o falla (corrupta,
 * sin espacio) devuelve el valor por defecto: la campana de TODAS las
 * cabeceras depende de esto y no puede tumbar la pantalla.
 */
function safely<T>(op: () => T, fallback: T): T {
  try {
    return op();
  } catch {
    return fallback;
  }
}

export function useNotifications(executor?: SqlExecutor): UseNotifications {
  const center = useMemo(
    () => safely(() => createNotificationCenter(executor ?? initDatabase()), null),
    [executor],
  );

  // Lectura inicial perezosa (la base es local y síncrona); las mutaciones y la
  // navegación refrescan vía `refresh`.
  const [items, setItems] = useState<AppNotification[]>(() =>
    safely(() => center?.list() ?? [], []),
  );
  const [unreadCount, setUnreadCount] = useState<number>(() =>
    safely(() => center?.unreadCount() ?? 0, 0),
  );

  const refresh = useCallback(() => {
    setItems(safely(() => center?.list() ?? [], []));
    setUnreadCount(safely(() => center?.unreadCount() ?? 0, 0));
  }, [center]);

  const markAllRead = useCallback(() => {
    safely(() => center?.markAllRead(), undefined);
    refresh();
  }, [center, refresh]);

  return { items, unreadCount, markAllRead, refresh };
}
