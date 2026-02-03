import PublicRoute from '../../PublicRoute';
import AuthCallback from '@/components/AuthCallback';

export default function AuthCallbackPage() {
  return (
    <PublicRoute>
      <AuthCallback />
    </PublicRoute>
  );
}
