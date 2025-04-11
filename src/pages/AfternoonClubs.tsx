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
    }
  }, [selectedClub]);

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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, photo_url')
        .ilike('username', `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedClub) return;

    try {
      const { error } = await supabase
        .from('club_members')
        .insert([{
          club_id: selectedClub.id,
          user_id: userId
        }]);

      if (error) throw error;

      await loadClubMembers();
      setMessage({ type: 'success', text: 'Member added successfully' });
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Failed to add member' });
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

      await loadClubMembers();
      setMessage({ type: 'success', text: 'Member removed successfully' });
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Failed to remove member' });
      }
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClub.name || !newClub.description) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert([{
          ...newClub,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setClubs([data, ...clubs]);
        setNewClub({
          name: '',
          description: '',
          max_capacity: 30,
          schedule: ''
        });
        setIsCreateModalOpen(false);
        setMessage({ type: 'success', text: 'Club created successfully' });
      }
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Failed to create club' });
      }
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!confirm('Are you sure you want to delete this club?')) return;

    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', clubId);

      if (error) throw error;

      setClubs(clubs.filter(club => club.id !== clubId));
      if (selectedClub?.id === clubId) {
        setSelectedClub(null);
      }
      setMessage({ type: 'success', text: 'Club deleted successfully' });
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Failed to delete club' });
      }
    }
  };

  const handleJoinClub = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .insert([{
          club_id: clubId,
          user_id: user?.id
        }]);

      if (error) throw error;

      await loadUserClubs();
      setMessage({ type: 'success', text: 'Successfully joined the club' });
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Failed to join club' });
      }
    }
  };

  const handleLeaveClub = async (clubId: string) => {
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', user?.id);

      if (error) throw error;

      await loadUserClubs();
      setMessage({ type: 'success', text: 'Successfully left the club' });
    } catch (error) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'Failed to leave club' });
      }
    }
  };

  const StudentClubView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Clubs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userClubs.map((userClub) => (
          <motion.div
            key={userClub.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {userClub.clubs?.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {userClub.clubs?.description}
                </p>
              </div>
              <button
                onClick={() => handleLeaveClub(userClub.club_id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <UserMinus className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4 mr-2" />
              <span>{userClub.clubs?.members_count || 0} members</span>
            </div>
          </motion.div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8">Available Clubs</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs
          .filter(club => !userClubs.some(userClub => userClub.club_id === club.id))
          .map((club) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {club.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {club.description}
                  </p>
                </div>
                <button
                  onClick={() => handleJoinClub(club.id)}
                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                >
                  <UserPlus className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Users className="h-4 w-4 mr-2" />
                <span>{club.members_count} members</span>
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );

  const AdminClubView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Clubs</h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="button-primary"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Club
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.map((club) => (
          <motion.div
            key={club.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {club.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {club.description}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedClub(club);
                    setIsAssignModalOpen(true);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <UserPlus className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDeleteClub(club.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Users className="h-4 w-4 mr-2" />
              <span>{club.members_count} members</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Club Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">Create New Club</h3>
              <form onSubmit={handleCreateClub}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newClub.name}
                      onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      value={newClub.description}
                      onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Capacity
                    </label>
                    <input
                      type="number"
                      value={newClub.max_capacity}
                      onChange={(e) => setNewClub({ ...newClub, max_capacity: parseInt(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Schedule
                    </label>
                    <input
                      type="text"
                      value={newClub.schedule}
                      onChange={(e) => setNewClub({ ...newClub, schedule: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="e.g., Every Monday 2:00 PM"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button-primary">
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Members Modal */}
      <AnimatePresence>
        {isAssignModalOpen && selectedClub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Assign Members to {selectedClub.name}</h3>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-red-600 text-white rounded-r-md hover:bg-red-700"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-red-600" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      {searchResults.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center">
                            {user.photo_url ? (
                              <img
                                src={user.photo_url}
                                alt={user.username}
                                className="h-8 w-8 rounded-full mr-3"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                  {user.username[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.username}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {user.email}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddMember(user.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                          >
                            <UserPlus className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No users found
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="content-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-theme-text-primary dark:text-white">
          Afternoon Clubs
        </h1>
        {canManageClubs && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="button-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Club
          </motion.button>
        )}
      </div>

      {/* Message Display */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg mb-4 ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-theme-primary" />
        </div>
      )}

      {/* Clubs Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="card"
            >
              <div className="card-header">
                <h2 className="card-title">{club.name}</h2>
                {canManageClubs && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedClub(club);
                        setIsAssignModalOpen(true);
                      }}
                      className="p-2 hover:bg-theme-tertiary dark:hover:bg-gray-700 rounded-lg"
                    >
                      <UserPlus className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClub(club.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
              <div className="card-content">
                <p>{club.description}</p>
                <div className="mt-4 flex items-center space-x-4 text-sm text-theme-text-secondary dark:text-gray-400">
                  <div className="flex items-center">
                    <Users2 className="h-4 w-4 mr-1" />
                    {club.members_count} / {club.max_capacity} members
                  </div>
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    {club.schedule}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Club Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <h2 className="text-xl font-bold mb-4">Create New Club</h2>
              <form onSubmit={handleCreateClub}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={newClub.name}
                      onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                      className="input-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={newClub.description}
                      onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                      className="input-primary"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Capacity</label>
                    <input
                      type="number"
                      value={newClub.max_capacity}
                      onChange={(e) => setNewClub({ ...newClub, max_capacity: parseInt(e.target.value) })}
                      className="input-primary"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Schedule</label>
                    <input
                      type="text"
                      value={newClub.schedule}
                      onChange={(e) => setNewClub({ ...newClub, schedule: e.target.value })}
                      className="input-primary"
                      placeholder="e.g., Monday 2:00 PM - 3:00 PM"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="button-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button-primary">
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Members Modal */}
      <AnimatePresence>
        {isAssignModalOpen && selectedClub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Assign Members to {selectedClub.name}</h2>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="p-2 hover:bg-theme-tertiary dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search users..."
                    className="input-primary pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-theme-text-secondary" />
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-theme-tertiary dark:hover:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center">
                      {user.photo_url ? (
                        <img
                          src={user.photo_url}
                          alt={user.username}
                          className="h-8 w-8 rounded-full mr-3"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-theme-tertiary dark:bg-gray-700 flex items-center justify-center mr-3">
                          <Users className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-theme-text-secondary">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddMember(user.id)}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg"
                    >
                      <UserPlus className="h-5 w-5 text-green-600" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h3 className="font-medium mb-2">Current Members</h3>
                <div className="space-y-2">
                  {clubMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 hover:bg-theme-tertiary dark:hover:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center">
                        {member.profiles?.photo_url ? (
                          <img
                            src={member.profiles.photo_url}
                            alt={member.profiles.username}
                            className="h-8 w-8 rounded-full mr-3"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-theme-tertiary dark:bg-gray-700 flex items-center justify-center mr-3">
                            <Users className="h-5 w-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{member.profiles?.username}</div>
                          <div className="text-sm text-theme-text-secondary">
                            Joined {format(new Date(member.joined_at), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                      >
                        <UserMinus className="h-5 w-5 text-red-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}