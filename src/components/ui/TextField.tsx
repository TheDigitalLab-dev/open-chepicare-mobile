import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
}

export function TextField({
  label,
  error,
  hint,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.ring : colors.border;

  return (
    <View style={styles.group}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      ) : null}
      <TextInput
        // Teclado explícito siempre (AGENTS.md); cada campo declara el suyo.
        keyboardType="default"
        accessibilityLabel={label}
        {...inputProps}
        placeholderTextColor={colors.mutedForeground}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: colors.foreground,
            backgroundColor: colors.card,
            borderColor,
          },
        ]}
      />
      {error ? (
        <Text style={[styles.helper, { color: colors.destructive }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 6, marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '500' },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16, // evita zoom y cumple RNF-UX-001
  },
  helper: { fontSize: 12 },
});
