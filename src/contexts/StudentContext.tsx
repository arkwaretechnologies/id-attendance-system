'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { StudentContextValue } from '@/types/student';
import type { StudentProfile, Database } from '@/types/database';

const StudentContext = createContext<StudentContextValue | null>(null);

export function useStudent(): StudentContextValue {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}

interface StudentProviderProps {
  children: React.ReactNode;
}

export function StudentProvider({ children }: StudentProviderProps) {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('student_profile')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setStudents((data as StudentProfile[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const createStudent = async (studentData: Partial<StudentProfile>) => {
    try {
      setLoading(true);
      setError(null);
      type InsertRow = Database['public']['Tables']['student_profile']['Insert'];
      const { data, error: err } = await supabase
        .from('student_profile')
        .insert([studentData as InsertRow] as never)
        .select()
        .single();
      if (err) throw err;
      setStudents((prev) => [data as StudentProfile, ...prev]);
      return { data: data as StudentProfile, error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error creating student:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const updateStudent = async (
    id: string,
    updates: Partial<StudentProfile>
  ) => {
    try {
      setLoading(true);
      setError(null);
      type UpdateRow = Database['public']['Tables']['student_profile']['Update'];
      const { data, error: err } = await supabase
        .from('student_profile')
        .update(updates as UpdateRow as never)
        .eq('id', id)
        .select()
        .single();
      if (err) throw err;
      setStudents((prev) =>
        prev.map((student) => (student.id === id ? (data as StudentProfile) : student))
      );
      return { data: data as StudentProfile, error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error updating student:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error: err } = await supabase
        .from('student_profile')
        .delete()
        .eq('id', id);
      if (err) throw err;
      setStudents((prev) => prev.filter((student) => student.id !== id));
      return { error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error deleting student:', err);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  const getStudent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('student_profile')
        .select('*')
        .eq('id', id)
        .single();
      if (err) throw err;
      return { data: data as StudentProfile, error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching student:', err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = async (searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('student_profile')
        .select('*')
        .or(
          `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,learner_reference_number.ilike.%${searchTerm}%,email_address.ilike.%${searchTerm}%`
        )
        .order('created_at', { ascending: false });
      if (err) throw err;
      return { data: (data as StudentProfile[]) || [], error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error searching students:', err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  };

  const getStudentsByGrade = async (gradeLevel: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('student_profile')
        .select('*')
        .eq('last_grade_level_completed', gradeLevel)
        .order('last_name', { ascending: true });
      if (err) throw err;
      return { data: (data as StudentProfile[]) || [], error: null };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching students by grade:', err);
      return { data: [], error: err };
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const value: StudentContextValue = {
    students,
    loading,
    error,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudent,
    searchStudents,
    getStudentsByGrade,
    clearError,
  };

  return (
    <StudentContext.Provider value={value}>
      {children}
    </StudentContext.Provider>
  );
}

export default StudentProvider;
