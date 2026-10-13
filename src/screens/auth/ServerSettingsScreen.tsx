import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { Button, Card, InfoBanner, SectionTitle, TextField } from '@/components/ui';
import { ServerChangeDialog } from '@/components/domain';
import {
  checkServerHealth,
  getApiBaseUrl,
  getDefaultApiBaseUrl,
  resetServerUrl,
  setServerUrl,
  type ServerHealth,
} from '@/config/serverConfig';
import { useServerChange } from '@/hooks/useServerChange';
import { useSession } from '@/session/SessionProvider';

/**
 * Selección del servidor Pawcare (self-hosted / open source).
 * El usuario escribe la URL de su backend, prueba la conexión y la guarda.
 * Guardar otra dirección o restablecer la de por defecto, si cambia el
 * servidor, primero lo explica y pide confirmación (cierra la sesión actual).
 */
export function ServerSettingsScreen() {
  const { colors } = useTheme();
  // Todas las pilas que registran esta pantalla registran también PairingScan.
  const navigation =
    useNavigation<NativeStackNavigationProp<{ PairingScan: undefined }>>();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const [url, setUrl] = useState(() => getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [savedMsg, setSavedMsg] = useState<string>();
  const serverChange = useServerChange();
  const { endSession } = useSession();

  const trimmed = url.trim();
  const canTest = trimmed.length > 0 && !testing;

  const onTest = async () => {
    setTesting(true);
    setHealth(null);
    setSavedMsg(undefined);
    try {
      setHealth(await checkServerHealth(trimmed));
    } finally {
      setTesting(false);
    }
  };

  const onSave = () => {
    setSavedMsg(undefined);
    void serverChange.request(trimmed, async (change) => {
      setSaving(true);
      try {
        // La sesión del servidor anterior ya se cerró allí: la app vuelve a
        // público (el inicio de sesión del servidor nuevo).
        if (change?.hasSession) await endSession();
        const saved = await setServerUrl(trimmed);
        setUrl(saved);
        setSavedMsg(`Servidor guardado: ${saved}`);
      } finally {
        setSaving(false);
      }
    });
  };

  const onReset = () => {
    setSavedMsg(undefined);
    void serverChange.request(getDefaultApiBaseUrl(), async (change) => {
      if (change?.hasSession) await endSession();
      await resetServerUrl();
      setUrl(getApiBaseUrl());
      setHealth(null);
      setSavedMsg('Se restableció el servidor por defecto.');
    });
  };

  const defaultUrl = getDefaultApiBaseUrl();

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Servidor" onBack={back} />}
      contentStyle={{ gap: 12, paddingBottom: 32 }}
    >
      <InfoBanner
        tone="info"
        message="Pawcare es de código abierto. Conecta la app a tu propio servidor escaneando el código QR de la web o escribiendo su dirección."
      />

      <Button
        label="Escanear código QR"
        fullWidth
        onPress={() => navigation.navigate('PairingScan')}
      />

      <SectionTitle>Dirección del servidor</SectionTitle>
      <TextField
        label="URL"
        value={url}
        onChangeText={(v) => {
          setUrl(v);
          setHealth(null);
          setSavedMsg(undefined);
        }}
        placeholder="https://mi-servidor.com o http://192.168.1.10:3000"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="URL"
      />
      {/^http:\/\//i.test(trimmed) ? (
        <InfoBanner
          tone="warning"
          message="Conexión sin cifrado (http): tus credenciales viajarán en claro. Úsala solo con un servidor en tu propia red local de confianza."
        />
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Button
          label="Probar conexión"
          variant="outline"
          loading={testing}
          disabled={!canTest}
          onPress={onTest}
          style={{ flex: 1 }}
        />
        <Button
          label="Guardar"
          loading={saving}
          disabled={trimmed.length === 0 || saving}
          onPress={onSave}
          style={{ flex: 1 }}
        />
      </View>

      {health ? (
        <InfoBanner
          tone={health.ok ? 'success' : 'destructive'}
          message={
            health.ok
              ? `Conexión correcta${health.latencyMs != null ? ` (${health.latencyMs} ms)` : ''}.`
              : 'No se pudo conectar. Verifica la dirección y que el servidor esté encendido.'
          }
        />
      ) : null}

      {savedMsg ? <InfoBanner tone="success" message={savedMsg} /> : null}

      <SectionTitle>Servidor actual</SectionTitle>
      <Card>
        <Text style={{ fontSize: 15, color: colors.foreground }}>
          {getApiBaseUrl() || 'Sin configurar'}
        </Text>
        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>
          Por defecto: {defaultUrl || 'ninguno'}
        </Text>
      </Card>

      <Button
        label="Restablecer al valor por defecto"
        variant="ghost"
        onPress={onReset}
      />

      <ServerChangeDialog
        change={serverChange.pending}
        leaving={serverChange.leaving}
        onCancel={serverChange.cancel}
        onConfirm={() => void serverChange.confirm()}
      />
    </MobileShell>
  );
}
