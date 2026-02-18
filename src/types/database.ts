/**
 * Database row types used by the app.
 * Minimal set of fields actually used; extend as needed.
 */

export interface StudentProfile {
  id: string;
  learner_reference_number?: string | null;
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  extension_name?: string | null;
  sex?: string | null;
  school_year?: string | null;
  grade_level?: string | null;
  school_id?: number | null;
  rfid_tag?: string | null;
  student_image_url?: string | null;
  created_at?: string | null;
  email_address?: string | null;
  phone_number?: string | null;
  last_grade_level_completed?: string | null;
  parent_email?: string | null;
  father_last_name?: string | null;
  father_first_name?: string | null;
  father_middle_name?: string | null;
  father_contact_number?: string | null;
  mother_last_name?: string | null;
  mother_first_name?: string | null;
  mother_middle_name?: string | null;
  mother_contact_number?: string | null;
  guardian_last_name?: string | null;
  guardian_first_name?: string | null;
  guardian_middle_name?: string | null;
  guardian_contact_number?: string | null;
  [key: string]: unknown;
}

export interface Parent {
  id: string;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface Attendance {
  id?: string;
  learner_reference_number?: string | null;
  created_at?: string | null;
  student_profile?: StudentProfile | null;
  session_number?: number | null;
  time_in?: string | null;
  time_out?: string | null;
  grade_level?: string | null;
  rfid_tag?: string | null;
  [key: string]: unknown;
}

/** Scan schedule session: time window for scanning (time_in, time_out). */
export interface ScanSchedule {
  id: string;
  name: string;
  time_in: string; // HH:mm or HH:mm:ss
  time_out: string;
  created_at?: string | null;
  [key: string]: unknown;
}

/** RPC return types used by the app */
export interface GetTodayAttendanceCountResult {
  count?: number;
}

export interface GetAttendanceRateResult {
  rate?: number;
}

export interface GetWeeklyAttendanceSummaryResult {
  [key: string]: unknown;
}

export interface HasAttendanceTodayResult {
  has_attendance?: boolean;
}

export interface GetUsersWithRolesRow {
  id: string;
  email?: string | null;
  role?: string | null;
  [key: string]: unknown;
}

export interface UserRoleRow {
  user_id: string;
  role: string;
  school_id?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface School {
  school_id: number;
  school_name?: string | null;
  head?: string | null;
  position?: string | null;
  address?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

/** Row from public.users (custom auth table). */
export interface PublicUser {
  user_id: number;
  username: string;
  password_hash: string;
  fullname: string;
  role: string;
  created_at?: string | null;
  updated_at?: string | null;
  school_id: number | null;
  email_address: string | null;
  contact_no: string | null;
  [key: string]: unknown;
}

/** User list item from API (public.users without password_hash). */
export interface PublicUserListItem {
  user_id: number;
  username: string;
  fullname: string;
  role: string;
  school_id: number | null;
  email_address: string | null;
  contact_no: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/** Row from public.role. */
export interface Role {
  role_id: number;
  name: string;
  description: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

/** Row from public.role_page. */
export interface RolePage {
  role_id: number;
  page_key: string;
  [key: string]: unknown;
}

/** Role with its page_keys for API responses. */
export interface RoleWithPages {
  role_id: number;
  name: string;
  description: string | null;
  page_keys: string[];
  created_at?: string | null;
  updated_at?: string | null;
}

/** Page keys that can be assigned to roles (must match route paths). */
export const PAGE_KEYS = [
  'dashboard',
  'students',
  'rfid',
  'scanner',
  'attendance',
  'schedule',
  'notifications',
  'users',
  'roles',
  'enroll',
] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

/**
 * Minimal Supabase Database type for typed client.
 * Extend with more tables/RPCs as needed; or replace with supabase gen types typescript output.
 */
export interface Database {
  public: {
    Tables: {
      student_profile: {
        Row: StudentProfile;
        Insert: Partial<StudentProfile>;
        Update: Partial<StudentProfile>;
      };
      parents: {
        Row: Parent;
        Insert: Partial<Parent>;
        Update: Partial<Parent>;
      };
      attendance: {
        Row: Attendance;
        Insert: Partial<Attendance>;
        Update: Partial<Attendance>;
      };
      scan_schedule: {
        Row: ScanSchedule;
        Insert: Partial<ScanSchedule>;
        Update: Partial<ScanSchedule>;
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: Partial<UserRoleRow>;
        Update: Partial<UserRoleRow>;
      };
      school: {
        Row: School;
        Insert: Partial<School>;
        Update: Partial<School>;
      };
      users: {
        Row: PublicUser;
        Insert: Partial<PublicUser>;
        Update: Partial<PublicUser>;
      };
      role: {
        Row: Role;
        Insert: Partial<Role>;
        Update: Partial<Role>;
      };
      role_page: {
        Row: RolePage;
        Insert: Partial<RolePage>;
        Update: Partial<RolePage>;
      };
    };
    Functions: {
      get_today_attendance_count: { Args: Record<string, never>; Returns: number };
      get_attendance_rate: { Args: Record<string, never>; Returns: number };
      get_weekly_attendance_summary: {
        Args: Record<string, never>;
        Returns: unknown[];
      };
      has_attendance_today: {
        Args: { learner_reference_number: string };
        Returns: boolean;
      };
      get_users_with_roles: { Args: Record<string, never>; Returns: GetUsersWithRolesRow[] };
      get_public_users: { Args: Record<string, never>; Returns: unknown[] };
      create_user_account: {
        Args: { user_email: string; user_password: string; user_role: string };
        Returns: unknown;
      };
      update_user_role: {
        Args: { target_user_id: string; new_role: string };
        Returns: unknown;
      };
      delete_user_account: { Args: { target_user_id: string }; Returns: unknown };
      set_initial_admin: { Args: { admin_email: string }; Returns: unknown };
      record_time_in: {
        Args: {
          learner_ref_number: string | null;
          rfid_tag: string | null;
          grade_level: string | null;
          school_year: string;
        };
        Returns: unknown;
      };
      record_time_out: {
        Args: { learner_ref_number: string | null };
        Returns: unknown;
      };
    };
  };
}
