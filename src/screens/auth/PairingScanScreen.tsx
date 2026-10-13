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
import { usePairing, type PairingState } from '@/hooks/usePairing';
import { useSession } from '@/session/SessionProvider';
import type { AuthStackParamList } from '@/navigation/types';
import type { PairingAccountType } from '@/types/pairing';

type Rt = RouteProp<AuthStackParamList, 'PairingScan'>;

const QR_ONLY = { barcodeTypes: ['qr' as const] };

/** Reconstruye el URI del QR cuando la pantalla se abre por deep link. */
function deepLinkUri(params: Rt['params']): string | null {
  if (!params?.code || !params.server) return null;
  const query = [
    `v=${encodeURIComponent(params.v ?? '')}`,
    `server=${encodeURIComponent(params.server)}`,
    `code=${encodeURIComponent(params.code)}`,
  ];
  if (params.account) query.push(`account=${encodeURIComponent(params.account)}`);
  return `pawcare://pair?${query.join('&')}`;
}

const ACCOUNT_LABEL: Record<PairingAccountType, string> = {
  owner: 'propietario',
  staff: 'personal de la clínica',
};

function connectingText(accountType: PairingAccountType | null): string {
  return accountType
    ? `Conectando como ${ACCOUNT_LABEL[accountType]}…`
    : 'Conectando con el servidor…';
}

function pairedText(serverName: string | null, accountType: PairingAccountType | null) {
  const as = accountType ? ` como ${ACCOUNT_LABEL[accountType]}` : '';
  return `Conectado a ${serverName ?? 'tu servidor'}${as}.`;
}

/** Canje en curso, conexión lograda (con la cuenta abierta) o motivo del error. */
function PairingProgress({
  pairing,
  onContinue,
}: {
  pairing: PairingState;
  onContinue?: () => void;
}) {
  const { colors } = useTheme();

  if (pairing.status === 'pairing') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={{ color: colors.foreground }}>
          {connectingText(pairing.accountType)}
        </Text>
      </View>
    );
  }

  if (pairing.status === 'paired') {
    return (
      <View style={styles.error}>
        <InfoBanner
          tone="success"
          message={pairedText(pairing.serverName, pairing.accountType)}
        />
        {onContinue ? <Button label="Continuar" fullWidth onPress={onContinue} /> : null}
      </View>
    );
  }

  if (pairing.status === 'error' && pairing.error) {
    return (
      <View style={styles.error}>
        <InfoBanner tone="destructive" message={pairing.error} />
        <Button label="Escanear de nuevo" fullWidth onPress={pairing.reset} />
      </View>
    );
  }

  return null;
}

/**
 * Emparejar la app con un servidor PawCare escaneando el QR que genera la web
 * (Perfil del personal o «Mi Perfil» del propietario > Conectar la app móvil).
 * Configura el servidor y abre la sesión de la cuenta que generó el código, en
 * su modo (propietario o personal); también acepta el deep link
 * `pawcare://pair`.
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
      // Cambia el árbol de navegación al del rol de la cuenta emparejada
      // (propietario o personal); se vuelve a montar para el nuevo
      // servidor/usuario.
      void adoptSession(result.user);
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
        En la web de tu clínica abre tu perfil («Perfil» si eres del personal, «Mi Perfil»
        si eres propietario) → «Conectar la app móvil» y apunta la cámara al código. Es de
        un solo uso y vence a los 10 minutos.
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

      <PairingProgress pairing={pairing} onContinue={back} />
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
