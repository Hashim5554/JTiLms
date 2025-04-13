import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { Class } from '../types';
import { Check, ShieldAlert } from 'lucide-react';

export function ClassSelect() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classes, setClasses] = React.useState<Class[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedClass, setSelectedClass] = React.useState<Class | null>(null);

  React.useEffect(() => {
    loadClasses();
  }, [user]);

  const loadClasses = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name')
        .order('section');
      
      if (error) throw error;
      if (data) setClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectClass = (classId: string) => {
    localStorage.setItem('selectedClassId', classId);
    navigate('/');
  };

  const handleClassSelect = (grade: number, section: string) => {
    const classObj = classes.find(c => 
      parseInt(c.name) === grade && 
      c.section.toUpperCase() === section.toUpperCase()
    );
    if (classObj) {
      setSelectedClass(classObj);
      selectClass(classObj.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to LGS JTi LMS
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Select a class to manage
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          {[3, 4, 5, 6, 7, 8].map((grade) => (
            <div key={grade} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Grade {grade}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {['A', 'B', 'C', 'D', 'E', 'F'].map((section) => {
                  const isSelected = selectedClass?.name === grade.toString() && selectedClass?.section === section;
                  return (
                    <button
                      key={section}
                      onClick={() => handleClassSelect(grade, section)}
                      className={`p-4 rounded-2xl flex items-center justify-between transition-all duration-200 ${
                        isSelected
                          ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 ring-2 ring-red-600'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600'
                      }`}
                    >
                      <span className="text-lg font-medium">Section {section}</span>
                      {isSelected && <Check className="h-5 w-5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}