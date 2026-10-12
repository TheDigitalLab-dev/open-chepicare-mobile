import { useCallback, useEffect, useRef } from 'react';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { ActivityIndicator, Linking, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { Button, EmptyState, InfoBanner } from '@/components/ui';
import { usePairing } from '@/hooks/usePairing';
import { useSession } from '@/session/SessionProvider';
import type { AuthStackParamList } from '@/navigation/types';

type Rt = RouteProp<AuthStackParamList, 'PairingScan'>;

const QR_ONLY = { barcodeTypes: ['qr' as const] };

/** Reconstruye el URI del QR cuando la pantalla se abre por deep link. */
function deepLinkUri(params: Rt['params']): string | null {
  if (!params?.code || !params.server) return null;
  const query = [
    `v=${encodeURIComponent(params.v ?? '')}`,
    `server=${encodeURIComponent(params.server)}`,
    `code=${encodeURIComponent(params.code)}`,
  ].join('&');
  return `pawcare://pair?${query}`;
}

/**
 * Emparejar la app con un servidor PawCare escaneando el QR que genera la web
 * (Perfil > Conectar app móvil). Configura el servidor y abre la sesión del
 * usuario que generó el código; también acepta el deep link `pawcare://pair`.
 */
export function PairingScanScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<Rt>();
  const { adoptSession } = useSession();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const [permission, requestPermission] = useCameraPermissions();

  const pairing = usePairing({
    onPaired: (result) => {
      // Cambia el árbol de navegación al del rol del usuario emparejado (la
      // navegación se vuelve a montar para el nuevo servidor/usuario).
      adoptSession(result.user);
    },
  });

  const fromLink = deepLinkUri(route.params);
  const linkHandled = useRef(false);
  useEffect(() => {
    if (!fromLink || linkHandled.current) return;
    linkHandled.current = true;
    void pairing.pair(fromLink);
  }, [fromLink, pairing]);

  const onScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (pairing.status === 'idle') void pairing.pair(result.data);
    },
    [pairing],
  );

  const header = <AppHeader title="Emparejar con QR" onBack={back} />;

  if (!permission) {
    return (
      <MobileShell header={header}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </MobileShell>
    );
  }

  if (!permission.granted && !fromLink) {
    return (
      <MobileShell header={header}>
        <EmptyState
          icon="camera-outline"
          title="Permiso de cámara"
          description="PawCare necesita la cámara solo para leer el código QR que muestra tu servidor."
          actionLabel={permission.canAskAgain ? 'Permitir cámara' : 'Abrir ajustes'}
          onAction={() =>
            permission.canAskAgain
              ? void requestPermission()
              : void Linking.openSettings()
          }
        />
      </MobileShell>
    );
  }

  return (
    <MobileShell header={header} contentStyle={styles.content}>
      <Text style={[styles.help, { color: colors.mutedForeground }]}>
        En la web de tu clínica abre Perfil → «Conectar app móvil» y apunta la cámara al
        código. Es de un solo uso y vence a los 10 minutos.
      </Text>

      {permission.granted && pairing.status === 'idle' ? (
        <View style={[styles.cameraFrame, { borderColor: colors.primary }]}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={QR_ONLY}
            onBarcodeScanned={onScanned}
          />
        </View>
      ) : null}

      {pairing.status === 'pairing' ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ color: colors.foreground }}>Conectando con el servidor…</Text>
        </View>
      ) : null}

      {pairing.status === 'paired' ? (
        <View style={styles.error}>
          <InfoBanner
            tone="success"
            message={`Conectado a ${pairing.serverName ?? 'tu servidor'}.`}
          />
          {back ? <Button label="Continuar" fullWidth onPress={back} /> : null}
        </View>
      ) : null}

      {pairing.status === 'error' && pairing.error ? (
        <View style={styles.error}>
          <InfoBanner tone="destructive" message={pairing.error} />
          <Button label="Escanear de nuevo" fullWidth onPress={pairing.reset} />
        </View>
      ) : null}
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  help: { fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  cameraFrame: { aspectRatio: 1, borderRadius: 16, borderWidth: 3, overflow: 'hidden' },
  camera: { flex: 1 },
  error: { gap: 12 },
});
