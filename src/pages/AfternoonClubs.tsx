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
  CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Afternoon Clubs</h1>
        {canManageClubs && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Create Club
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clubs List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clubs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {clubs
                .filter(club => club.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(club => (
                  <div
                    key={club.id}
                    onClick={() => setSelectedClub(club)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedClub?.id === club.id ? 'bg-indigo-50 dark:bg-indigo-900' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{club.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {club.members_count} / {club.max_capacity} members
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Club Details */}
        <div className="lg:col-span-2">
          {selectedClub ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClub.name}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Created {format(new Date(selectedClub.created_at), 'PPP')}
                    </p>
                  </div>
                  {canManageClubs && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setIsEditModalOpen(true)}
                        className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`${
                        activeTab === 'details'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`${
                        activeTab === 'members'
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                      } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                    >
                      Members
                    </button>
                    {canManageClubs && (
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className={`${
                          activeTab === 'attendance'
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                        } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
                      >
                        Attendance
                      </button>
                    )}
                  </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Description</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{selectedClub.description}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Schedule</h3>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="h-5 w-5 mr-2" />
                        {selectedClub.schedule}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Capacity</h3>
                      <div className="mt-2">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-2 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedClub.members_count} / {selectedClub.max_capacity} members
                          </span>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{
                              width: `${(selectedClub.members_count / selectedClub.max_capacity) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'members' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Members</h3>
                      {canManageClubs && (
                        <button
                          onClick={() => setIsAssignModalOpen(true)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add Member
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {clubMembers.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                          <div className="flex items-center">
                            {member.profiles?.photo_url ? (
                              <img
                                src={member.profiles.photo_url}
                                alt={member.profiles.username}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                <Users className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                              {member.profiles?.username}
                            </span>
                          </div>
                          {canManageClubs && (
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                            >
                              <UserMinus className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'attendance' && canManageClubs && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attendance</h3>
                      <div className="flex items-center space-x-4">
                        <input
                          type="date"
                          value={currentDate}
                          onChange={(e) => setCurrentDate(e.target.value)}
                          className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {clubMembers.map(member => {
                        const attendance = attendances.find(a => a.user_id === member.user_id);
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.profiles?.username}
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleAttendanceChange(member.user_id, 'present')}
                                className={`p-1.5 rounded-full ${
                                  attendance?.status === 'present'
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-600'
                                }`}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleAttendanceChange(member.user_id, 'absent')}
                                className={`p-1.5 rounded-full ${
                                  attendance?.status === 'absent'
                                    ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-600'
                                }`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No club selected</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Select a club from the list to view its details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Club Modal */}
      {isCreateModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Create New Club</h3>
                  <form onSubmit={handleCreateClub} className="mt-6 space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Club Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={newClub.name}
                        onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <textarea
                        id="description"
                        value={newClub.description}
                        onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Schedule
                      </label>
                      <input
                        type="text"
                        id="schedule"
                        value={newClub.schedule}
                        onChange={(e) => setNewClub({ ...newClub, schedule: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Maximum Capacity
                      </label>
                      <input
                        type="number"
                        id="max_capacity"
                        value={newClub.max_capacity}
                        onChange={(e) => setNewClub({ ...newClub, max_capacity: parseInt(e.target.value) })}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                          </>
                        ) : (
                          'Create Club'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Toast */}
      {message && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
          message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          <div className="flex items-center">
            {message.type === 'success' ? (
              <Check className="h-5 w-5 mr-2" />
            ) : (
              <X className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        </div>
      )}
    </div>
  );
}