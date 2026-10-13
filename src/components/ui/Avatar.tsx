import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import { absoluteServerUrl } from '@/utils/serverUrl';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /**
   * URL de imagen; si falta, se muestra inicial o emoji. Las rutas relativas
   * del backend (`/rails/active_storage/…`) se resuelven contra el servidor activo.
   */
  uri?: string | null;
  /** Descripción para lectores de pantalla (p. ej. "Foto de Luna"). */
  accessibilityLabel?: string;
  /** Texto de fallback (inicial) o emoji (p. ej. mascota). */
  fallback?: string;
  size?: AvatarSize;
}

const SIZES: Record<AvatarSize, number> = { sm: 32, md: 44, lg: 72 };

export function Avatar({
  uri,
  fallback = '?',
  size = 'md',
  accessibilityLabel,
}: AvatarProps) {
  const { colors } = useTheme();
  const dim = SIZES[size];
  const radius = dim / 2;
  const source = absoluteServerUrl(uri);

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        accessibilityLabel={accessibilityLabel}
        style={{ width: dim, height: dim, borderRadius: radius }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.fallback,
        {
          width: dim,
          height: dim,
          borderRadius: radius,
          backgroundColor: colors.secondary,
        },
      ]}
    >
      <Text
        style={{
          color: colors.secondaryForeground,
          fontSize: dim * 0.4,
          fontWeight: '600',
        }}
      >
        {fallback.slice(0, 2)}
      </Text>
    </View>
  );
}

/** Alias semántico para mascotas (acepta emoji como fallback). */
export const PetAvatar = Avatar;

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
});
