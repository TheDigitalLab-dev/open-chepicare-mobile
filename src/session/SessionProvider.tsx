import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';

import type { AuthUser } from '@/types/models';
import { ApiError } from '@/types/api';
import type { OwnerRegistration } from '@/types/auth';
import * as authService from '@/services/auth';
import * as secureStore from '@/utils/secureStore';
import { purgeLocalData } from '@/db/database';
import { cancelAllLocalAlarms } from '@/services/alarms';
import { restoreClinicConfig } from '@/services/clinicConfig';
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
   * emparejamiento, de personal o de propietario): los tokens ya están en
   * SecureStore. Si había otra sesión abierta, purga antes sus datos locales.
   */
  adoptSession: (user: AuthUser) => Promise<void>;
  /**
   * Termina la sesión en la app cuando ya se cerró en el servidor por otro
   * flujo (cambio de servidor confirmado: `services/serverChange`), sin más
   * llamadas de red: purga los datos locales y vuelve a público.
   */
  endSession: () => Promise<void>;
  /** Re-lee el usuario de sesión desde /me (tras editar el perfil). */
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Teléfono compartido: ni los datos clínicos locales ni las alarmas del usuario
 * saliente deben sobrevivir a su sesión (cierre manual o sesión revocada). La
 * configuración de la clínica (zona y formatos) no es del usuario y se conserva.
 */
async function clearLocalUserData(): Promise<void> {
  try {
    purgeLocalData();
  } catch {
    // La base local no estaba abierta: nada que purgar.
  }
  await cancelAllLocalAlarms();
}

/** Cierra del todo los datos de la cuenta saliente (y su marca de dueño). */
async function forgetLocalUser(): Promise<void> {
  await clearLocalUserData();
  await secureStore.clearLocalDataOwner();
}

const ownerKey = (user: AuthUser): string => `${user.type}:${user.id}`;

/**
 * Antes de abrir la sesión de `user`: si los datos locales del teléfono son de
 * OTRA cuenta (p. ej. su sesión quedó guardada porque el arranque fue sin red),
 * se purgan. La misma cuenta conserva sus tratamientos y alarmas.
 */
async function claimLocalData(user: AuthUser): Promise<void> {
  const current = await secureStore.getLocalDataOwner();
  if (current !== null && current !== ownerKey(user)) await clearLocalUserData();
  await secureStore.setLocalDataOwner(ownerKey(user));
}

/** El servidor rechazó la sesión (no es un fallo de red ni del servidor). */
function isSessionRejected(err: unknown): boolean {
  return (
    err instanceof ApiError && (err.kind === 'unauthorized' || err.kind === 'forbidden')
  );
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
      void forgetLocalUser();
    });

    (async () => {
      // Zona y formatos de la clínica guardados en la última sesión: listos antes
      // de la primera pantalla, aunque no haya red. `/me` (o el login) los
      // actualiza. Sin caché (primer arranque sin red), la zona del dispositivo.
      await restoreClinicConfig();
      try {
        if (!(await secureStore.hasSession())) return;
        const restored = await authService.fetchCurrentUser();
        if (!active) return;
        await claimLocalData(restored);
        setUser(restored);
        setRole(roleForUser(restored));
      } catch (err) {
        // Solo una sesión RECHAZADA se borra (con los datos locales de la
        // cuenta). Sin red, timeout o 5xx los tokens se conservan: el siguiente
        // arranque con conexión restaura la sesión.
        if (isSessionRejected(err)) {
          await secureStore.clearTokens();
          await forgetLocalUser();
        }
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
        await claimLocalData(authed);
        setUser(authed);
        setRole(roleForUser(authed));
      },
      register: async (data) => {
        const authed = await authService.register(data);
        await claimLocalData(authed);
        setUser(authed);
        setRole(roleForUser(authed));
      },
      forgotPassword: (email) => authService.forgotPassword(email),
      resetPassword: (token, password, passwordConfirmation) =>
        authService.resetPassword(token, password, passwordConfirmation),
      signOut: async () => {
        // Ninguno lanza: sin red o con el access vencido el teléfono sale igual.
        try {
          // El teléfono deja de recibir push de esta cuenta (requiere sesión).
          await unregisterThisDevice();
          await authService.logout();
        } finally {
          await forgetLocalUser();
          setUser(null);
          setRole('public');
        }
      },
      adoptSession: async (authed) => {
        // Emparejar otra cuenta sin cerrar sesión (p. ej. el teléfono del
        // personal pasa a la cuenta de un propietario): como al salir, ni los
        // datos locales, ni la cola de sincronización, ni las alarmas de la
        // sesión anterior pasan a la nueva.
        if (user) await clearLocalUserData();
        await claimLocalData(authed);
        setUser(authed);
        setRole(roleForUser(authed));
      },
      endSession: async () => {
        // El escáner del QR llama a esto al desmontarse, y se desmonta A MITAD
        // del canje (el árbol se monta de nuevo para el servidor nuevo): si ya
        // hay una sesión nueva guardada, o se guarda mientras se purga, no se
        // pisa (antes la app quedaba en público con la sesión nueva guardada).
        if (await secureStore.hasSession()) return;
        const epoch = secureStore.getTokenEpoch();
        await clearLocalUserData();
        if (secureStore.getTokenEpoch() !== epoch) return;
        await secureStore.clearLocalDataOwner();
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
