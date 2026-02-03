import type { StudentProfile } from './database';

export interface StudentContextValue {
  students: StudentProfile[];
  loading: boolean;
  error: string | null;
  fetchStudents: () => Promise<void>;
  createStudent: (
    studentData: Partial<StudentProfile>
  ) => Promise<{ data: StudentProfile | null; error: unknown }>;
  updateStudent: (
    id: string,
    updates: Partial<StudentProfile>
  ) => Promise<{ data: StudentProfile | null; error: unknown }>;
  deleteStudent: (id: string) => Promise<{ error: unknown }>;
  getStudent: (
    id: string
  ) => Promise<{ data: StudentProfile | null; error: unknown }>;
  searchStudents: (
    searchTerm: string
  ) => Promise<{ data: StudentProfile[]; error: unknown }>;
  getStudentsByGrade: (
    gradeLevel: string
  ) => Promise<{ data: StudentProfile[]; error: unknown }>;
  clearError: () => void;
}
