import ProtectedRoute from '../ProtectedRoute';
import NotificationSettings from '@/components/NotificationSettings';

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationSettings />
    </ProtectedRoute>
  );
}
