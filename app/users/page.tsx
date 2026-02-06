import AdminRoute from '../AdminRoute';
import UserManagement from '@/components/UserManagement';

export default function UsersPage() {
  return (
    <AdminRoute>
      <UserManagement />
    </AdminRoute>
  );
}
