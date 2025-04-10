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
  PlusCircle
} from 'lucide-react';
import '../styles/cards.css';

interface Club {
  id: string;
  name: string;
  description: string;
  created_at: string;
  created_by: string;
  max_capacity: number;
  schedule: string;
  members_count: number;
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
  const [newClub, setNewClub] = useState<Omit<Club, 'id' | 'created_at' | 'created_by' | 'members_count'>>({
    name: '',
    description: '',
    max_capacity: 30,
    schedule: ''
  });
  const [userClubs, setUserClubs] = useState<ClubMember[]>([]);

  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';

  useEffect(() => {
    loadClubs();
    if (!isAdmin) {
      loadUserClubs();
    }
  }, [isAdmin, user]);

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
    if (!newClub.name.trim()) {
      setMessage({ type: 'error', text: 'Club name is required' });
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('clubs')
        .insert([{
          name: newClub.name,
          description: newClub.description,
          created_by: user?.id,
          max_capacity: newClub.max_capacity,
          schedule: newClub.schedule
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        setClubs([...clubs, data]);
        setNewClub({ name: '', description: '', max_capacity: 0, schedule: '' });
        setMessage({ type: 'success', text: 'Club created successfully' });
      }
    } catch (error: any) {
      if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred' });
      }
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
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-theme-text-primary dark:text-white">Afternoon Clubs</h1>
      </div>

      {message && (
        <div className={`card ${message.type === 'error' ? 'bg-red-100' : 'bg-green-100'} mb-4 p-4`}>
          <p className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>{message.text}</p>
        </div>
      )}

      {isAdmin && (
        <div className="card mb-6 dark:bg-gray-800">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Club</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleCreateClub} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Club Name</label>
                <input
                  type="text"
                  id="name"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea
                  id="description"
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-colors duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Capacity</label>
                <input
                  type="number"
                  id="max_capacity"
                  value={newClub.max_capacity}
                  onChange={(e) => setNewClub({ ...newClub, max_capacity: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-colors duration-200"
                  required
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Schedule</label>
                <input
                  type="text"
                  id="schedule"
                  value={newClub.schedule}
                  onChange={(e) => setNewClub({ ...newClub, schedule: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 transition-colors duration-200"
                  required
                />
              </div>
              <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200">
                <PlusCircle size={20} className="mr-2" /> Create Club
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.length === 0 ? (
          <div className="card col-span-full dark:bg-gray-800">
            <p className="text-center text-gray-500 dark:text-gray-400">No clubs available.</p>
          </div>
        ) : (
          clubs.map((club: Club) => (
            <div key={club.id} className="card dark:bg-gray-800">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{club.name}</h3>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteClub(club.id)}
                    className="btn-icon text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
              <div className="card-body">
                <p className="text-gray-600 dark:text-gray-300 mb-4">{club.description}</p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p><strong className="text-gray-900 dark:text-white">Schedule:</strong> {club.schedule}</p>
                  <p><strong className="text-gray-900 dark:text-white">Capacity:</strong> {club.members_count}/{club.max_capacity}</p>
                </div>
              </div>
              <div className="card-footer">
                {!isAdmin && (
                  userClubs.some((uc: ClubMember) => uc.club_id === club.id) ? (
                    <button
                      onClick={() => handleLeaveClub(club.id)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200"
                    >
                      Leave Club
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinClub(club.id)}
                      className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 disabled:opacity-50"
                      disabled={club.members_count >= club.max_capacity}
                    >
                      Join Club
                    </button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}