import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StyleSheet, Text } from 'react-native';

import { useTheme } from '@/theme';
import { AppHeader, MobileShell } from '@/components/layout';
import { Button, HeroCard } from '@/components';
import type { PublicStackParamList } from '@/navigation/types';

/** Portada del programa de adopción responsable. */
export function AdoptionLandingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<PublicStackParamList>>();
  const { colors } = useTheme();

  return (
    <MobileShell
      scroll
      header={
        <AppHeader
          title="Adopción"
          onBack={navigation.canGoBack() ? navigation.goBack : undefined}
        />
      }
      contentStyle={{ gap: 16 }}
    >
      <HeroCard
        title="Dale un hogar"
        subtitle="Conoce a las mascotas que buscan una familia."
      />

      <Text style={[styles.body, { color: colors.foreground }]}>
        En ChepiCare promovemos la adopción responsable. Todas nuestras mascotas están
        desparasitadas, vacunadas y revisadas por nuestro equipo veterinario. Adoptar es
        un compromiso de amor y cuidado para toda la vida.
      </Text>

      <Button
        label="Ver mascotas"
        fullWidth
        onPress={() => navigation.navigate('AdoptionList')}
      />
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  body: { fontSize: 15, lineHeight: 22 },
});
