import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AnimatePresence, motion } from 'framer-motion';
import { 
  Plus, 
  Users, 
  Calendar,
  Clock,
  MapPin,
  Star,
  Target,
  Palette, 
  BookOpen,
  Code,
  Music, 
  Languages,
  Award,
  Heart,
  UserPlus,
  Trash2,
  Edit2,
  X,
  CheckCircle,
  AlertCircle,
  Clock as ClockIcon,
  UserCheck,
  Search
} from 'lucide-react';

// Sector icons mapping
const sectorIcons = {
  Sports: <Target className="h-6 w-6" />,
  Arts: <Palette className="h-6 w-6" />,
  Science: <BookOpen className="h-6 w-6" />,
  'AI Clubs': <Code className="h-6 w-6" />,
  Music: <Music className="h-6 w-6" />,
  Languages: <Languages className="h-6 w-6" />,
  Leadership: <Award className="h-6 w-6" />,
  Community: <Heart className="h-6 w-6" />
};

// Status colors
const statusColors = {
  present: 'bg-green-100 text-green-800 border-green-200',
  absent: 'bg-red-100 text-red-800 border-red-200',
  late: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  leave: 'bg-blue-100 text-blue-800 border-blue-200'
};

export default function AfternoonClubs() {
  const [sectors, setSectors] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [clubMembers, setClubMembers] = useState<any[]>([]);
  const [userClubMemberships, setUserClubMemberships] = useState<any[]>([]); // New state for user's club memberships
  const [allClubMembers, setAllClubMembers] = useState<any[]>([]); // New state for all club members
  const [allAttendance, setAllAttendance] = useState<any[]>([]); // New state for all attendance data
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [message, setMessage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showCreateSectorModal, setShowCreateSectorModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newClubData, setNewClubData] = useState({
    name: '',
    description: '',
    sector_id: '',
    max_capacity: 30
  });
  const [newSectorData, setNewSectorData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    async function fetchData() {
    setLoading(true);
      const { data: sectorData } = await supabase.from('sectors').select('*');
      setSectors(sectorData || []);
      setActiveSector(sectorData?.[0]?.id || null);
      const { data: clubData } = await supabase.from('clubs').select('*');
      setClubs(clubData || []);
      
      // Load all club members for all clubs
      await loadAllClubMembers();
      await loadAllAttendance(); // Load all attendance data
      
      // Get current user and their profile
      const { data: { user: userData } } = await supabase.auth.getUser();
      if (userData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .single();
        setUser(profileData || userData);
        
        // Load user's club memberships after user data is set
        if (profileData || userData) {
          await loadUserClubMemberships();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Refresh attendance data when date changes
  useEffect(() => {
    if (attendanceDate) {
      loadAllAttendance();
    }
  }, [attendanceDate]);

  const isAdminOrTeacher = user?.role === 'admin' || user?.role === 'ultra_admin' || user?.role === 'teacher';
  const isStudent = user && !isAdminOrTeacher;
  
  // Debug logging
  console.log('User:', user);
  console.log('User role:', user?.role);
  console.log('isAdminOrTeacher:', isAdminOrTeacher);
  console.log('isStudent:', isStudent);

  async function loadClubMembers(clubId: string) {
      const { data } = await supabase
        .from('club_members')
      .select('*, profiles:user_id (id, username, photo_url)')
      .eq('club_id', clubId);
    setClubMembers(data || []);
  }

  // New function to load all club memberships for the current user
  async function loadUserClubMemberships() {
    if (!user?.id) return;
    
    console.log('Loading user club memberships for user ID:', user.id);
    
    const { data, error } = await supabase
      .from('club_members')
      .select('club_id')
      .eq('user_id', user.id);
    
    console.log('User club memberships query result:', { data, error });
    
    setUserClubMemberships(data || []);
  }

  async function loadAllClubMembers() {
    const { data } = await supabase
      .from('club_members')
      .select('*, profiles:user_id (id, username, photo_url), clubs:club_id (id, name)');
    setAllClubMembers(data || []);
    
    console.log('All club members loaded:', data);
    if (user?.id) {
      const userMemberships = data?.filter(m => m.user_id === user.id) || [];
      console.log('Current user memberships in allClubMembers:', userMemberships);
    }
  }

  async function loadAllAttendance() {
    const { data } = await supabase
      .from('club_attendance')
      .select('*, profiles:user_id (id, username), clubs:club_id (id, name)')
      .eq('date', attendanceDate);
    setAllAttendance(data || []);
  }

  async function loadAttendance(clubId: string, date: string) {
    const { data } = await supabase
      .from('club_attendance')
      .select('*, profiles:user_id (id, username)')
      .eq('club_id', clubId)
      .eq('date', date);
    setAttendance(data || []);
  }

  async function handleMarkAttendance(clubId: string, userId: string, status: string) {
    await supabase.from('club_attendance').upsert({
      club_id: clubId,
      user_id: userId,
      date: attendanceDate,
      status,
      marked_by: user.id
    });
    await loadAttendance(clubId, attendanceDate);
    
    // Refresh all attendance data to update the attendance counts
    await loadAllAttendance();
    
    setMessage({ type: 'success', text: 'Attendance marked successfully!' });
  }

  async function handleCreateClub() {
    if (!newClubData.name || !newClubData.sector_id) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    
      const { data, error } = await supabase
      .from('clubs')
        .insert([{
        ...newClubData,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
        setMessage({ type: 'error', text: error.message });
      return;
    }

    setClubs([...clubs, data]);
    setShowCreateModal(false);
    setNewClubData({ name: '', description: '', sector_id: '', max_capacity: 30 });
    setMessage({ type: 'success', text: 'Club created successfully!' });
  }

  async function handleCreateSector() {
    if (!newSectorData.name) {
      setMessage({ type: 'error', text: 'Please enter a sector name' });
      return;
    }
    
      const { data, error } = await supabase
      .from('sectors')
        .insert([{
        name: newSectorData.name,
        description: newSectorData.description
        }])
        .select()
        .single();
      
    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setSectors([...sectors, data]);
    setShowCreateSectorModal(false);
    setNewSectorData({ name: '', description: '' });
    setMessage({ type: 'success', text: 'Sector created successfully!' });
  }

  async function handleDeleteSector(sectorId: string) {
    const { error } = await supabase
      .from('sectors')
      .delete()
      .eq('id', sectorId);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setSectors(sectors.filter(s => s.id !== sectorId));
    if (activeSector === sectorId) {
      setActiveSector(sectors[0]?.id || null);
    }
    setMessage({ type: 'success', text: 'Sector deleted successfully!' });
  }

  async function handleDeleteClub(clubId: string) {
      const { error } = await supabase
        .from('clubs')
        .delete()
      .eq('id', clubId);

    if (error) {
      setMessage({ type: 'error', text: error.message });
      return;
    }

    setClubs(clubs.filter(c => c.id !== clubId));
    if (selectedClub?.id === clubId) {
        setSelectedClub(null);
      }
    setMessage({ type: 'success', text: 'Club deleted successfully!' });
  }

  async function handleAddStudent(studentId: string) {
    if (!selectedClub) return;

      const { error } = await supabase
        .from('club_members')
        .insert([{
        club_id: selectedClub.id,
        user_id: studentId
      }]);

    if (error) {
        setMessage({ type: 'error', text: error.message });
      return;
    }

    await loadClubMembers(selectedClub.id);
    
    // Refresh all club members to update the member counts
    await loadAllClubMembers();
    
    // Refresh user's club memberships if the added student is the current user
    if (studentId === user?.id) {
      await loadUserClubMemberships();
    }
    
    setShowAddStudentModal(false);
    setMessage({ type: 'success', text: 'Student added successfully!' });
  }

  async function loadAvailableStudents() {
    console.log('Loading available students...');
    
    // First, let's check what students exist
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    console.log('All profiles:', allProfiles);
    console.log('Profiles error:', profilesError);
    
    if (profilesError) {
      console.error('Error loading profiles:', profilesError);
      setMessage({ type: 'error', text: 'Error loading students: ' + profilesError.message });
        return;
      }

    // Filter for students - check multiple possible field names and values
    const students = allProfiles?.filter(profile => {
      console.log('Checking profile:', profile);
      
      // Check if it's a student by role field
      if (profile.role === 'student') return true;
      
      // Check if it's a student by role field (case insensitive)
      if (profile.role?.toLowerCase() === 'student') return true;
      
      // Check if it's not an admin/teacher (assume it's a student)
      if (profile.role && !['admin', 'ultra_admin', 'teacher'].includes(profile.role.toLowerCase())) return true;
      
      // If no role field, assume it's a student
      if (!profile.role) return true;
      
      // If it has a username and isn't explicitly admin/teacher, treat as student
      if (profile.username && !profile.role) return true;
      
      return false;
    }) || [];
    
    console.log('Students found:', students);
    
    const enrolledStudentIds = allClubMembers.map(m => m.user_id);
    console.log('Enrolled student IDs:', enrolledStudentIds);
    
    // Include all profiles that aren't enrolled (regardless of role)
    const available = allProfiles?.filter(profile => {
      // Skip if already enrolled
      if (enrolledStudentIds.includes(profile.id)) return false;
      
      // Include everyone else (regardless of role)
      return true;
    }) || [];
    
    console.log('Available students (including LGS):', available);
    
    setAvailableStudents(available);
    setFilteredStudents(available);
    
    if (available.length === 0) {
      setMessage({ type: 'info', text: 'No available students found. All students may already be enrolled or no students exist.' });
      
      // If no profiles exist at all, show a message
      if (allProfiles?.length === 0) {
        setMessage({ type: 'info', text: 'No users found in the database.' });
      }
    }
  }

  // Filter clubs for students (only show clubs they're enrolled in)
  const visibleClubs = isStudent
    ? clubs.filter(club => {
        // First check if the club is in the current active sector
        if (club.sector_id !== activeSector) return false;
        
        // Then check if the user is enrolled in this club
        const inUserMemberships = userClubMemberships.some(m => m.club_id === club.id);
        // Fallback: check allClubMembers if userClubMemberships is empty
        const inAllMembers = allClubMembers.some(m => m.club_id === club.id && m.user_id === user?.id);
        return inUserMemberships || inAllMembers;
      })
    : clubs.filter(club => club.sector_id === activeSector);

  // Debug logging for student view
  if (isStudent) {
    console.log('Student view debugging:');
    console.log('User ID:', user?.id);
    console.log('User club memberships:', userClubMemberships);
    console.log('All clubs:', clubs);
    console.log('Active sector:', activeSector);
    
    // Debug sector filtering
    const clubsInActiveSector = clubs.filter(club => club.sector_id === activeSector);
    console.log('Clubs in active sector:', clubsInActiveSector);
    
    const userEnrolledClubs = clubs.filter(club => {
      const inUserMemberships = userClubMemberships.some(m => m.club_id === club.id);
      const inAllMembers = allClubMembers.some(m => m.club_id === club.id && m.user_id === user?.id);
      return inUserMemberships || inAllMembers;
    });
    console.log('User enrolled clubs (all sectors):', userEnrolledClubs);
    
    console.log('Visible clubs:', visibleClubs);
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const cardVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.3
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        duration: 0.2
      }
    }
  };

      return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-2"
            >
              Afternoon Clubs
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 dark:text-gray-400 text-center"
            >
              Explore and manage extracurricular activities
            </motion.p>
            </div>
            </div>

              {/* Sector Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Sectors
            </h2>
            {isAdminOrTeacher && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateSectorModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="h-4 w-4" />
                Add Sector
              </motion.button>
            )}
          </div>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {sectors.map((sector, index) => (
              <motion.div
                key={sector.id}
                variants={itemVariants}
                className="flex items-center gap-2"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-3 px-6 py-3 rounded-full font-semibold transition-all duration-200 shadow-lg ${
                    activeSector === sector.id
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-xl'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-xl border border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setActiveSector(sector.id)}
                >
                  {sectorIcons[sector.name] || <Star className="h-6 w-6" />}
                  <span>{sector.name}</span>
                </motion.button>
                {isAdminOrTeacher && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteSector(sector.id)}
                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Delete sector"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                )}
          </motion.div>
        ))}
          </motion.div>

        {/* Clubs Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 gap-8"
          >
            <AnimatePresence mode="popLayout">
              {visibleClubs.map((club, index) => (
            <motion.div
              key={club.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                  layout
                  className="group relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-3xl transition-all duration-500 hover:scale-[1.02]"
                >
                  {/* Club Header with Gradient Background */}
                  <div className="relative bg-gradient-to-br from-red-500 via-pink-500 to-red-600 p-4 sm:p-6 text-white">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-3 sm:mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                              {sectorIcons[sectors.find(s => s.id === club.sector_id)?.name] || <Star className="h-4 w-4 sm:h-5 sm:w-5" />}
                            </div>
                <div>
                              <h3 className="text-lg sm:text-2xl font-bold mb-1">
                    {club.name}
                  </h3>
                              <p className="text-white/80 text-sm sm:text-base font-medium">
                                {sectors.find(s => s.id === club.sector_id)?.name || 'Unknown Sector'}
                  </p>
                </div>
                          </div>
                        </div>
                        {isAdminOrTeacher && (
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteClub(club.id)}
                            className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                            title="Delete club"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </motion.button>
                        )}
              </div>
                      
                      <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 line-clamp-2">
                        {club.description || 'No description available.'}
                      </p>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                        <div className="flex items-center gap-3 sm:gap-4 text-white/80">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            </div>
                            <span className="font-semibold text-xs sm:text-sm">{allClubMembers.filter(m => m.club_id === club.id).length} members</span>
        </div>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                              <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
    </div>
                            <span className="font-semibold text-xs sm:text-sm">{new Date(club.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold shadow-2xl hover:shadow-3xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/30 text-sm sm:text-base"
                          onClick={async () => {
                            setSelectedClub(club);
                            await loadClubMembers(club.id);
                            await loadAttendance(club.id, attendanceDate);
                          }}
                        >
                          <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden xs:inline">View Details</span>
                          <span className="xs:hidden">Details</span>
                        </motion.button>
                      </div>
                    </div>
        </div>

                  {/* Club Stats with Glass Effect */}
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                          </div>
              <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Capacity</div>
                            <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                              {allClubMembers.filter(m => m.club_id === club.id).length}/{club.max_capacity || 30}
              </div>
              </div>
          </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((allClubMembers.filter(m => m.club_id === club.id).length / (club.max_capacity || 30)) * 100, 100)}%` }}
                          ></div>
            </div>
      </div>
                      
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 sm:p-4 border border-gray-200 dark:border-gray-600 shadow-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
    </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Attendance Today</div>
                            <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                              {allAttendance.filter(a => a.club_id === club.id && a.status === 'present').length}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {allAttendance.filter(a => a.club_id === club.id).length > 0 
                            ? `${Math.round((allAttendance.filter(a => a.club_id === club.id && a.status === 'present').length / allAttendance.filter(a => a.club_id === club.id).length) * 100)}% present`
                            : 'No attendance marked'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && visibleClubs.length === 0 && (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-gray-400 dark:text-gray-600 mb-4">
              <Users className="h-16 w-16 mx-auto" />
          </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No clubs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isStudent ? 'You are not enrolled in any clubs in this sector.' : 'No clubs have been created in this sector yet.'}
            </p>
          </motion.div>
        )}
              </div>

      {/* Floating Add Club Button */}
      {isAdminOrTeacher && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-8 w-8" />
        </motion.button>
      )}

      {/* Club Details Modal */}
      <AnimatePresence>
        {selectedClub && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto"
            >
              <div className="p-4 sm:p-8">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedClub.name}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
                      {sectors.find(s => s.id === selectedClub.sector_id)?.name} • {clubMembers.length} members
                    </p>
            </div>
                  <button
                    onClick={() => setSelectedClub(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
          </div>
          
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                                    {/* Members Section */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        Enrolled Students ({clubMembers.length})
                      </h3>
                      {isAdminOrTeacher && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setShowAddStudentModal(true);
                            loadAvailableStudents();
                          }}
                          className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                        >
                          <UserPlus className="h-3 w-3 sm:h-4 sm:w-4" />
                          Add Student
              </motion.button>
                      )}
                    </div>
                    
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {clubMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No students enrolled yet</p>
                        </div>
                      ) : (
                        clubMembers.map((member) => (
                          <motion.div
                            key={member.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                                {member.profiles?.username?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                  {member.profiles?.username || 'Unknown'}
                                </span>
                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                  Joined {new Date(member.joined_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            {isAdminOrTeacher && (
              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={async () => {
                                  await supabase.from('club_members').delete().eq('id', member.id);
                                  await loadClubMembers(selectedClub.id);
                                }}
                                className="p-1.5 sm:p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                title="Remove student"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.button>
                            )}
                          </motion.div>
                        ))
            )}
          </div>
        </div>

                  {/* Attendance Section */}
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        Attendance ({attendanceDate})
                      </h3>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => {
                            setAttendanceDate(e.target.value);
                            loadAttendance(selectedClub.id, e.target.value);
                          }}
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm sm:text-base"
                        />
                        {isAdminOrTeacher && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              // Mark all as present
                              clubMembers.forEach(member => {
                                handleMarkAttendance(selectedClub.id, member.user_id, 'present');
                              });
                            }}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Mark All Present
          </motion.button>
        )}
                      </div>
          </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {clubMembers.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No students to mark attendance for</p>
                        </div>
                      ) : (
                        clubMembers.map((member) => {
                          const att = attendance.find(a => a.user_id === member.user_id);
                          // Students only see their own attendance
                          if (isStudent && member.user_id !== user.id) return null;
                          
                          return (
          <motion.div
                              key={member.user_id}
                              initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
                              className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                                  {member.profiles?.username?.charAt(0) || 'U'}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
                                  {member.profiles?.username || 'Unknown'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 sm:gap-3">
                                <span className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium border ${statusColors[att?.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                  {att?.status || 'Not marked'}
                                </span>
                                
                                {isAdminOrTeacher && (
                                  <div className="flex gap-1">
                                    {['present', 'absent', 'late', 'leave'].map((status) => (
            <motion.button
                                        key={status}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                          att?.status === status
                                            ? 'bg-red-600 text-white shadow-lg'
                                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                                        }`}
                                        onClick={() => handleMarkAttendance(selectedClub.id, member.user_id, status)}
                                      >
                                        {status}
            </motion.button>
          ))}
        </div>
                                )}
      </div>
                            </motion.div>
                          );
                        })
                      )}
        </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
                )}
      </AnimatePresence>
                
      {/* Create Club Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Create New Club
                </h3>
                
                <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Club Name *
                  </label>
                  <input
                    type="text"
                      value={newClubData.name}
                      onChange={(e) => setNewClubData({ ...newClubData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter club name"
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sector *
                      </label>
                      <select
                      value={newClubData.sector_id}
                      onChange={(e) => setNewClubData({ ...newClubData, sector_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select a sector</option>
                      {sectors.map(sector => (
                        <option key={sector.id} value={sector.id}>
                          {sector.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                  </label>
                  <textarea
                      value={newClubData.description}
                      onChange={(e) => setNewClubData({ ...newClubData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter club description"
                  />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Capacity
                  </label>
                    <input
                      type="number"
                      value={newClubData.max_capacity}
                      onChange={(e) => setNewClubData({ ...newClubData, max_capacity: parseInt(e.target.value) || 30 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                                     <button
                     onClick={handleCreateClub}
                     className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                   >
                     Create Club
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddStudentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Add Users to {selectedClub?.name}
                  </h3>
                  <button
                    onClick={() => setShowAddStudentModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                                  </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    onChange={(e) => {
                      const term = e.target.value;
                      setSearchTerm(term);
                      const filtered = availableStudents.filter(student => 
                        student.username?.toLowerCase().includes(term.toLowerCase()) ||
                        student.email?.toLowerCase().includes(term.toLowerCase())
                      );
                      setFilteredStudents(filtered);
                    }}
                  />
                  <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  </div>
                </div>

              <div className="p-6 max-h-96 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{searchTerm ? 'No students found matching your search' : 'No available students found'}</p>
                    <p className="text-sm">{searchTerm ? 'Try a different search term' : 'All students are already enrolled in this club'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <motion.div
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                            {student.username?.charAt(0) || 'S'}
                                  </div>
                      <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {student.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {student.email}
                            </div>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleAddStudent(student.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                        >
                          Add
                        </motion.button>
                      </motion.div>
                    ))}
                      </div>
                )}
                    </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Sector Modal */}
      <AnimatePresence>
        {showCreateSectorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Create New Sector
                </h3>
                
                <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sector Name *
                      </label>
                    <input
                      type="text"
                      value={newSectorData.name}
                      onChange={(e) => setNewSectorData({ ...newSectorData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter sector name"
                      />
                    </div>

                    <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                      </label>
                    <textarea
                      value={newSectorData.description}
                      onChange={(e) => setNewSectorData({ ...newSectorData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Enter sector description"
                    />
                </div>
              </div>

                <div className="flex gap-3 mt-6">
                                  <button
                    onClick={() => setShowCreateSectorModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                                  </button>
                                  <button
                    onClick={handleCreateSector}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    Create Sector
                                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
          )}
      </AnimatePresence>

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
              message.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            {message.text}
          </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}