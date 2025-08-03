import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { UserRole, Profile, Class } from '../types';
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
  Lock,
  Clock as ClockIcon
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
  full_name?: string;
  class_assignments?: ClassAssignmentWithDetails[];
}

export function Users() {
  // State management
  const [users, setUsers] = useState<ExtendedProfile[]>([]);
  const [classes, setClasses] = useState<ExtendedClass[]>([]);
  const [classesMap, setClassesMap] = useState<Map<string, ExtendedClass>>(new Map());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showPendingUsers, setShowPendingUsers] = useState(false);
  const [sortField, setSortField] = useState<SortField>('username');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setExpandedUser(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // State for editing user's classes
  const [editingUserClasses, setEditingUserClasses] = useState<string[]>([]);
  const [isEditingClasses, setIsEditingClasses] = useState(false);

  // Load classes on component mount
  useEffect(() => {
    loadClasses();
  }, []);

  // Load users when component mounts or filters change
  useEffect(() => {
    loadUsers();
  }, [sortField, sortOrder]);

  const loadClasses = async () => {
    try {
      const { classes: loadedClasses, error } = await fetchClasses();
      if (error) {
        console.error('Error loading classes:', error);
        return;
      }
      if (loadedClasses) {
        setClasses(loadedClasses);
        const map = new Map();
        loadedClasses.forEach(cls => map.set(cls.id, cls));
        setClassesMap(map);
      }
    } catch (err) {
      console.error('Error in loadClasses:', err);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
      .from('profiles')
        .select(`
          *,
          class_assignments (
            id,
            class_id,
            created_at,
            class_details:classes (*)
          )
        `)
        .order(sortField, { ascending: sortOrder === 'asc' });

      const { data: usersData, error } = await query;
      
      if (error) throw error;
      
      if (usersData) {
        // Process class assignments - use the class_details from the query
        const processedUsers = usersData.map(user => ({
          ...user,
          class_assignments: user.class_assignments?.map((assignment: any) => ({
            ...assignment,
            class_details: assignment.class_details || null
          })) || []
        }));
        
        setUsers(processedUsers);
      }
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term, role filter, and pending status
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesPending = showPendingUsers ? user.role === 'pending' : user.role !== 'pending';
      
      return matchesSearch && matchesRole && matchesPending;
    });
  }, [users, searchTerm, roleFilter, showPendingUsers]);

  const canChangeRole = (currentRole: UserRole, newRole: UserRole) => {
    // Ultra admins can change any role
    if (currentRole === 'ultra_admin') return true;
    
    // Admins can change roles except ultra_admin
    if (currentRole === 'admin' && newRole !== 'ultra_admin') return true;
    
    // Teachers can only change student roles
    if (currentRole === 'teacher' && newRole === 'student') return true;
    
    return false;
  };

  const validateClassAssignment = async (classId: string) => {
    try {
      const { data: classData, error } = await supabase
        .from('classes')
        .select('id')
        .eq('id', classId)
        .single();

      if (error || !classData) {
        throw new Error('Invalid class selected');
      }

      return true;
    } catch (error) {
      console.error('Class validation error:', error);
      return false;
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
      
      setSuccess('User deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError(error.message || 'Failed to delete user');
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
      
      // Automatically assign all classes to admins and teachers
      if (newRole === 'admin' || newRole === 'teacher' || newRole === 'ultra_admin') {
        // Get all available classes
        const allClassIds = classes.map(cls => cls.id);
        
        if (allClassIds.length > 0) {
          // Remove any existing assignments first
          await supabase
            .from('class_assignments')
            .delete()
            .eq('user_id', userId);
          
          // Create assignments for all classes
          const assignments = allClassIds.map(classId => ({
            user_id: userId,
            class_id: classId,
          }));
          
          const { error: assignmentError } = await supabase
            .from('class_assignments')
            .insert(assignments);
          
          if (assignmentError) {
            console.error('Error assigning classes:', assignmentError);
            // Don't throw error here, just log it
          }
        }
      }
      
      setSuccess(`User role updated to ${newRole}!${(newRole === 'admin' || newRole === 'teacher' || newRole === 'ultra_admin') ? ' All classes have been assigned.' : ''}`);
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    } catch (error: any) {
      console.error('Error updating user role:', error);
      setError(error.message || 'Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePendingUser = async (userId: string, newRole: UserRole) => {
    setLoading(true);
    try {
      // Update user role
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      // Automatically assign all classes to admins and teachers
      if (newRole === 'admin' || newRole === 'teacher' || newRole === 'ultra_admin') {
        // Get all available classes
        const allClassIds = classes.map(cls => cls.id);
        
        if (allClassIds.length > 0) {
          // Remove any existing assignments first
          await supabase
            .from('class_assignments')
            .delete()
            .eq('user_id', userId);
          
          // Create assignments for all classes
          const assignments = allClassIds.map(classId => ({
            user_id: userId,
            class_id: classId,
          }));
          
          const { error: assignmentError } = await supabase
            .from('class_assignments')
            .insert(assignments);
          
          if (assignmentError) {
            console.error('Error assigning classes:', assignmentError);
            // Don't throw error here, just log it
          }
        }
      }
      
      setSuccess(`User approved and role set to ${newRole}!${(newRole === 'admin' || newRole === 'teacher' || newRole === 'ultra_admin') ? ' All classes have been assigned.' : ''}`);
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      setError(error.message || 'Failed to approve user');
    } finally {
      setLoading(false);
    }
  };



  const handleEditUserClasses = async (userId: string, newClasses: string[]) => {
    setIsEditingClasses(true);
    try {
      // Validate all classes first
      for (const classId of newClasses) {
        const isValid = await validateClassAssignment(classId);
        if (!isValid) {
          throw new Error(`Invalid class ID: ${classId}`);
        }
      }

      // Remove existing assignments
      const { error: deleteError } = await supabase
          .from('class_assignments')
          .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add new assignments
      if (newClasses.length > 0) {
        const assignments = newClasses.map(classId => ({
          user_id: userId,
          class_id: classId,
        }));

        const { error: insertError } = await supabase
          .from('class_assignments')
          .insert(assignments);

        if (insertError) throw insertError;
      }

      setSuccess('User classes updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      loadUsers();
      setEditingUserClasses([]);
    } catch (error: any) {
      console.error('Error updating user classes:', error);
      setError(error.message || 'Failed to update user classes');
    } finally {
      setIsEditingClasses(false);
    }
  };

  const getClassString = (user: ExtendedProfile) => {
    if (!user.class_assignments || user.class_assignments.length === 0) {
      return 'No classes assigned';
    }
    
    // For admins and teachers, show "All classes assigned" if they have all classes
    if (user.role === 'admin' || user.role === 'teacher' || user.role === 'ultra_admin') {
      const hasAllClasses = user.class_assignments.length === classes.length;
      if (hasAllClasses) {
        return 'All classes assigned';
      }
    }
    
    // For students or partial assignments, show individual classes
    return user.class_assignments
      .map(assignment => {
        const classDetails = assignment.class_details;
        return classDetails ? `Grade ${classDetails.grade}-${classDetails.section}` : 'Unknown Class';
      })
      .join(', ');
  };

  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ultra_admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'admin':
        return <KeyRound className="w-4 h-4 text-red-600" />;
      case 'teacher':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'student':
        return <User className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ultra_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'teacher':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'student':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const pendingUsers = users.filter(user => user.role === 'pending');
  const approvedUsers = users.filter(user => user.role !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Manage Google OAuth users and their access permissions
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {users.length} total users
                </span>
          </div>
        </div>
          </div>
          </div>

        {/* Pending Users Section */}
        {pendingUsers.length > 0 && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ClockIcon className="w-6 h-6 text-white" />
                </div>
          <div>
                    <h2 className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                      Pending Approvals
                    </h2>
                    <p className="text-yellow-700 dark:text-yellow-300">
                      {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} awaiting approval
                    </p>
                </div>
              </div>
              <button 
                  onClick={() => setShowPendingUsers(!showPendingUsers)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-yellow-700 dark:text-yellow-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm border border-yellow-200/50 dark:border-yellow-800/50"
              >
                  {showPendingUsers ? 'Hide' : 'Show'} Pending
                  {showPendingUsers ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              </div>
              
              {showPendingUsers && (
                <div className="space-y-4">
                                    {pendingUsers.map(user => (
                    <div key={user.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-yellow-200/50 dark:border-yellow-800/50 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/40 dark:to-orange-900/40 rounded-xl flex items-center justify-center shadow-sm">
                            <User className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                              {user.full_name || user.username}
                        </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user.email}
                        </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                              Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                        <div className="flex items-center gap-3">
                          <select
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent shadow-sm"
                            onChange={(e) => handleApprovePendingUser(user.id, e.target.value as UserRole)}
                            defaultValue=""
                          >
                            <option value="" disabled>Select Role</option>
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                  </div>
                </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                />
                      </div>
                    </div>
            <div className="flex items-center gap-4">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
                    </div>
                  </div>
              </div>

        {/* Users Table */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Classes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
        {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                        <span className="ml-2 text-gray-500">Loading users...</span>
          </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.full_name || user.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                      </div>
                    </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                  </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getClassString(user)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 relative dropdown-container">
                  <button
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                            <MoreVertical className="w-4 h-4" />
                  </button>

                          {/* Dropdown Menu */}
                          {expandedUser === user.id && (
                            <div className="absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 min-w-[200px]">
                              {/* Change Role */}
                              <div className="px-4 py-2">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                  Change Role
                  </label>
                  <select
                                  value={user.role}
                                  onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                                  <option value="ultra_admin">Ultra Admin</option>
                  </select>
                          </div>

                              {/* Edit Classes */}
                              <button
                                onClick={() => setEditingUserClasses([...editingUserClasses, user.id])}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit Classes
                              </button>
                              
                              {/* Delete User */}
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 flex items-center gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete User
                              </button>
                </div>
                )}
                  </div>
                      </td>
                    </tr>
                  ))
        )}
              </tbody>
            </table>
          </div>
              </div>

        {/* Edit Classes Modal */}
        {editingUserClasses.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Edit User Classes
                  </h3>
                  <button
                    onClick={() => setEditingUserClasses([])}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {editingUserClasses.map(userId => {
                  const user = users.find(u => u.id === userId);
                  if (!user) return null;
                  
                  const currentClasses = user.class_assignments?.map(a => a.class_id) || [];
                  
                  return (
                    <div key={userId} className="mb-6">
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {user.full_name || user.username}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Assign Classes
                  </label>
                        <div className="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
                          {classes.map(cls => (
                            <label key={cls.id} className="flex items-center space-x-2 py-1">
                              <input
                                type="checkbox"
                                checked={currentClasses.includes(cls.id)}
                                onChange={(e) => {
                                  const newClasses = e.target.checked
                                    ? [...currentClasses, cls.id]
                                    : currentClasses.filter(id => id !== cls.id);
                                  
                                  // Update the user's class assignments in state
                                  const updatedUsers = users.map(u => 
                                    u.id === userId 
                                      ? {
                                          ...u,
                                          class_assignments: newClasses.map(classId => ({
                                            id: '',
                                            user_id: userId,
                                            class_id: classId,
                                            created_at: new Date().toISOString(),
                                            class_details: classes.find(c => c.id === classId) || null
                                          }))
                                        }
                                      : u
                                  );
                                  setUsers(updatedUsers);
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-900 dark:text-white">
                                Grade {cls.grade}-{cls.section}
                              </span>
                      </label>
                          ))}
              </div>
              </div>

                      <div className="flex justify-end gap-2 mt-4">
              <button
                          onClick={() => setEditingUserClasses(editingUserClasses.filter(id => id !== userId))}
                          className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                    Cancel
              </button>
                        <button
                          onClick={() => {
                            const updatedUser = users.find(u => u.id === userId);
                            if (updatedUser) {
                              const newClasses = updatedUser.class_assignments?.map(a => a.class_id) || [];
                              handleEditUserClasses(userId, newClasses);
                              setEditingUserClasses(editingUserClasses.filter(id => id !== userId));
                            }
                          }}
                          disabled={isEditingClasses}
                          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isEditingClasses ? 'Saving...' : 'Save Changes'}
                        </button>
                </div>
                </div>
                  );
                })}
                </div>
                </div>
          </div>
        )}

        {/* Success/Error Messages */}
      <AnimatePresence>
          {success && (
          <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5" />
              {error}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}