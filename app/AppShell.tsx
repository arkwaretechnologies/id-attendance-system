'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';

const PUBLIC_PATHS = ['/login', '/reset-password', '/update-password', '/auth/callback'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, canViewPage } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    const isPublic = PUBLIC_PATHS.some((p) => pathname?.startsWith(p));
    if (!isPublic && pathname && !canViewPage(pathname)) {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, canViewPage, router]);

  return (
    <div className="App">
      {user && <Navbar />}
      <main className={`container ${user ? 'main-content' : ''}`}>
        {children}
      </main>
    </div>
  );
}
