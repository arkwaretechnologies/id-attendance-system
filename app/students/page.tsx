import ProtectedRoute from '../ProtectedRoute';
import StudentManagement from '@/components/StudentManagement';

export default function StudentsPage() {
  return (
    <ProtectedRoute>
      <StudentManagement />
    </ProtectedRoute>
  );
}
