import { supabase } from '../lib/supabase';

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

    if (!joinError && classesWithSubjects) {
      return {
        classes: classesWithSubjects.map(class_ => ({
          id: class_.id,
          grade: class_.grade,
          section: class_.section,
          subject_id: class_.subject_id,
          subject_name: class_.subjects?.name || 'Unknown Subject'
        })),
        error: null
      };
    }

    // If the join fails, try loading classes and subjects separately
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*')
      .order('grade')
      .order('section');

    if (classesError) throw classesError;

    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*');

    if (subjectsError) throw subjectsError;

    const mappedClasses = classes.map(class_ => {
      const subject = subjects?.find(sub => sub.id === class_.subject_id);
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
    return { classes: [], error: 'Failed to load classes' };
  }
} 