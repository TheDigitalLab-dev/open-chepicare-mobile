/**
 * Push remotas (Expo) de la sesión actual:
 * - registra el token del dispositivo en el servidor al iniciar sesión;
 * - al tocar una notificación del asistente ("Dictado procesado",
 *   "Respuesta del asistente") abre la consulta, la mascota o el chat.
 *
 * Capa fina sobre módulos nativos (expo-notifications); la interpretación del
 * payload y el registro están probados en `services/pushNotifications`.
 */
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

import { openAssistantTarget } from '@/navigation/navigationRef';
import {
  assistantPushTarget,
  parseAssistantPush,
  registerThisDevice,
} from '@/services/pushNotifications';

function handleResponse(response: Notifications.NotificationResponse): void {
  const data = parseAssistantPush(response.notification.request.content.data);
  if (!data) return;
  const target = assistantPushTarget(data);
  if (target) openAssistantTarget(target);
}

export function usePushNotifications(userId: number | null, isStaff: boolean): void {
  useEffect(() => {
    if (userId === null) return;
    void registerThisDevice();
  }, [userId]);

  useEffect(() => {
    if (!isStaff) return undefined;
    // La app pudo abrirse en frío tocando la notificación.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      handleResponse(response);
      void Notifications.clearLastNotificationResponseAsync();
    });
    const subscription =
      Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, [isStaff]);
}
