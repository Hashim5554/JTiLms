import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { ThemeToggle } from './ThemeToggle';
import { 
  Home, 
  Bell, 
  BookOpen, 
  Library, 
  Settings, 
  Users,
  LogOut,
  Menu,
  X,
  FileText,
  Users2,
  Palette,
  Calendar
} from 'lucide-react';
import { getUnreadNotificationCount, markNotificationsAsRead } from '../lib/notifications';
import type { Class } from '../types';

interface NotificationCounts {
  announcements: number;
  subjects: number;
  library: number;
  recordRoom: number;
  clubs: number;
}

export function Layout() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);
  const [notifications, setNotifications] = useState<NotificationCounts>({
    announcements: 0,
    subjects: 0,
    library: 0,
    recordRoom: 0,
    clubs: 0
  });
  const [notificationError, setNotificationError] = useState<string | null>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (user) {
      loadCurrentClass();
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadCurrentClass = async () => {
    if (!user) return;
    
    const selectedClassId = localStorage.getItem('selectedClassId');
    if (!selectedClassId) {
      navigate('/class-select');
      return;
    }

    try {
      const { data: classData, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', selectedClassId)
        .single();

      if (error) throw error;
      if (!classData) {
        navigate('/class-select');
        return;
      }

      setCurrentClass(classData);
    } catch (error) {
      console.error('Error loading class:', error);
      navigate('/class-select');
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const path = location.pathname;
    let type = '';
    
    if (path === '/announcements') type = 'announcement';
    else if (path.startsWith('/subjects')) type = 'subject';
    else if (path === '/library') type = 'library';
    else if (path === '/record-room') type = 'record';
    else if (path === '/afternoon-clubs') type = 'club';
    
    if (type) {
      markNotificationsAsRead(type)
        .then(() => loadNotifications())
        .catch(error => {
          console.error('Error marking notifications as read:', error);
          setNotificationError('Failed to update notifications');
        });
    }
  }, [location.pathname, user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setNotificationError(null);
      const [
        announcementsCount,
        subjectsCount,
        libraryCount,
        recordCount,
        clubsCount
      ] = await Promise.all([
        getUnreadNotificationCount('announcement'),
        getUnreadNotificationCount('subject'),
        getUnreadNotificationCount('library'),
        getUnreadNotificationCount('record'),
        getUnreadNotificationCount('club')
      ]);

      setNotifications({
        announcements: announcementsCount,
        subjects: subjectsCount,
        library: libraryCount,
        recordRoom: recordCount,
        clubs: clubsCount
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotificationError('Failed to load notifications');
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('selectedClassId');
    await signOut();
    navigate('/');
  };

  const openTimetable = () => {
    window.open('https://lgs254f1.edupage.org/timetable/', '_blank');
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label, notificationCount = 0 }: { 
    to: string; 
    icon: React.ElementType; 
    label: string;
    notificationCount?: number;
  }) => (
    <Link
      to={to}
      className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
        isActive(to)
          ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
          : 'text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400'
      }`}
    >
      <Icon className={`h-5 w-5 mr-3 transition-transform duration-200 group-hover:scale-110 ${
        isActive(to) ? 'text-red-600 dark:text-red-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400'
      }`} />
      <span className="flex-1">{label}</span>
      {notificationCount > 0 && (
        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full animate-pulse">
          {notificationCount}
        </span>
      )}
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo section */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-8 w-8" />
              <span className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">LGS JTi</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Notification error message */}
          {notificationError && (
            <div className="px-4 py-2 bg-red-100 text-red-600 text-sm">
              {notificationError}
              <button
                onClick={loadNotifications}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <NavLink to="/" icon={Home} label="Home" />
            <NavLink 
              to="/announcements" 
              icon={Bell} 
              label="Announcements" 
              notificationCount={notifications.announcements}
            />
            <NavLink 
              to="/subjects" 
              icon={BookOpen} 
              label="Subjects" 
              notificationCount={notifications.subjects}
            />
            <NavLink 
              to="/library" 
              icon={Library} 
              label="Library" 
              notificationCount={notifications.library}
            />
            <NavLink 
              to="/record-room" 
              icon={FileText} 
              label="Record Room" 
              notificationCount={notifications.recordRoom}
            />
            <NavLink 
              to="/afternoon-clubs" 
              icon={Users2} 
              label="Afternoon Clubs" 
              notificationCount={notifications.clubs}
            />
            {user?.role === 'ultra_admin' && (
              <>
                <NavLink to="/users" icon={Users} label="Users" />
                <NavLink to="/customize" icon={Palette} label="Customize" />
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <button
              onClick={openTimetable}
              className="w-full button-secondary"
            >
              <Calendar className="h-5 w-5" />
              Timetable
            </button>
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handleSignOut}
                className="button-outline flex-1"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className={`
          fixed top-4 left-4 z-40 lg:hidden p-2 rounded-xl bg-white dark:bg-gray-800 
          shadow-lg border border-gray-200 dark:border-gray-700
          text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300
          transition-all duration-200
        `}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <main className="relative">
          <Outlet context={{ currentClass }} />
        </main>
      </div>

      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}