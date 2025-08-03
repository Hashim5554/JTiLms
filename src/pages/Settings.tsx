import React, { useState, useRef, useEffect } from 'react';
import { useSession } from '../contexts/SessionContext';
import { updateUserProfile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Profile } from '../types';
import { motion } from 'framer-motion';
import { 
  User, 
  Upload, 
  X, 
  Loader2,
  Check,
  AlertCircle,
  Users,
  Search,
  Edit,
  Save
} from 'lucide-react';

export function Settings() {
  const { user } = useSession();
  const [username, setUsername] = useState(user?.username || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photo_url || '');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';
  const canManageStudents = user?.role === 'admin' || user?.role === 'teacher';
  
  // Student management state
  const [students, setStudents] = useState<Profile[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editingUsername, setEditingUsername] = useState('');
  const [uploadingStudentPhoto, setUploadingStudentPhoto] = useState<string | null>(null);
  const studentPhotoRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const data = await updateUserProfile(user.id, {
        username,
        photo_url: photoUrl || null
      });

      if (data) {
        // Profile updated successfully
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (error) {
      const pgError = error as PostgrestError;
      setMessage({ type: 'error', text: pgError.message });
    }
  };



  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !user) return;
    setUploadingPhoto(true);

    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) throw profileError;

      setPhotoUrl(publicUrl);
              // Photo updated successfully
      setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
    } catch (error) {
      console.error('Error uploading photo:', error);
      setMessage({ type: 'error', text: 'Failed to upload profile photo' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Load students for admin/teacher management
  const loadStudents = async () => {
    if (!canManageStudents) return;
    
    setLoadingStudents(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('username');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      setMessage({ type: 'error', text: 'Failed to load students' });
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle student username update
  const handleStudentUsernameUpdate = async (studentId: string) => {
    if (!editingUsername.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: editingUsername.trim() })
        .eq('id', studentId);

      if (error) throw error;

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, username: editingUsername.trim() }
          : student
      ));
      setEditingStudent(null);
      setEditingUsername('');
      setMessage({ type: 'success', text: 'Student username updated successfully!' });
    } catch (error) {
      console.error('Error updating student username:', error);
      setMessage({ type: 'error', text: 'Failed to update student username' });
    }
  };

  // Handle student photo upload
  const handleStudentPhotoUpload = async (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploadingStudentPhoto(studentId);

    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${studentId}-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update student profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', studentId);

      if (profileError) throw profileError;

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, photo_url: publicUrl }
          : student
      ));
      setMessage({ type: 'success', text: 'Student photo updated successfully!' });
    } catch (error) {
      console.error('Error uploading student photo:', error);
      setMessage({ type: 'error', text: 'Failed to upload student photo' });
    } finally {
      setUploadingStudentPhoto(null);
    }
  };

  // Handle student photo removal
  const handleStudentPhotoRemove = async (studentId: string) => {
    setUploadingStudentPhoto(studentId);

    try {
      // Update student profile to remove photo_url
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ photo_url: null })
        .eq('id', studentId);

      if (profileError) throw profileError;

      setStudents(students.map(student => 
        student.id === studentId 
          ? { ...student, photo_url: null }
          : student
      ));
      setMessage({ type: 'success', text: 'Student photo removed successfully!' });
    } catch (error) {
      console.error('Error removing student photo:', error);
      setMessage({ type: 'error', text: 'Failed to remove student photo' });
    } finally {
      setUploadingStudentPhoto(null);
    }
  };

  // Load students on component mount if user can manage students
  useEffect(() => {
    if (canManageStudents) {
      loadStudents();
    }
  }, [canManageStudents]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white font-semibold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{user?.username}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

      {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </motion.div>
      )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Settings */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <User className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Settings</h3>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                disabled={!isAdmin && user?.role === 'student'}
              />
              {!isAdmin && user?.role === 'student' && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Only administrators can change usernames.</p>
              )}
            </div>

            <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Profile Photo
              </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {photoUrl ? (
                  <img
                    src={photoUrl}
                          alt="Profile"
                          className="w-20 h-20 rounded-xl object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/200?text=No+Image';
                    }}
                  />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
              )}
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPhotoUrl('')}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto || (!isAdmin && user?.role === 'student')}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Upload Photo</span>
                          </>
                        )}
                      </button>
              {!isAdmin && user?.role === 'student' && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Only administrators can change profile photos.</p>
              )}
                    </div>
                  </div>
            </div>

            {(isAdmin || user?.role !== 'student') && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  type="submit"
                    className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 transition-all"
                >
                  Update Profile
                  </motion.button>
            )}
          </form>
        </div>
          </motion.div>

          {/* Student Profile Management - Only for Admins and Teachers */}
          {canManageStudents && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                    <Users className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Student Profile Management</h3>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Students List */}
                {loadingStudents ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 dark:text-red-400" />
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {students
                      .filter(student => 
                        student.username.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((student) => (
                        <motion.div
                          key={student.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                        >
                          {/* Student Photo */}
                          <div className="relative">
                            {student.photo_url ? (
                              <img
                                src={student.photo_url}
                                alt={student.username}
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/48?text=No+Image';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                              </div>
                            )}
                            
                            {/* Photo Upload Button */}
                            <input
                              type="file"
                              ref={(el) => studentPhotoRefs.current[student.id] = el}
                              onChange={(e) => handleStudentPhotoUpload(student.id, e)}
                              accept="image/*"
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => studentPhotoRefs.current[student.id]?.click()}
                              disabled={uploadingStudentPhoto === student.id}
                              className="absolute -bottom-1 -right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                              title="Change photo"
                            >
                              {uploadingStudentPhoto === student.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Upload className="w-3 h-3" />
                              )}
                            </button>

                            {/* Photo Remove Button - Only show if photo exists */}
                            {student.photo_url && (
                              <button
                                type="button"
                                onClick={() => handleStudentPhotoRemove(student.id)}
                                disabled={uploadingStudentPhoto === student.id}
                                className="absolute -top-1 -right-1 p-1 rounded-full bg-gray-500 text-white hover:bg-gray-600 transition-colors disabled:opacity-50"
                                title="Remove photo"
                              >
                                {uploadingStudentPhoto === student.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Student Info */}
                          <div className="flex-1">
                            {editingStudent === student.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingUsername}
                                  onChange={(e) => setEditingUsername(e.target.value)}
                                  className="flex-1 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => handleStudentUsernameUpdate(student.id)}
                                  className="p-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
                                  title="Save"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudent(null);
                                    setEditingUsername('');
                                  }}
                                  className="p-1 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {student.username}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStudent(student.id);
                                    setEditingUsername(student.username);
                                  }}
                                  className="p-1 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                  title="Edit username"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Student • {student.email || 'No email'}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    
                    {students.filter(student => 
                      student.username.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {searchTerm ? 'No students found matching your search.' : 'No students available.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>


      </div>
    </motion.div>
  );
}