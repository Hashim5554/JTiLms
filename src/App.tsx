import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider, useSession } from './contexts/SessionContext';
import { supabase } from './lib/supabase';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Classes } from './pages/Classes';
import { ClassSelect } from './pages/ClassSelect';
import { Subjects } from './pages/Subjects';
import { SubjectDetail } from './pages/SubjectDetail';
import { Assignments } from './pages/Assignments';
import { Announcements } from './pages/Announcements';
import { Library } from './pages/Library';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Customize } from './pages/Customize';
import { CustomPage } from './pages/CustomPage';
import { RecordRoom } from './pages/RecordRoom';
import AfternoonClubs from './pages/AfternoonClubs';
import { Other } from './pages/Other';
import { loadClasses } from './utils/classUtils';
import { Clock, AlertTriangle } from 'lucide-react';


// Pending Access Component
function PendingAccess() {
  const { user } = useSession();
  
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 dark:from-yellow-900/10 dark:via-orange-900/10 dark:to-amber-900/10 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-200/30 dark:bg-yellow-800/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-orange-200/30 dark:bg-orange-800/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-amber-200/20 dark:bg-amber-800/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="max-w-md w-full bg-white/90 dark:bg-gray-800/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-yellow-200/50 dark:border-yellow-800/30 p-8 text-center relative z-10">
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Access Pending
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
            Your account is awaiting approval from an administrator.
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl p-6 mb-8 border border-yellow-200/50 dark:border-yellow-800/30">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-lg">
                What happens next?
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                An administrator will review your account and assign you the appropriate role and permissions. You'll be notified once your access is granted.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <p><span className="font-semibold text-gray-700 dark:text-gray-200">Email:</span> {user?.email || 'N/A'}</p>
              <p><span className="font-semibold text-gray-700 dark:text-gray-200">Username:</span> {user?.username}</p>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string[] }) {
  const { user, loading } = useSession();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is pending
  if (user.role === 'pending') {
    return <PendingAccess />;
  }

  // Check role requirements
  if (requiredRole && !requiredRole.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Main App Component
function AppContent() {
  const { user, loading } = useSession();
  const [classes, setClasses] = useState<any[]>([]);
  const [currentClass, setCurrentClass] = useState<any>(null);

  useEffect(() => {
    const loadClassesData = async () => {
      try {
        const { classes: classesData, error } = await loadClasses();
        if (error) {
          console.error('Error loading classes:', error);
          return;
        }
        if (classesData) {
          setClasses(classesData);
        }
      } catch (err) {
        console.error('Error in loadClassesData:', err);
      }
    };

    loadClassesData();
  }, []);

  useEffect(() => {
    const savedClassId = localStorage.getItem('selectedClassId');
    if (savedClassId && classes.length > 0) {
      const savedClass = classes.find(cls => cls.id === savedClassId);
      if (savedClass) {
        setCurrentClass(savedClass);
      }
    }
  }, [classes]);

  const handleClassChange = (selectedClass: any) => {
    setCurrentClass(selectedClass);
    if (selectedClass) {
      localStorage.setItem('selectedClassId', selectedClass.id);
    } else {
      localStorage.removeItem('selectedClassId');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Show pending access for pending users
  if (user?.role === 'pending') {
    return <PendingAccess />;
  }

  return (
    <>
      <Routes>
        {/* Standalone routes without sidebar */}
        <Route path="/class-select" element={<ClassSelect />} />
        <Route path="/select-class" element={<ClassSelect />} />
        
        {/* Routes with sidebar */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="classes" element={<Classes />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/:id" element={<SubjectDetail />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="library" element={<Library />} />
          <Route path="users" element={<ProtectedRoute requiredRole={['admin', 'ultra_admin']}><Users /></ProtectedRoute>} />
          <Route path="settings" element={<Settings />} />
          <Route path="customize" element={<ProtectedRoute requiredRole={['admin', 'ultra_admin']}><Customize /></ProtectedRoute>} />
          <Route path="custom/:path" element={<CustomPage />} />
          <Route path="record-room" element={<ProtectedRoute requiredRole={['admin', 'ultra_admin', 'teacher', 'student']}><RecordRoom /></ProtectedRoute>} />
          <Route path="afternoon-clubs" element={<AfternoonClubs />} />
          <Route path="other" element={<Other />} />
        </Route>
      </Routes>
    </>
  );
}

// Root App Component with Session Provider
function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;