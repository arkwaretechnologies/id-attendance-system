import ProtectedRoute from '../ProtectedRoute';
import UserManagement from '@/components/UserManagement';

export default function UsersPage() {
  return (
    <ProtectedRoute>
      <UserManagement />
    </ProtectedRoute>
  );
}
