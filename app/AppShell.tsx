'use client';

import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/Navbar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <div className="App">
      {user && <Navbar />}
      <main className={`container ${user ? 'main-content' : ''}`}>
        {children}
      </main>
    </div>
  );
}
