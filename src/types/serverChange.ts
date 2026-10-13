/**
 * Cambio del servidor guardado de la app (pantalla Servidor, restablecer o QR
 * de emparejamiento de otro servidor): lo que se le explica al usuario antes de
 * confirmarlo.
 */
export interface ServerChangeInfo {
  /** Servidor al que está conectada la app ahora (normalizado). */
  currentUrl: string;
  /** Servidor al que se va a cambiar (normalizado; '' = ninguno). */
  targetUrl: string;
  /** Nombre de la clínica del servidor actual, si se conoce. */
  currentClinicName: string | null;
  /** Hay una sesión abierta en este teléfono (se cerrará al confirmar). */
  hasSession: boolean;
}
