import { View } from 'react-native';

import { SectionTitle } from '@/components/ui';
import type { Pet } from '@/types/models';
import { ListRow } from './ListRow';

/** La ficha y el historial muestran los mismos datos reales del tutor. */
export function TutorContact({ tutor }: { tutor: Pet['proprietary'] }) {
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>Tutor y contacto</SectionTitle>
      <ListRow
        title={tutor?.full_name ?? 'Tutor no registrado'}
        subtitle={tutor?.identity_document ?? 'Sin documento registrado'}
      />
      <ListRow title="Teléfono" subtitle={tutor?.phone ?? 'Sin teléfono registrado'} />
      <ListRow title="Correo" subtitle={tutor?.email ?? 'Sin correo registrado'} />
    </View>
  );
}
