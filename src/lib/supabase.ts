import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';
import type { UserRole } from '../types';

const supabaseUrl = 'https://hovpbitodsfarvojjvqh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhvdnBiaXRvZHNmYXJ2b2pqdnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3MzcwMTgsImV4cCI6MjA1MzMxMzAxOH0.La3MbLvfG42MzxJq610pMcQfjsmPgSg2IL4Ws86tB9o';

// Get the current URL for OAuth redirects
const getRedirectUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For SSR, we'll let the client handle the redirect
  return undefined;
};

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with error handling and proper redirect URL
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    redirectTo: getRedirectUrl(),
  },
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

// Debug function to check current redirect URL
export const debugOAuthRedirect = () => {
  const currentUrl = window.location.origin;
  console.log('Current OAuth redirect URL:', currentUrl);
  console.log('Full current URL:', window.location.href);
  return currentUrl;
};

// OAuth sign-in with proper redirect URL
export const signInWithOAuth = async (provider: 'google' | 'github' | 'discord') => {
  try {
    const redirectUrl = debugOAuthRedirect();
    console.log(`Attempting to sign in with ${provider}, redirect URL: ${redirectUrl}`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('OAuth authentication error:', error);
      throw new Error(error.message || 'OAuth authentication failed. Please try again.');
    }

    console.log('OAuth sign in initiated:', data);
    return data;
  } catch (error: any) {
    console.error('OAuth sign in error:', error);
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
    const { data: existingUser, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      throw new Error('Username already taken');
    }

    // Use the Supabase Auth Admin API to create the user
    const { data: userData, error: adminError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        role,
      },
    });

    if (adminError) throw adminError;
    if (!userData || !userData.user) throw new Error('Failed to create user');

    // The trigger on auth.users will create the profile row automatically
    // Optionally, fetch the profile after creation
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (profileError) {
      // Profile may not be immediately available due to trigger timing
      return { user: userData.user, profile: null };
    }

    return { user: userData.user, profile };
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

// Function to clear any existing sessions
export async function clearAllSessions() {
  try {
    await supabase.auth.signOut({ scope: 'global' });
    console.log('All sessions cleared');
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('selectedClassId');
    
    // Clear any other auth-related items in localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('supabase') || key.includes('auth') || key.includes('session')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing sessions:', error);
  }
}

// Helper function to create admin profile directly
async function createAdminProfile(email: string, username: string, role: UserRole) {
  try {
    // Try to get the auth user ID first
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user?.id) {
      throw new Error(`Auth user not found for email: ${email}`);
    }
    
    // Create the profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([{
        id: user.id,
        email,
        username,
        role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return profile;
  } catch (error) {
    console.error(`Failed to create profile for ${email}:`, error);
    throw error;
  }
}

// Initialize default accounts if they don't exist
export async function initializeDefaultAdmin() {
  try {
    // Check if auth user exists first to avoid user_already_exists errors
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingEmails = new Set(
      authUsers?.users?.map(user => user.email?.toLowerCase()) || []
    );
    
    // Check if admin exists in profiles
    const { data: existingAdmin, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'admin')
      .maybeSingle();

    if (!existingAdmin && !adminError && !existingEmails.has('admin@lgs.edu.pk')) {
      try {
        await createUser({
          email: 'admin@lgs.edu.pk',
          password: 'admin1234',
          username: 'admin',
          role: 'admin'
        });
        console.log('Admin user created successfully');
      } catch (error: any) {
        // Ignore user_already_exists errors
        if (error?.name === 'AuthApiError' && error?.code === 'user_already_exists') {
          console.log('Admin user already exists in auth but not in profiles');
          // Try to create just the profile
          try {
            await createAdminProfile('admin@lgs.edu.pk', 'admin', 'admin');
          } catch (profileError) {
            console.warn('Failed to create admin profile:', profileError);
          }
        } else {
          console.error('Error creating admin user:', error);
        }
      }
    }

    // Check if ultra admin exists in profiles
    const { data: existingUltraAdmin, error: ultraAdminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'ultraadmin')
      .maybeSingle();

    if (!existingUltraAdmin && !ultraAdminError && !existingEmails.has('ultraadmin@lgs.edu.pk')) {
      try {
        await createUser({
          email: 'ultraadmin@lgs.edu.pk',
          password: 'ultraadmin1234',
          username: 'ultraadmin',
          role: 'ultra_admin'
        });
        console.log('Ultra admin user created successfully');
      } catch (error: any) {
        // Ignore user_already_exists errors
        if (error?.name === 'AuthApiError' && error?.code === 'user_already_exists') {
          console.log('Ultra admin user already exists in auth but not in profiles');
          // Try to create just the profile
          try {
            await createAdminProfile('ultraadmin@lgs.edu.pk', 'ultraadmin', 'ultra_admin');
          } catch (profileError) {
            console.warn('Failed to create ultra admin profile:', profileError);
          }
        } else {
          console.error('Error creating ultra admin user:', error);
        }
      }
    }

    // Check if student exists in profiles
    const { data: existingStudent, error: studentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'student')
      .maybeSingle();

    if (!existingStudent && !studentError && !existingEmails.has('student@lgs.edu.pk')) {
      try {
        const studentUser = await createUser({
          email: 'student@lgs.edu.pk',
          password: 'student1234',
          username: 'student',
          role: 'student'
        });

        // Assign student to class 7C
        if (studentUser?.user?.id) {
          await assignStudentToClass(studentUser.user.id, 7, 'C');
        }
        console.log('Student user created successfully');
      } catch (error: any) {
        // Ignore user_already_exists errors
        if (error?.name === 'AuthApiError' && error?.code === 'user_already_exists') {
          console.log('Student user already exists in auth but not in profiles');
          // Try to create just the profile
          try {
            const profile = await createAdminProfile('student@lgs.edu.pk', 'student', 'student');
            // Assign student to class 7C if profile was created
            if (profile?.id) {
              await assignStudentToClass(profile.id, 7, 'C');
            }
          } catch (profileError) {
            console.warn('Failed to create student profile:', profileError);
          }
        } else {
          console.error('Error creating student user:', error);
        }
      }
    }

    console.log('Default accounts initialized');
  } catch (error) {
    console.error('Error initializing accounts:', error);
    // Don't throw the error to prevent breaking the app
    return null;
  }
}