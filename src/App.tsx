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
import AfternoonClubs from './pages/AfternoonClubs';
import { useAuthStore } from './store/auth';
import { useTheme } from './hooks/useTheme';
import { setupRLSPolicies } from './lib/rls';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { supabase } from './lib/supabase';
import { Class, Profile } from './types';

// Component for pending users
function PendingAccess() {
  const { signOut, user, setUser } = useAuthStore();
  const [name, setName] = useState<string>(user?.username || '');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [classes, setClasses] = useState<Class[]>([]);
  
  useEffect(() => {
    async function fetchClasses() {
      console.log('Fetching classes for waitlist...');
      const { data, error } = await supabase.from('classes').select('*');
      if (!error && data) {
        console.log('Classes loaded:', data.length);
        setClasses(data as Class[]);
      } else {
        console.error('Error loading classes:', error);
      }
    }
    fetchClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    console.log('Submitting waitlist application:', { name, selectedClass, userId: user?.id });
    
    try {
      if (!user) throw new Error('No user found');
      
      // First, ensure the profile exists and update it
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          username: name,
          role: 'pending',
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }
      
      console.log('Profile updated successfully');
      
      // Update class assignment if selected
      if (selectedClass) {
        console.log('Adding class assignment:', selectedClass);
        
        // Remove any existing assignments first
        await supabase
          .from('class_assignments')
          .delete()
          .eq('user_id', user.id);
        
        // Add new assignment
        const { error: assignmentError } = await supabase
          .from('class_assignments')
          .insert([{
            user_id: user.id,
            class_id: selectedClass,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
        
        if (assignmentError) {
          console.error('Class assignment error:', assignmentError);
          throw assignmentError;
        }
        
        console.log('Class assignment added successfully');
      }
      
      setSuccess('You have joined the waitlist. Please wait for admin approval.');
      setSubmitted(true);
      setUser({ ...user, username: name });
      
      console.log('Waitlist application submitted successfully');
    } catch (err: any) {
      console.error('Waitlist submission error:', err);
      setError(err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Your account is currently pending approval. Please join the waitlist below and wait for an administrator to activate your account.
          </p>
        </div>
        {submitted ? (
          <div className="text-green-600 dark:text-green-400 font-semibold mb-4">{success}</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class</label>
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)} 
                required 
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select a class</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.grade || ''}-{cls.section || ''}
                  </option>
                ))}
              </select>
            </div>
            {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        )}
        <button
          onClick={() => signOut()}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-2"
        >
          Sign Out
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          If you believe this is an error, please contact your system administrator.
        </p>
      </div>
    </div>
  );
}

function RejectedAccess() {
  const { signOut } = useAuthStore();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Rejected</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Your account request was rejected. Please contact an administrator if you believe this is a mistake.
          </p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors mt-2"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user, setUser } = useAuthStore();
  const { session, user: sessionUser, loading: sessionLoading } = useSession();
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

  // Handle loading state based on session loading
  useEffect(() => {
    if (!sessionLoading) {
      setLoading(false);
    }
  }, [sessionLoading]);

  // Additional timeout to prevent infinite loading
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        console.log('AppRoutes: Loading timeout reached, forcing loading to false');
        setLoading(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          {sessionLoading && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Checking session...</p>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    // If sessionUser exists but user is null, show rejected message
    if (sessionUser) {
      return <RejectedAccess />;
    }
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