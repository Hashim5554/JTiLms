import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import type { UserRole } from '../types';

const supabaseUrl = 'https://hovpbitodsfarvojjvqh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdnBiaXRvZHNmYXJ2b2pqdnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MzcwMTgsImV4cCI6MjA1MzMxMzAxOH0.La3MbLvfG42MzxJq610pMcQfjsmPgSg2IL4Ws86tB9o';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

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

export async function createUser({
  email,
  password,
  username,
  role = 'student',
}: {
  email: string;
  password: string;
  username: string;
  role?: UserRole;
}) {
  try {
    // Validate inputs
    if (!email || !password || !username) {
      throw new Error('Email, password, and username are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }

    // Validate password length
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // First check if username is taken
    const { data: existingUser, error: checkError } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new Error('Username already taken');
    }

    // Use the create_new_user RPC function if available
    try {
      const { data: userData, error: rpcError } = await supabase.rpc('create_new_user', {
        email,
        password,
        role,
        username
      });

      if (rpcError) throw rpcError;
      if (userData && userData.error) throw new Error(userData.error);

      // Success using RPC method
      return { 
        user: { 
          id: userData.id, 
          email: userData.email 
        }, 
        profile: userData 
      };
    } catch (rpcError) {
      console.warn('Failed to create user with RPC, falling back to direct method:', rpcError);
      
      // Fallback to direct method if RPC fails
      // Create auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role,
          },
        },
      });

      if (signUpError || !authData.user) {
        throw signUpError || new Error('Failed to create user');
      }

      // Create profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email,
            username,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
        ])
        .select()
        .single();

      if (profileError) {
        // Cleanup auth user if profile creation fails
        console.error('Failed to create profile, attempting to clean up auth user:', profileError);
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error('Failed to clean up auth user:', cleanupError);
        }
        throw profileError;
      }

      return { user: authData.user, profile };
    }
  } catch (error) {
    console.error('Create user error:', error);
    throw error;
  }
}

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
        console.error('Error assigning to class:', assignmentError);
      }
    }
  } catch (error) {
    console.error('Error in assignStudentToClass:', error);
  }
}

// Initialize default accounts if they don't exist
export async function initializeDefaultAdmin() {
  try {
    // Create admin if it doesn't exist
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin')
      .single();

    if (!existingAdmin) {
      await createUser({
        email: 'admin@lgs.edu.pk',
        password: 'admin1234',
        username: 'admin',
        role: 'admin'
      });
    }

    // Create ultra admin if it doesn't exist
    const { data: existingUltraAdmin } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'ultraadmin')
      .single();

    if (!existingUltraAdmin) {
      await createUser({
        email: 'ultraadmin@lgs.edu.pk',
        password: 'ultraadmin1234',
        username: 'ultraadmin',
        role: 'ultra_admin'
      });
    }

    // Create student if it doesn't exist
    const { data: existingStudent } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'student')
      .single();

    if (!existingStudent) {
      await createUser({
        email: 'student@lgs.edu.pk',
        password: 'student1234',
        username: 'student',
        role: 'student'
      });
    }
  } catch (error) {
    console.error('Error initializing accounts:', error);
  }
}