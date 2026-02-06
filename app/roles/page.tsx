import ProtectedRoute from '../ProtectedRoute';
import RoleManagement from '@/components/RoleManagement';

export default function RolesPage() {
  return (
    <ProtectedRoute>
      <RoleManagement />
    </ProtectedRoute>
  );
}
