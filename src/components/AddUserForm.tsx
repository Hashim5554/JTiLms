import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { UserRole, Class } from '../types';
import { loadClasses as fetchClasses } from '../utils/classUtils';
import { 
  UserPlus, 
  X, 
  Loader2, 
  GraduationCap,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

interface AddUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showClassSelect, setShowClassSelect] = useState(false);
  const [formData, setFormData] = useState({
    email: '', // This will be the Google Email
    role: 'student' as UserRole,
    username: '',
    full_name: '',
    class_id: '',
  });

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { classes: loadedClasses, error } = await fetchClasses();
      if (error) {
        console.error('Error loading classes:', error);
        return;
      }
      if (loadedClasses) {
        setClasses(loadedClasses);
      }
    } catch (err) {
      console.error('Error in loadClasses:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Insert into profiles table to pre-authorize the user
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
        email: formData.email,
          username: formData.username,
          full_name: formData.full_name,
        role: formData.role,
        })
        .select()
        .single();

        if (profileError) throw profileError;
      if (!profileData) throw new Error('Failed to create profile for user.');

      // Step 2: If student, create class assignment
      if (formData.role === 'student' && formData.class_id) {
        const { error: assignmentError } = await supabase
          .from('class_assignments')
          .insert([{
            user_id: profileData.id, // The ID from the newly created profile
            class_id: formData.class_id,
          }]);

        if (assignmentError) throw assignmentError;
      }

      // Reset form and call success callback
      setFormData({
        email: '',
        role: 'student',
        username: '',
        full_name: '',
        class_id: '',
      });
      onSuccess?.();

    } catch (error: any) {
      console.error('Error creating user profile:', error);
      if (error.message.includes('unique constraint')) {
        setError('A user with this email or username already exists.');
      } else {
      setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getSelectedClassName = () => {
    if (!formData.class_id) return null;
    const selectedClass = classes.find(c => c.id === formData.class_id);
    if (!selectedClass) return null;
    return `Grade ${selectedClass.grade} - Section ${selectedClass.section}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Authorize New User</h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Google Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Class
                </label>
                <div className="mt-1 relative">
                  <button
                    type="button"
                    onClick={() => setShowClassSelect(!showClassSelect)}
                    className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    {getSelectedClassName() || "Select a class"}
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>
                  {showClassSelect && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md overflow-auto max-h-60">
                      <ul className="py-1">
                        {classes.map(classItem => (
                          <li 
                            key={classItem.id}
                            className="px-3 py-2 flex items-center text-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, class_id: classItem.id }));
                              setShowClassSelect(false);
                            }}
                          >
                            <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                            Grade {classItem.grade} - Section {classItem.section}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

            {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md flex items-center text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
                </div>
            )}

          <div className="flex justify-end pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="mr-3 py-2 px-4 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {loading && <Loader2 className="animate-spin h-5 w-5 mr-2" />}
              Authorize User
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 