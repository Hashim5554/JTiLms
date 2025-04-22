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
  const { user, setUser } = useAuthStore();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedClassId = localStorage.getItem('selectedClassId');

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
      if (sessionError) throw sessionError;

      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) throw profileError;
        
        if (profile) {
          setUser(profile);
        }
      }
    } catch (error: any) {
      console.error('Error checking auth state:', error);
      setError(error.message);
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
  if (user.role !== 'ultra_admin') {
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
        {user.role === 'ultra_admin' && (
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