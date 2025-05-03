import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { clearAllSessions } from './lib/supabase';
import { useTheme } from './hooks/useTheme';
import { setupRLSPolicies } from './lib/rls';

function App() {
  const { user, setUser } = useAuthStore();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Ensure user is admin if they exist
  useEffect(() => {
    if (user && user.role !== 'ultra_admin' && user.role !== 'admin') {
      console.log('User is not an admin, setting to ultraadmin');
      setUser({
        ...user,
        role: 'ultra_admin'
      });
    }
  }, [user, setUser]);

  // Set theme and initialize RLS policies
  useEffect(() => {
    // Set initial theme class
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    
    // Initialize RLS policies but don't block on errors
    setupRLSPolicies().catch(error => {
      console.warn('RLS policy setup failed, continuing anyway:', error);
    });
  }, [theme]);
  
  // Clear sessions only on first load of the application
  useEffect(() => {
    // Use sessionStorage to track if this is the first load
    const isFirstLoad = !sessionStorage.getItem('appInitialized');
    
    const initApp = async () => {
      if (isFirstLoad) {
        try {
          // Clear any existing sessions only on first load
          await clearAllSessions();
          console.log('First load: Sessions cleared, redirecting to login');
          // Mark that we've initialized the app
          sessionStorage.setItem('appInitialized', 'true');
          setUser(null);
        } catch (err) {
          console.error('Error during initialization:', err);
        }
      } else {
        console.log('App already initialized, skipping session clear');
      }
      
      // Always set loading to false
      setLoading(false);
    };
    
    initApp();
  }, [setUser]);

  // Add a timeout to prevent infinite loading state
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
          console.log('Loading timeout - forcing login page');
          setLoading(false);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

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

  // Check if user is logged out and redirect to login page
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }
  
  // Check if admin needs to select a class first
  const storedClassId = localStorage.getItem('selectedClassId');
  const isAdmin = user.role === 'ultra_admin' || user.role === 'admin';
  const needsClassSelection = isAdmin && !storedClassId && location.pathname !== '/select-class';
  
  // Redirect admins to class selection if no class is selected
  if (needsClassSelection) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/select-class" replace />} />
      </Routes>
    );
  }
  
  // Normal routing when user is logged in and class is selected (or user is a student)
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
        <Route path="users" element={<Users />} />
        <Route path="customize" element={<Customize />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App