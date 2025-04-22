import { supabase } from '../lib/supabase';

interface Subject {
  id: string;
  name: string;
}

export interface Class {
  id: string;
  grade: number;
  section: string;
  subject_id: string;
  subject_name: string;
}

export async function loadClasses(): Promise<{ classes: Class[]; error: string | null }> {
  try {
    // First try to load classes with subject information using a join
    const { data: classesWithSubjects, error: joinError } = await supabase
      .from('classes')
      .select(`
        id,
        grade,
        section,
        subject_id,
        subjects (
          id,
          name
        )
      `)
      .order('grade')
      .order('section');

    if (joinError) {
      console.error('Join query failed, falling back to separate queries:', joinError);
    }

    if (classesWithSubjects && classesWithSubjects.length > 0) {
      return {
        classes: classesWithSubjects.map(class_ => ({
          id: class_.id,
          grade: class_.grade,
          section: class_.section,
          subject_id: class_.subject_id,
          subject_name: (class_.subjects as unknown as Subject)?.name || 'Unknown Subject'
        })),
        error: null
      };
    }

    // If the join fails or returns no data, try loading classes and subjects separately
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('grade')
      .order('section');

    if (classesError) {
      console.error('Error loading classes:', classesError);
      throw classesError;
    }

    if (!classes || classes.length === 0) {
      return { classes: [], error: 'No classes found in the system' };
    }

    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*');

    if (subjectsError) {
      console.error('Error loading subjects:', subjectsError);
      throw subjectsError;
    }

    const mappedClasses = classes.map(class_ => {
      const subject = (subjects as unknown as Subject[])?.find(sub => sub.id === class_.subject_id);
      return {
        id: class_.id,
        grade: class_.grade,
        section: class_.section,
        subject_id: class_.subject_id,
        subject_name: subject?.name || 'Unknown Subject'
      };
    });

    return { classes: mappedClasses, error: null };
  } catch (error) {
    console.error('Error loading classes:', error);
    return { classes: [], error: error instanceof Error ? error.message : 'Failed to load classes' };
  }
} 