import { View } from 'react-native';
import { Card, SectionTitle } from '@/components/ui';
import type { Consultation } from '@/types/models';
import { formatDate } from '@/utils/format';
import { ListRow } from './ListRow';

export function ConsultationPreventiveCare({
  consultation,
}: {
  consultation: Consultation;
}) {
  const vaccinations = consultation.vaccinations_in_consultation ?? [];
  const dewormings = consultation.dewormings_in_consultation ?? [];
  return (
    <>
      {vaccinations.length ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Vacunas aplicadas</SectionTitle>
          <Card padding={0}>
            {vaccinations.map((item) => (
              <ListRow
                key={item.id}
                title={item.vaccine_name}
                subtitle={[formatDate(item.application_date), item.dose]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))}
          </Card>
        </View>
      ) : null}
      {dewormings.length ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>Desparasitaciones aplicadas</SectionTitle>
          <Card padding={0}>
            {dewormings.map((item) => (
              <ListRow
                key={item.id}
                title={item.product_name}
                subtitle={[formatDate(item.application_date), item.dose]
                  .filter(Boolean)
                  .join(' · ')}
              />
            ))}
          </Card>
        </View>
      ) : null}
    </>
  );
}
