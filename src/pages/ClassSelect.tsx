import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import type { Class } from '../types';
import { Check, ShieldAlert, School, Loader2, GraduationCap } from 'lucide-react';
import { loadClasses } from '../utils/classUtils';

export function ClassSelect() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studentAssignments, setStudentAssignments] = useState<Class[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'student') {
      loadStudentAssignments();
    } else {
      loadClasses();
    }
  }, [user, navigate]);

  const loadStudentAssignments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const { data: assignments, error: assignmentError } = await supabase
        .from('class_assignments')
        .select(`
          class_id,
          classes (
            id,
            grade,
            section,
            name,
            max_students
          )
        `)
        .eq('user_id', user.id);

      if (assignmentError) {
        console.error('Error fetching assignments:', assignmentError);
        throw new Error('Failed to load your class assignments');
      }

      if (!assignments || assignments.length === 0) {
        setError('No classes have been assigned to you yet. Please contact your administrator.');
        setLoading(false);
        return;
      }

      const classData = assignments
        .map(a => a.classes)
        .filter((c): c is Class => c !== null)
        .sort((a, b) => {
          if (a.grade === b.grade) {
            return a.section.localeCompare(b.section);
          }
          return a.grade - b.grade;
        });

      if (classData.length === 0) {
        setError('No valid classes found for your assignments');
        setLoading(false);
        return;
      }

      setClasses(classData);
      setStudentAssignments(classData);

      if (classData.length === 1) {
        navigate(`/class/${classData[0].id}`);
        return;
      }
    } catch (error: any) {
      console.error('Error loading student assignments:', error);
      setError(error.message || 'Failed to load your class assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      const { classes: loadedClasses, error: loadError } = await loadClasses();

      if (loadError) {
        throw new Error(loadError);
      }

      if (!loadedClasses || loadedClasses.length === 0) {
        setError('No classes found in the system');
        setLoading(false);
        return;
      }

      setClasses(loadedClasses);
    } catch (error: any) {
      console.error('Error loading classes:', error);
      setError(error.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const selectClass = async (classId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .single();

      if (classError || !classData) {
        throw new Error('Invalid class selection');
      }

      if (user?.role === 'student') {
        const { data: assignment, error: assignmentError } = await supabase
          .from('class_assignments')
          .select('*')
          .eq('user_id', user.id)
          .eq('class_id', classId)
          .single();

        if (assignmentError || !assignment) {
          throw new Error('You are not assigned to this class');
        }
      }

      localStorage.setItem('selectedClassId', classId);
      navigate(`/class/${classId}`);
    } catch (error: any) {
      console.error('Error selecting class:', error);
      setError(error.message || 'Failed to select class');
    } finally {
      setLoading(false);
    }
  };

  const handleClassSelect = (grade: number, section: string) => {
    const classObj = classes.find(c => 
      c.grade === grade && 
      c.section.toLowerCase() === section.toLowerCase()
    );

    if (classObj) {
      setSelectedClass(classObj);
      selectClass(classObj.id);
    } else {
      setError('Invalid class selection');
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

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full"
        >
          <div className="w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <School className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {user?.role === 'student' ? 'No Classes Assigned' : 'Error'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
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
          {user?.role === 'student' ? 'Your Classes' : 'Select a Class'}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          {user?.role === 'student' ? 'Choose a class to view' : 'Select a class to manage'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
      >
        {[3, 4, 5, 6, 7, 8].map((grade, gradeIndex) => {
          const gradeClasses = classes.filter(c => c.grade === grade);
          if (gradeClasses.length === 0) return null;

          return (
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
                  const isAssigned = user?.role === 'student' ? 
                    studentAssignments.some(a => a.grade === grade && a.section === section) : 
                    true;

                  return (
                    <motion.button
                      key={section}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (gradeIndex * 8 + sectionIndex) * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => classObj && handleClassSelect(grade, section)}
                      disabled={!classObj || !isAssigned}
                      className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                        isSelected
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary ring-2 ring-primary'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-primary/5 dark:hover:bg-primary/10 hover:text-primary'
                      } ${!classObj || !isAssigned ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          );
        })}
      </motion.div>
    </div>
  );
}