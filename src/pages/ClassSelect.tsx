import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface Class {
  id: string;
  grade: number;
  section: string;
  subject_id: string;
  teacher_id: string;
  academic_year: string;
  semester: string;
  max_students: number;
  created_at: string;
  updated_at: string;
}

const ClassSelect: React.FC = () => {
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          navigate('/login');
          return;
        }

        // If user is a student, check if they have a class assignment
        if (role === UserRole.Student) {
          const { data: assignment, error: assignmentError } = await supabase
            .from('class_assignments')
            .select('class_id')
            .eq('student_id', user.id)
            .single();

          if (assignmentError) {
            throw assignmentError;
          }

          if (!assignment) {
            setError('No classes assigned');
            setLoading(false);
            return;
          }

          // Redirect to the student's assigned class
          navigate(`/class/${assignment.class_id}`);
          return;
        }

        // For teachers, admins, and ultraadmins, fetch all classes
        const { data, error } = await supabase
          .from('classes')
          .select('*')
          .order('grade')
          .order('section');

        if (error) throw error;
        setClasses(data || []);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load classes');
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [user, role, navigate]);

  const handleClassSelect = (classId: string) => {
    navigate(`/class/${classId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Error</h2>
          <p className="text-gray-600 dark:text-gray-300">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Group classes by grade
  const classesByGrade = classes.reduce((acc, cls) => {
    if (!acc[cls.grade]) {
      acc[cls.grade] = [];
    }
    acc[cls.grade].push(cls);
    return acc;
  }, {} as Record<number, Class[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center"
        >
          Select a Class
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(classesByGrade).map(([grade, gradeClasses]) => (
            <motion.div
              key={grade}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Number(grade) * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-4 bg-blue-500 text-white">
                <h2 className="text-xl font-bold">Grade {grade}</h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                {gradeClasses.map((cls) => (
                  <motion.button
                    key={cls.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleClassSelect(cls.id)}
                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-800 dark:text-white">
                      Section {cls.section}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassSelect;