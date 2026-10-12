/**
 * Referencia al contenedor de navegación para abrir pantallas desde fuera del
 * árbol de React (al tocar una notificación push del asistente).
 */
import { createNavigationContainerRef } from '@react-navigation/native';

import type { AssistantPushTarget } from '@/services/pushNotifications';

export const navigationRef = createNavigationContainerRef();

/**
 * Abre el destino de una push del asistente (solo árbol del personal). En un
 * arranque en frío la navegación aún no está montada: reintenta unos segundos.
 */
export function openAssistantTarget(target: AssistantPushTarget, attempts = 25): void {
  if (!navigationRef.isReady()) {
    if (attempts > 0) setTimeout(() => openAssistantTarget(target, attempts - 1), 200);
    return;
  }
  // El contenedor es el mismo para todos los roles; los nombres de tabs y
  // pantallas son los del árbol del personal (AdminTabs).
  const navigate = navigationRef.navigate as unknown as (
    name: string,
    params: Record<string, unknown>,
  ) => void;
  switch (target.screen) {
    case 'consultation':
      navigate('MoreTab', {
        screen: 'AdminConsultationDetail',
        params: { id: target.consultationId },
      });
      return;
    case 'pet':
      navigate('PatientsTab', { screen: 'AdminPetDetail', params: { id: target.petId } });
      return;
    case 'chat':
      navigate('MoreTab', {
        screen: 'AssistantChat',
        params: { conversationId: target.conversationId },
      });
      return;
  }
}
