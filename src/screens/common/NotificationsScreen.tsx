import { useCallback } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, View, type ListRenderItemInfo } from 'react-native';

import { AppHeader, MobileShell } from '@/components/layout';
import { Button, Card, EmptyState } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import type { AppNotification } from '@/services/notificationCenter';
import { useTheme } from '@/theme';
import { formatDateTime } from '@/utils/format';

// Fecha y hora en la misma zona y con el formato de la clínica (antes: la
// fecha en la zona de la clínica y la hora en la del teléfono).
function formatWhen(iso: string): string {
  return formatDateTime(iso);
}

function NotificationRow({ item }: { item: AppNotification }) {
  const { colors } = useTheme();
  return (
    <Card style={[styles.row, item.readAt === null && { borderColor: colors.primary }]}>
      <View style={styles.rowHead}>
        <Text
          style={[
            styles.title,
            { color: colors.foreground },
            item.readAt === null && styles.unread,
          ]}
        >
          {item.title}
        </Text>
        {item.readAt === null ? (
          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
        ) : null}
      </View>
      {item.body ? (
        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{item.body}</Text>
      ) : null}
      <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
        {formatWhen(item.createdAt)}
      </Text>
    </Card>
  );
}

/**
 * Centro de notificaciones in-app (local-first): historial persistente de
 * avisos — conectividad (O12/O13), tratamientos y recordatorios — leído de la
 * base local, disponible con o sin conexión.
 */
export function NotificationsScreen() {
  const navigation = useNavigation();
  const back = navigation.canGoBack() ? navigation.goBack : undefined;
  const { items, unreadCount, markAllRead, refresh } = useNotifications();

  // Al volver a enfocar la pantalla se refleja lo registrado entre tanto.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<AppNotification>) => <NotificationRow item={item} />,
    [],
  );

  return (
    <MobileShell
      header={<AppHeader title="Notificaciones" onBack={back} />}
      contentStyle={styles.content}
    >
      {items.length === 0 ? (
        <EmptyState
          icon="notifications-off"
          title="Sin notificaciones"
          description="Aquí verás los avisos de conexión, tratamientos y recordatorios."
        />
      ) : (
        <>
          {unreadCount > 0 ? (
            <Button
              label={`Marcar todas como leídas (${unreadCount})`}
              variant="outline"
              size="sm"
              onPress={markAllRead}
            />
          ) : null}
          <FlatList
            data={items}
            keyExtractor={(n) => n.id}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
    </MobileShell>
  );
}

const styles = StyleSheet.create({
  content: { gap: 10 },
  list: { flex: 1 },
  listContent: { gap: 10, paddingBottom: 32 },
  row: { gap: 4 },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: { fontSize: 14, flexShrink: 1 },
  unread: { fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
