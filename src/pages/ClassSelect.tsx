import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { Class } from '../types';
import { Check, ShieldAlert, School, Loader2, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ClassSelect() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user || user.role === 'student') {
      navigate('/');
      return;
    }
    loadClasses();
  }, [user, navigate]);

  const loadClasses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('grade')
        .order('section');
      
      if (error) throw error;
      if (data) setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = async (classId: string) => {
    try {
      localStorage.setItem('selectedClassId', classId);
      navigate('/');
    } catch (error) {
      console.error('Error selecting class:', error);
      setError('Failed to select class. Please try again.');
    }
  };

  const handleClassSelect = (grade: number, section: string) => {
    const classObj = classes.find(c => 
      c.grade === grade && 
      c.section === section
    );
    if (classObj) {
      setSelectedClass(classObj);
      selectClass(classObj.id);
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading classes...</p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-2xl"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </motion.div>
      )}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg"
      >
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
        >
          <School className="w-8 h-8 text-primary" />
        </motion.div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to LGS JTi LMS
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Select a class to manage
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
      >
        {[3, 4, 5, 6, 7, 8].map((grade, gradeIndex) => (
          <motion.div 
            key={grade}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: gradeIndex * 0.1 }}
            className="border-b border-gray-200 dark:border-gray-700 last:border-b-0"
          >
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Grade {grade}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6">
              {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((section, sectionIndex) => {
                const classObj = classes.find(c => c.grade === grade && c.section === section);
                const isSelected = selectedClass?.grade === grade && selectedClass?.section === section;
                return (
                  <motion.button
                    key={section}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (gradeIndex * 8 + sectionIndex) * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => classObj && handleClassSelect(grade, section)}
                    disabled={!classObj}
                    className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/10 dark:bg-primary/20 text-primary ring-2 ring-primary'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary'
                    } ${!classObj ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-lg font-medium">Section {section}</span>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 10 }}
                      >
                        <Check className="h-5 w-5" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}