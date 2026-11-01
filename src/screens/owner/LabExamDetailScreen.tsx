import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { OwnerPetsStackParamList } from '@/navigation/types';
import { LabExamDetailContent } from '@/components/domain/LabExamDetailContent';

export function LabExamDetailScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<OwnerPetsStackParamList, 'LabExamDetail'>>();
  return (
    <LabExamDetailContent
      {...params}
      onBack={navigation.canGoBack() ? navigation.goBack : undefined}
    />
  );
}
