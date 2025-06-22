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
  Loader2,
  MapPin,
  Star,
  Trophy,
  Target,
  BookOpen,
  Music,
  Code,
  Palette,
  Languages,
  Award,
  Heart
} from 'lucide-react';
import { format } from 'date-fns';
import '../styles/cards.css';
import { motion, AnimatePresence } from 'framer-motion';
import type { Club } from '../types/index';

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

const categoryIcons = {
  Sports: <Target className="h-6 w-6" />,
  Arts: <Palette className="h-6 w-6" />,
  Science: <BookOpen className="h-6 w-6" />,
  Technology: <Code className="h-6 w-6" />,
  Music: <Music className="h-6 w-6" />,
  Languages: <Languages className="h-6 w-6" />,
  Leadership: <Award className="h-6 w-6" />,
  Community: <Heart className="h-6 w-6" />
};

const difficultyColors = {
  Beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  Advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};

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
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    day: '',
    time: '',
    location: '',
    capacity: '',
    teacher: '',
    category: '',
    difficulty_level: 'Beginner',
    requirements: '',
    equipment_needed: [] as string[],
    image_url: ''
  });
  const [userClubs, setUserClubs] = useState<ClubMember[]>([]);

  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'admin';
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
      let query = supabase
        .from('clubs')
        .select('*')
        .order('name');

      if (selectedCategory) {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;
      
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

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.description) {
        setMessage({ type: 'error', text: 'Name and description are required' });
      return;
    }
    
      const { data, error } = await supabase
        .from('clubs')
        .insert([{
          name: formData.name,
          description: formData.description,
          day: formData.day,
          time: formData.time,
          location: formData.location,
          capacity: parseInt(formData.capacity) || 30,
          teacher: formData.teacher,
          category: formData.category,
          difficulty_level: formData.difficulty_level,
          requirements: formData.requirements,
          equipment_needed: formData.equipment_needed || [],
          image_url: formData.image_url,
          created_by: user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      if (data) {
        setClubs([data, ...clubs]);
        setFormData({
          name: '',
          description: '',
          day: '',
          time: '',
          location: '',
          capacity: '',
          teacher: '',
          category: '',
          difficulty_level: 'Beginner',
          requirements: '',
          equipment_needed: [],
          image_url: ''
        });
        setIsCreating(false);
        setIsEditing(null);
        setMessage({ type: 'success', text: 'Club created successfully' });
      }
    } catch (error) {
      console.error('Error creating club:', error);
      setMessage({ type: 'error', text: 'Failed to create club' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this club?')) return;

    try {
      const { error } = await supabase
        .from('clubs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setClubs(clubs.filter(club => club.id !== id));
      if (selectedClub?.id === id) {
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

  const handleUpdate = async (id: string) => {
    try {
      if (!formData.name || !formData.description) {
        setMessage({ type: 'error', text: 'Name and description are required' });
        return;
      }

      const { error } = await supabase
        .from('clubs')
        .update(formData)
        .eq('id', id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Club updated successfully' });
      setIsEditing(null);
      setFormData({
        name: '',
        description: '',
        day: '',
        time: '',
        location: '',
        capacity: '',
        teacher: '',
        category: '',
        difficulty_level: 'Beginner',
        requirements: '',
        equipment_needed: [],
        image_url: ''
      });
      loadClubs();
    } catch (error) {
      console.error('Error updating club:', error);
      setMessage({ type: 'error', text: 'Failed to update club' });
    }
  };

  const startEditing = (club: Club) => {
    setIsEditing(club.id);
    setFormData({
      name: club.name,
      description: club.description,
      day: club.day || '',
      time: club.time || '',
      location: club.location || '',
      capacity: club.capacity.toString(),
      teacher: club.teacher || '',
      category: club.category || '',
      difficulty_level: club.difficulty_level || 'Beginner',
      requirements: club.requirements || '',
      equipment_needed: club.equipment_needed || [],
      image_url: club.image_url || ''
    });
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
          onClick={() => setIsCreating(true)}
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
                    setIsEditing(club.id);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(club.id)}
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
    </div>
  );

  const ClubCard = ({ club }: { club: Club }) => {
    const isMember = club.members?.some(member => member.user_id === user?.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        <div className="relative h-48">
          <img
            src={club.image_url || '/default-club.jpg'}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4">
            {club.difficulty_level && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${difficultyColors[club.difficulty_level]}`}>
                {club.difficulty_level}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {club.name}
            </h3>
            {club.category && categoryIcons[club.category as keyof typeof categoryIcons]}
          </div>
          
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {club.description}
          </p>
          
          <div className="space-y-2 mb-4">
            {club.day && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{club.day}</span>
              </div>
            )}
            {club.time && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4 mr-2" />
                <span>{club.time}</span>
              </div>
            )}
            {club.location && (
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{club.location}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm text-gray-500">
                {club.members_count} members
              </span>
            </div>
            
            {club.rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-500">
                  {club.rating.toFixed(1)} ({club.total_ratings})
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            {isMember ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleLeaveClub(club.id)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Leave Club
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleJoinClub(club.id)}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Join Club
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Afternoon Clubs</h1>
        {canManageClubs && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreating(true)}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Club
          </motion.button>
        )}
          </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-8">
        <div className="flex flex-wrap gap-4">
          {Object.entries(categoryIcons).map(([category, icon]) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === category
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {icon}
              <span className="ml-2">{category}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-red-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
          {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </AnimatePresence>
                  </div>
                )}
                
      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(isCreating || isEditing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-4"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Club' : 'Create Club'}
                </h2>
                              <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(null);
                    setFormData({
                      name: '',
                      description: '',
                      day: '',
                      time: '',
                      location: '',
                      capacity: '',
                      teacher: '',
                      category: '',
                      difficulty_level: 'Beginner',
                      requirements: '',
                      equipment_needed: [],
                      image_url: ''
                    });
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                              </button>
              </div>

              <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 space-y-4">
                {/* Basic Information Section */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Basic Information</h3>
                  <div className="space-y-3">
                <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        placeholder="Enter club name"
                  />
                </div>

                <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                      >
                        <option value="">Select a category</option>
                        {Object.keys(categoryIcons).map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        rows={2}
                        placeholder="Enter club description"
                  />
              </div>
                  </div>
                </div>

                {/* Schedule & Location Section */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Schedule & Location</h3>
                  <div className="grid grid-cols-2 gap-3">
                <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day
                  </label>
                    <input
                    type="text"
                    value={formData.day}
                    onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        placeholder="e.g., Monday"
                    />
                  </div>

                <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time
                  </label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        placeholder="e.g., 3:00 PM"
                  />
                </div>

                <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        placeholder="e.g., Room 101"
                  />
                                  </div>

                <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Capacity
                  </label>
                  <input
                        type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        placeholder="Max students"
                  />
                                    </div>
                  </div>
                </div>

                {/* Additional Details Section */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Additional Details</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teacher
                  </label>
                  <input
                    type="text"
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                          placeholder="Teacher's name"
                  />
                                  </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Difficulty Level
                        </label>
                        <select
                          value={formData.difficulty_level}
                          onChange={(e) => setFormData({ ...formData, difficulty_level: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' })}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Requirements
                      </label>
                      <textarea
                        value={formData.requirements}
                        onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        rows={2}
                        placeholder="List any prerequisites or requirements"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                        placeholder="URL for club image"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(null);
                      setFormData({
                        name: '',
                        description: '',
                        day: '',
                        time: '',
                        location: '',
                        capacity: '',
                      teacher: '',
                      category: '',
                      difficulty_level: 'Beginner',
                      requirements: '',
                      equipment_needed: [],
                      image_url: ''
                      });
                    }}
                  className="px-4 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                                  </button>
                                  <button
                    onClick={() => isEditing ? handleUpdate(isEditing) : handleCreate()}
                  className="px-4 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                  {isEditing ? 'Update Club' : 'Create Club'}
                                  </button>
              </div>
            </motion.div>
          </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}