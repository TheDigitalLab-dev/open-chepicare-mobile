import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { AppHeader, MobileShell } from '@/components/layout';
import { Card, InfoBanner } from '@/components/ui';
import { initDatabase } from '@/db/database';
import {
  createNotificationPrefs,
  NOTIFICATION_CATEGORIES,
} from '@/services/notificationPrefs';
import { applyNotificationPref } from '@/services/notificationPrefEffects';
import { useTheme } from '@/theme';

/**
 * Preferencias de notificaciones (opt-out por categoría, local-first): lo que
 * se apaga aquí deja de sonar (recordatorios/alarmas) y de registrarse en el
 * centro. Todo viene habilitado por defecto.
 */
export function NotificationPrefsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;

  const exec = useMemo(() => initDatabase(), []);
  const prefs = useMemo(() => createNotificationPrefs(exec), [exec]);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(prefs.all().map((p) => [p.category, p.enabled])),
  );

  const toggle = useCallback(
    (category: string, value: boolean) => {
      setEnabled((prev) => ({ ...prev, [category]: value }));
      // Guarda y cancela/reprograma lo ya agendado de esa categoría.
      applyNotificationPref(exec, category, value).catch(() => {
        // La preferencia ya quedó guardada; lo programado se ajusta en la
        // próxima sincronización.
      });
    },
    [exec],
  );

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Notificaciones" onBack={back} />}
      contentStyle={styles.content}
    >
      <InfoBanner
        tone="info"
        message="Las categorías apagadas no suenan ni se registran en el centro de notificaciones. Los cambios aplican de inmediato en este teléfono."
      />
      {NOTIFICATION_CATEGORIES.map((cat) => (
        <Card key={cat.key} style={styles.row}>
          <View style={styles.text}>
            <Text style={[styles.label, { color: colors.foreground }]}>{cat.label}</Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground }}>
              {cat.description}
            </Text>
          </View>
          <Switch
            value={enabled[cat.key] ?? true}
            onValueChange={(value) => toggle(cat.key, value)}
            trackColor={{ true: colors.primary, false: colors.border }}
            accessibilityLabel={`Notificaciones de ${cat.label}`}
          />
        </Card>
      ))}
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  text: { flex: 1, gap: 2 },
  label: { fontSize: 15, fontWeight: '600' },
});
