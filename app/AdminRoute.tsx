'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ProtectedRoute from './ProtectedRoute';

export default function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userRole, loading } = useAuth();
  const router = useRouter();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (loading) return;
    if (userRole != null && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [userRole, isAdmin, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (userRole != null && !isAdmin) {
    return null;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
}
