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
import { UserRole } from './types';

function App() {
  const { user, setUser } = useAuthStore();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedClassId = localStorage.getItem('selectedClassId');

  useEffect(() => {
    checkUser();
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    setupRLSPolicies().catch(console.error);
  }, [theme]);

  async function checkUser() {
    try {
      setError(null);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session?.user) {
        // Get a simplified profile object
        const userId = session.user.id;
        const userEmail = session.user.email || '';
        let username = userEmail.split('@')[0];
        let role: UserRole = 'student';
        
        try {
          // Try to get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (!profileError && profile) {
            // Profile exists, use it
            setUser(profile);
            return;
          }
          
          // Create an emergency profile if none exists
          console.log('No existing profile found, creating one');
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              username,
              email: userEmail,
              role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }]);
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            throw insertError;
          }
          
          // Get the newly created profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (newProfile) {
            setUser(newProfile);
          } else {
            // Create a minimal user object as last resort
            setUser({
              id: userId,
              username,
              email: userEmail,
              role,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Profile error:', error);
          // Just use a minimal profile as absolute last resort
          setUser({
            id: userId,
            username,
            email: userEmail,
            role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
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

  if (!user) {
    return <Login />;
  }

  if (user.role !== 'ultra_admin' && user.role !== 'admin') {
    if (window.location.pathname === '/select-class') {
      return <ClassSelect />;
    }
    
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