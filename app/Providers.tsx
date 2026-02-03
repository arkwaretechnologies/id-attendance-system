'use client';

import React from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AuthProvider from '@/contexts/AuthContextProvider';
import { StudentProvider } from '@/contexts/StudentContext';
import AppShell from './AppShell';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StudentProvider>
          <AppShell>{children}</AppShell>
        </StudentProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
