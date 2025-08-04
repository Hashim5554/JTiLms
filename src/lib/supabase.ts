import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import type { UserRole } from '../types';

const supabaseUrl = 'https://hovpbitodsfarvojjvqh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdnBiaXRvZHNmYXJ2b2pqdnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MzcwMTgsImV4cCI6MjA1MzMxMzAxOH0.La3MbLvfG42MzxJq610pMcQfjsmPgSg2IL4Ws86tB9o';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.x'
    }
  }
});

// Utility function to check if error is "not found"
export const isNotFoundError = (error: any) => {
  return error?.code === 'PGRST116';
};

// Validate database connection
export const validateConnection = async () => {
  try {
    const { error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Global session manager
let sessionRefreshPromise: Promise<boolean> | null = null;

// Validate session and refresh if needed
export const validateSession = async () => {
  try {
    // Prevent multiple simultaneous refresh attempts
    if (sessionRefreshPromise) {
      return await sessionRefreshPromise;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      console.error('Session validation failed:', error);
      return false;
    }
    
    // Check if session is expired or about to expire
    const expiresAt = session.expires_at;
    if (expiresAt) {
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = expiresAt - now;
      
      // If session expires in less than 10 minutes, refresh it
      if (timeUntilExpiry < 600) {
        console.log('Session expiring soon, refreshing...');
        
        sessionRefreshPromise = (async () => {
          try {
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Session refresh failed:', refreshError);
              return false;
            }
            console.log('Session refreshed successfully');
            return true;
          } finally {
            sessionRefreshPromise = null;
          }
        })();
        
        return await sessionRefreshPromise;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Session validation error:', error);
    sessionRefreshPromise = null;
    return false;
  }
};

// Global database operation wrapper
export const dbOperation = async <T>(
  operation: () => Promise<T>,
  fallbackValue: T,
  operationName: string = 'Database operation'
): Promise<T> => {
  try {
    // Validate session before any database operation
    const sessionValid = await validateSession();
    if (!sessionValid) {
      console.error(`${operationName}: Session validation failed`);
      return fallbackValue;
    }

    console.log(`${operationName}: Starting operation`);
    const result = await operation();
    console.log(`${operationName}: Operation completed successfully`);
    return result;
  } catch (error) {
    console.error(`${operationName}: Operation failed:`, error);
    return fallbackValue;
  }
};

// Enhanced error handling for auth
export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('Attempting to sign in with email:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Authentication error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check your credentials and try again.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please verify your email address before signing in.');
      } else {
        throw new Error(error.message || 'Authentication failed. Please try again.');
      }
    }

    console.log('Sign in successful:', data?.user?.id);
    return data;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export async function updateUserProfile(
  userId: string,
  updates: {
    username?: string;
    photo_url?: string | null;
    role?: UserRole;
  }
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserPassword(newPassword: string) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

async function assignStudentToClass(userId: string, grade: number, section: string) {
  try {
    // Get the class ID for 7C
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('grade', grade)
      .eq('section', section)
      .single();

    if (classError || !classData) {
      console.error('Error finding class:', classError);
      return;
    }

    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('class_assignments')
      .select('id')
      .eq('user_id', userId)
      .eq('class_id', classData.id)
      .single();

    if (!existingAssignment) {
      // Create class assignment
      const { error: assignmentError } = await supabase
        .from('class_assignments')
        .insert([
          {
            user_id: userId,
            class_id: classData.id,
          },
        ]);

      if (assignmentError) {
        console.error('Error creating class assignment:', assignmentError);
      }
    }
  } catch (error) {
    console.error('Error in assignStudentToClass:', error);
  }
}

export async function clearAllSessions() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    console.error('Clear sessions error:', error);
    throw new Error(error.message || 'Failed to clear sessions');
  }
}

async function createAdminProfile(email: string, username: string, role: UserRole) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([
        {
          email,
          username,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Create admin profile error:', error);
    throw error;
  }
}

export async function initializeDefaultAdmin() {
  try {
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'admin@lgs.edu.pk')
      .single();

    if (existingAdmin) {
      console.log('Admin already exists');
      return existingAdmin;
    }

    // Create default admin
    const adminProfile = await createAdminProfile('admin@lgs.edu.pk', 'admin', 'ultra_admin');
    console.log('Default admin created:', adminProfile);
    return adminProfile;
  } catch (error: any) {
    console.error('Initialize default admin error:', error);
    throw error;
  }
}