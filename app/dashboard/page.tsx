import ProtectedRoute from '../ProtectedRoute';
import Dashboard from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
