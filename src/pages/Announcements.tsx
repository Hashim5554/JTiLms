import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { useTheme } from '../hooks/useTheme';
import { 
  Megaphone, Plus, Trash2, Edit, ChevronLeft, ChevronRight as ChevronRightIcon,
  Search, Sparkles, Trophy, User, Calendar, X
} from 'lucide-react';
import type { Class } from '../types';

interface ContextType {
  currentClass: Class | null;
  classes: Class[];
}

interface Achiever {
  id: string;
  student_id: string;
  achievement: string;
  description: string;
  date: string;
  created_at: string;
  profiles?: {
    username: string;
    photo_url: string | null;
  };
  certificate_url?: string;
}

export function Announcements() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const context = useOutletContext<ContextType>();
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
  });
  const [achievers, setAchievers] = useState<Achiever[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showAchieverModal, setShowAchieverModal] = useState(false);
  const [newAchiever, setNewAchiever] = useState({
    student_id: '',
    achievement: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [showEditAchieverModal, setShowEditAchieverModal] = useState(false);
  const [editAchiever, setEditAchiever] = useState<Achiever | null>(null);
  const [editCertificateFile, setEditCertificateFile] = useState<File | null>(null);
  const [updatingAchiever, setUpdatingAchiever] = useState(false);
  const [isAchieversHovered, setIsAchieversHovered] = useState(false);

  // Optimized animations with reduced complexity
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 20
      }
    },
    hover: { 
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  // Optimized slide animation
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  // Memoize expensive computations
  const memoizedAchievers = React.useMemo(() => achievers, [achievers]);
  const memoizedAnnouncements = React.useMemo(() => announcements, [announcements]);

  // Optimize auto-advance slideshow
  useEffect(() => {
    if (achievers.length <= 1 || isAchieversHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % achievers.length);
    }, 2500);
    return () => clearInterval(timer);
  }, [achievers.length, isAchieversHovered]);

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            *,
            profiles:created_by (
              username,
              photo_url
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAnnouncements(data || []);
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  // Load achievers
  useEffect(() => {
    const loadAchievers = async () => {
    try {
      const { data, error } = await supabase
          .from('achievers')
          .select(`
            *,
            profiles:student_id (
              username,
              photo_url
            )
          `)
          .order('date', { ascending: false });

      if (error) throw error;
        setAchievers(data || []);
      } catch (err: any) {
        console.error(err.message);
      }
    };

    loadAchievers();
  }, []);

  // Handle create announcement
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      console.error('Please fill in all fields');
      return;
    }

    const insertObj: any = {
      title: newAnnouncement.title.trim(),
      content: newAnnouncement.content.trim(),
    };
    if (user?.id) insertObj.created_by = user.id;

    const { data, error } = await supabase
      .from('announcements')
      .insert([insertObj])
      .select()
      .single();

    console.log('Insert data:', data);
    console.log('Insert error:', error);

    if (error) {
      alert('Insert error: ' + error.message);
      return;
    }

    setAnnouncements(prev => [data, ...prev]);
    console.log('Announcement created successfully!');
    setTimeout(() => {
      setShowCreateModal(false);
      setNewAnnouncement({ title: '', content: '' });
    }, 3000);
  };

  // Handle delete announcement
  const handleDeleteAnnouncement = async () => {
    if (!selectedAnnouncement) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', selectedAnnouncement.id);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== selectedAnnouncement.id));
      console.log('Announcement deleted successfully!');
      setTimeout(() => {
        setShowDeleteModal(false);
      }, 3000);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  // Handle student search
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, photo_url')
        .ilike('username', `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle create achiever
  const handleCreateAchiever = async () => {
    if (!newAchiever.student_id || !newAchiever.achievement) {
      console.error('Please fill in all required fields');
      return;
    }

    let certificate_url = null;
    if (certificateFile) {
      setUploadingCertificate(true);
      const fileExt = certificateFile.name.split('.').pop();
      const fileName = `certificates/${newAchiever.student_id}-${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('achiever-certificates')
        .upload(fileName, certificateFile);
      setUploadingCertificate(false);
      if (uploadError) {
        alert('Failed to upload certificate');
        return;
      }
      certificate_url = supabase.storage.from('achiever-certificates').getPublicUrl(fileName).data.publicUrl;
    }

    try {
      const { data, error } = await supabase
        .from('achievers')
        .insert([{
          student_id: newAchiever.student_id,
          achievement: newAchiever.achievement,
          description: newAchiever.description,
          date: newAchiever.date,
          certificate_url
        }])
        .select()
        .single();

      if (error) throw error;

      setAchievers(prev => [data, ...prev]);
      setTimeout(() => {
        setShowAchieverModal(false);
        setNewAchiever({
          student_id: '',
          achievement: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        setCertificateFile(null);
      }, 3000);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  // Handle delete achiever
  const handleDeleteAchiever = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;
    try {
      const { error } = await supabase.from('achievers').delete().eq('id', id);
      if (error) throw error;
      setAchievers(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert('Failed to delete achievement');
    }
  };

  // Update getAchieverPhoto to handle more edge cases
  const getAchieverPhoto = (achiever: Achiever) => {
    const url = achiever?.profiles?.photo_url;
    if (!url || url.trim() === '' || url === 'null' || url === 'undefined') {
      return '/default-avatar.png';
    }
    return url;
  };

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-4 sm:py-8 px-2 sm:px-6 lg:px-8"
    >
      {/* Hero Section with Optimized Animation */}
      <motion.div 
        variants={cardVariants}
        className="max-w-7xl mx-auto mb-4 sm:mb-8"
      >
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-red-600 to-red-800 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
          <div className="relative px-4 sm:px-8 py-6 sm:py-10">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="mb-3 sm:mb-4 p-2 sm:p-3 bg-white/10 rounded-xl sm:rounded-2xl backdrop-blur-sm"
              >
                <Megaphone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3"
              >
                Announcements
              </motion.h1>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm sm:text-base text-white/90 max-w-2xl mb-4 sm:mb-6"
              >
                Stay updated with the latest news and important information from your school.
              </motion.p>
              {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
          <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-red-600 rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create New Announcement
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Optimized Outstanding Achievers Section */}
      <motion.div 
        variants={cardVariants}
        className="max-w-7xl mx-auto mb-4 sm:mb-8"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <motion.div 
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className="p-2 sm:p-2.5 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl shadow-lg"
                >
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Outstanding Achievers
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Celebrating student excellence
                  </p>
                </div>
              </div>
              {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAchieverModal(true)}
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl font-medium shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Add Achievement
          </motion.button>
        )}
      </div>

            {/* Optimized Slideshow */}
            <div
              className="relative h-[280px] sm:h-[320px] overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
              onMouseEnter={() => setIsAchieversHovered(true)}
              onMouseLeave={() => setIsAchieversHovered(false)}
            >
              <AnimatePresence mode="wait" custom={currentSlide}>
                {memoizedAchievers.length > 0 && (
                  <motion.div
                    key={currentSlide}
                    custom={currentSlide}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 }
                    }}
                    className="absolute inset-0 flex items-center justify-center p-4 sm:p-6"
                  >
                    <motion.div 
                      whileHover={{ scale: 1.02 }}
                      className="w-full max-w-2xl"
                    >
                      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-4 sm:p-6">
                          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden ring-2 sm:ring-3 ring-red-500/20 relative">
                              <img
                                src={getAchieverPhoto(memoizedAchievers[currentSlide])}
                                alt={memoizedAchievers[currentSlide].profiles?.username}
                                className="w-full h-full object-cover"
                                onError={e => { e.currentTarget.src = '/default-avatar.png'; }}
                              />
                              {(user?.role === 'admin' || user?.role === 'ultra_admin' || user?.role === 'teacher') && (
                                <div className="absolute top-0 right-0 flex flex-col gap-1 p-1">
                                  <button
                                    onClick={() => handleDeleteAchiever(memoizedAchievers[currentSlide].id)}
                                    className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 shadow"
                                    title="Delete Achievement"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditAchiever(memoizedAchievers[currentSlide]);
                                      setShowEditAchieverModal(true);
                                    }}
                                    className="bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-full p-1 shadow"
                                    title="Edit Achievement"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                                {memoizedAchievers[currentSlide].profiles?.username}
                              </h3>
                              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                {new Date(memoizedAchievers[currentSlide].date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <h4 className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400">
                              {memoizedAchievers[currentSlide].achievement}
                            </h4>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                              {memoizedAchievers[currentSlide].description}
                            </p>
                          </div>
                          {memoizedAchievers[currentSlide].certificate_url && (
                            <a
                              href={memoizedAchievers[currentSlide].certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block mt-3 px-3 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs font-medium transition-colors"
                            >
                              View Certificate
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

              {/* Enhanced Navigation */}
              {memoizedAchievers.length > 1 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1, x: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + memoizedAchievers.length) % memoizedAchievers.length)}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1, x: 2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % memoizedAchievers.length)}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
                  >
                    <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </>
              )}

              {/* Enhanced Dots */}
              {memoizedAchievers.length > 1 && (
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1 sm:gap-1.5">
                  {memoizedAchievers.map((_, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setCurrentSlide(index)}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${
                        index === currentSlide
                          ? 'bg-red-500 scale-125'
                          : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Optimized Announcements Grid */}
      <motion.div 
        variants={cardVariants}
        className="max-w-7xl mx-auto"
      >
        {loading ? (
          <div className="flex items-center justify-center py-12 sm:py-16">
            <div className="text-center">
        <motion.div 
                animate={{ 
                  rotate: 360,
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  rotate: { repeat: Infinity, duration: 1, ease: "linear" },
                  scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                }}
                className="inline-block"
              >
                <Megaphone className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
        </motion.div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading announcements...</p>
            </div>
          </div>
        ) : memoizedAnnouncements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className="text-center py-12 sm:py-16 bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 rounded-full w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 flex items-center justify-center"
            >
              <Megaphone className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
            </motion.div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              No Announcements Yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto">
              Be the first to create an announcement and keep everyone informed.
            </p>
            {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg sm:rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                Create New Announcement
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <AnimatePresence mode="wait">
              {memoizedAnnouncements.map((announcement) => (
                <motion.div
                  key={announcement.id}
                  variants={cardVariants}
                  whileHover="hover"
                  className="group relative bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden"
                >
                  {/* Card Header */}
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="h-24 sm:h-28 bg-gradient-to-r from-red-500 to-red-600 p-4 sm:p-5 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <motion.div 
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        className="p-2 sm:p-2.5 bg-white/10 rounded-lg sm:rounded-xl backdrop-blur-sm"
                      >
                        <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </motion.div>
                      <h3 className="text-base sm:text-lg font-semibold text-white truncate max-w-[180px] sm:max-w-[200px]">
                        {announcement.title}
                      </h3>
                    </div>
                    <motion.div 
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      className="p-2 sm:p-2.5 bg-white/10 rounded-lg sm:rounded-xl backdrop-blur-sm"
                    >
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5">
                    <div className="mb-3 sm:mb-4">
                      <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1.5 sm:mb-2">
                        Content
                      </div>
                      <div className="text-sm sm:text-base text-gray-900 dark:text-white">
                        {announcement.content}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{announcement.profiles?.username || 'Unknown User'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
                    <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 sm:gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setSelectedAnnouncement(announcement); setShowDeleteModal(true); }}
                        className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.button>
                    </div>
                  )}
            </motion.div>
          ))}
            </AnimatePresence>
        </div>
      )}
      </motion.div>

      {/* Enhanced Create Announcement Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg p-5 sm:p-8 relative"
            >
                <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                </button>

              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
                Create New Announcement
              </h2>

              <div className="space-y-3 sm:space-y-4">
            <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Title
              </label>
              <input
                type="text"
                    value={newAnnouncement.title}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter announcement title"
              />
            </div>

            <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                Content
              </label>
              <textarea
                    value={newAnnouncement.content}
                    onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                    placeholder="Enter announcement content"
                    rows={4}
              />
            </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateAnnouncement}
                  className="w-full mt-4 sm:mt-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Create Announcement
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedAnnouncement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-8 relative"
            >
              <button
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
              </button>

              <div className="text-center">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 mb-4 sm:mb-6 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  Delete Announcement
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
                  Are you sure you want to delete this announcement? This action cannot be undone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium text-sm sm:text-base transition-colors"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAnnouncement}
                    className="flex-1 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-red-600 text-white font-medium text-sm sm:text-base transition-colors"
                  >
                    Delete
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Add Achievement Modal */}
      <AnimatePresence>
        {showAchieverModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg p-8 relative"
            >
              <button
                onClick={() => setShowAchieverModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Add Achievement
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Student
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Search by username"
                      />
                      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSearch}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                    >
                      Search
                    </motion.button>
                  </div>

                  {isSearching && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Searching...
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.map((result) => (
                        <motion.button
                          key={result.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setNewAchiever(prev => ({ ...prev, student_id: result.id }));
                            setSearchResults([]);
                            setSearchQuery(result.username);
                          }}
                          className="w-full p-3 flex items-center gap-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img
                              src={result.photo_url || '/default-avatar.png'}
                              alt={result.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {result.username}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Achievement *
                  </label>
                  <input
                    type="text"
                    value={newAchiever.achievement}
                    onChange={(e) => setNewAchiever(prev => ({ ...prev, achievement: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder="Enter achievement title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newAchiever.description}
                    onChange={(e) => setNewAchiever(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    rows={3}
                    placeholder="Enter achievement description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newAchiever.date}
                    onChange={(e) => setNewAchiever(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Certificate (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setCertificateFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAchieverModal(false)}
                  className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-colors"
                  >
                    Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateAchiever}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  Add Achievement
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Achiever Modal */}
      <AnimatePresence>
        {showEditAchieverModal && editAchiever && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg p-8 relative"
            >
              <button
                onClick={() => setShowEditAchieverModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Edit Achievement
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Achievement
                  </label>
                  <input
                    type="text"
                    value={editAchiever.achievement}
                    onChange={e => setEditAchiever({ ...editAchiever, achievement: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editAchiever.description}
                    onChange={e => setEditAchiever({ ...editAchiever, description: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editAchiever.date}
                    onChange={e => setEditAchiever({ ...editAchiever, date: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Certificate (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={e => setEditCertificateFile(e.target.files?.[0] || null)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                  {editAchiever.certificate_url && (
                    <a
                      href={editAchiever.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-2 px-2 py-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs"
                    >
                      View Current Certificate
                    </a>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditAchieverModal(false)}
                  className="px-6 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setUpdatingAchiever(true);
                    let certificate_url = editAchiever.certificate_url;
                    if (editCertificateFile) {
                      const fileExt = editCertificateFile.name.split('.').pop();
                      const fileName = `certificates/${editAchiever.student_id}-${Date.now()}.${fileExt}`;
                      const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('achiever-certificates')
                        .upload(fileName, editCertificateFile);
                      if (!uploadError) {
                        certificate_url = supabase.storage.from('achiever-certificates').getPublicUrl(fileName).data.publicUrl;
                      }
                    }
                    const { error } = await supabase
                      .from('achievers')
                      .update({
                        achievement: editAchiever.achievement,
                        description: editAchiever.description,
                        date: editAchiever.date,
                        certificate_url
                      })
                      .eq('id', editAchiever.id);
                    setUpdatingAchiever(false);
                    if (!error) {
                      // Fetch the updated achiever with the profiles join
                      const { data: updated, error: fetchError } = await supabase
                        .from('achievers')
                        .select(`
                          *,
                          profiles:student_id (
                            username,
                            photo_url
                          )
                        `)
                        .eq('id', editAchiever.id)
                        .single();
                      if (!fetchError && updated) {
                        setAchievers(prev => prev.map(a => a.id === updated.id ? updated : a));
                        setShowEditAchieverModal(false);
                        setEditAchiever(null);
                        setEditCertificateFile(null);
                      } else {
                        alert('Failed to fetch updated achievement');
                      }
                    } else {
                      alert('Failed to update achievement');
                    }
                  }}
                  disabled={updatingAchiever}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {updatingAchiever ? 'Saving...' : 'Save Changes'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default Announcements;