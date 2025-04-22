import { supabase } from '../lib/supabase';

/**
 * Class interface representing the structure of a class in the system
 */
export interface Class {
  id: string;
  grade: number;
  section: string;
  name: string;
  max_students: number;
  created_at: string;
  updated_at: string;
}

/**
 * Class student interface representing a student in a class
 */
export interface ClassStudent {
  user_id: string;
  username: string;
  photo_url: string | null;
}

/**
 * Response interface for class-related operations
 */
export interface ClassResponse {
  classes: Class[];
  error?: string;
}

/**
 * Response interface for class students operations
 */
export interface ClassStudentsResponse {
  students: ClassStudent[];
  error?: string;
}

/**
 * Loads all classes from the database
 * @returns A promise that resolves to a ClassResponse object
 */
export async function loadClasses(): Promise<ClassResponse> {
  try {
    const { data, error } = await supabase.rpc('get_classes');
    
    if (error) {
      console.error('Error loading classes:', error);
      return { 
        classes: [], 
        error: `Failed to load classes: ${error.message}` 
      };
    }
    
    return { 
      classes: data || [] 
    };
  } catch (error: any) {
    console.error('Unexpected error in loadClasses:', error);
    return { 
      classes: [], 
      error: error?.message || 'An unexpected error occurred while loading classes' 
    };
  }
}

/**
 * Loads students for a specific class
 * @param classId The ID of the class to load students for
 * @returns A promise that resolves to a ClassStudentsResponse object
 */
export async function loadClassStudents(classId: string): Promise<ClassStudentsResponse> {
  try {
    if (!classId) {
      return {
        students: [],
        error: 'No class ID provided'
      };
    }

    const { data, error } = await supabase.rpc('get_class_students', { class_id: classId });
    
    if (error) {
      console.error(`Error loading students for class ${classId}:`, error);
      return { 
        students: [], 
        error: `Failed to load class students: ${error.message}` 
      };
    }
    
    return { 
      students: data || [] 
    };
  } catch (error: any) {
    console.error(`Unexpected error loading students for class ${classId}:`, error);
    return { 
      students: [], 
      error: error?.message || 'An unexpected error occurred while loading class students' 
    };
  }
}

/**
 * Creates a new class
 * @param classData The class data to create
 * @returns A promise that resolves to the created class or an error
 */
export async function createClass(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>): Promise<{ class?: Class; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating class:', error);
      return { error: `Failed to create class: ${error.message}` };
    }
    
    return { class: data };
  } catch (error: any) {
    console.error('Unexpected error in createClass:', error);
    return { error: error?.message || 'An unexpected error occurred while creating class' };
  }
}

/**
 * Assigns a student to a class
 * @param userId The ID of the user to assign
 * @param classId The ID of the class to assign to
 * @returns A promise that resolves to success or an error
 */
export async function assignStudentToClass(userId: string, classId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    // First check if the class has room
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('max_students')
      .eq('id', classId)
      .single();
    
    if (classError) {
      console.error('Error fetching class details:', classError);
      return { error: `Failed to fetch class details: ${classError.message}` };
    }
    
    // Count current students
    const { count, error: countError } = await supabase
      .from('class_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', classId);
    
    if (countError) {
      console.error('Error counting students in class:', countError);
      return { error: `Failed to count students in class: ${countError.message}` };
    }
    
    if (count !== null && count >= classData.max_students) {
      return { error: 'Class is already at maximum capacity' };
    }
    
    // Create assignment
    const { error } = await supabase
      .from('class_assignments')
      .insert({
        user_id: userId,
        class_id: classId
      });
    
    if (error) {
      console.error('Error assigning student to class:', error);
      return { error: `Failed to assign student to class: ${error.message}` };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error in assignStudentToClass:', error);
    return { error: error?.message || 'An unexpected error occurred while assigning student to class' };
  }
}

/**
 * Gets classes that a student is assigned to
 * @param userId The ID of the user to get classes for
 * @returns A promise that resolves to the classes the student is assigned to
 */
export async function getStudentClasses(userId: string): Promise<ClassResponse> {
  try {
    // First get the class IDs this student is assigned to
    const { data: classAssignments, error: assignmentsError } = await supabase
      .from('class_assignments')
      .select('class_id')
      .eq('user_id', userId);
    
    if (assignmentsError) {
      console.error(`Error fetching class assignments for student ${userId}:`, assignmentsError);
      return { 
        classes: [], 
        error: `Failed to fetch student class assignments: ${assignmentsError.message}` 
      };
    }

    // If no assignments, return empty array
    if (!classAssignments || classAssignments.length === 0) {
      return { classes: [] };
    }

    // Extract class IDs
    const classIds = classAssignments.map(assignment => assignment.class_id);

    // Now get the actual classes
    const { data, error } = await supabase
      .from('classes')
      .select()
      .in('id', classIds);
    
    if (error) {
      console.error(`Error fetching classes for student ${userId}:`, error);
      return { 
        classes: [], 
        error: `Failed to fetch student classes: ${error.message}` 
      };
    }
    
    return { classes: data || [] };
  } catch (error: any) {
    console.error(`Unexpected error fetching classes for student ${userId}:`, error);
    return { 
      classes: [], 
      error: error?.message || 'An unexpected error occurred while fetching student classes' 
    };
  }
} 