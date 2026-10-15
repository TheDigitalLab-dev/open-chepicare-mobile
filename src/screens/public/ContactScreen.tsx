import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { AsyncBoundary, ListRow, SectionTitle } from '@/components';
import { useAsync } from '@/hooks/useAsync';
import { getClinicContact, type ClinicContact } from '@/services/public';
import type { PublicStackParamList } from '@/navigation/types';

type ContactKey = 'phone' | 'emergency_phone' | 'whatsapp' | 'email' | 'address';

/** Filas de contacto y la acción del sistema que abre cada una. */
const CONTACT_ROWS: {
  key: ContactKey;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  url: (value: string) => string;
}[] = [
  {
    key: 'phone',
    title: 'Teléfono',
    icon: 'call',
    url: (v) => `tel:${v.replace(/[^\d+]/g, '')}`,
  },
  {
    key: 'emergency_phone',
    title: 'Emergencias',
    icon: 'medkit',
    url: (v) => `tel:${v.replace(/[^\d+]/g, '')}`,
  },
  {
    key: 'whatsapp',
    title: 'WhatsApp',
    icon: 'logo-whatsapp',
    url: (v) => `https://wa.me/${v.replace(/\D/g, '')}`,
  },
  { key: 'email', title: 'Correo', icon: 'mail', url: (v) => `mailto:${v}` },
  {
    key: 'address',
    title: 'Dirección',
    icon: 'location',
    url: (v) => `https://maps.google.com/?q=${encodeURIComponent(v)}`,
  },
];

function ContactRows({ contact }: { contact: ClinicContact }) {
  const { colors } = useTheme();
  return (
    <>
      {CONTACT_ROWS.map((row) => {
        const value = contact[row.key];
        if (!value) return null;
        return (
          <ListRow
            key={row.key}
            title={row.title}
            subtitle={value}
            leading={() => <Ionicons name={row.icon} size={22} color={colors.primary} />}
            onPress={() => void Linking.openURL(row.url(value))}
          />
        );
      })}
    </>
  );
}

/**
 * Datos de contacto (Configuración → Landing de la clínica, `/landing`) y
 * enlaces legales. Antes eran datos inventados en el código.
 */
export function ContactScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const { colors } = useTheme();
  const { data, loading, error, reload } = useAsync(() => getClinicContact());
  const hasAny = CONTACT_ROWS.some((row) => !!data?.[row.key]);

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
      <AsyncBoundary
        loading={loading && data === null}
        error={error}
        onRetry={reload}
        empty={data !== null && !hasAny}
        emptyIcon="call"
        emptyTitle="Sin datos de contacto"
        emptyDescription="La clínica aún no publicó sus datos de contacto."
      >
        {data ? <ContactRows contact={data} /> : null}
      </AsyncBoundary>

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
