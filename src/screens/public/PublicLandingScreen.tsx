import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { MobileShell } from '@/components/layout';
import { ActionTileGrid, HeroCard, ThemeToggle, type ActionTile } from '@/components';
import { Button, SectionTitle } from '@/components';
import type { PublicStackParamList } from '@/navigation/types';

/** Hub público de ChepiCare: punto de entrada a las secciones abiertas. */
export function PublicLandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const { colors } = useTheme();

  const tiles: ActionTile[] = [
    {
      id: 'services',
      label: 'Servicios',
      icon: 'medkit',
      onPress: () => navigation.navigate('Services'),
    },
    {
      id: 'products',
      label: 'Tienda',
      icon: 'cart',
      onPress: () => navigation.navigate('Products'),
    },
    {
      id: 'adoption',
      label: 'Adopción',
      icon: 'paw',
      onPress: () => navigation.navigate('AdoptionLanding'),
    },
    {
      id: 'sponsorships',
      label: 'Patrocinios',
      icon: 'gift',
      onPress: () => navigation.navigate('SponsorshipsList'),
    },
    {
      id: 'contact',
      label: 'Contacto',
      icon: 'call',
      onPress: () => navigation.navigate('Contact'),
    },
  ];

  return (
    <MobileShell scroll contentStyle={styles.content}>
      <View style={styles.brandBlock}>
        <Text style={[styles.brand, { color: colors.primary }]}>ChepiCare</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Cuidado veterinario a domicilio
        </Text>
      </View>

      <HeroCard
        title="Bienestar para tu mascota"
        subtitle="Servicios, tienda y adopción responsable en un solo lugar."
      />

      <ActionTileGrid tiles={tiles} />

      <Button
        label="Iniciar sesión"
        fullWidth
        onPress={() => navigation.navigate('Auth')}
        style={styles.login}
      />

      <SectionTitle>Apariencia</SectionTitle>
      <ThemeToggle />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 32 },
  brandBlock: { alignItems: 'center', gap: 4, marginTop: 8 },
  brand: { fontSize: 36, fontWeight: '700', letterSpacing: 0.5 },
  tagline: { fontSize: 14 },
  login: { marginTop: 4 },
});
