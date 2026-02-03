import ProtectedRoute from '../ProtectedRoute';
import RFIDManagement from '@/components/RFIDManagement';

export default function RFIDPage() {
  return (
    <ProtectedRoute>
      <RFIDManagement />
    </ProtectedRoute>
  );
}
