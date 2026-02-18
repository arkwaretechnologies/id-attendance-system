import ProtectedRoute from '../ProtectedRoute';
import ScheduleManagement from '@/components/ScheduleManagement';

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <ScheduleManagement />
    </ProtectedRoute>
  );
}
