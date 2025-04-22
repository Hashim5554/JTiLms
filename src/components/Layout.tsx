import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { ThemeToggle } from './ThemeToggle';
import { Logo } from './Logo';
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
  Palette,
  Calendar,
  Sun,
  Moon,
  Clock,
  CalendarDays,
  GraduationCap,
  BookMarked,
  NotebookPen,
  Users2
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
}

type NotificationType = 'announcement' | 'subject' | 'library' | 'record' | 'club' | 'timetable';

const notificationTypes: Record<keyof NotificationCounts, NotificationType> = {
  announcements: 'announcement',
  subjects: 'subject',
  library: 'library',
  recordRoom: 'record',
  clubs: 'club',
  timetable: 'timetable'
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
    timetable: 0
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
      const newNotifications = Object.fromEntries(results) as unknown as NotificationCounts;
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
      if (!classData || classData.length === 0) {
        console.warn("No classes found in database");
        return;
      }

      console.log("Classes loaded:", classData.length);
      setClasses(classData);
      
      // Get the stored class ID
      const storedClassId = localStorage.getItem('selectedClassId');
      console.log("Stored class ID:", storedClassId);
      
      if (storedClassId) {
        const classExists = classData.some(c => c.id === storedClassId);
        console.log("Class exists:", classExists);
        
        if (classExists) {
          console.log("Setting selected class ID:", storedClassId);
          setSelectedClassId(storedClassId);
          
          // Navigate to home if we're on the select page
          if (location.pathname === '/select-class') {
            console.log("Navigating to home from select page");
            navigate('/');
          }
        } else {
          console.warn("Stored class ID not found in available classes");
          // Class ID not found, clear it
          localStorage.removeItem('selectedClassId');
        }
      } else {
        console.log("No stored class ID found");
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo and brand */}
          <div className="px-4 py-5 flex items-center justify-center border-b border-gray-200 dark:border-gray-700">
            <Link to="/" className="flex items-center space-x-3">
              <Logo width={40} height={40} className="flex-shrink-0" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">EduLearn</span>
            </Link>
          </div>

          {/* Navigation links */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
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
              icon={Users} 
              label="Clubs" 
              notificationCount={notifications.clubs} 
            />
            {user?.role === 'ultra_admin' && (
              <>
                <NavLink to="/users" icon={Users2} label="Users" />
                <NavLink to="/customize" icon={Palette} label="Customize" />
              </>
            )}
          </nav>

          {/* Class Selector */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              to="/select-class"
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <GraduationCap className="h-5 w-5 mr-2" />
              <span>Change Class</span>
            </Link>
          </div>

          {/* User Info, Timetable, and Logout */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Timetable Button */}
            <a
              href="https://lgs254f1.edupage.org/timetable/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              <CalendarDays className="h-5 w-5 mr-2" />
              <span>Timetable</span>
            </a>

            {/* User Info and Logout */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {user?.role}
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu */}
      <div className="md:hidden">
        <div className="fixed inset-0 flex z-40">
          {/* Mobile menu backdrop */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Mobile menu sidebar */}
          <div 
            className={`fixed inset-y-0 left-0 flex flex-col w-full sm:w-64 bg-white dark:bg-gray-800 transform transition-transform duration-300 ease-in-out ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Mobile menu header */}
            <div className="px-4 py-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
              <Link to="/" className="flex items-center space-x-3" onClick={() => setIsMobileMenuOpen(false)}>
                <Logo width={40} height={40} className="flex-shrink-0" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">EduLearn</span>
              </Link>
              <button 
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile navigation links */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
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
                icon={Users} 
                label="Clubs" 
                notificationCount={notifications.clubs} 
              />
              {user?.role === 'ultra_admin' && (
                <>
                  <NavLink to="/users" icon={Users2} label="Users" />
                  <NavLink to="/customize" icon={Palette} label="Customize" />
                </>
              )}
            </nav>

            {/* Class Selector */}
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/select-class"
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                <span>Change Class</span>
              </Link>
            </div>

            {/* User Info, Timetable, and Logout */}
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {/* Timetable Button */}
              <a
                href="https://lgs254f1.edupage.org/timetable/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                <CalendarDays className="h-5 w-5 mr-2" />
                <span>Timetable</span>
              </a>

              {/* User Info and Logout */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top navigation bar */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 md:px-8 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400"
                onClick={() => setIsMobileMenuOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              
              {/* Show Logo and brand name on mobile */}
              <div className="md:hidden flex items-center space-x-3">
                <Logo width={32} height={32} className="flex-shrink-0" />
                <span className="text-lg font-bold text-gray-900 dark:text-white">EduLearn</span>
              </div>
            </div>

            {/* ... existing right side elements (notifications, theme toggle, etc.) ... */}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1">
          <div className="px-4 sm:px-6 md:px-8 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}