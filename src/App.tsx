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
import { useTheme } from './hooks/useTheme';
import { setupRLSPolicies } from './lib/rls';
import { SessionProvider, useSession } from './contexts/SessionContext';

// Component for pending users
function PendingAccess() {
  const { signOut } = useAuthStore();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Pending</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your account is currently pending approval. Please contact an administrator to activate your account.
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => signOut()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Sign Out
          </button>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, setUser } = useAuthStore();
  const { session, user: sessionUser } = useSession();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Sync session user to auth store
  useEffect(() => {
    if (sessionUser) {
      console.log('AppRoutes: Setting user from session context', sessionUser);
      setUser(sessionUser);
    } else {
      console.log('AppRoutes: Clearing user');
      setUser(null);
    }
  }, [sessionUser, setUser]);

  // Set theme and initialize RLS policies
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    setupRLSPolicies().catch(error => {
      console.warn('RLS policy setup failed, continuing anyway:', error);
    });
  }, [theme]);

  // Add a timeout to prevent infinite loading state
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        if (loading) {
          setLoading(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  useEffect(() => {
    if (session) setLoading(false);
  }, [session]);

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

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Check if user has pending access
  if (user.role === 'pending') {
    return <PendingAccess />;
  }

  const storedClassId = localStorage.getItem('selectedClassId');
  const isAdmin = user.role === 'ultra_admin' || user.role === 'admin';
  const needsClassSelection = isAdmin && !storedClassId && location.pathname !== '/select-class';

  if (needsClassSelection) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/select-class" replace />} />
      </Routes>
    );
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
        <Route path="users" element={<Users />} />
        <Route path="customize" element={<Customize />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <SessionProvider>
      <AppRoutes />
    </SessionProvider>
  );
}

export default App;