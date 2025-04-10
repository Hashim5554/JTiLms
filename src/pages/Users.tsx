import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { UserRole, Profile, Class } from '../types';
import { createUser } from '../lib/supabase';
import { UserPlus, Check, X } from 'lucide-react';

export function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadClasses();
    loadUsers();
  }, []);

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('grade', { ascending: true })
      .order('section', { ascending: true });
    
    if (data) setClasses(data);
  };

  const loadUsers = async () => {
    const { data } = await supabase
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
      `);
    
    if (data) setUsers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      setLoading(false);
      return;
    }

    try {
      // Create user with helper function
      const { user: newUser } = await createUser({
        email: newEmail,
        password: newPassword,
        username: newUsername,
        role: newRole
      });

      // Assign classes
      if (selectedClasses.length > 0) {
        const { error: assignmentError } = await supabase
          .from('class_assignments')
          .insert(
            selectedClasses.map(classId => ({
              user_id: newUser.id,
              class_id: classId
            }))
          );

        if (assignmentError) throw assignmentError;
      }

      setMessage({ type: 'success', text: 'User created successfully!' });
      loadUsers();
      
      // Clear form
      setNewEmail('');
      setNewUsername('');
      setNewPassword('');
      setNewRole('student');
      setSelectedClasses([]);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignClass = async (userId: string, classId: string, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        // Remove class assignment
        const { error } = await supabase
          .from('class_assignments')
          .delete()
          .eq('user_id', userId)
          .eq('class_id', classId);
        
        if (error) throw error;
      } else {
        // Add class assignment
        const { error } = await supabase
          .from('class_assignments')
          .insert([{
            user_id: userId,
            class_id: classId
          }]);
        
        if (error) throw error;
      }
      
      // Reload users to update the UI
      loadUsers();
      setMessage({ type: 'success', text: 'Class assignments updated successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (user?.role !== 'ultra_admin') {
    return <div>Access denied. Only ultra admins can view this page.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">User Management</h1>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create New User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            >
              <option value="student">Student</option>
              <option value="admin">Admin</option>
              <option value="ultra_admin">Ultra Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assign Classes
            </label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
              {classes.map((cls) => (
                <label key={cls.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedClasses.includes(cls.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedClasses([...selectedClasses, cls.id]);
                      } else {
                        setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                      }
                    }}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span>Class {cls.grade}-{cls.section}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Existing Users</h3>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {users.map((userItem) => (
              <li key={userItem.id} className="px-4 py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center mb-4 md:mb-0">
                    {userItem.photo_url ? (
                      <img
                        src={userItem.photo_url}
                        alt={userItem.username}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center text-white">
                        {userItem.username[0].toUpperCase()}
                      </div>
                    )}
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{userItem.username}</h4>
                      <p className="text-sm text-gray-500">Email: {userItem.email}</p>
                      <p className="text-sm text-gray-500">Role: {userItem.role}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Joined {new Date(userItem.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Class Assignments</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {classes.map((cls) => {
                      // Check if user is assigned to this class
                      const isAssigned = userItem.class_assignments?.some(
                        (ca: any) => ca.class_id === cls.id
                      );
                      
                      return (
                        <button
                          key={cls.id}
                          onClick={() => handleAssignClass(userItem.id, cls.id, isAssigned)}
                          className={`flex items-center justify-between px-3 py-2 text-sm rounded-md ${
                            isAssigned 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          <span>Class {cls.grade}-{cls.section}</span>
                          {isAssigned ? (
                            <Check className="h-4 w-4 ml-2" />
                          ) : (
                            <X className="h-4 w-4 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}