import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar…',
}: SearchBarProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.base, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Ionicons name="search" size={18} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, { color: colors.foreground }]}
        keyboardType="default"
        accessibilityLabel={placeholder ?? 'Buscar'}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
});
