'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthContext } from './AuthContext';
import type { AuthContextValue, AppUser, UserRole } from '@/types/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<{ user: AppUser } | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setSession({ user: data.user });
        setUserRole((data.user.role as UserRole) ?? null);
        setAllowedPages(Array.isArray(data.allowedPages) ? data.allowedPages : []);
        setSchoolId(data.schoolId ?? null);
        setSchoolName(data.schoolName ?? null);
      } else {
        setUser(null);
        setSession(null);
        setUserRole(null);
        setAllowedPages([]);
        setSchoolId(null);
        setSchoolName(null);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      setUser(null);
      setSession(null);
      setUserRole(null);
      setAllowedPages([]);
      setSchoolId(null);
      setSchoolName(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const signUp = async (
    _email: string,
    _password: string,
    _userData: Record<string, unknown> = {}
  ) => {
    return {
      data: null,
      error: new Error('Account creation is managed by your administrator.'),
    };
  };

  const signIn = async (schoolIdParam: number, username: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          schoolId: schoolIdParam,
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        return {
          data: null,
          error: new Error(data.error ?? 'Sign in failed.'),
        };
      }

      setUser(data.user);
      setSession({ user: data.user });
      setUserRole((data.user.role as UserRole) ?? null);
      setAllowedPages(Array.isArray(data.allowedPages) ? data.allowedPages : []);
      setSchoolId(data.schoolId ?? null);
      setSchoolName(data.schoolName ?? null);
      return { data, error: null };
    } catch (err) {
      console.error('Sign in error:', err);
      return {
        data: null,
        error: new Error('Unable to sign in. Please try again.'),
      };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      setUser(null);
      setSession(null);
      setUserRole(null);
      setAllowedPages([]);
      setSchoolId(null);
      setSchoolName(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
      setSession(null);
      setUserRole(null);
      setSchoolId(null);
      setSchoolName(null);
      return { error };
    }
  };

  const resetPassword = async (_email: string) => {
    return {
      data: null,
      error: new Error('Please contact your administrator to reset your password.'),
    };
  };

  const updatePassword = async (_newPassword: string) => {
    return {
      data: null,
      error: new Error('Please contact your administrator to change your password.'),
    };
  };

  const updateProfile = async (_updates: Record<string, unknown>) => {
    return {
      data: null,
      error: new Error('Profile updates are not available.'),
    };
  };

  const isAdmin = () => userRole === 'admin';

  const canViewPage = useCallback(
    (pathname: string) => {
      const path = pathname.replace(/^\/+|\/+$/g, '') || 'dashboard';
      const pageKey = path.split('/')[0] ?? 'dashboard';
      if (allowedPages.length === 0) return true;
      return allowedPages.includes(pageKey);
    },
    [allowedPages]
  );

  const refreshUserRole = useCallback(() => {
    fetchSession();
  }, [fetchSession]);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    userRole,
    allowedPages,
    schoolId,
    schoolName,
    canViewPage,
    supabase,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    isAdmin,
    refreshUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
