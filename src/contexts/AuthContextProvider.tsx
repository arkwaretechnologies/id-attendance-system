'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentUserRole } from '@/lib/adminService';
import { AuthContext } from './AuthContext';
import type { User, Session } from '@supabase/supabase-js';
import type { AuthContextValue, UserRole } from '@/types/auth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const fetchUserRole = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setUserRole('admin');
      return;
    }
    try {
      const { role, error } = await getCurrentUserRole(userId);
      if (error) {
        setUserRole('admin');
      } else {
        setUserRole((role as UserRole) || 'admin');
      }
    } catch {
      setUserRole('admin');
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchUserRole(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setUserRole('admin');
          fetchUserRole(session.user.id).catch(console.error);
        }
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchUserRole]);

  const signUp = async (
    email: string,
    password: string,
    userData: Record<string, unknown> = {}
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: userData },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Sign out error:', error);
          return { error };
        }
      }
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      // Ensure Supabase Dashboard → Auth → URL Configuration → Redirect URLs includes:
      // https://<your-domain>/update-password and http://localhost:3000/update-password
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/update-password`,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Record<string, unknown>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = () => userRole === 'admin';

  const refreshUserRole = () => {
    fetchUserRole(user?.id);
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    userRole,
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
