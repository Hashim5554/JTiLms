import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { UserRole, Profile, Class } from '../types';
import { createUser } from '../lib/supabase';
import { 
  UserPlus, 
  Search, 
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  ChevronDown,
  X,
  Check,
  Loader2,
  Plus,
  User,
  Mail,
  Shield,
  GraduationCap,
  Users as UsersIcon,
  KeyRound,
  Building2,
  School,
  Calendar,
  Clock,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortField = 'username' | 'role' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface ClassAssignment {
  class_id: string;
  classes?: {
    grade: string;
    section: string;
  };
}

interface ExtendedProfile extends Profile {
  email?: string;
  class_assignments?: ClassAssignment[];
}

interface ExtendedClass extends Class {
  grade: string;
  section: string;
}

export function Users() {
  // State management
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [classes, setClasses] = useState<ExtendedClass[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    role: 'student' as UserRole,
    selectedClasses: [] as string[]
  });

  // Add new state for class selection
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

  // Add state for editing user's classes
  const [editingUserClasses, setEditingUserClasses] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExtendedProfile | null>(null);

  const user = useAuthStore((state) => state.user);

  // Load initial data
  useEffect(() => {
    loadClasses();
    loadUsers();
  }, []);

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('grade')
      .order('section');
    
    if (data) setClasses(data);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          class_assignments(
            class_id,
            classes(
              grade,
              section
            )
          )
        `)
        .order('username');
      
      if (error) throw error;
      if (data) {
        setUsers(data);
        setMessage(null);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      setMessage({ type: 'error', text: 'Failed to load users. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const modifier = sortOrder === 'asc' ? 1 : -1;
        return aValue > bValue ? modifier : -modifier;
      });
  }, [users, searchQuery, roleFilter, sortField, sortOrder]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.username || !newUser.password) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Add validation for student class selection
    if (newUser.role === 'student' && selectedClasses.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one class for the student' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      if (newUser.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Create user
      const { user: createdUser } = await createUser({
        email: newUser.email,
        password: newUser.password,
        username: newUser.username,
        role: newUser.role
      });

      if (!createdUser) throw new Error('Failed to create user');

      // Assign classes if any selected
      if (selectedClasses.length > 0) {
        const { error: assignmentError } = await supabase
          .from('class_assignments')
          .insert(
            selectedClasses.map(classId => ({
              user_id: createdUser.id,
              class_id: classId
            }))
          );

        if (assignmentError) throw assignmentError;
      }

      setMessage({ type: 'success', text: 'User created successfully!' });
      await loadUsers();
      setIsCreateModalOpen(false);
      setNewUser({
        email: '',
        username: '',
        password: '',
        role: 'student' as UserRole,
        selectedClasses: []
      });
      setSelectedClasses([]);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create user' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.filter(user => user.id !== userId));
      setMessage({ type: 'success', text: 'User deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete user' });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole as 'ultra_admin' | 'student' | 'teacher' } : user
      ));
      setMessage({ type: 'success', text: 'User role updated successfully' });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update user role' });
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle editing user classes
  const handleEditUserClasses = async (userId: string, newClasses: string[]) => {
    setLoading(true);
    try {
      // First, remove all existing class assignments
      const { error: deleteError } = await supabase
        .from('class_assignments')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Then, add new class assignments
      if (newClasses.length > 0) {
        const { error: insertError } = await supabase
          .from('class_assignments')
          .insert(
            newClasses.map(classId => ({
              user_id: userId,
              class_id: classId
            }))
          );

        if (insertError) throw insertError;
      }

      setMessage({ type: 'success', text: 'User classes updated successfully' });
      await loadUsers();
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditingUserClasses([]);
    } catch (error: any) {
      console.error('Error updating user classes:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update user classes' });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ultra_admin') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="text-center p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">Only ultra admins can view this page.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8"
    >
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20"
            >
              <UsersIcon className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage and monitor user accounts</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="btn btn-primary gap-2 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
          >
            <Plus className="w-5 h-5" />
            Create New User
          </motion.button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700"
              >
                <Search className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </motion.div>
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered w-full pl-12 bg-gray-50 dark:bg-gray-700 rounded-xl"
              />
            </div>
            <div className="relative">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700"
              >
                <Filter className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </motion.div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="select select-bordered pl-12 bg-gray-50 dark:bg-gray-700 rounded-xl"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'} mb-8 shadow-lg rounded-xl`}
          >
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
            <span>{message.text}</span>
          </motion.div>
        )}

        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-64"
          >
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </motion.div>
        ) : filteredUsers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg"
          >
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 dark:text-gray-300">No users found matching your criteria</p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="card bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden"
              >
                <div className="card-body p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20"
                      >
                        <User className="w-5 h-5 text-primary" />
                      </motion.div>
                      <div>
                        <h3 className="card-title text-lg font-semibold text-gray-900 dark:text-white">
                          {user.username}
                        </h3>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                          <div className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
                            <Mail className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                          </div>
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                    {user.role !== 'ultra_admin' && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setEditingUser(user);
                            setEditingUserClasses(user.class_assignments?.map(a => a.class_id) || []);
                            setIsEditModalOpen(true);
                          }}
                          className="btn btn-ghost btn-sm text-primary hover:text-primary/80 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl"
                        >
                          <Edit2 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700"
                      >
                        <Shield className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </motion.div>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="select select-bordered w-full bg-gray-50 dark:bg-gray-700 rounded-xl"
                        disabled={user.role === 'ultra_admin'}
                      >
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    {user.class_assignments && user.class_assignments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {user.class_assignments.map((assignment) => (
                          <motion.span
                            key={assignment.class_id}
                            whileHover={{ scale: 1.05 }}
                            className="badge badge-primary gap-1 bg-primary/10 text-primary border-0 rounded-xl"
                          >
                            <div className="p-1 rounded-lg bg-primary/20">
                              <GraduationCap className="w-3 h-3 text-primary" />
                            </div>
                            {assignment.classes?.grade} {assignment.classes?.section}
                          </motion.span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Last Active: {new Date(user.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Create User Modal */}
        <AnimatePresence>
          {isCreateModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20"
                  >
                    <UserPlus className="w-5 h-5 text-primary" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Create New User
                  </h2>
                </div>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text text-gray-900 dark:text-white">Email</span>
                    </label>
                    <div className="relative">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700"
                      >
                        <Mail className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </motion.div>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="input input-bordered w-full pl-12 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text text-gray-900 dark:text-white">Username</span>
                    </label>
                    <div className="relative">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700"
                      >
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </motion.div>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="input input-bordered w-full pl-12 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text text-gray-900 dark:text-white">Password</span>
                    </label>
                    <div className="relative">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700"
                      >
                        <KeyRound className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </motion.div>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="input input-bordered w-full pl-12 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">
                      <span className="label-text text-gray-900 dark:text-white">Role</span>
                    </label>
                    <div className="relative">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 rounded-xl bg-gray-100 dark:bg-gray-700"
                      >
                        <Shield className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      </motion.div>
                      <select
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                        className="select select-bordered w-full pl-12 bg-gray-50 dark:bg-gray-700 rounded-xl"
                        required
                      >
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                  </div>
                  {/* Add Class Selection for Students */}
                  {newUser.role === 'student' && (
                    <div>
                      <label className="label">
                        <span className="label-text text-gray-900 dark:text-white">Assigned Classes</span>
                      </label>
                      <div className="space-y-2">
                        {classes.map((classItem) => (
                          <motion.div
                            key={classItem.id}
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-700"
                          >
                            <input
                              type="checkbox"
                              id={`class-${classItem.id}`}
                              checked={selectedClasses.includes(classItem.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedClasses([...selectedClasses, classItem.id]);
                                } else {
                                  setSelectedClasses(selectedClasses.filter(id => id !== classItem.id));
                                }
                              }}
                              className="checkbox checkbox-primary"
                            />
                            <label
                              htmlFor={`class-${classItem.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-primary/10">
                                  <School className="w-4 h-4 text-primary" />
                                </div>
                                <span className="text-gray-900 dark:text-white">
                                  {classItem.grade} {classItem.section}
                                </span>
                              </div>
                            </label>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="btn btn-ghost rounded-xl"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="btn btn-primary rounded-xl"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Create User'
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Edit Modal */}
        <AnimatePresence>
          {isEditModalOpen && editingUser && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20"
                  >
                    <Edit2 className="w-5 h-5 text-primary" />
                  </motion.div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Edit User Classes
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    {classes.map((classItem) => (
                      <motion.div
                        key={classItem.id}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-gray-700"
                      >
                        <input
                          type="checkbox"
                          id={`edit-class-${classItem.id}`}
                          checked={editingUserClasses.includes(classItem.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingUserClasses([...editingUserClasses, classItem.id]);
                            } else {
                              setEditingUserClasses(editingUserClasses.filter(id => id !== classItem.id));
                            }
                          }}
                          className="checkbox checkbox-primary"
                        />
                        <label
                          htmlFor={`edit-class-${classItem.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-lg bg-primary/10">
                              <School className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-gray-900 dark:text-white">
                              {classItem.grade} {classItem.section}
                            </span>
                          </div>
                        </label>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingUser(null);
                        setEditingUserClasses([]);
                      }}
                      className="btn btn-ghost rounded-xl"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEditUserClasses(editingUser.id, editingUserClasses)}
                      className="btn btn-primary rounded-xl"
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Save Changes'
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}