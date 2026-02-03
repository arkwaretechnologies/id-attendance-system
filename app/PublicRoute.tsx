'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (user) {
    return null;
  }

  return <>{children}</>;
}
