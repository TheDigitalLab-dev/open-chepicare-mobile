import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { ListRow, SectionTitle } from '@/components';
import type { PublicStackParamList } from '@/navigation/types';

/** Datos de contacto y enlaces legales. */
export function ContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const { colors } = useTheme();

  return (
    <MobileShell
      scroll
      header={
        <AppHeader
          title="Contacto"
          onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        />
      }
      contentStyle={{ gap: 12 }}
    >
      <SectionTitle>Comunícate con nosotros</SectionTitle>
      <ListRow
        title="Teléfono"
        subtitle="+58 412 1234567"
        leading={() => <Ionicons name="call" size={22} color={colors.primary} />}
        showChevron={false}
      />
      <ListRow
        title="Correo"
        subtitle="contacto@chepicare.com"
        leading={() => <Ionicons name="mail" size={22} color={colors.primary} />}
        showChevron={false}
      />
      <ListRow
        title="Dirección"
        subtitle="Av. Principal 123, Ciudad"
        leading={() => <Ionicons name="location" size={22} color={colors.primary} />}
        showChevron={false}
      />

      <SectionTitle>Información legal</SectionTitle>
      <ListRow
        title="Términos y condiciones"
        leading={() => <Ionicons name="document-text" size={22} color={colors.primary} />}
        onPress={() => navigation.navigate('Terms')}
      />
      <ListRow
        title="Política de privacidad"
        leading={() => (
          <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
        )}
        onPress={() => navigation.navigate('Privacy')}
      />
    </MobileShell>
  );
}
