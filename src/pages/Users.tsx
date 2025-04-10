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
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <h2>Add New User</h2>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                required
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Add User
            </button>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>Users</h2>
        </div>
        <div className="card-content">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Classes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.role}</td>
                    <td>
                      <div className="class-tags">
                        {user.class_assignments?.map(assignment => (
                          <span key={assignment.class_id} className="class-tag">
                            {assignment.classes?.grade}{assignment.classes?.section}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}