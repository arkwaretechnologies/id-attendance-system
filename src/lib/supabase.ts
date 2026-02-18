'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { StudentProfile, Parent, Attendance, ScanSchedule } from '@/types/database';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'public-anon-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Supabase configuration missing! Please copy .env.example to .env.local and add your Supabase credentials.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const auth = {
  signUp: async (
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
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: () => supabase.auth.getUser(),

  onAuthStateChange: (callback: (event: string, session: unknown) => void) =>
    supabase.auth.onAuthStateChange(callback),
};

interface StudentProfileFilters {
  schoolYear?: string;
  gradeLevel?: string;
  /** When set, only rows with this school_id are returned. */
  schoolId?: number | null;
}

interface Pagination {
  page?: number;
  pageSize?: number;
}

export const db = {
  students: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('student_profile')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('student_profile')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    getByRfId: async (rfId: string) => {
      const { data, error } = await supabase
        .from('student_profile')
        .select('*')
        .eq('rfid_tag', rfId)
        .single();
      return { data, error };
    },

    create: async (studentData: Partial<StudentProfile>) => {
      const { data, error } = await supabase
        .from('student_profile')
        .insert([studentData] as never)
        .select();
      return { data, error };
    },

    update: async (id: string, updates: Partial<StudentProfile>) => {
      const { data, error } = await supabase
        .from('student_profile')
        .update(updates as never)
        .eq('id', id)
        .select();
      return { data, error };
    },

    delete: async (id: string) => {
      const { data, error } = await supabase
        .from('student_profile')
        .delete()
        .eq('id', id);
      return { data, error };
    },
  },

  studentProfiles: {
    getAll: async (
      filters: StudentProfileFilters = {},
      pagination: Pagination = {}
    ) => {
      let query = supabase
        .from('student_profile')
        .select(
          'id, learner_reference_number, last_name, first_name, middle_name, extension_name, sex, school_year, grade_level',
          { count: 'exact' }
        )
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (filters.schoolYear) {
        query = query.eq('school_year', filters.schoolYear);
      }
      if (filters.gradeLevel) {
        query = query.eq('grade_level', filters.gradeLevel);
      }
      if (filters.schoolId != null) {
        query = query.eq('school_id', filters.schoolId);
      }

      if (pagination.page != null && pagination.pageSize != null) {
        const from = (pagination.page - 1) * pagination.pageSize;
        const to = from + pagination.pageSize - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query;
      return { data, error, count };
    },

    getDistinctSchoolYears: async (schoolId?: number | null) => {
      let query = supabase
        .from('student_profile')
        .select('school_year')
        .not('school_year', 'is', null)
        .order('school_year', { ascending: false });
      if (schoolId != null) {
        query = query.eq('school_id', schoolId);
      }
      const { data, error } = await query;

      if (error) return { data: [] as string[], error };
      const rows = (data ?? []) as { school_year?: string }[];
      const uniqueYears = [...new Set(rows.map((item) => item.school_year))];
      return { data: uniqueYears, error: null };
    },

    getDistinctGradeLevels: async (schoolId?: number | null) => {
      let query = supabase
        .from('student_profile')
        .select('grade_level')
        .not('grade_level', 'is', null)
        .order('grade_level', { ascending: true });
      if (schoolId != null) {
        query = query.eq('school_id', schoolId);
      }
      const { data, error } = await query;

      if (error) return { data: [] as string[], error };
      const rows = (data ?? []) as { grade_level?: string }[];
      const uniqueGrades = [...new Set(rows.map((item) => item.grade_level))];
      return { data: uniqueGrades, error: null };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('student_profile')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    getByRfId: async (rfId: string) => {
      const { data, error } = await supabase
        .from('student_profile')
        .select('*')
        .eq('rfid_tag', rfId)
        .single();
      return { data, error };
    },

    searchForRfidAssignment: async (
      searchTerm = '',
      filters: StudentProfileFilters = {}
    ) => {
      let query = supabase
        .from('student_profile')
        .select(
          'id, learner_reference_number, last_name, first_name, middle_name, extension_name, school_year, grade_level, rfid_tag'
        )
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (searchTerm) {
        query = query.or(
          `last_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,learner_reference_number.ilike.%${searchTerm}%`
        );
      }
      if (filters.schoolYear) {
        query = query.eq('school_year', filters.schoolYear);
      }
      if (filters.gradeLevel) {
        query = query.eq('grade_level', filters.gradeLevel);
      }
      if (filters.schoolId != null) {
        query = query.eq('school_id', filters.schoolId);
      }

      const { data, error } = await query;
      return { data, error };
    },

    updateRfId: async (id: string, rfId: string) => {
      const { data, error } = await supabase
        .from('student_profile')
        .update({ rfid_tag: rfId } as never)
        .eq('id', id)
        .select();
      return { data, error };
    },

    removeRfId: async (id: string) => {
      const { data, error } = await supabase
        .from('student_profile')
        .update({ rfid_tag: null } as never)
        .eq('id', id)
        .select();
      return { data, error };
    },
  },

  parents: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    create: async (parentData: Partial<Parent>) => {
      const { data, error } = await supabase
        .from('parents')
        .insert([parentData] as never)
        .select();
      return { data, error };
    },

    update: async (id: string, updates: Partial<Parent>) => {
      const { data, error } = await supabase
        .from('parents')
        .update(updates as never)
        .eq('id', id)
        .select();
      return { data, error };
    },
  },

  attendance: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, student_profile (*)')
        .order('created_at', { ascending: false });
      return { data, error };
    },

    getByStudentId: async (learnerReferenceNumber: string) => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, student_profile (*)')
        .eq('learner_reference_number', learnerReferenceNumber)
        .order('created_at', { ascending: false });
      return { data, error };
    },

    create: async (attendanceData: Partial<Attendance>) => {
      const { data, error } = await supabase
        .from('attendance')
        .insert([attendanceData] as never)
        .select('*, student_profile (*)');
      return { data, error };
    },

    getTodayByLearnerReferenceNumber: async (
      learnerReferenceNumber: string
    ) => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('learner_reference_number', learnerReferenceNumber)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      return { data, error };
    },

    getStats: async () => {
      const { data: todayCount, error: todayError } = await supabase.rpc(
        'get_today_attendance_count'
      );
      const { data: rate, error: rateError } = await supabase.rpc(
        'get_attendance_rate'
      );
      const { data: weeklyData, error: weeklyError } = await supabase.rpc(
        'get_weekly_attendance_summary'
      );
      return {
        todayCount: todayCount ?? 0,
        attendanceRate: rate ?? 0,
        weeklyData: weeklyData ?? [],
        errors: { todayError, rateError, weeklyError },
      };
    },

    hasAttendanceToday: async (learnerReferenceNumber: string) => {
      const { data, error } = await supabase.rpc(
        'has_attendance_today',
        { learner_reference_number: learnerReferenceNumber } as never
      );
      return { data, error };
    },
  },

  scanSchedule: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('scan_schedule')
        .select('*')
        .order('time_in', { ascending: true });
      return { data, error };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('scan_schedule')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    create: async (session: Partial<ScanSchedule>) => {
      const { data, error } = await supabase
        .from('scan_schedule')
        .insert([session] as never)
        .select();
      return { data, error };
    },

    update: async (id: string, updates: Partial<ScanSchedule>) => {
      const { data, error } = await supabase
        .from('scan_schedule')
        .update(updates as never)
        .eq('id', id)
        .select();
      return { data, error };
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('scan_schedule')
        .delete()
        .eq('id', id);
      return { error };
    },
  },
};
