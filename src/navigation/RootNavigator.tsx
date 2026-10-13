import { useSyncExternalStore } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  type LinkingOptions,
  type Theme,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useTheme } from '@/theme';
import { useSession } from '@/session/SessionProvider';
import { DEEP_LINK_PREFIXES } from '@/config/deepLinks';
import { getApiBaseUrl, subscribeServerUrl } from '@/config/serverConfig';
import { PairingScanScreen, ServerSettingsScreen } from '@/screens/auth';
import { navigationRef } from './navigationRef';
import { PublicStack } from './PublicStack';
import { OwnerTabs } from './OwnerTabs';
import { AdminTabs } from './AdminTabs';
import type { PublicStackParamList } from './types';

// Gate de primer arranque: un build sin EXPO_PUBLIC_API_BASE_URL (self-hosted)
// no tiene servidor; la app abre directo en la configuración del servidor en
// lugar de quedar "muda". Al guardar una URL, el gate desaparece solo.
type ServerSetupParamList = { ServerSettings: undefined; PairingScan: undefined };
const SetupStack = createNativeStackNavigator<ServerSetupParamList>();

// Deep links del estado público (PublicStack → Auth):
//  - recuperación: chepicare://reset_password/:token
//  - emparejamiento: chepicare://pair?v=1&server=…&code=…&account=… (los query params llegan
//    como params de PairingScan, que canjea el código).
// `pawcare://` sigue aceptado para los QR y enlaces ya emitidos (ver deepLinks).
const linking: LinkingOptions<PublicStackParamList> = {
  prefixes: DEEP_LINK_PREFIXES,
  config: {
    screens: {
      Auth: {
        screens: {
          ResetPassword: 'reset_password/:token',
          PairingScan: 'pair',
        },
      },
    },
  },
};

export function RootNavigator() {
  const { colors, scheme } = useTheme();
  const { role, status, user } = useSession();
  const apiBaseUrl = useSyncExternalStore(subscribeServerUrl, getApiBaseUrl);

  const navTheme: Theme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.foreground,
      border: colors.border,
      notification: colors.destructive,
    },
  };

  // Mientras se restaura la sesión (lectura de tokens + /me) mostramos un splash
  // para no parpadear de público → owner/admin.
  if (status === 'restoring') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (apiBaseUrl.length === 0) {
    return (
      <NavigationContainer theme={navTheme}>
        <SetupStack.Navigator screenOptions={{ headerShown: false }}>
          <SetupStack.Screen name="ServerSettings" component={ServerSettingsScreen} />
          <SetupStack.Screen name="PairingScan" component={PairingScanScreen} />
        </SetupStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme} linking={linking}>
      {/* Cambiar de servidor o de usuario (p. ej. al emparejar por QR) monta el
          árbol de cero: ninguna pantalla conserva datos del servidor anterior. */}
      {role === 'owner' ? (
        <OwnerTabs key={`${apiBaseUrl}#${user?.id ?? ''}`} />
      ) : role === 'admin' ? (
        <AdminTabs key={`${apiBaseUrl}#${user?.id ?? ''}`} />
      ) : (
        <PublicStack />
      )}
    </NavigationContainer>
  );
}
