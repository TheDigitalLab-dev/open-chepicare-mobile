/**
 * Chepicare — Diseño de componentes (Microtaller 03)
 * Componentes de UI móviles en React Native (Expo SDK 56, TypeScript).
 * Cada componente parte de su DEFINICIÓN (contrato de props + estados) y se
 * implementa con los tokens compartidos del design system de Chepicare.
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  type PressableProps,
} from 'react-native';

/* ============================================================
   Tokens (extracto de src/theme/tokens.ts)
   ============================================================ */
const tokens = {
  colors: {
    background: '#FAF8F3',
    foreground: '#1F2A37',
    card: '#FFFFFF',
    primary: '#36B6AC',
    primaryForeground: '#FFFFFF',
    secondary: '#EDF5F4',
    secondaryForeground: '#1E5A53',
    mutedForeground: '#6B7280',
    destructive: '#EF4444',
    success: '#16A34A',
    warning: '#F59E0B',
    border: '#D6E7E4',
  },
  radius: 8,
  radiusFull: 9999,
  spacing: 8,
  touch: 44, // área táctil mínima (Material Design)
} as const;

/* ============================================================
   1. Button — acción del usuario
   Definición: variante (primary|secondary|outline|destructive|ghost),
   tamaño (sm|md|lg), fullWidth opcional, área táctil ≥ 44 px.
   ============================================================ */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends PressableProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const SIZE_HEIGHT: Record<ButtonSize, number> = { sm: 36, md: 40, lg: 44 };

export function Button({
  label,
  variant = 'primary',
  size = 'lg',
  fullWidth,
  ...rest
}: ButtonProps) {
  const v = buttonVariantStyles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        { minHeight: SIZE_HEIGHT[size], backgroundColor: v.bg, borderColor: v.border },
        fullWidth && styles.btnBlock,
        pressed && { opacity: 0.9 },
      ]}
      {...rest}
    >
      <Text style={[styles.btnLabel, { color: v.fg }]}>{label}</Text>
    </Pressable>
  );
}

const buttonVariantStyles: Record<ButtonVariant, { bg: string; fg: string; border: string }> = {
  primary: { bg: tokens.colors.primary, fg: tokens.colors.primaryForeground, border: 'transparent' },
  secondary: { bg: tokens.colors.secondary, fg: tokens.colors.secondaryForeground, border: 'transparent' },
  outline: { bg: 'transparent', fg: tokens.colors.foreground, border: tokens.colors.border },
  destructive: { bg: tokens.colors.destructive, fg: '#FFFFFF', border: 'transparent' },
  ghost: { bg: 'transparent', fg: tokens.colors.primary, border: 'transparent' },
};

/* ============================================================
   2. TextField — entrada de datos con validación
   Definición: label, placeholder, value, secureTextEntry, error?.
   fontSize 16 para evitar el zoom automático en iOS.
   ============================================================ */
interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
}

export function TextField({ label, value, onChangeText, placeholder, secureTextEntry, error }: TextFieldProps) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.colors.mutedForeground}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

/* ============================================================
   3. Badge — etiqueta de estado del dominio
   Definición: tone (success|warning|destructive|primary), label.
   ============================================================ */
type BadgeTone = 'success' | 'warning' | 'destructive' | 'primary';

const BADGE_TONES: Record<BadgeTone, { bg: string; fg: string }> = {
  success: { bg: 'rgba(22,163,74,0.15)', fg: tokens.colors.success },
  warning: { bg: 'rgba(245,158,11,0.18)', fg: '#B45309' },
  destructive: { bg: 'rgba(239,68,68,0.15)', fg: tokens.colors.destructive },
  primary: { bg: tokens.colors.secondary, fg: tokens.colors.secondaryForeground },
};

export function Badge({ label, tone = 'primary' }: { label: string; tone?: BadgeTone }) {
  const t = BADGE_TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/* ============================================================
   4. StatCard — métrica numérica del dashboard
   Definición: value (número grande) + label (texto muted).
   ============================================================ */
export function StatCard({ value, label }: { value: number | string; label: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ============================================================
   5. AppointmentCard — fila compuesta (avatar + texto + Badge)
   Definición: petEmoji, title, subtitle, status, onPress.
   Reutilizada en citas del dueño y agenda del administrador.
   ============================================================ */
interface AppointmentCardProps {
  petEmoji: string;
  title: string;
  subtitle: string;
  status: { label: string; tone: BadgeTone };
  onPress?: () => void;
}

export function AppointmentCard({ petEmoji, title, subtitle, status, onPress }: AppointmentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.petAvatar}>
        <Text style={styles.petAvatarText}>{petEmoji}</Text>
      </View>
      <View style={styles.listRowBody}>
        <Text style={styles.listRowTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.listRowSub} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Badge label={status.label} tone={status.tone} />
    </Pressable>
  );
}

/* ============================================================
   Estilos
   ============================================================ */
const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: tokens.radius,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  btnBlock: { alignSelf: 'stretch' },
  btnLabel: { fontSize: 15, fontWeight: '600' },

  formGroup: { gap: 6, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: tokens.colors.foreground },
  input: {
    minHeight: tokens.touch,
    fontSize: 16, // evita el zoom automático en iOS
    paddingHorizontal: 12,
    backgroundColor: tokens.colors.card,
    color: tokens.colors.foreground,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
  },
  inputError: { borderColor: tokens.colors.destructive },
  fieldError: { fontSize: 13, color: tokens.colors.destructive },

  badge: { borderRadius: tokens.radiusFull, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: '600' },

  statCard: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700', color: tokens.colors.primary },
  statLabel: { fontSize: 13, color: tokens.colors.mutedForeground },

  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: tokens.colors.card,
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius,
  },
  petAvatar: {
    width: 44,
    height: 44,
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarText: { fontSize: 22 },
  listRowBody: { flex: 1, minWidth: 0 },
  listRowTitle: { fontSize: 16, fontWeight: '600', color: tokens.colors.foreground },
  listRowSub: { fontSize: 13, color: tokens.colors.mutedForeground },
});
