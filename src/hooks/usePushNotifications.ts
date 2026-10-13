/**
 * Push remotas (Expo) de la sesión actual:
 * - registra el token del dispositivo en el servidor al iniciar sesión;
 * - al tocar una notificación del asistente ("Dictado procesado",
 *   "Respuesta del asistente") abre la consulta, la mascota o el chat;
 * - al tocar una del propietario (cita, pago, apadrinamiento, informe…) abre
 *   su pantalla.
 *
 * Capa fina sobre módulos nativos (expo-notifications); la interpretación del
 * payload y el registro están probados en `services/pushNotifications`.
 */
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

import { openAssistantTarget, openOwnerTarget } from '@/navigation/navigationRef';
import {
  assistantPushTarget,
  ownerPushTarget,
  parseAssistantPush,
  registerThisDevice,
} from '@/services/pushNotifications';

function handleStaffResponse(response: Notifications.NotificationResponse): void {
  const data = parseAssistantPush(response.notification.request.content.data);
  if (!data) return;
  const target = assistantPushTarget(data);
  if (target) openAssistantTarget(target);
}

/** Push de citas, pagos, informes… del propietario. */
function handleOwnerResponse(response: Notifications.NotificationResponse): void {
  const target = ownerPushTarget(response.notification.request.content.data);
  if (target) openOwnerTarget(target);
}

export function usePushNotifications(userId: number | null, isStaff: boolean): void {
  useEffect(() => {
    if (userId === null) return;
    void registerThisDevice();
  }, [userId]);

  useEffect(() => {
    if (userId === null) return undefined;
    const handle = isStaff ? handleStaffResponse : handleOwnerResponse;
    // La app pudo abrirse en frío tocando la notificación.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      handle(response);
      void Notifications.clearLastNotificationResponseAsync();
    });
    const subscription = Notifications.addNotificationResponseReceivedListener(handle);
    return () => subscription.remove();
  }, [userId, isStaff]);
}
