import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/SessionContext';
import { useTheme } from '../hooks/useTheme';
import { 
  BookOpen, Calendar, ChevronDown, ChevronRight, Plus, Trash2, Edit, Eye, 
  Users, AlertCircle, Check, X, GraduationCap, Clock, Layers
} from 'lucide-react';
import type { Class } from '../types';

interface ContextType {
  currentClass: Class | null;
  classes: Class[];
}

export function Classes() {
  const { user } = useSession();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const context = useOutletContext<ContextType>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [newClass, setNewClass] = useState({
    grade: '',
    section: '',
    subject: '',
    teacher: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'grade' | 'section' | 'subject'>('grade');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // --- Handlers ---
  const handleSortChange = (field: 'grade' | 'section' | 'subject') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handleCreateClass = async () => {
    if (!user) return;
    if (!newClass.grade.trim() || !newClass.section.trim() || !newClass.subject.trim() || !newClass.teacher.trim()) {
      setError('All fields are required');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          grade: newClass.grade.trim(),
          section: newClass.section.trim(),
          subject: newClass.subject.trim(),
          teacher: newClass.teacher.trim(),
        }])
        .select()
        .single();
      if (error) throw error;
      setSuccess('Class created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setShowCreateModal(false);
      setNewClass({ grade: '', section: '', subject: '', teacher: '' });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', selectedClass.id);
      if (error) throw error;
      setSuccess('Class deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setShowDeleteModal(false);
      setSelectedClass(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

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
              <GraduationCap className="w-14 h-14 text-white drop-shadow-lg mb-4" />
              <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center mb-3 drop-shadow-lg">Classes</h1>
              <p className="text-lg text-white/80 text-center max-w-2xl mb-6">Manage your classes, view student progress, and organize course materials.</p>
              <motion.button whileHover={{ scale: 1.07, rotate: 2 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-8 py-4 bg-white/90 text-red-700 rounded-2xl font-bold text-lg shadow-lg hover:bg-white/100 transition-all">
                <Plus className="w-6 h-6" /> Create New Class
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Search and sort controls */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto">
            <input type="text" placeholder="Search classes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-80 px-4 py-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" aria-label="Search classes" />
            <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => handleSortChange('grade')} className={`px-4 py-2 rounded-xl border transition-colors ${sortBy === 'grade' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}> <span>Grade</span> {sortBy === 'grade' && (<ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />)} </button>
            <button onClick={() => handleSortChange('section')} className={`px-4 py-2 rounded-xl border transition-colors ${sortBy === 'section' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}> <span>Section</span> {sortBy === 'section' && (<ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />)} </button>
            <button onClick={() => handleSortChange('subject')} className={`px-4 py-2 rounded-xl border transition-colors ${sortBy === 'subject' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}> <span>Subject</span> {sortBy === 'subject' && (<ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />)} </button>
          </div>
        </motion.div>

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

        {/* Classes grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block"><GraduationCap className="w-12 h-12 text-red-600 mx-auto mb-4 animate-spin" /></motion.div>
              <p className="text-gray-100 dark:text-gray-300">Loading classes...</p>
            </div>
          </div>
        ) : context.classes.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center py-20 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-md">
            <GraduationCap className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No classes found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{searchTerm ? 'No classes match your search criteria.' : 'Create your first class to get started.'}</p>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"><Plus className="w-5 h-5" />Create New Class</motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {context.classes.map((cls, idx) => (
              <motion.div key={cls.id} variants={cardVariants} initial="initial" whileInView="animate" whileHover="whileHover" viewport={{ once: true, amount: 0.3 }} transition={{ delay: idx * 0.06 }} className="group relative bg-white/90 dark:bg-gray-900/80 rounded-3xl shadow-xl overflow-hidden border border-white/30 dark:border-gray-800/40 transition-all duration-300 hover:shadow-2xl cursor-pointer" tabIndex={0} aria-label={`View or edit class ${cls.grade}-${cls.section}`}>
                {/* Card header with gradient */}
                <div className="h-24 bg-gradient-to-r from-red-500 to-red-700 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-lg"><GraduationCap className="w-5 h-5 text-white" /></div>
                    <h3 className="text-lg font-semibold text-white">Grade {cls.grade}-{cls.section}</h3>
                  </div>
                  <div className="p-2 bg-white/10 rounded-lg"><BookOpen className="w-5 h-5 text-white" /></div>
                </div>
                {/* Card content */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Subject</div>
                    <div className="text-gray-900 dark:text-white font-medium">{cls.subject}</div>
                  </div>
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Teacher</div>
                    <div className="text-gray-900 dark:text-white">{cls.teacher}</div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1"><Users className="w-4 h-4" /><span>24 Students</span></div>
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>Mon-Fri, 9:00 AM</span></div>
                  </div>
                </div>
                {/* Action buttons */}
                <div className="p-4 border-t border-white/30 dark:border-gray-800/40 flex justify-between">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/classes/${cls.id}`)} className="px-4 py-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"><Eye className="w-4 h-4" /><span>View</span></motion.button>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedClass(cls); setShowDeleteModal(true); }} className="p-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 className="w-4 h-4" /></motion.button>
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/classes/${cls.id}/edit`)} className="p-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"><Edit className="w-4 h-4" /></motion.button>
                  </div>
                </div>
                {/* 3D hover overlay */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: hoveredCard === cls.id ? 0.08 : 0 }} className="absolute inset-0 bg-white dark:bg-black pointer-events-none" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-lg relative border border-white/30 dark:border-gray-800/40 max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">Create New Class</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Grade</label>
                  <input type="text" value={newClass.grade} onChange={e => setNewClass({ ...newClass, grade: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" placeholder="Grade" aria-label="Grade" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Section</label>
                  <input type="text" value={newClass.section} onChange={e => setNewClass({ ...newClass, section: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" placeholder="Section" aria-label="Section" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Subject</label>
                  <input type="text" value={newClass.subject} onChange={e => setNewClass({ ...newClass, subject: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" placeholder="Subject" aria-label="Subject" />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Teacher</label>
                  <input type="text" value={newClass.teacher} onChange={e => setNewClass({ ...newClass, teacher: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" placeholder="Teacher" aria-label="Teacher" />
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCreateClass} className="w-full mt-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" /> Create Class
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedClass && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-md relative border border-white/30 dark:border-gray-800/40">
              <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">Delete Class</h2>
              <p className="text-gray-700 dark:text-gray-200 mb-6 text-center">Are you sure you want to delete Grade {selectedClass.grade}-{selectedClass.section}? This action cannot be undone.</p>
              <div className="flex gap-4 justify-center">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDeleteClass} className="px-6 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors flex items-center gap-2"><Trash2 className="w-5 h-5" />Delete</motion.button>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowDeleteModal(false)} className="px-6 py-2 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold transition-colors flex items-center gap-2"><X className="w-5 h-5" />Cancel</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Classes; 