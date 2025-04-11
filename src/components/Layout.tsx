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
  Calendar,
  Sun,
  Moon,
  Clock,
  CalendarDays,
  GraduationCap,
  BookMarked,
  NotebookPen
} from 'lucide-react';
import { getUnreadNotificationCount, markNotificationsAsRead } from '../lib/notifications';
import type { Class } from '../types/index';

interface NotificationCounts {
  announcements: number;
  subjects: number;
  library: number;
  recordRoom: number;
  clubs: number;
  timetable: number;
  dueWorks: number;
}

type NotificationType = 'announcement' | 'subject' | 'library' | 'record' | 'club' | 'timetable' | 'dueWork';

const notificationTypes: Record<keyof NotificationCounts, NotificationType> = {
  announcements: 'announcement',
  subjects: 'subject',
  library: 'library',
  recordRoom: 'record',
  clubs: 'club',
  timetable: 'timetable',
  dueWorks: 'dueWork'
};

export function Layout() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationCounts>({
    announcements: 0,
    subjects: 0,
    library: 0,
    recordRoom: 0,
    clubs: 0,
    timetable: 0,
    dueWorks: 0
  });
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentClass, setCurrentClass] = useState<Class | null>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Load notifications and classes
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadClasses();
    }
  }, [user]);

  // Update current class when selectedClassId changes
  useEffect(() => {
    if (selectedClassId) {
      const selectedClass = classes.find(c => c.id === selectedClassId);
      setCurrentClass(selectedClass || null);
    } else {
      setCurrentClass(null);
    }
  }, [selectedClassId, classes]);

  const loadNotifications = async () => {
    try {
      const notificationPromises = Object.entries(notificationTypes).map(
        async ([key, type]) => {
          const count = await getUnreadNotificationCount(type);
          return [key, count] as [keyof NotificationCounts, number];
        }
      );

      const results = await Promise.all(notificationPromises);
      const newNotifications = Object.fromEntries(results) as NotificationCounts;
      setNotifications(newNotifications);
    } catch (error) {
      setNotificationError('Failed to load notifications');
      console.error('Error loading notifications:', error);
    }
  };

  const loadClasses = async () => {
    if (!user) return;
    
    try {
      const { data: classData, error } = await supabase
        .from('classes')
        .select('*');

      if (error) throw error;
      if (!classData) return;

      setClasses(classData);
      const storedClassId = localStorage.getItem('selectedClassId');
      if (storedClassId && classData.some(c => c.id === storedClassId)) {
        setSelectedClassId(storedClassId);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleClassChange = async (classId: string) => {
    try {
      setSelectedClassId(classId);
      localStorage.setItem('selectedClassId', classId);
      navigate('/');
    } catch (error) {
      console.error('Error changing class:', error);
    }
  };

  const handleNotificationClick = async (key: keyof NotificationCounts) => {
    try {
      const type = notificationTypes[key];
      await markNotificationsAsRead(type);
      setNotifications(prev => ({ ...prev, [key]: 0 }));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">LGS JTi</h1>
          </div>

          {/* Class Selector */}
          {user?.role !== 'ultra_admin' && classes.length > 0 && (
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <select
                value={selectedClassId || ''}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select Class</option>
                {classes.map((class_) => (
                  <option key={class_.id} value={class_.id}>
                    {class_.grade} {class_.section}
                  </option>
                ))}
              </select>
            </div>
          )}

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
              to="/timetable" 
              icon={CalendarDays} 
              label="Timetable" 
              notificationCount={notifications.timetable}
            />
            <NavLink 
              to="/due-works" 
              icon={NotebookPen} 
              label="Due Works" 
              notificationCount={notifications.dueWorks}
            />
            <NavLink 
              to="/library" 
              icon={Library} 
              label="Library" 
              notificationCount={notifications.library}
            />
            <NavLink 
              to="/record-room" 
              icon={BookMarked} 
              label="Record Room" 
              notificationCount={notifications.recordRoom}
            />
            <NavLink 
              to="/afternoon-clubs" 
              icon={GraduationCap} 
              label="Afternoon Clubs" 
              notificationCount={notifications.clubs}
            />
            {user?.role === 'ultra_admin' && (
              <>
                <NavLink to="/users" icon={Users2} label="Users" />
                <NavLink to="/customize" icon={Palette} label="Customize" />
              </>
            )}
            <NavLink to="/settings" icon={Settings} label="Settings" />
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <ThemeToggle />
              <button
                onClick={signOut}
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <LogOut className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-6">
          <Outlet context={{ currentClass, selectedClassId, classes }} />
        </main>
      </div>
    </div>
  );
}