import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AuthUser } from '@/types/models';
import type { OwnerRegistration } from '@/screens/auth/RegisterScreen';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import { purgeLocalData } from '@/db/database';
import { cancelAllLocalAlarms } from '@/services/alarms';
import { unregisterThisDevice } from '@/services/pushNotifications';

/** Rol efectivo que decide el árbol de navegación (RNF-SEC-002). */
export type SessionRole = 'public' | 'owner' | 'admin';

/** `restoring`: leyendo tokens al arrancar. `ready`: árbol decidido. */
export type SessionStatus = 'restoring' | 'ready';

export interface SessionContextValue {
  status: SessionStatus;
  role: SessionRole;
  user: AuthUser | null;
  /** Inicia sesión con email o usuario. Lanza `ApiError` si falla. */
  signIn: (login: string, password: string) => Promise<void>;
  /** Registra un dueño y deja la sesión iniciada. Lanza `ApiError` (422 por campo). */
  register: (data: OwnerRegistration) => Promise<void>;
  /** Solicita el correo de recuperación (el backend siempre responde ok). */
  forgotPassword: (email: string) => Promise<void>;
  /** Fija una nueva contraseña con el token del deep link. Lanza `ApiError`. */
  resetPassword: (
    token: string,
    password: string,
    passwordConfirmation: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  /**
   * Adopta una sesión ya guardada por otro flujo (canje del QR de
   * emparejamiento): los tokens ya están en SecureStore.
   */
  adoptSession: (user: AuthUser) => void;
  /** Re-lee el usuario de sesión desde /me (tras editar el perfil). */
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/** Deriva el rol de navegación a partir del tipo de cuenta. */
function roleForUser(user: AuthUser): SessionRole {
  return user.type === 'Owner' ? 'owner' : 'admin';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('restoring');
  const [role, setRole] = useState<SessionRole>('public');
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restauración al arrancar: si hay tokens, validar con /me (auto-refresh ante
  // 401). Si falla, limpiar y quedar en público.
  useEffect(() => {
    let active = true;

    // Cuando el refresh falla dentro de una petición cualquiera, volvemos a público.
    authService.setOnSessionExpired(() => {
      if (!active) return;
      setUser(null);
      setRole('public');
    });

    (async () => {
      try {
        if (!(await secureStore.hasSession())) return;
        const restored = await authService.fetchCurrentUser();
        if (!active) return;
        setUser(restored);
        setRole(roleForUser(restored));
      } catch {
        await secureStore.clearTokens();
      } finally {
        if (active) setStatus('ready');
      }
    })();

    return () => {
      active = false;
      authService.setOnSessionExpired(() => {});
    };
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      role,
      user,
      signIn: async (login, password) => {
        const authed = await authService.login(login, password);
        setUser(authed);
        setRole(roleForUser(authed));
      },
      register: async (data) => {
        const authed = await authService.register(data);
        setUser(authed);
        setRole(roleForUser(authed));
      },
      forgotPassword: (email) => authService.forgotPassword(email),
      resetPassword: (token, password, passwordConfirmation) =>
        authService.resetPassword(token, password, passwordConfirmation),
      signOut: async () => {
        // El teléfono deja de recibir push de esta cuenta (requiere sesión).
        await unregisterThisDevice();
        await authService.logout();
        // Teléfono compartido: ni los datos clínicos locales ni las alarmas del
        // usuario saliente deben sobrevivir a su sesión.
        try {
          purgeLocalData();
        } catch {
          // La base local no estaba abierta: nada que purgar.
        }
        await cancelAllLocalAlarms();
        setUser(null);
        setRole('public');
      },
      adoptSession: (authed) => {
        setUser(authed);
        setRole(roleForUser(authed));
      },
      refreshUser: async () => {
        const fresh = await authService.fetchCurrentUser();
        setUser(fresh);
        setRole(roleForUser(fresh));
      },
    }),
    [status, role, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = use(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>.');
  return ctx;
}
