import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AuthUser } from '@/types/models';
import type { OwnerRegistration } from '@/screens/auth/RegisterScreen';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import { purgeLocalData } from '@/db/database';
import { cancelAllLocalAlarms } from '@/services/alarms';
import { fetchClinicTimeZone } from '@/services/clinicSettings';
import { setClinicTimeZone } from '@/utils/clinicTime';

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
  /** Re-lee el usuario de sesión desde /me (tras editar el perfil). */
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Teléfono compartido: ni los datos clínicos locales ni las alarmas del usuario
 * saliente deben sobrevivir a su sesión (cierre manual o sesión revocada).
 */
async function clearLocalUserData(): Promise<void> {
  setClinicTimeZone(null);
  try {
    purgeLocalData();
  } catch {
    // La base local no estaba abierta: nada que purgar.
  }
  await cancelAllLocalAlarms();
}

/**
 * Zona horaria de la clínica para mostrar las citas. Solo el staff con permiso
 * de configuración puede leerla aquí; para el resto, la adoptan los servicios
 * de citas desde el `time_zone` de cada respuesta (hasta entonces, la del
 * dispositivo). Nunca bloquea el inicio de sesión.
 */
async function loadClinicTimeZone(user: AuthUser): Promise<void> {
  if (user.type !== 'User') {
    setClinicTimeZone(null);
    return;
  }
  try {
    setClinicTimeZone(await fetchClinicTimeZone());
  } catch {
    setClinicTimeZone(null);
  }
}

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

    // El servidor rechazó el refresh (contraseña cambiada o restablecida en otro
    // dispositivo, cuenta desactivada o eliminada): los tokens ya se borraron;
    // se limpian los datos locales y se vuelve a público.
    authService.setOnSessionExpired(() => {
      if (!active) return;
      setUser(null);
      setRole('public');
      void clearLocalUserData();
    });

    (async () => {
      try {
        if (!(await secureStore.hasSession())) return;
        const restored = await authService.fetchCurrentUser();
        await loadClinicTimeZone(restored);
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
        await loadClinicTimeZone(authed);
        setUser(authed);
        setRole(roleForUser(authed));
      },
      register: async (data) => {
        const authed = await authService.register(data);
        await loadClinicTimeZone(authed);
        setUser(authed);
        setRole(roleForUser(authed));
      },
      forgotPassword: (email) => authService.forgotPassword(email),
      resetPassword: (token, password, passwordConfirmation) =>
        authService.resetPassword(token, password, passwordConfirmation),
      signOut: async () => {
        await authService.logout();
        await clearLocalUserData();
        setUser(null);
        setRole('public');
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
