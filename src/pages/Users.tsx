import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { UserRole, Profile, Class } from '../types';
import { createUser } from '../lib/supabase';
import { loadClasses as fetchClasses } from '../utils/classUtils';
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
  Info,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  UserMinus,
  ChevronUp,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type SortField = 'username' | 'role' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface ClassAssignment {
  id: string;
  user_id: string;
  class_id: string;
  created_at: string;
}

interface ExtendedClass extends Class {
  subject_name?: string;
}

interface ClassAssignmentWithDetails extends ClassAssignment {
  class_details?: ExtendedClass | null;
}

interface ExtendedProfile extends Profile {
  email?: string;
  class_assignments?: ClassAssignmentWithDetails[];
}

export function Users() {
  // State management
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [classes, setClasses] = useState<ExtendedClass[]>([]);
  const [classesMap, setClassesMap] = useState<Map<string, ExtendedClass>>(new Map());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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

  // Add new state for class selection
  const [selectedClass, setSelectedClass] = useState<ExtendedClass | null>(null);
  const [showClassSelect, setShowClassSelect] = useState(false);

  // Add new state for add user modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  // Load initial data
  useEffect(() => {
    loadClasses();
    loadUsers();
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

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');
        
      if (profilesError) throw profilesError;
      
      // Get class assignments
      const { data: classAssignments, error: classAssignmentsError } = await supabase
        .from('class_assignments')
        .select('*');
        
      if (classAssignmentsError) {
        console.error('Error loading class assignments:', classAssignmentsError);
        // Continue with profiles even if class assignments fail
      }
      
      // Get classes
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*');
        
      if (classesError) {
        console.error('Error loading classes:', classesError);
        // Continue with profiles even if classes fail
      }
      
      // Create a map of user IDs to their class assignments
      const userClassAssignmentsMap = new Map();
      if (classAssignments) {
        classAssignments.forEach((assignment: ClassAssignment) => {
          const userId = assignment.user_id;
          if (!userClassAssignmentsMap.has(userId)) {
            userClassAssignmentsMap.set(userId, []);
          }
          userClassAssignmentsMap.get(userId).push(assignment);
        });
      }
      
      // Create a map of class IDs to class objects for quick lookup
      const newClassesMap = new Map();
      if (classes) {
        classes.forEach((classObj: ExtendedClass) => {
          newClassesMap.set(classObj.id, classObj);
        });
      }
      setClassesMap(newClassesMap);
      
      // Combine profiles with their class assignments
      const usersWithAssignments = profiles?.map(profile => {
        const userAssignments = userClassAssignmentsMap.get(profile.id) || [];
        
        // Add class details to each assignment
        const enhancedAssignments = userAssignments.map((assignment: ClassAssignment) => {
          const classDetails = newClassesMap.get(assignment.class_id);
          return {
            ...assignment,
            class_details: classDetails || null
          };
        });
        
        // Update role if it's 'ultra_admin' to 'admin'
        let updatedRole = profile.role;
        if (updatedRole === 'ultra_admin') {
          updatedRole = 'admin';
        }
        
        return {
          ...profile,
          role: updatedRole as UserRole,
          class_assignments: enhancedAssignments
        } as ExtendedProfile;
      }) || [];
      
      setUsers(usersWithAssignments);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Add validation for role changes
  const canChangeRole = (currentRole: UserRole, newRole: UserRole) => {
    const roleHierarchy = {
      'admin': ['teacher', 'student'] as UserRole[],
      'teacher': ['student'] as UserRole[],
      'student': [] as UserRole[]
    } as Record<UserRole, UserRole[]>;
    return roleHierarchy[currentRole]?.includes(newRole) || false;
  };

  // Add validation for class assignments
  const validateClassAssignment = async (classId: string) => {
    const classItem = classes.find(c => c.id === classId);
    if (!classItem) return false;
    
    try {
      // Get the class's max students limit
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('max_students')
        .eq('id', classId)
        .single();

      if (classError) throw classError;
      if (!classData?.max_students) return false;

      // Count current students in the class
      const { count, error: countError } = await supabase
        .from('class_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId);

      if (countError) throw countError;
      
      return count !== null && count < classData.max_students;
    } catch (error) {
      console.error('Error validating class assignment:', error);
      return false;
    }
  };

  // Add filter functionality
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        const modifier = sortOrder === 'asc' ? 1 : -1;
        return aValue > bValue ? modifier : -modifier;
      });
  }, [users, searchTerm, roleFilter, sortField, sortOrder]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.email || !newUser.username || !newUser.password) {
      setError('Please fill in all required fields');
      return;
    }

    // Add validation for student class selection
    if (newUser.role === 'student' && selectedClasses.length === 0) {
      setError('Please select at least one class for the student');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (newUser.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUser.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate username format (alphanumeric and underscores only)
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(newUser.username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
      }

      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', newUser.username)
        .single();

      if (existingUser) {
        throw new Error('Username is already taken');
      }

      // Validate class assignments
      if (newUser.role === 'student' && selectedClasses.length > 0) {
        const classValidations = await Promise.all(
          selectedClasses.map(classId => validateClassAssignment(classId))
        );

        if (classValidations.some(isValid => !isValid)) {
          throw new Error('One or more selected classes are full or invalid');
        }
      }

      // Create user
      const result = await createUser({
        email: newUser.email,
        password: newUser.password,
        username: newUser.username,
        role: newUser.role
      });

      if (!result || !result.user) {
        throw new Error('Failed to create user');
      }

      // Assign classes if any selected
      if (selectedClasses.length > 0) {
        const { error: assignmentError } = await supabase
          .from('class_assignments')
          .insert(
            selectedClasses.map(classId => ({
              user_id: result.user.id,
              class_id: classId
            }))
          );

        if (assignmentError) throw assignmentError;
      }

      setSuccess('User created successfully!');
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
      setError(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      // Delete from profiles table first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) throw profileError;

      // Delete any class assignments
      const { error: assignmentError } = await supabase
        .from('class_assignments')
        .delete()
        .eq('user_id', userId);

      if (assignmentError) throw assignmentError;

      // Delete from auth.users table using RPC
      const { error: authError } = await supabase.rpc('delete_user', { user_id: userId });
      if (authError) throw authError;
      
      setUsers(users.filter(user => user.id !== userId));
      setSuccess('User deleted successfully');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (!canChangeRole(users.find(u => u.id === userId)?.role as UserRole, newRole)) {
      setError('You do not have permission to assign this role');
      setTimeout(() => setError(null), 3000);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      setSuccess('User role updated successfully');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      setError(error.message || 'Failed to update user role');
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

      setSuccess('User classes updated successfully');
      await loadUsers();
      setIsEditModalOpen(false);
      setEditingUser(null);
      setEditingUserClasses([]);
    } catch (error: any) {
      console.error('Error updating user classes:', error);
      setError(error.message || 'Failed to update user classes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!isFormValid) return;

    try {
      setLoading(true);
      setError(null);

      // Create auth user using RPC function
      const { data: authData, error: authError } = await supabase.rpc('create_user_with_admin_api', {
        user_email: newUser.email,
        user_password: newUser.password,
        user_data: {
          username: newUser.username,
          role: newUser.role
        }
      });

      if (authError) throw authError;
      if (!authData || authData.error) throw new Error(authData?.error || 'Failed to create user');

      const userId = authData.id;

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
        }]);

      if (profileError) throw profileError;

      // If student, create class assignment
      if (newUser.role === 'student' && selectedClass) {
        const { error: assignmentError } = await supabase
          .from('class_assignments')
          .insert([{
            user_id: userId,
            class_id: selectedClass.id,
          }]);

        if (assignmentError) throw assignmentError;
      }

      // Refresh users list
      loadUsers();
      setShowAddUserModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        role: 'student',
        selectedClasses: []
      });
      setSelectedClass(null);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = !loading && !error && newUser.email && newUser.username && newUser.password;

  const getClassString = (user: ExtendedProfile) => {
    if (!user || !user.class_assignments || !user.class_assignments.length) return 'No assigned class';
    
    return user.class_assignments.map((ca) => {
      const classObj = classesMap.get(ca.class_id);
      if (!classObj) return '';
      return `${classObj.grade}-${classObj.section}`;
    }).filter(Boolean).join(', ');
  };

  if (user?.role !== 'admin' && user?.role !== 'ultra_admin') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
      >
        <div className="text-center p-8 rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
          <Shield className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300">Only administrators can view this page.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6"
    >
      {/* Header Section */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 dark:bg-primary/20">
              <UsersIcon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddUserModal(true)}
            className="button-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add User
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            <Filter className="w-5 h-5" />
            Filters
            {isFilterOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </motion.button>
        </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role Filter
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="username">Username</option>
                    <option value="email">Email</option>
                    <option value="role">Role</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Users List */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <AnimatePresence>
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 dark:bg-primary/20">
                        <UsersIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {user.username}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {expandedUser === user.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedUser === user.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Role
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
                                <Shield className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                              </div>
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                disabled={user.role === 'admin'}
                              >
                                <option value="teacher">Teacher</option>
                                <option value="student">Student</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Assigned Classes
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {user.class_assignments?.map((assignment) => (
                                <motion.span
                                  key={assignment.class_id}
                                  whileHover={{ scale: 1.05 }}
                                  className="px-3 py-1 rounded-xl bg-primary/10 text-primary text-sm flex items-center gap-1"
                                >
                                  <GraduationCap className="w-4 h-4" />
                                  {assignment.class_details && (
                                    <>Grade {assignment.class_details.grade} - Section {assignment.class_details.section}</>
                                  )}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setEditingUser(user);
                              setEditingUserClasses(user.class_assignments?.map(a => a.class_id) || []);
                              setIsEditModalOpen(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-2"
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit Classes
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete User
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New User</h2>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        className="input-primary pl-10 w-full"
                        placeholder="Enter username"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="input-primary pl-10 w-full"
                        placeholder="Enter email"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="input-primary pl-10 w-full"
                        placeholder="Enter password"
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Shield className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        value={newUser.role || 'student'}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                        className="input-primary pl-10 w-full"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Class Selection (for students) */}
                {newUser.role === 'student' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Assign to Class
                      </label>
                      <button
                        onClick={() => setShowClassSelect(true)}
                        className="text-sm text-primary hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                      >
                        Select Class
                      </button>
                    </div>
                    {selectedClass ? (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                            <GraduationCap className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Grade {selectedClass.grade} - Section {selectedClass.section}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {selectedClass.subject_name}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedClass(null)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No class selected
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={!isFormValid}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create User
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Classes Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit Classes for {editingUser.username}
                  </h2>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingUser(null);
                      setEditingUserClasses([]);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {classes.map((classItem) => (
                    <motion.div
                      key={classItem.id}
                      whileHover={{ scale: 1.01 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                            <GraduationCap className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Grade {classItem.grade} - Section {classItem.section}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {classItem.subject_name}
                            </p>
                          </div>
                        </div>
                      </label>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingUser(null);
                      setEditingUserClasses([]);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEditUserClasses(editingUser.id, editingUserClasses)}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-600 rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Class Selection Modal */}
      <AnimatePresence>
        {showClassSelect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Select Class</h2>
                  <button
                    onClick={() => setShowClassSelect(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 gap-2">
                  {classes.map((class_) => (
                    <motion.button
                      key={class_.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setSelectedClass(class_);
                        setShowClassSelect(false);
                      }}
                      className={`p-3 rounded-xl border transition-colors flex items-center gap-3 ${
                        selectedClass?.id === class_.id
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                        <GraduationCap className="w-4 h-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          Grade {class_.grade} - Section {class_.section}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {class_.subject_name}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error and Success Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-2xl shadow-lg flex items-center gap-2"
          >
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 p-4 rounded-2xl shadow-lg flex items-center gap-2"
          >
            <Check className="w-5 h-5" />
            <p>{success}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}