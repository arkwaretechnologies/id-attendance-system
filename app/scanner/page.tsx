import ProtectedRoute from '../ProtectedRoute';
import AttendanceScanner from '@/components/AttendanceScanner';

export default function ScannerPage() {
  return (
    <ProtectedRoute>
      <AttendanceScanner />
    </ProtectedRoute>
  );
}
