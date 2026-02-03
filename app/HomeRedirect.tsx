'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  return null;
}
