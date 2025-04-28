import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Announcements } from './pages/Announcements';
import { Subjects } from './pages/Subjects';
import { Library } from './pages/Library';
import { SubjectDetail } from './pages/SubjectDetail';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { ClassSelect } from './pages/ClassSelect';
import { CustomPage } from './pages/CustomPage';
import { Customize } from './pages/Customize';
import { RecordRoom } from './pages/RecordRoom';
import { AfternoonClubs } from './pages/AfternoonClubs';
import { useAuthStore } from './store/auth';
import { supabase } from './lib/supabase';
import { useTheme } from './hooks/useTheme';
import { setupRLSPolicies } from './lib/rls';
import { Profile, UserRole } from './types';

// Default ultraadmin user to use when no user is logged in
const defaultUltraAdmin: Profile = {
  id: 'ultraadmin',
  username: 'ultraadmin',
  role: 'ultra_admin',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

function App() {
  const { user, setUser, autoLogin } = useAuthStore();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedClassId = localStorage.getItem('selectedClassId');
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Ensure user is admin
  useEffect(() => {
    if (user && user.role !== 'ultra_admin' && user.role !== 'admin') {
      console.log('User is not an admin, setting to ultraadmin');
      setUser(defaultUltraAdmin);
    }
  }, [user, setUser]);

  useEffect(() => {
    checkUser();
    // Set initial theme class
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Initialize RLS policies
    setupRLSPolicies().catch(console.error);
  }, [theme]);

  async function checkUser() {
    try {
      setError(null);
      
      // Try auto-login first
      console.log('Attempting auto-login with ultraadmin');
      await autoLogin();
      setLoading(false);
      return;
    } catch (error) {
      console.error('Auto-login failed:', error);
      
      // As a fallback, try checking for an existing session
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (session?.user) {
          try {
            // First try to use our new get_user_profile function
            const { data: profileData, error: funcError } = await supabase.rpc(
              'get_user_profile', 
              { user_id: session.user.id }
            );

            if (!funcError && profileData && !profileData.error) {
              console.log('Profile retrieved using function');
              // Force admin role
              profileData.role = 'ultra_admin';
              setUser(profileData);
              return;
            }
            
            console.warn('Function approach failed, trying view:', funcError || profileData?.error);
            
            // Next try the view
            const { data: viewData, error: viewError } = await supabase
              .from('user_profiles_complete')
              .select('*')
              .eq('id', session.user.id)
              .single();
              
            if (!viewError && viewData) {
              console.log('Profile retrieved using view');
              // Force admin role
              viewData.role = 'ultra_admin';
              setUser(viewData);
              return;
            }
            
            console.warn('View approach failed, trying direct query:', viewError);
            
            // Try to get user profile directly
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.warn('Direct profile fetch error:', profileError);
              throw profileError;
            }
            
            if (profile) {
              // Force admin role
              profile.role = 'ultra_admin';
              setUser(profile);
            } else {
              throw new Error('Profile not found for current user');
            }
          } catch (error: any) {
            // If all else fails, try a more direct approach
            console.warn('All regular methods failed, using emergency fallback');
            
            try {
              // Get user email from session
              const userEmail = session.user.email;
              
              if (!userEmail) {
                throw new Error('User email not found in session');
              }
              
              // Try to get profile by email instead of ID
              const { data: profileByEmail, error: emailError } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', userEmail)
                .single();
                
              if (emailError) {
                console.error('Failed to get profile by email:', emailError);
                
                // Final emergency: create a basic profile
                const userId = session.user.id;
                
                console.log('Creating emergency profile for:', userId);
                
                const { error: createError } = await supabase
                  .from('profiles')
                  .insert([
                    { 
                      id: userId,
                      username: userEmail.split('@')[0],
                      email: userEmail,
                      role: 'ultra_admin', // Force ultra_admin role
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    }
                  ]);
                  
                if (createError) {
                  console.error('Failed to create emergency profile:', createError);
                  throw createError;
                }
                
                // Now fetch the profile we just created
                const { data: newProfile, error: newProfileError } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .single();
                  
                if (newProfileError) {
                  throw newProfileError;
                }
                
                if (newProfile) {
                  console.log('Using emergency created profile');
                  setUser(newProfile);
                  return;
                }
                
                throw new Error('Failed to create or retrieve profile');
              }
              
              if (profileByEmail) {
                console.log('Profile retrieved by email');
                // Force admin role
                profileByEmail.role = 'ultra_admin';
                setUser(profileByEmail);
                return;
              } else {
                throw new Error('Profile not found by email');
              }
            } catch (fallbackError) {
              console.error('All fallback approaches failed:', fallbackError);
              // As last resort, use default ultraadmin user
              console.log('Using default ultraadmin user');
              setUser(defaultUltraAdmin);
            }
          }
        } else {
          // No user session found, use default ultraadmin
          console.log('No session found, using default ultraadmin user');
          setUser(defaultUltraAdmin);
        }
      } catch (finalError) {
        // At this point, just use the default ultraadmin
        console.error('All authentication methods failed:', finalError);
        console.log('Using default ultraadmin user as final fallback');
        setUser(defaultUltraAdmin);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Always treat the user as logged in, even if authentication failed
  // This ensures the login page is never shown and force admin role
  const activeUser = user || defaultUltraAdmin;
  if (activeUser.role !== 'ultra_admin' && activeUser.role !== 'admin') {
    console.log('Forcing admin role');
    activeUser.role = 'ultra_admin';
  }

  // No need to check class for admin users
  if (window.location.pathname === '/select-class') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      <Route path="/select-class" element={<Navigate to="/" replace />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="subjects/:id" element={<SubjectDetail />} />
        <Route path="library" element={<Library />} />
        <Route path="record-room" element={<RecordRoom />} />
        <Route path="afternoon-clubs" element={<AfternoonClubs />} />
        <Route path="settings" element={<Settings />} />
        <Route path="custom/:path" element={<CustomPage />} />
        <Route path="users" element={<Users />} />
        <Route path="customize" element={<Customize />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App