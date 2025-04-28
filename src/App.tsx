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

function App() {
  const { user, setUser, autoLogin } = useAuthStore();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedClassId = localStorage.getItem('selectedClassId');
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

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
              const username = userEmail.split('@')[0];
              const role = 'student';
              
              console.log('Creating emergency profile for:', userId);
              
              const { error: createError } = await supabase
                .from('profiles')
                .insert([
                  { 
                    id: userId,
                    username,
                    email: userEmail,
                    role,
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
              setUser(profileByEmail);
              return;
            } else {
              throw new Error('Profile not found by email');
            }
          } catch (fallbackError) {
            console.error('All fallback approaches failed:', fallbackError);
            throw error; // Throw the original error
          }
        }
      } else if (!autoLoginAttempted) {
        // If no user is logged in and we haven't tried auto-login yet, try it
        console.log('No user logged in, attempting auto-login with ultraadmin');
        setAutoLoginAttempted(true);
        await autoLogin();
      }
    } catch (error: any) {
      console.error('Error checking auth state:', error);
      setError(error.message || 'Authentication error');
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-8 rounded-lg bg-white shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // If no user is logged in, show login page
  if (!user) {
    return <Login />;
  }

  // Handle class selection more gracefully:
  // 1. ultra_admin doesn't need a class
  // 2. If we're explicitly on the select-class path, show that
  // 3. Otherwise, show class select only if no class is selected
  if (user.role !== 'ultra_admin' && user.role !== 'admin') {
    // If we're explicitly trying to select a class, show the selector
    if (window.location.pathname === '/select-class') {
      return <ClassSelect />;
    }
    
    // Otherwise, only show class select if there's no class selected
    if (!selectedClassId) {
      return <ClassSelect />;
    }
  }

  return (
    <Routes>
      <Route path="/select-class" element={<ClassSelect />} />
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
        {(user.role === 'ultra_admin' || user.role === 'admin') && (
          <>
            <Route path="users" element={<Users />} />
            <Route path="customize" element={<Customize />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App