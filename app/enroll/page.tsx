import ProtectedRoute from '../ProtectedRoute';
import StudentEnrollment from '@/components/StudentEnrollment';

export default function EnrollPage() {
  return (
    <ProtectedRoute>
      <StudentEnrollment />
    </ProtectedRoute>
  );
}
