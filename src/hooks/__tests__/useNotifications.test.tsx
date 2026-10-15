/**
 * Hook del centro de notificaciones contra SQLite REAL (`node:sqlite`).
 */
import { act, renderHook } from '@testing-library/react-native';
import { DatabaseSync } from 'node:sqlite';

import { applyMigrations } from '@/db/migrations';
import type { SqlExecutor } from '@/db/sqlExecutor';
import { useNotifications } from '@/hooks/useNotifications';
import { createNotificationCenter } from '@/services/notificationCenter';

function nodeExecutor(db: DatabaseSync): SqlExecutor {
  return {
    exec: (sql) => db.exec(sql),
    run: (sql, params = []) => {
      db.prepare(sql).run(...(params as never[]));
    },
    all: <T,>(sql: string, params: unknown[] = []) =>
      db.prepare(sql).all(...(params as never[])) as T[],
    get: <T,>(sql: string, params: unknown[] = []) =>
      (db.prepare(sql).get(...(params as never[])) as T | undefined) ?? undefined,
  };
}

describe('useNotifications', () => {
  let db: DatabaseSync;
  let exec: SqlExecutor;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    exec = nodeExecutor(db);
    applyMigrations(exec);
  });

  afterEach(() => db.close());

  it('lista las notificaciones existentes con su conteo de no leídas', () => {
    const center = createNotificationCenter(exec);
    center.add({ type: 'connectivity', title: 'Sin conexión' });
    center.add({ type: 'treatment', title: 'Tratamiento iniciado' });

    const { result } = renderHook(() => useNotifications(exec));

    expect(result.current.items).toHaveLength(2);
    expect(result.current.unreadCount).toBe(2);
  });

  it('marcar todas como leídas deja el badge en cero', () => {
    createNotificationCenter(exec).add({ type: 'a', title: 'Uno' });
    const { result } = renderHook(() => useNotifications(exec));

    act(() => result.current.markAllRead());

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.items[0]!.readAt).not.toBeNull();
  });

  it('refresh refleja avisos registrados después del montaje', () => {
    const { result } = renderHook(() => useNotifications(exec));
    expect(result.current.items).toHaveLength(0);

    createNotificationCenter(exec).add({ type: 'b', title: 'Nuevo' });
    act(() => result.current.refresh());

    expect(result.current.items).toHaveLength(1);
    expect(result.current.unreadCount).toBe(1);
  });

  it('si la base local falla (corrupta, sin espacio) no rompe la cabecera', () => {
    // Base real cerrada: toda consulta lanza, como una base que no abre.
    const broken = new DatabaseSync(':memory:');
    const brokenExec = nodeExecutor(broken);
    broken.close();

    const { result } = renderHook(() => useNotifications(brokenExec));
    expect(result.current.items).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
    act(() => result.current.refresh());
    act(() => result.current.markAllRead());
    expect(result.current.unreadCount).toBe(0);
  });
});
