import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { useTheme } from '../hooks/useTheme';
import { 
  BookOpen, Calendar, Clock, FileText, GraduationCap, Home, Layout, Layers, 
  MessageSquare, Settings, Users, ChevronDown, ChevronRight, Plus, AlertCircle, Check, X
} from 'lucide-react';
import type { Class } from '../types';

interface ContextType {
  currentClass: Class | null;
  classes: Class[];
}

export function Dashboard() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const context = useOutletContext<ContextType>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalAssignments: 0,
    upcomingEvents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);

  // --- Data Loading ---
  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load stats and recent activity
        const { data: statsData, error: statsError } = await supabase
          .from('stats')
          .select('*')
          .single();
        if (statsError) throw statsError;
        setStats(statsData);

        const { data: activityData, error: activityError } = await supabase
          .from('recent_activity')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        if (activityError) throw activityError;
        setRecentActivity(activityData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  // --- Accessibility: Close dropdown on outside click ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setShowClassDropdown(false);
      }
    }
    if (showClassDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showClassDropdown]);

  // --- 3D/Scroll Animations ---
  const cardVariants = {
    initial: { opacity: 0, y: 40, rotateY: -10 },
    animate: { opacity: 1, y: 0, rotateY: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
    whileHover: { scale: 1.04, rotateY: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' },
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-red-600/80 to-red-900/90 pb-12 relative overflow-x-hidden">
      {/* 3D Hero Section */}
      <motion.div initial={{ scale: 0.95, opacity: 0, y: -40 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.7, type: 'spring', stiffness: 80 }} className="relative z-10">
        <div className="max-w-5xl mx-auto px-4 pt-16 pb-10">
          <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }} className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/30 rounded-3xl shadow-2xl p-10 flex flex-col items-center border border-white/30 dark:border-gray-800/40 relative overflow-hidden">
            <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }} className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-red-400/40 to-red-800/40 rounded-full blur-2xl z-0" />
            <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }} className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-red-200/40 to-red-700/40 rounded-full blur-2xl z-0" />
            <div className="relative z-10 flex flex-col items-center">
              <Home className="w-14 h-14 text-white drop-shadow-lg mb-4" />
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center mb-3 drop-shadow-lg">Dashboard</h1>
              <p className="text-lg text-white/80 text-center max-w-2xl mb-6">Welcome back! Here's an overview of your LMS activities and important updates.</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError(null)} className="ml-auto p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 flex items-center gap-3">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
              <button onClick={() => setSuccess(null)} className="ml-auto p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-800/50"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="bg-white/90 dark:bg-gray-900/80 rounded-3xl shadow-xl p-6 border border-white/30 dark:border-gray-800/40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                <GraduationCap className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Classes</h3>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.totalClasses}</p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="bg-white/90 dark:bg-gray-900/80 rounded-3xl shadow-xl p-6 border border-white/30 dark:border-gray-800/40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Students</h3>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalStudents}</p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="bg-white/90 dark:bg-gray-900/80 rounded-3xl shadow-xl p-6 border border-white/30 dark:border-gray-800/40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assignments</h3>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalAssignments}</p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="bg-white/90 dark:bg-gray-900/80 rounded-3xl shadow-xl p-6 border border-white/30 dark:border-gray-800/40">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.upcomingEvents}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="bg-white/90 dark:bg-gray-900/80 rounded-3xl shadow-xl p-6 border border-white/30 dark:border-gray-800/40 mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, idx) => (
              <motion.div key={activity.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{activity.description}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(activity.created_at).toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="bg-white/90 dark:bg-gray-900/80 rounded-3xl shadow-xl p-6 border border-white/30 dark:border-gray-800/40">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/classes')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <BookOpen className="w-6 h-6 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Classes</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/assignments')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Assignments</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/calendar')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Calendar</span>
            </motion.button>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate('/settings')} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
              <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Settings</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default Dashboard; 