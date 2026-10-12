import { createContext, use, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { subscribeServerUrl } from '@/config/serverConfig';
import { useServerCapabilities } from '@/hooks/useServerCapabilities';
import { restartAiUpdates } from '@/services/aiUpdates';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import type { AssistantAvailability, ServerCapabilities } from '@/types/assistant';
import { useSession } from './SessionProvider';

export interface AssistantContextValue {
  capabilities: ServerCapabilities | null;
  /** Qué mostrar: con "Sin IA" en el servidor todo es false. */
  availability: AssistantAvailability;
  reload: () => Promise<void>;
}

const AssistantContext = createContext<AssistantContextValue | undefined>(undefined);

/**
 * Capacidades del servidor compartidas por toda la app (chat y dictado se
 * muestran solo si el servidor tiene IA y el usuario tiene permiso) y push de
 * la sesión. Se refrescan al cambiar de usuario o de servidor y al volver la
 * app al primer plano (el admin pudo cambiar Configuración > IA).
 */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const { user, role } = useSession();
  const { capabilities, availability, reload } = useServerCapabilities();
  const userId = user?.id ?? null;

  usePushNotifications(userId, role === 'admin');

  // Los permisos (`user`) dependen de la sesión: recargar al cambiar de usuario.
  const lastUserId = useRef(userId);
  useEffect(() => {
    if (lastUserId.current === userId) return;
    lastUserId.current = userId;
    // El WebSocket se autenticó con la sesión anterior.
    restartAiUpdates();
    void reload();
  }, [userId, reload]);

  useEffect(() => subscribeServerUrl(restartAiUpdates), []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void reload();
    });
    return () => subscription.remove();
  }, [reload]);

  const value = useMemo(
    () => ({ capabilities, availability, reload }),
    [capabilities, availability, reload],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const ctx = use(AssistantContext);
  if (!ctx) throw new Error('useAssistant debe usarse dentro de <AssistantProvider>.');
  return ctx;
}
