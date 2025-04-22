import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { UserRole, Class } from '../types';
import { loadClasses as fetchClasses } from '../utils/classUtils';
import { 
  UserPlus, 
  X, 
  Loader2, 
  Eye, 
  EyeOff,
  Check,
  AlertCircle,
  GraduationCap,
  ChevronDown
} from 'lucide-react';

interface AddUserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showClassSelect, setShowClassSelect] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'student' as UserRole,
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    class_id: '',
  });

  // Load classes when component mounts
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
      // Create auth user using the direct function
      const { data: userData, error: userError } = await supabase.rpc('create_new_user', {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        username: formData.email.split('@')[0] // Default username from email
      });

      if (userError) throw userError;
      if (!userData || userData.error) {
        throw new Error(userData?.error || 'Failed to create user');
      }

      const userId = userData.id;
      
      // Update profile with additional details if needed
      if (formData.first_name || formData.last_name || formData.phone || formData.address) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone,
            address: formData.address,
          })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // If student, create class assignment
      if (formData.role === 'student' && formData.class_id) {
        const { error: assignmentError } = await supabase
          .from('class_assignments')
          .insert([{
            user_id: userId,
            class_id: formData.class_id,
          }]);

        if (assignmentError) throw assignmentError;
      }

      setFormData({
        email: '',
        password: '',
        role: 'student',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        class_id: '',
      });

      onSuccess?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message);
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h2>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
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
                {user?.role === 'admin' && (
                  <option value="admin">Admin</option>
                )}
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
                              setFormData({...formData, class_id: classItem.id});
                              setShowClassSelect(false);
                            }}
                          >
                            <GraduationCap className="h-4 w-4 mr-2 text-indigo-500" />
                            <span>Grade {classItem.grade} - Section {classItem.section}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-md bg-red-50 dark:bg-red-900/50 p-4"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 