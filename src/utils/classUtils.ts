import { supabase } from '../lib/supabase';

interface Subject {
  id: string;
  name: string;
}

interface ClassResponse {
  id: string;
  grade: number;
  section: string;
  subject_id: string;
  subject_name: string;
  academic_year: string;
  semester: string;
  max_students: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  grade: number;
  section: string;
  subject_id: string;
  subject_name: string;
  academic_year: string;
  semester: string;
  max_students: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function loadClasses(): Promise<{ classes: Class[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .rpc('get_classes');

    if (error) {
      console.error('Error loading classes:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return { classes: [], error: 'No classes found in the system' };
    }

    return { 
      classes: data.map((class_: ClassResponse) => ({
        id: class_.id,
        grade: class_.grade,
        section: class_.section,
        subject_id: class_.subject_id,
        subject_name: class_.subject_name || 'Unknown Subject',
        academic_year: class_.academic_year,
        semester: class_.semester,
        max_students: class_.max_students,
        status: class_.status,
        created_at: class_.created_at,
        updated_at: class_.updated_at
      })),
      error: null
    };
  } catch (error) {
    console.error('Error loading classes:', error);
    return { 
      classes: [], 
      error: error instanceof Error ? error.message : 'Failed to load classes' 
    };
  }
} 