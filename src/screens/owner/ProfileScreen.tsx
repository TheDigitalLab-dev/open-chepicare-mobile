import { useNavigation } from '@react-navigation/native';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader, MobileShell } from '@/components/layout';
import { Avatar, Button, EmptyState, SectionTitle } from '@/components/ui';
import { DetailHero, ListRow, ThemeToggle } from '@/components/domain';
import type { OwnerProfileStackParamList } from '@/navigation/types';
import { useAuth } from '@/hooks/useAuth';
import { deleteAccount } from '@/services/profile';
import { ApiError } from '@/types/api';

type Nav = NativeStackNavigationProp<OwnerProfileStackParamList>;

// Iconos estáticos hoisteados para evitar recrear JSX en cada render (jsx-no-jsx-as-prop).
const EDIT_ICON = <Avatar fallback="✎" />;
const PASSWORD_ICON = <Avatar fallback="🔒" />;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();

  const runDelete = async () => {
    try {
      await deleteAccount();
      // La cuenta queda eliminada: cierra sesión y vuelve al público.
      await signOut();
    } catch (e) {
      Alert.alert(
        'No se pudo eliminar la cuenta',
        e instanceof ApiError ? e.message : 'Inténtalo de nuevo más tarde.',
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert('Eliminar cuenta', 'Esta acción es permanente. ¿Deseas continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void runDelete() },
    ]);
  };

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      // Revoca el refresh, limpia SecureStore y vuelve a público (RootNavigator).
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  if (user?.type !== 'Owner') {
    return (
      <MobileShell header={<AppHeader title="Perfil" />}>
        <EmptyState icon="person" title="Sin sesión de dueño" />
      </MobileShell>
    );
  }
  const owner = user;
  const initials =
    `${owner.first_name.charAt(0)}${owner.last_name.charAt(0)}`.toUpperCase();

  return (
    <MobileShell
      scroll
      header={<AppHeader title="Perfil" />}
      contentStyle={{ gap: 16, paddingBottom: 32 }}
    >
      <DetailHero
        title={owner.full_name ?? `${owner.first_name} ${owner.last_name}`}
        subtitle={owner.email}
        avatar={<Avatar fallback={initials} size="lg" />}
      />

      <SectionTitle>Datos</SectionTitle>
      <View style={{ gap: 8 }}>
        <ListRow title="Usuario" subtitle={owner.username} showChevron={false} />
        <ListRow
          title="Documento"
          subtitle={owner.identity_document}
          showChevron={false}
        />
        <ListRow title="Teléfono" subtitle={owner.phone ?? '—'} showChevron={false} />
        <ListRow title="Dirección" subtitle={owner.address ?? '—'} showChevron={false} />
      </View>

      <SectionTitle>Cuenta</SectionTitle>
      <View style={{ gap: 8 }}>
        <ListRow
          title="Editar perfil"
          leading={EDIT_ICON}
          onPress={() => navigation.navigate('EditProfile')}
        />
        <ListRow
          title="Notificaciones"
          subtitle="Preferencias por categoría"
          onPress={() => navigation.navigate('NotificationPrefs')}
        />
        <ListRow
          title="Cambiar contraseña"
          leading={PASSWORD_ICON}
          onPress={() => navigation.navigate('ChangePassword')}
        />
      </View>

      <SectionTitle>Servidor</SectionTitle>
      <View style={{ gap: 8 }}>
        <ListRow
          title="Emparejar con código QR"
          subtitle="Conecta la app a otro servidor ChepiCare"
          onPress={() => navigation.navigate('PairingScan')}
        />
        <ListRow
          title="Configurar servidor"
          subtitle="Elige a qué backend se conecta la app"
          onPress={() => navigation.navigate('ServerSettings')}
        />
      </View>

      <SectionTitle>Apariencia</SectionTitle>
      <View style={{ gap: 8 }}>
        <ThemeToggle />
      </View>

      <Button
        label="Cerrar sesión"
        variant="outline"
        fullWidth
        onPress={confirmLogout}
        style={{ marginTop: 8 }}
      />
      <Button
        label="Eliminar cuenta"
        variant="destructive"
        fullWidth
        onPress={confirmDelete}
      />
    </MobileShell>
  );
}
