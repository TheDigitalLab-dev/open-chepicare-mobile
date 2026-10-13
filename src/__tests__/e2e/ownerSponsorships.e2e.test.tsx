/**
 * E2E (app completa + backend real): apadrinamientos del propietario. El
 * apadrinamiento se crea con el servicio real; la app lo lista con etiquetas
 * en español, muestra su detalle y lo cancela.
 */
import { act, screen } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';

import {
  answerAlert,
  findText,
  loginThroughUi,
  pressButton,
  renderApp,
} from '@/testing/renderApp';
import * as publicService from '@/services/public';
import * as sponsorshipsService from '@/services/sponsorships';
import * as secureStore from '@/utils/secureStore';

const tap = (Notifications as unknown as { __tapNotification: (d: object) => void })
  .__tapNotification;

afterEach(async () => {
  await secureStore.clearTokens();
});

it('lista, abre y cancela un apadrinamiento', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  renderApp();
  await loginThroughUi('owner1@example.com');

  const [pet] = await publicService.listAdoptionPets();
  const created = await sponsorshipsService.createSponsorship({
    pet_id: pet!.id,
    amount: 7,
    recurrence: 'monthly',
    notes: 'Apadrinamiento e2e',
  });

  await pressButton('Apadrinamientos');
  await findText('Apadrinamientos');
  // Etiquetas en español (antes "monthly"/"cancelled" crudos).
  await findText(/· Mensual$/);
  expect(screen.queryByText('monthly')).toBeNull();

  // Hay una fila por apadrinamiento de esa mascota.
  const rows = await screen.findAllByRole('button', { name: new RegExp(pet!.name) });
  expect(rows.length).toBeGreaterThan(0);

  // Abre ESTE apadrinamiento tocando su push ("Apadrinamiento confirmado").
  await act(async () =>
    tap({
      category: 'pagos',
      entity: 'sponsorship',
      entity_id: created.id,
      event_key: `sponsorship-${created.id}-created`,
    }),
  );
  await findText('Apadrinamiento e2e');
  await findText(/^gastos de la mascota$/i);
  expect(screen.getByText('Mensual')).toBeTruthy();
  expect(screen.getByText('Activo')).toBeTruthy();

  await pressButton('Cancelar apadrinamiento');
  await act(async () => answerAlert(alert, 'Sí, cancelar'));
  await findText('Cancelado');
  expect(screen.queryByRole('button', { name: 'Cancelar apadrinamiento' })).toBeNull();
  expect((await sponsorshipsService.getSponsorship(created.id)).status).toBe('cancelled');
  alert.mockRestore();
}, 120000);
