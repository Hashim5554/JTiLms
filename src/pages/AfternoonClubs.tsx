import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Search, 
  Plus,
  Check, 
  X, 
  Calendar,
  UserPlus,
  Trash2,
  PlusCircle,
  Edit2,
  ChevronDown,
  ChevronRight,
  Settings,
  Clock,
  UserMinus,
  CalendarDays,
  Users2,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import '../styles/cards.css';
import { motion, AnimatePresence } from 'framer-motion';

interface Club {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  max_capacity: number;
  schedule: string;
  members_count: number;
  members?: ClubMember[];
}

interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  joined_at: string;
  profiles?: {
    id: string;
    username: string;
    photo_url: string | null;
  };
  clubs?: Club;
}

interface ClubAttendance {
  id: string;
  club_id: string;
  user_id: string;
  date: string;
  status: 'present' | 'absent';
  created_at: string;
  profiles?: {
    username: string;
  };
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface SearchResult {
  id: string;
  username: string;
  email: string;
  photo_url: string | null;
}

export function AfternoonClubs() {
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([]);
  const [attendances, setAttendances] = useState<ClubAttendance[]>([]);
  const [currentDate, setCurrentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [newClub, setNewClub] = useState<Omit<Club, 'id' | 'created_at' | 'created_by' | 'members_count'>>({
    name: '',
    description: '',
    max_capacity: 30,
    schedule: ''
  });
  const [userClubs, setUserClubs] = useState<ClubMember[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'members' | 'attendance'>('details');

  const isAdmin = user?.role === 'ultra_admin';
  const isTeacher = user?.role === 'teacher';
  const canManageClubs = isAdmin || isTeacher;

  useEffect(() => {
    loadClubs();
    if (!canManageClubs) {
      loadUserClubs();
    }
  }, [canManageClubs, user]);

  useEffect(() => {
    if (selectedClub) {
      loadClubMembers();
      loadAttendances();
    }
  }, [selectedClub, currentDate]);

  const loadClubs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setClubs(data);
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserClubs = async () => {
    try {
      const { data: userClubsData, error } = await supabase
        .from('club_members')
        .select(`
          *,
          clubs (*)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setUserClubs(userClubsData as ClubMember[]);
    } catch (error) {
      console.error('Error loading user clubs:', error);
      setMessage({ type: 'error', text: 'Failed to load user clubs.' });
    }
  };

  const loadClubMembers = async () => {
    if (!selectedClub) return;
    
    setLoading(true);
    try {
      const { data } = await supabase
        .from('club_members')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            photo_url
          )
        `)
        .eq('club_id', selectedClub.id);
      
      if (data) setClubMembers(data);
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAttendances = async () => {
    if (!selectedClub || !currentDate) return;
    
    try {
      const { data } = await supabase
        .from('club_attendance')
        .select(`
          *,
          profiles:user_id (username)
        `)
        .eq('club_id', selectedClub.id)
        .eq('date', currentDate);
      
      if (data) setAttendances(data);
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, email, photo_url')
        .ilike('username', `%${searchQuery}%`)
        .limit(10);
      
      if (data) setSearchResults(data);
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedClub) return;
    
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', selectedClub.id)
        .eq('user_id', userId)
        .single();
      
      if (existingMember) {
        setMessage({ type: 'error', text: 'User is already a member of this club' });
        return;
      }
      
      const { data, error } = await supabase
        .from('club_members')
        .insert([{
          club_id: selectedClub.id,
          user_id: userId
        }])
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            photo_url
          )
        `)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setClubMembers([...clubMembers, data]);
        setSearchResults([]);
        setSearchQuery('');
        setMessage({ type: 'success', text: 'Member added successfully' });
      }
    } catch (error: any) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('id', memberId);
      
      if (error) throw error;
      
      setClubMembers(clubMembers.filter(member => member.id !== memberId));
      setMessage({ type: 'success', text: 'Member removed successfully' });
    } catch (error: any) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    }
  };

  const handleAttendanceChange = async (userId: string, status: 'present' | 'absent') => {
    if (!selectedClub || !currentDate) return;
    
    try {
      // Check if attendance record already exists
      const { data: existingData } = await supabase
        .from('club_attendance')
        .select('*')
        .eq('club_id', selectedClub.id)
        .eq('user_id', userId)
        .eq('date', currentDate)
        .single();
      
      let data;
      
      if (existingData) {
        // Update existing record
        const { data: updatedData, error } = await supabase
          .from('club_attendance')
          .update({ status })
          .eq('id', existingData.id)
          .select(`
            *,
            profiles:user_id (username)
          `)
          .single();
        
        if (error) throw error;
        data = updatedData;
      } else {
        // Create new record
        const { data: newData, error } = await supabase
          .from('club_attendance')
          .insert([{
            club_id: selectedClub.id,
            user_id: userId,
            date: currentDate,
            status
          }])
          .select(`
            *,
            profiles:user_id (username)
          `)
          .single();
        
        if (error) throw error;
        data = newData;
      }
      
      if (data) {
        // Update the attendance list
        const updatedAttendances = attendances.filter(a => 
          !(a.club_id === selectedClub.id && a.user_id === userId && a.date === currentDate)
        );
        setAttendances([data, ...updatedAttendances]);
        setMessage({ type: 'success', text: 'Attendance updated' });
      }
    } catch (error: any) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert([{
          ...newClub,
          created_by: user?.id,
          members_count: 0
        }])
        .select()
        .single();

      if (error) throw error;
      
      setClubs([data, ...clubs]);
      setIsCreateModalOpen(false);
      setNewClub({
        name: '',
        description: '',
        max_capacity: 30,
        schedule: ''
      });
      setMessage({ type: 'success', text: 'Club created successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);
      
      if (error) throw error;
      
      setClubs(clubs.filter(club => club.id !== clubId));
      setMessage({ type: 'success', text: 'Club deleted successfully' });
    } catch (error: any) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
    }
  };

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setNewClub(prev => ({ ...prev, max_capacity: value }));
    }
  };

  const handleJoinClub = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .insert([
          {
            club_id: clubId,
            user_id: user?.id
          }
        ]);

      if (error) throw error;

      await loadClubs();
      await loadUserClubs();
      setMessage({ type: 'success', text: 'Successfully joined the club!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .match({ club_id: clubId, user_id: user?.id });

      if (error) throw error;

      await loadClubs();
      await loadUserClubs();
      setMessage({ type: 'success', text: 'Successfully left the club!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Student view component
  const StudentClubView = () => (
    <div className="space-y-6">
      {userClubs.length > 0 ? (
        userClubs.map((clubMember: ClubMember) => {
          const club = clubMember.clubs;
          if (!club) return null;
          
          return (
            <div key={club.id} className="bg-theme-primary shadow-lg rounded-xl p-4 hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h4 className="text-lg font-medium text-theme-text-primary">{club.name}</h4>
                <button
                  onClick={() => handleDeleteClub(club.id)}
                  className="text-red-600 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-theme-text-secondary mb-4">{club.description}</p>
              <div className="space-y-2 text-sm text-theme-text-tertiary">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{club.members_count}/{club.max_capacity} members</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{club.schedule}</span>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-theme-primary shadow-lg rounded-xl p-6 text-center">
          <p className="text-theme-text-secondary">You are not a member of any clubs</p>
        </div>
      )}
    </div>
  );

  if (user?.role !== 'ultra_admin' && user?.role !== 'teacher') {
    return <div>Access denied. Admin privileges required.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Afternoon Clubs
          </h1>
          {canManageClubs && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              New Club
            </motion.button>
          )}
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500" />
          </div>
        ) : clubs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No clubs found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {canManageClubs
                ? 'Create your first club to get started'
                : 'No clubs are available at the moment'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid gap-6">
              {clubs.map((club) => (
                <motion.div
                  key={club.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          <Users2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {club.name}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                          {club.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{club.members?.length || 0} members</span>
                          <span>•</span>
                          <span>Created on {new Date(club.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      {canManageClubs && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteClub(club.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-xl transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Club
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClub} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newClub.name}
                    onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newClub.description}
                    onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}