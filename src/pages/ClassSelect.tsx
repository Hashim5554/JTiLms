import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import type { Class } from '../types';
import { Check, ShieldAlert, School, Loader2, GraduationCap } from 'lucide-react';
import { loadClasses, getStudentClasses } from '../utils/classUtils';

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
      loadAllClasses();
    }
  }, [user, navigate]);

  const loadStudentAssignments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const { classes: assignedClasses, error: assignmentsError } = await getStudentClasses(user.id);

      if (assignmentsError) {
        throw new Error(assignmentsError);
      }

      if (!assignedClasses || assignedClasses.length === 0) {
        setError('No classes have been assigned to you yet. Please contact your administrator.');
        setLoading(false);
        return;
      }

      // Sort classes by grade and section
      const sortedClasses = [...assignedClasses].sort((a, b) => {
        if (a.grade === b.grade) {
          return a.section.localeCompare(b.section);
        }
        return a.grade - b.grade;
      });

      setClasses(sortedClasses);
      setStudentAssignments(sortedClasses);

      // Auto-navigate if only one class
      if (sortedClasses.length === 1) {
        navigate(`/class/${sortedClasses[0].id}`);
        return;
      }
    } catch (error: any) {
      console.error('Error loading student assignments:', error);
      setError(error.message || 'Failed to load your class assignments');
    } finally {
      setLoading(false);
    }
  };

  const loadAllClasses = async () => {
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

      // Sort classes by grade and section
      const sortedClasses = [...loadedClasses].sort((a, b) => {
        if (a.grade === b.grade) {
          return a.section.localeCompare(b.section);
        }
        return a.grade - b.grade;
      });

      setClasses(sortedClasses);
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

      // Admin users can select any class, only check assignments for students
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

      // Store the selected class ID in localStorage
      localStorage.setItem('selectedClassId', classId);
      console.log('Selected class ID stored:', classId);
      
      // Set as selected in UI
      setSelectedClass(classData);
      
      // Use a small timeout to ensure localStorage is set before navigation
      setTimeout(() => {
        // Force reload to ensure App component picks up the new class ID
        window.location.href = '/';
      }, 500);
    } catch (error: any) {
      console.error('Error selecting class:', error);
      setError(error.message || 'Failed to select class');
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
      setError(`Cannot find class for Grade ${grade} Section ${section}`);
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

  // Group classes by grade
  const classGroups = classes.reduce<Record<number, Class[]>>((acc, cls) => {
    if (!acc[cls.grade]) {
      acc[cls.grade] = [];
    }
    acc[cls.grade].push(cls);
    return acc;
  }, {});

  // Define sections for visual display
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

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

      {/* Display classes grouped by grades */}
      <div className="max-w-7xl mx-auto">
        {Object.entries(classGroups).map(([grade, gradeClasses]) => {
          const numericGrade = parseInt(grade);
          return (
            <motion.div
              key={grade}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: numericGrade * 0.05 }}
              className="mb-10"
            >
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <GraduationCap className="w-6 h-6 mr-2 text-primary" />
                Grade {grade}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {sections.map(section => {
                  // Find class for this grade and section
                  const cls = gradeClasses.find(c => c.section.toUpperCase() === section);
                  const isAvailable = !!cls;
                  const isSelected = selectedClass?.id === cls?.id;
                  
                  // For admin users, all classes are selectable
                  // For students, only their assigned classes are selectable
                  const isSelectable = isAvailable && (
                    user?.role === 'ultra_admin' || 
                    user?.role === 'admin' || 
                    studentAssignments.some(c => cls && c.id === cls.id)
                  );
                  
                  return (
                    <motion.button
                      key={`${grade}-${section}`}
                      onClick={() => isSelectable && cls && selectClass(cls.id)}
                      whileHover={isSelectable ? { scale: 1.03 } : { scale: 1 }}
                      whileTap={isSelectable ? { scale: 0.98 } : { scale: 1 }}
                      disabled={!isSelectable}
                      className={`
                        p-6 rounded-2xl shadow-md text-center 
                        ${isSelected
                          ? 'bg-primary text-white'
                          : isSelectable
                            ? 'bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                        }
                        transition-all duration-300
                      `}
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="text-2xl md:text-3xl font-bold mb-2">{section}</div>
                        {isSelected ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="mt-2"
                          >
                            <Check className="w-6 h-6" />
                          </motion.div>
                        ) : isSelectable ? (
                          <span className="text-xs mt-1">
                            {user?.role === 'student' ? 'Your class' : 'Select'}
                          </span>
                        ) : (
                          <span className="text-xs mt-1">Not available</span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}