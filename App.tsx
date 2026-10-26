import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider, type ThemePreference } from '@/theme';
import { SessionProvider } from '@/session/SessionProvider';
import { AssistantProvider } from '@/session/AssistantProvider';
import { RootNavigator } from '@/navigation/RootNavigator';
import { loadServerUrl } from '@/config/serverConfig';
import { ASYNC_STORAGE_KEYS } from '@/config/storageKeys';

const THEME_KEY = ASYNC_STORAGE_KEYS.themePreference;

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

// Función pura (no usa estado local): a nivel de módulo para no reconstruirla
// en cada render y no romper la memoización de los hijos.
function persistThemePreference(next: ThemePreference): void {
  void AsyncStorage.setItem(THEME_KEY, next);
}

export default function App() {
  // Preferencia de tema hidratada desde almacenamiento (persistente entre sesiones).
  // `null` mientras carga: evita un parpadeo claro→oscuro al arrancar.
  const [preference, setPreference] = useState<ThemePreference | null>(null);

  useEffect(() => {
    // Restaura el tema y el servidor elegido ANTES de que la sesión haga su
    // primer fetch.
    Promise.all([
      AsyncStorage.getItem(THEME_KEY).catch(() => null),
      loadServerUrl(),
    ]).then(([stored]) => {
      setPreference(isThemePreference(stored) ? stored : 'system');
    });
  }, []);

  if (preference === null) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider
          initialPreference={preference}
          onPreferenceChange={persistThemePreference}
        >
          <SessionProvider>
            <AssistantProvider>
              <RootNavigator />
            </AssistantProvider>
          </SessionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
