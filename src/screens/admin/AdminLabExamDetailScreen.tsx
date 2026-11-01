import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AdminMoreStackParamList } from '@/navigation/types';
import { LabExamDetailContent } from '@/components/domain/LabExamDetailContent';

export function AdminLabExamDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<AdminMoreStackParamList, 'AdminLabExamDetail'>>();
  return (
    <LabExamDetailContent
      {...params}
      audience="staff"
      onBack={navigation.canGoBack() ? navigation.goBack : undefined}
    />
  );
}
