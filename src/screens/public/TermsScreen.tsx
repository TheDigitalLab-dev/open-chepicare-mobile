import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import type { PublicStackParamList } from '@/navigation/types';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: '1. Aceptación de los términos',
    body: 'Al usar la aplicación ChepiCare aceptas los presentes términos y condiciones. Si no estás de acuerdo, te pedimos abstenerte de utilizar nuestros servicios.',
  },
  {
    heading: '2. Uso de los servicios',
    body: 'Los servicios veterinarios, la tienda y el programa de adopción se ofrecen de buena fe. Te comprometes a proporcionar información veraz y a usar la plataforma de manera responsable.',
  },
  {
    heading: '3. Pagos y comprobantes',
    body: 'Los pedidos y servicios deben pagarse según los medios indicados. El comprobante de pago será validado por nuestro equipo antes de confirmar cualquier pedido.',
  },
  {
    heading: '4. Adopción responsable',
    body: 'La adopción está sujeta a la evaluación de requisitos. ChepiCare se reserva el derecho de aprobar o rechazar solicitudes en beneficio del bienestar animal.',
  },
  {
    heading: '5. Modificaciones',
    body: 'Podemos actualizar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse en la aplicación.',
  },
];

/** Términos y condiciones (texto legal de ejemplo). */
export function TermsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const { colors } = useTheme();

  return (
    <MobileShell
      scroll
      header={
        <AppHeader
          title="Términos y condiciones"
          onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        />
      }
      contentStyle={{ gap: 12 }}
    >
      {SECTIONS.map((section) => (
        <Text key={section.heading}>
          <Text style={[styles.heading, { color: colors.foreground }]}>
            {section.heading}
            {'\n'}
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {section.body}
          </Text>
        </Text>
      ))}
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 16, fontWeight: '700', lineHeight: 24 },
  body: { fontSize: 14, lineHeight: 21 },
});
