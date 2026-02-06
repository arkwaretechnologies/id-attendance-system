import ProtectedRoute from '../../ProtectedRoute';
import CreateRoleForm from '@/components/CreateRoleForm';

export default function CreateRolePage() {
  return (
    <ProtectedRoute>
      <CreateRoleForm />
    </ProtectedRoute>
  );
}
