/**
 * `useReloadOnFocus` con un navegador REAL de React Navigation: recarga al
 * VOLVER a la pantalla, no al montarla (la carga inicial ya la hace
 * `useAsync`/`usePaginatedList`; antes cada pantalla pedía todo dos veces al
 * abrirse — con `fetchAllPages`, el doble de páginas).
 */
import { act, render, screen } from '@testing-library/react-native';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { useReloadOnFocus } from '@/hooks/useReloadOnFocus';

type Params = { List: undefined; Detail: undefined };
const Stack = createNativeStackNavigator<Params>();
const nav = createNavigationContainerRef<Params>();

it('no recarga al montar y sí cada vez que se vuelve a la pantalla', async () => {
  const reload = jest.fn(async () => undefined);
  function List() {
    useReloadOnFocus(reload);
    return <Text>Lista</Text>;
  }
  function Detail() {
    return <Text>Detalle</Text>;
  }

  render(
    <NavigationContainer ref={nav}>
      <Stack.Navigator>
        <Stack.Screen name="List" component={List} />
        <Stack.Screen name="Detail" component={Detail} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
  await screen.findByText('Lista');
  expect(reload).not.toHaveBeenCalled();

  await act(async () => nav.navigate('Detail'));
  await screen.findByText('Detalle');
  await act(async () => nav.goBack());
  expect(reload).toHaveBeenCalledTimes(1);

  await act(async () => nav.navigate('Detail'));
  await act(async () => nav.goBack());
  expect(reload).toHaveBeenCalledTimes(2);
});
