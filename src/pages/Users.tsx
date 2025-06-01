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
    // Allow admin and ultra_admin users to assign any role
    if (user?.role === 'ultra_admin' || user?.role === 'admin') {
      return true;
    }
    
    // For other users, use role hierarchy
    const roleHierarchy = {
      'ultra_admin': ['admin', 'teacher', 'student'] as UserRole[],
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

      // Create user directly with our simplified function
      const { data: userData, error: userError } = await supabase.rpc('create_new_user', {
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        username: newUser.username
      });

      if (userError) throw userError;
      if (!userData || userData.error) {
        throw new Error(userData?.error || 'Failed to create user');
      }

      const userId = userData.id;

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
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-3 sm:p-6"
    >
      {/* Header Section */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-4 sm:mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-primary/10 dark:bg-primary/20">
              <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
          <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddUserModal(true)}
            className="button-primary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2.5"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
            Add User
          </motion.button>
        </div>
      </motion.div>

      {/* Search and Filter Section */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4"
      >
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm sm:text-base"
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            Filters
            {isFilterOpen ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
          </motion.button>
          </div>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 sm:mt-4 space-y-3 sm:space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Role Filter
                  </label>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                  </select>
                </div>
          <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Sort By
            </label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
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
        className="space-y-3 sm:space-y-4"
      >
        {/* Error and Success Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3"
            >
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-300 text-sm sm:text-base">Error</h3>
                <p className="text-red-700 dark:text-red-400 text-xs sm:text-sm">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="ml-auto p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/50"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 dark:text-red-400" />
              </button>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-green-800 dark:text-green-300 text-sm sm:text-base">Success</h3>
                <p className="text-green-700 dark:text-green-400 text-xs sm:text-sm">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess(null)}
                className="ml-auto p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/50"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 dark:text-green-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {loading ? (
          <div className="flex justify-center items-center h-48 sm:h-64">
            <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary animate-spin" />
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
                className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10 dark:bg-primary/20">
                        <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          {user.username}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setEditingUser(user);
                          setEditingUserClasses(user.class_assignments?.map(ca => ca.class_id) || []);
                              setIsEditModalOpen(true);
                            }}
                        className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                          >
                        <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </motion.button>
                          <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                            onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </motion.button>
                        </div>
                  </div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 relative"
            >
                  <button
                    onClick={() => setShowAddUserModal(false)}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            </button>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Add New User
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter email address"
                  />
              </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Username
                    </label>
                      <input
                        type="text"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="Enter username"
                      />
      </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Password
                    </label>
                      <input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="Enter password"
                      />
                  </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Role
                    </label>
                      <select
                    value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                      </select>
                </div>

                {newUser.role === 'student' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Class
                      </label>
                    <div className="relative">
                      <button
                        onClick={() => setShowClassSelect(!showClassSelect)}
                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base flex items-center justify-between"
                      >
                        <span>{selectedClass ? `${selectedClass.grade}-${selectedClass.section}` : 'Select a class'}</span>
                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      {showClassSelect && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                          {classes.map((classItem) => (
                        <button
                              key={classItem.id}
                              onClick={() => {
                                setSelectedClass(classItem);
                                setShowClassSelect(false);
                              }}
                              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm sm:text-base"
                        >
                              {classItem.grade}-{classItem.section}
                        </button>
                          ))}
                      </div>
                    )}
                  </div>
              </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    onClick={handleAddUser}
                    disabled={!isFormValid}
                  className={`w-full mt-4 sm:mt-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                    !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  >
                  <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add User
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg p-4 sm:p-6 relative"
            >
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingUser(null);
                      setEditingUserClasses([]);
                    }}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                  </button>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Edit User
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Username
                  </label>
                      <input
                    type="text"
                    value={editingUser.username}
                    disabled
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed text-sm sm:text-base"
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Role
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => handleRoleChange(editingUser.id, e.target.value as UserRole)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                          </div>

                {editingUser.role === 'student' && (
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Class
                      </label>
                    <select
                      value={editingUserClasses[0] || ''}
                      onChange={e => setEditingUserClasses([e.target.value])}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
                    >
                      <option value="" disabled>Select a class</option>
                      {classes.map(classItem => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.grade}-{classItem.section}
                        </option>
                  ))}
                    </select>
                </div>
                )}
              </div>

              <div className="flex justify-end gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setEditingUser(null);
                      setEditingUserClasses([]);
                    }}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm sm:text-base transition-colors"
                  >
                    Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                    onClick={() => handleEditUserClasses(editingUser.id, editingUserClasses)}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm sm:text-base shadow-lg hover:shadow-xl transition-all"
                  >
                    Save Changes
                    </motion.button>
    </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}