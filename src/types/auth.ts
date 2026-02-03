import type { User, Session } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export type { User, Session };

export type UserRole = 'admin' | 'teacher' | 'user' | string | null;

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  supabase: SupabaseClient;
  signUp: (
    email: string,
    password: string,
    userData?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ data: unknown; error: unknown }>;
  signOut: () => Promise<{ error: unknown }>;
  resetPassword: (email: string) => Promise<{ data: unknown; error: unknown }>;
  updatePassword: (newPassword: string) => Promise<{
    data: unknown;
    error: unknown;
  }>;
  updateProfile: (updates: Record<string, unknown>) => Promise<{
    data: unknown;
    error: unknown;
  }>;
  isAdmin: () => boolean;
  refreshUserRole: () => void;
}
