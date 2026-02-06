import type { SupabaseClient } from '@supabase/supabase-js';

/** Session user from public.users (custom auth). */
export interface AppUser {
  id: string;
  user_id: number;
  username: string;
  fullname: string;
  role: string;
  school_id: number | null;
  /** Display email (email_address or username). */
  email?: string;
  email_address: string | null;
  contact_no: string | null;
}

export type UserRole = 'admin' | 'reviewer' | 'user' | string | null;

export interface AuthContextValue {
  user: AppUser | null;
  session: { user: AppUser } | null;
  loading: boolean;
  userRole: UserRole;
  /** Page keys this role can view (from role_page). Used for nav and route guard. */
  allowedPages: string[];
  schoolId: number | null;
  schoolName: string | null;
  supabase: SupabaseClient;
  /** True if current path is allowed for this user's role. */
  canViewPage: (pathname: string) => boolean;
  signUp: (
    email: string,
    password: string,
    userData?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: unknown }>;
  signIn: (
    schoolId: number,
    username: string,
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
