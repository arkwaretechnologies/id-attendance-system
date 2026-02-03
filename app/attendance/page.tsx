import ProtectedRoute from '../ProtectedRoute';
import AttendanceRecords from '@/components/AttendanceRecords';

export default function AttendancePage() {
  return (
    <ProtectedRoute>
      <AttendanceRecords />
    </ProtectedRoute>
  );
}
