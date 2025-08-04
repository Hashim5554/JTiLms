import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/SessionContext';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  MessageSquare,
  Trash2, 
  Plus,
  Loader2,
  Calendar,
  PlusCircle,
  Clock,
  AlertCircle,
  X,
  Users,
  Target,
  Upload,
  Download,
  FileText,
  Settings,
  Newspaper
} from 'lucide-react';
import { Class } from '../types';
import '../styles/cards.css';
import { useTheme } from '../hooks/useTheme';
import { markMessagesAsRead } from '../lib/messageTracking';

interface HomeContextType {
  currentClass: Class | null;
  classes: Class[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  username?: string;
  role?: string;
}

interface DueWork {
  id: string;
  title: string;
  description: string;
  due_date: string;
  subject_id: string;
  class_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  subject_name: string;
  creator_username: string;
}

interface Discussion {
  id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  class_id: string;
  username?: string;
  profiles?: {
    username: string;
  };
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  created_by: string;
  created_at: string;
  is_deleted?: boolean;
  updated_at?: string;
}

interface PrivateDiscussion {
  id: string;
  content: string;
  created_by: string;
  recipient_id: string;
  class_id: string;
  created_at: string;
  updated_at: string;
  sender_username?: string;
  sender_role?: string;
  recipient_username?: string;
  recipient_role?: string;
  profiles?: {
    username: string;
    role: string;
  };
  recipient?: {
    username: string;
    role: string;
  };
}

const HERO_BG = '/Screenshot 2025-05-03 164632.png';

function useParallax(offset = 0.4) {
  const [parallax, setParallax] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      setParallax(window.scrollY * offset);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset]);
  return parallax;
}

export function Home() {
  const navigate = useNavigate();
  console.log('Home component rendering'); // Debug log

  // Add a render counter to track re-renders
  const renderCount = React.useRef(0);
  renderCount.current += 1;
  console.log('Render count:', renderCount.current);

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dueWorks, setDueWorks] = useState<DueWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDueWorkModal, setShowDueWorkModal] = useState(false);
  const [selectedDueWork, setSelectedDueWork] = useState<DueWork | null>(null);
  const [newDueWork, setNewDueWork] = useState({
    title: '',
    description: '',
    due_date: '',
    subject_id: '',
    class_id: ''
  });
  const [subjects, setSubjects] = useState<any[]>([]);
  const { user } = useSession();
  const { currentClass, classes } = useOutletContext<HomeContextType>();
  
  // Log user changes
  React.useEffect(() => {
    console.log('User changed:', user);
  }, [user]);
  
  // Log currentClass changes
  React.useEffect(() => {
    console.log('CurrentClass changed:', currentClass);
  }, [currentClass]);
  const [newNews, setNewNews] = useState({
    title: '',
    content: ''
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [showOldNews, setShowOldNews] = useState(false);
  const [isCreateNewsModalOpen, setIsCreateNewsModalOpen] = useState(false);
  const [newNewsTitle, setNewNewsTitle] = useState('');
  const [newNewsContent, setNewNewsContent] = useState('');
  const [creatingNews, setCreatingNews] = useState(false);
  const [deletingNews, setDeletingNews] = useState<string | null>(null);
  const [movingNews, setMovingNews] = useState<string | null>(null);
  const [creatingDueWork, setCreatingDueWork] = useState(false);
  const [showDueWorkDetailsModal, setShowDueWorkDetailsModal] = useState(false);
  const [showCreateDueWorkModal, setShowCreateDueWorkModal] = useState(false);
  const [showNewsDetailsModal, setShowNewsDetailsModal] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showDiscussionsModal, setShowDiscussionsModal] = useState(false);
  const [showPrivateDiscussions, setShowPrivateDiscussions] = useState(false);
  const [showOpenDiscussions, setShowOpenDiscussions] = useState(false);
  const [selectedDiscussionType, setSelectedDiscussionType] = useState<'private' | 'open' | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showTargetsModal, setShowTargetsModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [targetFiles, setTargetFiles] = useState<{ [key: string]: any[] }>({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isHeroHovered, setIsHeroHovered] = useState(false);
  const [lightPos, setLightPos] = useState<{ x: number; y: number } | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);
  const parallax = useParallax(0.4);
  const [privateDiscussions, setPrivateDiscussions] = useState<PrivateDiscussion[]>([]);

  const months = [
    { name: 'August', value: 'august' },
    { name: 'September', value: 'september' },
    { name: 'October', value: 'october' },
    { name: 'November', value: 'november' },
    { name: 'December', value: 'december' },
    { name: 'January', value: 'january' },
    { name: 'February', value: 'february' },
    { name: 'March', value: 'march' },
    { name: 'April', value: 'april' },
    { name: 'May', value: 'may' },
    { name: 'June', value: 'june' }
  ];

  // --- 3D/Scroll Animations ---
  const cardVariants = {
    initial: { opacity: 0, y: 40, rotateY: -10 },
    animate: { opacity: 1, y: 0, rotateY: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
    whileHover: { scale: 1.04, rotateY: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' },
  };

  const loadData = useCallback(async () => {
    console.log('Starting loadData'); // Debug log
    setLoading(true);
    setError(null);
    
    // Add request timeout and cancellation
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('Request timeout reached, cancelling requests');
      controller.abort();
    }, 15000); // 15 second timeout for individual requests
    
    try {
      // Load announcements with timeout
      try {
        console.log('Loading announcements'); // Debug log
        let announcementsQuery = supabase
          .rpc('get_announcements_with_profiles')
          .order('created_at', { ascending: false });

        if (currentClass?.id && user?.role !== 'ultra_admin') {
          announcementsQuery = announcementsQuery.eq('class_id', currentClass.id);
        }

        const { data: announcementsData, error: announcementsError } = await announcementsQuery;
        console.log('Announcements loaded:', announcementsData, announcementsError); // Debug log
        
        if (!announcementsError) {
          setAnnouncements(announcementsData || []);
        } else {
          console.warn('Error loading announcements:', announcementsError);
          setAnnouncements([]);
        }
      } catch (announcementsFallbackError) {
        console.warn('Fallback for announcements:', announcementsFallbackError);
        setAnnouncements([]);
      }

      // Load discussions with timeout
      try {
        console.log('Loading discussions'); // Debug log
        let discussionsQuery = supabase
          .rpc('get_discussions_with_profiles')
          .order('created_at', { ascending: false });

        if (currentClass?.id) {
          discussionsQuery = discussionsQuery.eq('class_id', currentClass.id);
        }

        const { data: discussionsData, error: discussionsError } = await discussionsQuery;
        console.log('Discussions loaded:', discussionsData, discussionsError); // Debug log
        
        if (!discussionsError) {
          setDiscussions(discussionsData || []);
        } else {
          console.warn('Error loading discussions:', discussionsError);
          setDiscussions([]);
        }
      } catch (discussionsFallbackError) {
        console.warn('Fallback for discussions:', discussionsFallbackError);
        setDiscussions([]);
      }

      // Load due works with timeout
      try {
        console.log('Loading due works'); // Debug log
        await loadDueWorks(false);
      } catch (dueWorksError) {
        console.warn('Error loading due works:', dueWorksError);
        setDueWorks([]);
      }

      // Create recent activity from existing data
      const recentActivity = [
        ...announcements.slice(0, 3).map(a => ({
          id: a.id,
          type: 'announcement',
          title: a.title,
          created_at: a.created_at,
          description: `New announcement: ${a.title}`
        })),
        ...discussions.slice(0, 3).map(d => ({
          id: d.id,
          type: 'discussion',
          title: d.content,
          created_at: d.created_at,
          description: `New discussion: ${d.content.substring(0, 50)}...`
        })),
        ...dueWorks.slice(0, 3).map(w => ({
          id: w.id,
          type: 'due_work',
          title: w.title,
          created_at: w.created_at,
          description: `New assignment: ${w.title}`
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

      setRecentActivity(recentActivity);
      console.log('Data loading completed successfully'); // Debug log
    } catch (error: any) {
      console.error('Error in loadData:', error);
      if (error.name === 'AbortError') {
        console.log('Request was aborted due to timeout');
        setError('Request timeout - please try again');
      } else {
        setError(error.message || 'Failed to load data');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [currentClass?.id, user?.role]);

  useEffect(() => {
    console.log('Initial useEffect running'); // Debug log
    console.log('Current user:', user); // Debug log
    console.log('Current class:', currentClass); // Debug log

    // Prevent multiple simultaneous data loads
    if (loading) {
      console.log('Already loading, skipping data load');
      return;
    }

    // Start loading data
    loadData();
    loadSubjects(); // Load subjects on mount
    
    // Force render after a longer timeout even if data isn't fully loaded
    const forceRenderTimer = setTimeout(() => {
      console.log('Force render timeout reached'); // Debug log
      setLoading(false);
    }, 15000); // 15 second timeout - increased from 10 seconds
    
    // Additional safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      console.log('Safety timeout reached, forcing loading to false');
      setLoading(false);
      setError('Loading timeout - please refresh the page');
    }, 30000); // 30 second safety timeout
    
    return () => {
      console.log('Cleanup running'); // Debug log
      clearTimeout(forceRenderTimer);
      clearTimeout(safetyTimer);
    };
  }, [currentClass?.id, user?.role, loading]); // More stable dependencies

  // Load subjects when needed
  const loadSubjects = async () => {
    if (subjects.length > 0) return; // Don't reload if we already have subjects
    
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*');

      if (error) throw error;
      if (data) {
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handlePostDiscussion = async () => {
    if (!newDiscussion.trim() || !user?.id || !currentClass?.id) return;

    try {
      const { data, error } = await supabase
        .from('discussions')
        .insert([{
          content: newDiscussion,
          created_by: user.id,
          class_id: currentClass.id
        }])
        .select(`
          *,
          profiles (username)
        `)
        .single();

      if (error) throw error;
      if (data) {
        setDiscussions([data, ...discussions]);
        setNewDiscussion('');
      }
    } catch (error) {
      console.error('Error posting discussion:', error);
    }
  };

  const loadDueWorks = async (manageLoading = true) => {
    // Add request timeout
    const timeoutId = setTimeout(() => {
      console.log('Due works request timeout, setting empty array');
      setDueWorks([]);
      if (manageLoading) {
        setLoading(false);
      }
    }, 8000); // 8 second timeout for due works

    try {
      if (manageLoading) {
        setLoading(true);
        setError(null);
      }

      try {
        // Try to get due works with the RPC function first
        const { data, error } = await supabase
          .rpc('get_home_due_works');

        if (!error) {
          console.log('Successfully loaded due works via RPC');
          
          // Filter by class if one is selected and user is not admin
          let filteredWorks = data || [];
          if (currentClass?.id && user?.role !== 'ultra_admin') {
            filteredWorks = filteredWorks.filter((work: {class_id: string}) => work.class_id === currentClass.id);
          }

          setDueWorks(filteredWorks);
          clearTimeout(timeoutId);
          return;
        } else {
          console.warn('RPC failed for due works, using fallback:', error);
          throw error;
        }
      } catch (rpcError) {
        // Fallback: Direct query to due_works table with joins
        console.log('Using fallback for due works');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('due_works')
          .select(`
            *,
            subjects (name),
            profiles!due_works_created_by_fkey (username)
          `)
          .order('due_date', { ascending: true });

        if (fallbackError) {
          console.error('Fallback for due works also failed:', fallbackError);
          throw fallbackError;
        }

        // Transform the data to match the expected format
        const transformedData = fallbackData?.map(item => ({
          ...item,
          subject_name: item.subjects?.name,
          creator_username: item.profiles?.username
        })) || [];

        // Filter by class if one is selected and user is not admin
        let filteredWorks = transformedData;
        if (currentClass?.id && user?.role !== 'ultra_admin') {
          filteredWorks = filteredWorks.filter(work => work.class_id === currentClass.id);
        }

        setDueWorks(filteredWorks);
        clearTimeout(timeoutId);
      }
    } catch (error: any) {
      console.error('Error loading due works:', error);
      if (manageLoading) {
        setError('Failed to load due works. Please try again.');
      }
      // Set empty array to prevent UI from being stuck in loading
      setDueWorks([]);
      clearTimeout(timeoutId);
    } finally {
      if (manageLoading) {
        setLoading(false);
      }
    }
  };

  const handleCreateDueWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingDueWork(true);
    
    try {
      console.log('Creating due work for classes:', selectedClasses);
      console.log('Due work data:', newDueWork);
      
      // Create due work for each selected class
      const dueWorkPromises = selectedClasses.map(async (classId) => {
        console.log('Creating due work for class:', classId);
        
        const { data, error } = await supabase
          .from('due_works')
          .insert([{
            title: newDueWork.title,
            description: newDueWork.description,
            due_date: newDueWork.due_date,
            subject_id: newDueWork.subject_id,
            class_id: classId,
            created_by: user?.id
          }])
          .select();

        if (error) {
          console.error('Error creating due work for class', classId, ':', error);
          throw error;
        }
        
        console.log('Successfully created due work for class', classId, ':', data);
        return data;
      });

      await Promise.all(dueWorkPromises);
      console.log('All due works created successfully');
      
      await loadDueWorks();
      setShowCreateDueWorkModal(false);
      setNewDueWork({
        title: '',
        description: '',
        due_date: '',
        subject_id: '',
        class_id: ''
      });
      setSelectedClasses([]);
      
      // Show success message
      alert('Due work created successfully!');
    } catch (error: any) {
      console.error('Error creating due work:', error);
      alert(`Failed to create due work: ${error.message}`);
    } finally {
      setCreatingDueWork(false);
    }
  };

  // Handle delete due work
  const handleDeleteDueWork = async (dueWorkId: string) => {
    if (!user) return;
    
    try {
      console.log('Deleting due work:', dueWorkId);
      
      const { error } = await supabase
        .from('due_works')
        .delete()
        .eq('id', dueWorkId);

      if (error) {
        console.error('Error deleting due work:', error);
        throw error;
      }

      console.log('Due work deleted successfully');
      
      // Refresh due works
      await loadDueWorks();
      
      // Show success message
      alert('Due work deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting due work:', error);
      alert(`Failed to delete due work: ${error.message}`);
    }
  };

  // Add this new function to clean up deleted items
  const cleanupDeletedNews = async () => {
    try {
      // First, get all news items marked as deleted
      const { data: deletedNews, error: fetchError } = await supabase
        .from('news')
        .select('*')
        .eq('is_deleted', true);

      if (fetchError) {
        console.error('Error fetching deleted news:', fetchError);
        return;
      }

      // If there are deleted items, remove them from the database
      if (deletedNews && deletedNews.length > 0) {
        const { error: deleteError } = await supabase
          .from('news')
          .delete()
          .in('id', deletedNews.map(item => item.id));

        if (deleteError) {
          console.error('Error cleaning up deleted news:', deleteError);
        }
      }
    } catch (error) {
      console.error('Error in cleanupDeletedNews:', error);
    }
  };

  // Update the handleDeleteNews function with more detailed logging
  const handleDeleteNews = async (newsId: string) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'ultra_admin') {
      console.error('User does not have permission to delete news');
      return;
    }

    try {
      setDeletingNews(newsId);
      console.log('Starting deletion process for news item:', newsId);

      // Delete the news item directly
      const { error: deleteError } = await supabase
        .from('news')
        .delete()
        .eq('id', newsId);

      if (deleteError) {
        console.error('Error deleting news item:', deleteError);
        throw deleteError;
      }

      console.log('Successfully deleted news item from database');

      // Update local state immediately
      setNews((prevNews) => prevNews.filter((n) => n.id !== newsId));

      // Clear cache
      localStorage.removeItem('cachedNews');
      console.log('Cleared news cache');

    } catch (error: any) {
      console.error('Error in handleDeleteNews:', error);
      setError(error.message || 'Failed to delete news item');
    } finally {
      setDeletingNews(null);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create news');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'ultra_admin' && user.role !== 'teacher') {
      setError('You do not have permission to create news');
      return;
    }

    if (!newNewsTitle.trim() || !newNewsContent.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setCreatingNews(true);
      const { data, error } = await supabase
        .from('news')
        .insert([{
          title: newNewsTitle.trim(), 
          content: newNewsContent.trim(), 
          created_by: user.id,
          is_deleted: false,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update local state with the new news item
      if (data) {
        setNews(prevNews => [data, ...prevNews]);
      }
      
      setIsCreateNewsModalOpen(false);
      setNewNewsTitle('');
      setNewNewsContent('');
      setError(null);
    } catch (error: any) {
      console.error('Error creating news:', error);
      setError(error.message || 'Failed to create news');
    } finally {
      setCreatingNews(false);
    }
  };

  // Update the useEffect for news fetching
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        console.log('Starting news fetch...');

        // Fetch all news items
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching news:', error);
             setError('Failed to load news. Please try again.');
          throw error;
        }

        console.log('Fetched news items:', data);

        if (data) {
          setNews(data);
          localStorage.setItem('cachedNews', JSON.stringify(data));
        }
      } catch (error) {
        console.error('Error in fetchNews:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchNews();

    // Set up real-time subscription
    const channel = supabase.channel('news_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'news' 
        }, 
        async (payload) => {
          console.log('Realtime news change detected:', payload);
          
          if (payload.eventType === 'DELETE') {
            // For deletions, remove from state
            setNews((prevNews) => prevNews.filter((n) => n.id !== payload.old.id));
            localStorage.removeItem('cachedNews');
          } else if (payload.eventType === 'INSERT') {
            // For new items, add to state
            setNews((prevNews) => [payload.new, ...prevNews]);
            localStorage.removeItem('cachedNews');
          } else if (payload.eventType === 'UPDATE') {
            // For updates, update the item in state
            setNews((prevNews) => {
              const updatedNews = prevNews.map((n) => (n.id === payload.new.id ? payload.new : n));
              return updatedNews as NewsItem[];
            });
            localStorage.removeItem('cachedNews');
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // Update the recentNews filter with logging
  const recentNews = useMemo((): NewsItem[] => {
    const now = new Date();
    const filtered = news.filter((n: NewsItem) => {
      const newsDate = new Date(n.created_at);
      const isRecent = (now.getTime() - newsDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
      return isRecent;
    });
    console.log('Filtered recent news:', filtered);
    return filtered;
  }, [news]);

  // Update the oldNews filter with logging
  const oldNews = useMemo(() => {
    const now = new Date();
    const filtered = news.filter(n => {
      const newsDate = new Date(n.created_at);
      const isOld = (now.getTime() - newsDate.getTime()) >= 7 * 24 * 60 * 60 * 1000;
      return isOld;
    });
    console.log('Filtered old news:', filtered);
    return filtered;
  }, [news]);

  // Calculate time left for due works
  const getTimeLeft = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Due soon';
  };

  // Load users for private discussions
  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, role')
        .neq('id', user?.id);

      if (error) throw error;
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  // Load target files
  const loadTargetFiles = async () => {
    try {
      // First get the files
      const { data, error } = await supabase
        .from('attainment_targets')
        .select(`
          id,
          name,
          url,
          month,
          created_by,
          uploaded_at,
          created_at
        `)
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Error fetching target files:', error);
        throw error;
      }
      
      if (!data) {
        setTargetFiles({});
        return;
      }

      // Then get the usernames for created_by ids
      const userIds = [...new Set(data.map(file => file.created_by))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of user IDs to usernames
      const usernameMap = (profiles || []).reduce((acc: {[key: string]: string}, profile) => {
        acc[profile.id] = profile.username;
        return acc;
      }, {});
      
      // Group files by month
      const groupedFiles = data.reduce((acc: { [key: string]: any[] }, file) => {
        const month = file.month.toLowerCase();
        if (!acc[month]) acc[month] = [];
        
        // Add the public URL and username to each file
        const publicUrl = supabase.storage
          .from('attainment-targets')
          .getPublicUrl(file.url)
          .data.publicUrl;
          
        acc[month].push({
          ...file,
          publicUrl,
          username: usernameMap[file.created_by] || 'Unknown User'
        });
        
        return acc;
      }, {});

      setTargetFiles(groupedFiles);
    } catch (error) {
      console.error('Error loading target files:', error);
      alert('Failed to load files. Please try refreshing the page.');
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, month: string) => {
    if (!e.target.files?.length || !user) return;

    const file = e.target.files[0];
    setUploadingFile(true);

    try {
      // Check file size (50MB limit)
      if (file.size > 52428800) {
        throw new Error('File size must be less than 50MB');
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported. Please upload PDF, Word documents, text files, or images.');
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${month}/${user.id}-${Date.now()}.${fileExt}`;
      
      console.log('Uploading file to storage:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attainment-targets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('Upload failed - no path returned');
      }

      console.log('File uploaded to storage, adding to database...');

      // Add file record to database
      const { error: dbError } = await supabase
        .from('attainment_targets')
        .insert([{
          name: file.name,
          url: uploadData.path,
          month: month,
          created_by: user.id,
          uploaded_at: new Date().toISOString()
        }]);

      if (dbError) {
        console.error('Database insert error:', dbError);
        // If database insert fails, clean up the uploaded file
        await supabase.storage
          .from('attainment-targets')
          .remove([uploadData.path]);
        throw new Error(`Database insert failed: ${dbError.message}`);
      }

      console.log('File successfully uploaded and added to database');

      // Refresh files
      await loadTargetFiles();
      
      // Clear the input
      e.target.value = '';
      
      // Show success message
      alert('File uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle file delete
  const handleFileDelete = async (fileId: string, fileUrl: string) => {
    if (!user) return;
    setDeletingFile(fileId);

    try {
      console.log('Deleting file from storage:', fileUrl);
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('attainment-targets')
        .remove([fileUrl]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        throw new Error(`Storage delete failed: ${storageError.message}`);
      }

      console.log('File deleted from storage, removing from database...');

      // Delete from database
      const { error: dbError } = await supabase
        .from('attainment_targets')
        .delete()
        .eq('id', fileId);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw new Error(`Database delete failed: ${dbError.message}`);
      }

      console.log('File successfully deleted from database');

      // Refresh files
      await loadTargetFiles();
      
      // Show success message
      alert('File deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting file:', error);
      alert(`Failed to delete file: ${error.message}`);
    } finally {
      setDeletingFile(null);
    }
  };

  const handleMoveToOldNews = async (newsId: string) => {
    if (!user || (user.role !== 'admin' && user.role !== 'ultra_admin')) return;

    try {
      // Update the news item's created_at to make it appear in old news
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 8); // Move it 8 days back to ensure it's in old news
      
      const { error } = await supabase
        .from('news')
        .update({ created_at: oldDate.toISOString() })
        .eq('id', newsId);

      if (error) throw error;

      // Update local state
      setNews(prevNews => prevNews.map(n => 
        n.id === newsId ? { ...n, created_at: oldDate.toISOString() } : n
      ));
    } catch (error) {
      console.error('Error moving news to old:', error);
    }
  };

  const handleMoveToRecentNews = async (newsId: string) => {
    if (!user || (user.role !== 'admin' && user.role !== 'ultra_admin')) return;

    try {
      // Update the news item's created_at to make it appear in recent news
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 1); // Set to yesterday to ensure it's in recent news
      
      const { error } = await supabase
        .from('news')
        .update({ created_at: recentDate.toISOString() })
        .eq('id', newsId);

      if (error) throw error;
      
      // Update local state
      setNews(prevNews => prevNews.map(n => 
        n.id === newsId ? { ...n, created_at: recentDate.toISOString() } : n
      ));
    } catch (error) {
      console.error('Error moving news to recent:', error);
    }
  };

  const loadDiscussions = async () => {
    if (!currentClass?.id) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_discussions_with_profiles')
        .eq('class_id', currentClass.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscussions(data || []);
    } catch (error) {
      console.error('Error loading discussions:', error);
    }
  };

  const loadPrivateDiscussions = async () => {
    if (!selectedUser?.id || !user?.id) return;
    
    try {
      const { data, error } = await supabase
        .rpc('get_private_discussions_with_profiles')
        .or(`created_by.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Filter messages to only show those between the current user and selected user
      const filteredData = data?.filter(d => 
        (d.created_by === user.id && d.recipient_id === selectedUser.id) ||
        (d.created_by === selectedUser.id && d.recipient_id === user.id)
      ) || [];
      
      setPrivateDiscussions(filteredData);
    } catch (error) {
      console.error('Error loading private discussions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id || !currentClass?.id) {
      console.log('Missing required data for open discussion:', { 
        hasMessage: !!newMessage.trim(), 
        hasUserId: !!user?.id, 
        hasClassId: !!currentClass?.id 
      });
      return;
    }

    try {
      console.log('Attempting to insert open discussion message into Supabase');
      const { data, error } = await supabase
        .from('discussions')
        .insert([{
          content: newMessage,
          created_by: user.id,
          class_id: currentClass.id
        }])
        .select();

      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }
      
      console.log('Message sent successfully:', data);
      
      if (data) {
        // Reload discussions to get the updated list with profile information
        await loadDiscussions();
        setNewMessage('');
        // Message tracking is now handled automatically by the real-time subscription
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error.message}`);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('discussions')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      // Update local state
      setDiscussions((prevDiscussions) => {
        const updatedDiscussions = prevDiscussions.filter((d: { id: string }) => d.id !== messageId);
        return updatedDiscussions;
      });
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleDeletePrivateMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('private_discussions')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      
      // Update local state
      setPrivateDiscussions(privateDiscussions.filter(d => d.id !== messageId));
    } catch (error) {
      console.error('Error deleting private message:', error);
    }
  };

  const handleSendPrivateMessage = async () => {
    console.log('handleSendPrivateMessage called'); // Debug log
    console.log('Attempting to send private message:', { 
      newMessage, 
      userId: user?.id, 
      recipientId: selectedUser?.id
    });
    
    if (!newMessage.trim() || !user?.id || !selectedUser?.id) {
      console.log('Missing required data for private discussion:', { 
        hasMessage: !!newMessage.trim(), 
        hasUserId: !!user?.id, 
        hasRecipientId: !!selectedUser?.id
      });
      return;
    }

    try {
      console.log('Attempting to insert private message into Supabase');
      const { data, error } = await supabase
        .from('private_discussions')
        .insert([{
          content: newMessage,
          created_by: user.id,
          recipient_id: selectedUser.id,
          class_id: null // Allow private messages without class restriction
        }])
        .select();

      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }
      
      console.log('Private message sent successfully:', data);
      
      if (data) {
        // Reload discussions to get the updated list with profile information
        await loadPrivateDiscussions();
        setNewMessage('');
      }
    } catch (error: any) {
      console.error('Error sending private message:', error);
      alert(`Failed to send private message: ${error.message}`);
    }
  };

  // Add useEffect for loading discussions
  useEffect(() => {
    if (showDiscussionsModal) {
      if (selectedDiscussionType === 'open') {
        loadDiscussions();
        // Mark discussions as read when user opens discussions
        markMessagesAsRead('discussions');
      } else if (selectedDiscussionType === 'private' && selectedUser) {
        loadPrivateDiscussions();
        // Mark private discussions as read when user opens private discussions
        markMessagesAsRead('private_discussions');
      }
    }
  }, [showDiscussionsModal, selectedDiscussionType, selectedUser]);

  // Mark announcements as read when component mounts (user visits home page)
  useEffect(() => {
    if (user) {
      markMessagesAsRead('announcements');
    }
  }, [user]);

  // Add error boundary
  if (error) {
    console.error('Error state:', error); // Debug log
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="page-container flex items-center justify-center"
      >
        <div className="card p-8 max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="button-primary">
            Try Again
          </button>
      </div>
      </motion.div>
    );
  }

  // Add loading state
  if (loading) {
    console.log('Loading state active'); // Debug log
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="page-container flex items-center justify-center"
      >
        <div className="card p-8">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-theme-text-secondary dark:text-gray-300">Loading...</p>
      </div>
      </motion.div>
    );
  }

  // Add a check for required data
  if (!user || !currentClass) {
    console.log('Missing required data:', { user, currentClass }); // Debug log
    
    // Show different messages based on the situation
    let message = "Missing required data. Please try logging in again.";
    let actionText = "Go to Login";
    let action = () => navigate('/login');
    
    if (user && !currentClass) {
      if (user.role === 'student') {
        message = "Your class information is being loaded. Please wait a moment...";
        actionText = "Refresh Page";
        action = () => window.location.reload();
      } else {
        message = "Please select a class to continue.";
        actionText = "Select Class";
        action = () => navigate('/select-class');
      }
    }
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="page-container flex items-center justify-center"
      >
        <div className="card p-8 max-w-md">
          <div className="text-center">
            {user && !currentClass && user.role === 'student' ? (
              <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
            ) : (
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 dark:text-red-400 text-sm font-bold">!</span>
              </div>
            )}
            <p className="text-gray-700 dark:text-gray-300 mb-4">{message}</p>
            <button onClick={action} className="button-primary">
              {actionText}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  console.log('Rendering main content'); // Debug log
  return (
    <div className="min-h-screen bg-white dark:bg-[#181929] flex items-center justify-center py-2 sm:py-6 px-1 sm:px-2 md:py-10 md:px-0 transition-colors duration-300">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-7xl bg-gradient-to-br from-red-700 to-red-900 rounded-[24px] sm:rounded-[40px] md:rounded-[48px] shadow-2xl p-2 sm:p-4 md:p-12 lg:p-16 overflow-hidden">
        {/* 3D Hero Section with Parallax and Light Hover */}
        <div className="w-full mb-4 sm:mb-12 md:mb-16">
          <div
            className="relative z-10 w-full h-full overflow-hidden"
            style={{ height: '180px', minHeight: '160px', maxHeight: '380px', ...(window.innerWidth >= 768 ? { height: '380px' } : {}) }}
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => { setIsHeroHovered(false); setLightPos(null); }}
            onMouseMove={e => {
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              setLightPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
              });
            }}
          >
            {/* Always-visible background image with dark gradient overlay */}
            <div
              className="absolute inset-0 w-full h-full z-0 rounded-[32px] sm:rounded-[40px] overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(90deg, rgba(30,30,30,0.82) 0%, rgba(30,30,30,0.5) 60%, rgba(30,30,30,0.2) 100%), url('${HERO_BG}')`,
                backgroundSize: 'cover',
                backgroundPosition: `center ${parallax}px`,
                transition: 'background-position 0.4s cubic-bezier(.4,0,.2,1)',
              }}
            />
            {/* Localized light effect on hover */}
            {isHeroHovered && lightPos && (
              <div className="absolute inset-0 pointer-events-none z-20" style={{ pointerEvents: 'none' }}>
                {/* Dotted pattern only inside the light area using clipPath */}
                <svg
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                  width="100%"
                  height="100%"
                >
                  <defs>
                    <clipPath id="dotClip">
                      <circle cx={lightPos.x} cy={lightPos.y} r="160" />
                    </clipPath>
                    <pattern id="dotPat" patternUnits="userSpaceOnUse" width="12" height="12">
                      <circle cx="2" cy="2" r="1" fill="rgba(255,255,255,0.18)" />
                    </pattern>
                    <radialGradient id="lightGrad" cx={lightPos.x} cy={lightPos.y} r="320" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="rgba(255,100,100,0.32)" />
                      <stop offset="25%" stopColor="rgba(255,100,100,0.15)" />
                      <stop offset="56%" stopColor="rgba(255,255,255,0.08)" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                  </defs>
                  {/* Dots clipped to the light area */}
                  <rect x="0" y="0" width="100%" height="100%" fill="url(#dotPat)" clipPath="url(#dotClip)" />
                  {/* Reddish radial light */}
                  <rect x="0" y="0" width="100%" height="100%" fill="url(#lightGrad)" style={{mixBlendMode:'lighten'}} />
                </svg>
              </div>
            )}
            {/* Left-aligned content */}
          <motion.div 
              initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="relative z-20 flex flex-col justify-center h-full px-3 sm:px-8 md:px-10 py-4 sm:py-10 md:py-12"
            >
              <h1 className="text-xl xs:text-2xl sm:text-4xl md:text-5xl font-extrabold text-white mb-1 sm:mb-2 drop-shadow-2xl tracking-tight text-left">Welcome to LGS JTi Learning Management System</h1>
              {currentClass && (
                <div className="text-sm sm:text-lg text-white/90 font-semibold mb-1 sm:mb-2 text-left">
                  Grade {currentClass.grade} - {currentClass.section}
                </div>
              )}
              <p className="text-sm xs:text-base sm:text-xl md:text-2xl text-white/90 mb-2 sm:mb-6 md:mb-8 font-medium drop-shadow-lg text-left">Your Learning Dashboard</p>
          </motion.div>
        </div>
        </div>

      {/* Main Content Grid */}
        <div className="px-2 sm:px-6 lg:px-8 mt-4 sm:mt-10">
          {/* Notifications */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div key="error" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-center gap-2 sm:gap-3">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">{error}</span>
                <button onClick={() => setError(null)} className="ml-auto p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50"><X className="w-3 h-3 sm:w-4 sm:h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Latest News Section */}
            <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="relative overflow-visible rounded-2xl sm:rounded-3xl shadow-2xl p-0 border-0">
              <div className="relative bg-white/30 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-0 overflow-hidden shadow-xl border border-white/20 dark:border-gray-800/30">
                <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-8 pt-6 sm:pt-8 pb-2">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-red-500/80 to-red-700/80 shadow-lg">
                    <Newspaper className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
              </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-0.5 sm:mb-1">Latest News</h2>
                    <p className="text-xs sm:text-base text-gray-700 dark:text-gray-300">Stay up to date with the latest updates and events.</p>
            </div>
                </div>
                <div className="relative px-4 sm:px-8 pb-6 sm:pb-8 pt-2">
                  {recentNews.length === 0 ? (
                    <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 py-8 sm:py-12 text-center">No news in the last week.</div>
                  ) : (
                    <div className="space-y-3 sm:space-y-6 max-h-[18vh] min-h-[80px] sm:min-h-[100px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-300 dark:scrollbar-thumb-red-900/60 scrollbar-track-transparent">
                      <AnimatePresence mode="popLayout">
                        {recentNews.map((n: NewsItem, idx: number) => (
                    <motion.div
                          key={n.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                          transition={{ delay: idx * 0.1, duration: 0.3 }}
                          className="group relative bg-white/70 dark:bg-gray-900/70 rounded-xl p-3 sm:p-4 shadow-md border border-white/20 dark:border-gray-800/30 hover:shadow-lg transition-all duration-300"
                          onClick={() => {
                            setSelectedNews(n);
                            setShowNewsDetailsModal(true);
                            setShowNewsModal(false);
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1 sm:mb-2">
                            <span className="font-semibold text-sm sm:text-lg text-gray-900 dark:text-white">{n.title}</span>
                            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 bg-white/40 dark:bg-gray-800/40 px-1.5 sm:px-2 py-0.5 rounded-full">
                              {new Date(n.created_at).toLocaleDateString()}
                            </span>
                        {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
                              <div className="flex items-center gap-1 sm:gap-2">
                          <button
                                  onClick={() => handleMoveToOldNews(n.id)}
                                  disabled={movingNews === n.id}
                                  className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Move to Old News"
                          >
                                  {movingNews === n.id ? (
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                                  )}
                          </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNews(n.id);
                                  }}
                                  disabled={deletingNews === n.id}
                                  className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  {deletingNews === n.id ? (
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-red-600 dark:text-red-400" />
                                  ) : (
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
                                  )}
                                </button>
                      </div>
                            )}
                          </div>
                          <div className="text-sm sm:text-base text-gray-700 dark:text-gray-200">{n.content}</div>
                    </motion.div>
                  ))}
                        </AnimatePresence>
                </div>
                  )}
                  <div className="flex justify-between items-center mt-4 sm:mt-8">
                    <button onClick={() => setShowOldNews(true)} className="text-xs sm:text-sm text-red-700 dark:text-red-300 hover:underline font-semibold">View Old News</button>
                    {(user?.role === 'admin' || user?.role === 'ultra_admin' || user?.role === 'teacher') && (
                      <button onClick={() => setIsCreateNewsModalOpen(true)} className="fixed bottom-6 sm:bottom-8 right-6 sm:right-8 z-50 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-full shadow-lg w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-xl sm:text-2xl hover:scale-105 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-red-400">
                        <span className="sr-only">Create News</span>
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                      </button>
                    )}
              </div>
            </div>
          </div>
        </motion.div>

            {/* Recent Activity Section (now Due Works) */}
            <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="bg-white/90 dark:bg-gray-900/80 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-white/30 dark:border-gray-800/40">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Due Works</h2>
                {(user?.role === 'admin' || user?.role === 'ultra_admin' || user?.role === 'teacher') && (
                  <button
                    onClick={() => {
                      setShowCreateDueWorkModal(true);
                      loadSubjects();
                    }}
                    className="p-1.5 sm:p-2 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
            </div>
              <div className="space-y-3 sm:space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block">
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 animate-spin" />
                    </motion.div>
                  </div>
                ) : dueWorks.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No due works.</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                {dueWorks.map((work) => (
                  <motion.div 
                    key={work.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 cursor-pointer hover:from-gray-100 hover:to-gray-200 dark:hover:from-gray-700/50 dark:hover:to-gray-600/50 transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 hover:border-red-200 dark:hover:border-red-800/50"
                    onClick={() => {
                      setSelectedDueWork(work);
                      setShowDueWorkDetailsModal(true);
                      setShowDueWorkModal(false);
                    }}
                  >
                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg shadow-sm">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{work.title}</p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{work.subject_name}</p>
                      <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">{getTimeLeft(work.due_date)}</p>
                    </div>
                    {(user?.id === work.created_by || user?.role === 'admin' || user?.role === 'ultra_admin' || user?.role === 'teacher') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this due work?')) {
                            handleDeleteDueWork(work.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              )}
            </div>
            </motion.div>

            {/* Quick Actions Section */}
            <motion.div variants={cardVariants} initial="initial" animate="animate" whileHover="whileHover" className="lg:col-span-2 bg-white/90 dark:bg-gray-900/80 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 border border-white/30 dark:border-gray-800/40">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => {
                    setShowTargetsModal(true);
                    loadTargetFiles();
                  }} 
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Attainment Targets</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => {
                    setSelectedDueWork(null);
                    setShowDueWorkModal(true);
                    loadSubjects();
                  }} 
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Due Works</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => {
                    setShowDiscussionsModal(true);
                    loadUsers();
                  }} 
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Discussions</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }} 
                  onClick={() => navigate('/settings')} 
                  className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Settings</span>
                </motion.button>
          </div>
        </motion.div>
      </div>
        </div>
      </motion.div>

      {/* Due Works Modal */}
      {showDueWorkModal && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999]">
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 max-w-4xl w-full relative border border-white/30 dark:border-gray-800/40 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
            <button
                onClick={() => {
                  setShowDueWorkModal(false);
                  setSelectedDueWork(null);
                }} 
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
              
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Due Works</h3>
                {(user?.role === 'admin' || user?.role === 'ultra_admin' || user?.role === 'teacher') && (
            <button
                    onClick={() => {
                      setShowCreateDueWorkModal(true);
                      setShowDueWorkModal(false);
                      loadSubjects();
                    }}
                    className="p-1.5 sm:p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
                )}
          </div>

              <div className="space-y-3 sm:space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-6 sm:py-8">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block">
                      <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400 animate-spin" />
                    </motion.div>
        </div>
                ) : dueWorks.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Clock className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-4" />
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No due works.</p>
            </div>
                ) : (
                  <AnimatePresence mode="wait">
                    {dueWorks.map((work) => (
                    <motion.div 
                        key={work.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        onClick={() => {
                          setSelectedDueWork(work);
                          setShowDueWorkDetailsModal(true);
                          setShowDueWorkModal(false);
                        }}
                      >
                        <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm sm:text-base text-gray-900 dark:text-white font-medium">{work.title}</p>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{work.subject_name}</p>
                          <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">{getTimeLeft(work.due_date)}</p>
                </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Due Work Details Modal */}
      {showDueWorkDetailsModal && selectedDueWork && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999]">
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 max-w-4xl w-full relative border border-white/30 dark:border-gray-800/40 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => {
                  setShowDueWorkDetailsModal(false);
                  setSelectedDueWork(null);
                  setShowDueWorkModal(true);
                }} 
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{selectedDueWork.title}</h3>
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Subject</p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">{selectedDueWork.subject_name}</p>
                    </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white">{new Date(selectedDueWork.due_date).toLocaleString()}</p>
                    </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Description</p>
                    <p className="text-sm sm:text-base text-gray-900 dark:text-white whitespace-pre-wrap">{selectedDueWork.description}</p>
          </div>
        </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create Due Work Modal */}
      {showCreateDueWorkModal && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999]">
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl p-6 sm:p-8 max-w-5xl w-full relative border border-white/30 dark:border-gray-800/40 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                <button
                onClick={() => {
                  setShowCreateDueWorkModal(false);
                  setNewDueWork({
                    title: '',
                    description: '',
                    due_date: '',
                    subject_id: '',
                    class_id: ''
                  });
                  setSelectedClasses([]);
                }} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
                </button>
              
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-center gap-4 mb-6 sm:mb-8">
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-2xl shadow-lg">
                    <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Create Due Work</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Assign work to one or multiple classes</p>
                  </div>
                </div>

                <form onSubmit={handleCreateDueWork} className="space-y-6 sm:space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    {/* Left Column - Basic Info */}
                    <div className="space-y-6 sm:space-y-8">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-4 sm:p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700 dark:text-gray-200">Assignment Title</label>
                        <input
                          type="text"
                          value={newDueWork.title}
                          onChange={e => setNewDueWork(prev => ({ ...prev, title: e.target.value }))} 
                          className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm" 
                          placeholder="Enter assignment title"
                          required 
                        />
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-4 sm:p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700 dark:text-gray-200">Subject</label>
                        <select
                          value={newDueWork.subject_id}
                          onChange={e => setNewDueWork(prev => ({ ...prev, subject_id: e.target.value }))}
                          className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm"
                          required
                        >
                          <option value="">Select a subject</option>
                          {subjects.map(subject => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-4 sm:p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700 dark:text-gray-200">Due Date & Time</label>
                        <input
                          type="datetime-local"
                          value={newDueWork.due_date}
                          onChange={e => setNewDueWork(prev => ({ ...prev, due_date: e.target.value }))} 
                          className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm" 
                          required 
                        />
                      </div>
                    </div>

                    {/* Right Column - Class Selection */}
                    <div className="space-y-6 sm:space-y-8">
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-4 sm:p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                        <label className="block text-sm sm:text-base font-semibold mb-3 text-gray-700 dark:text-gray-200">Select Classes</label>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                          {classes.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No classes available</p>
                          ) : (
                            classes.map((classItem: Class) => (
                              <label key={classItem.id} className="flex items-center space-x-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedClasses.includes(classItem.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedClasses(prev => [...prev, classItem.id]);
                                    } else {
                                      setSelectedClasses(prev => prev.filter(id => id !== classItem.id));
                                    }
                                  }}
                                  className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                />
                                <span className="text-gray-900 dark:text-white font-medium">
                                  Grade {classItem.grade} - {classItem.section}
                                </span>
                              </label>
                            ))
                          )}
                        </div>
                        {classes.length > 0 && selectedClasses.length === 0 && (
                          <p className="text-sm text-red-500 mt-2 font-medium">Please select at least one class</p>
                        )}
                        {selectedClasses.length > 0 && (
                          <p className="text-sm text-green-600 dark:text-green-400 mt-2 font-medium">
                            ✓ {selectedClasses.length} {selectedClasses.length === 1 ? 'class' : 'classes'} selected
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description - Full Width */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 p-4 sm:p-6 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                    <label className="block text-sm sm:text-base font-semibold mb-2 text-gray-700 dark:text-gray-200">Assignment Description</label>
                    <textarea 
                      value={newDueWork.description} 
                      onChange={e => setNewDueWork(prev => ({ ...prev, description: e.target.value }))} 
                      className="w-full px-4 py-3 text-base sm:text-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all shadow-sm" 
                      rows={6} 
                      placeholder="Enter detailed assignment description..."
                      required 
                    />
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {selectedClasses.length > 0 ? (
                        <span className="text-green-600 dark:text-green-400">
                          ✓ {selectedClasses.length} {selectedClasses.length === 1 ? 'class' : 'classes'} selected
                        </span>
                      ) : (
                        'No classes selected'
                      )}
                    </div>
                    <button
                      type="submit" 
                      disabled={creatingDueWork || selectedClasses.length === 0} 
                      className="px-8 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {creatingDueWork ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        'Create Due Work'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Discussions Modal */}
      {showDiscussionsModal && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999]">
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-8 max-w-4xl w-full relative border border-white/30 dark:border-gray-800/40 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
                  <button
                onClick={() => {
                  setShowDiscussionsModal(false);
                  setSelectedDiscussionType(null);
                  setShowPrivateDiscussions(false);
                  setShowOpenDiscussions(false);
                }} 
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

              {!selectedDiscussionType ? (
                <div className="space-y-3 sm:space-y-8">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white text-center">Choose Discussion Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedDiscussionType('private');
                        setShowPrivateDiscussions(true);
                      }}
                      className="group relative p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 dark:from-blue-500/10 dark:to-blue-600/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex flex-col items-center gap-2 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl">
                          <MessageSquare className="w-5 h-5 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />
      </div>
                        <div className="text-center">
                          <h4 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Private Discussions</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Chat privately with teachers or students</p>
    </div>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedDiscussionType('open');
                        setShowOpenDiscussions(true);
                      }}
                      className="group relative p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20 border border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700 transition-all"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 dark:from-green-500/10 dark:to-green-600/10 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex flex-col items-center gap-2 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/30 rounded-lg sm:rounded-xl">
                          <Users className="w-5 h-5 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="text-center">
                          <h4 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Open Discussions</h4>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Join open discussions with everyone</p>
                        </div>
                      </div>
                    </motion.button>
                  </div>
                </div>
              ) : selectedDiscussionType === 'private' ? (
                <div className="space-y-3 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Private Discussions</h3>
                    <button
                      onClick={() => {
                        setSelectedDiscussionType(null);
                        setShowPrivateDiscussions(false);
                      }}
                      className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Back to Discussion Types
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
                    <div className="md:col-span-1 space-y-2 sm:space-y-4">
                      <div className="p-2 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white mb-2 sm:mb-4">Select User</h4>
                        <div className="space-y-1 sm:space-y-2 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
                          {users.map((u) => (
                <button
                              key={u.id}
                              onClick={() => setSelectedUser(u)}
                              className={`w-full p-2 sm:p-3 rounded-lg text-left transition-colors ${
                                selectedUser?.id === u.id
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
                              }`}
                            >
                              <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-xs sm:text-base">
                                  {u.username.charAt(0).toUpperCase()}
              </div>
                <div>
                                  <p className="font-medium text-xs sm:text-base text-gray-900 dark:text-white">{u.username}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.role}</p>
                                </div>
                              </div>
                            </button>
                          ))}
                </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      {selectedUser ? (
                        <div className="h-[40vh] sm:h-[60vh] flex flex-col">
                          <div className="flex-1 p-2 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 overflow-y-auto space-y-2 sm:space-y-4">
                            {privateDiscussions.length > 0 ? (
                              privateDiscussions.map((discussion) => (
                                <div key={discussion.id} className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                                        {discussion.sender_username || 'Unknown User'}
                                      </span>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(discussion.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{discussion.content}</p>
                                  </div>
                                  {(user?.id === discussion.created_by || 
                                    user?.role === 'admin' || 
                                    user?.role === 'ultra_admin' || 
                                    user?.role === 'teacher') && (
                                    <button
                                      onClick={() => handleDeletePrivateMessage(discussion.id)}
                                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))
                            ) : (
                            <div className="text-center text-xs sm:text-base text-gray-500 dark:text-gray-400">
                              No messages yet. Start the conversation!
                            </div>
                            )}
                          </div>
                          <div className="mt-2 sm:mt-4 flex gap-2">
                  <input
                    type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                  <button
                              onClick={() => {
                                console.log('Send button clicked'); // Debug log
                                handleSendPrivateMessage();
                              }}
                              disabled={!newMessage.trim()}
                              className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                              Send
                  </button>
                </div>
                </div>
                      ) : (
                        <div className="h-[40vh] sm:h-[60vh] flex items-center justify-center">
                          <div className="text-center">
                            <MessageSquare className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-4" />
                            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">Select a user to start chatting</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">Open Discussions</h3>
                  <button
                      onClick={() => {
                        setSelectedDiscussionType(null);
                        setShowOpenDiscussions(false);
                      }}
                      className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Back to Discussion Types
                  </button>
      </div>
                  
                  <div className="h-[40vh] sm:h-[60vh] flex flex-col">
                    <div className="flex-1 p-2 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 overflow-y-auto space-y-2 sm:space-y-4">
                      {discussions.length > 0 ? (
                        discussions.map((discussion) => (
                          <div key={discussion.id} className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                  {discussion.profiles?.username || discussion.username || 'Unknown User'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(discussion.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{discussion.content}</p>
                            </div>
                            {(user?.id === discussion.created_by || 
                              user?.role === 'admin' || 
                              user?.role === 'ultra_admin' || 
                              user?.role === 'teacher') && (
                              <button
                                onClick={() => handleDeleteMessage(discussion.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                      <div className="text-center text-xs sm:text-base text-gray-500 dark:text-gray-400">
                          No messages yet. Start a conversation!
    </div>
                      )}
                    </div>
                    <div className="mt-2 sm:mt-4 flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      />
                  <button
                        onClick={() => {
                          console.log('Send button clicked'); // Debug log
                          handleSendMessage();
                        }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:from-red-700 hover:to-red-800 transition-colors"
                      >
                        Send
                      </button>
                      </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Attainment Targets Modal */}
      {showTargetsModal && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999]">
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl sm:rounded-3xl shadow-2xl p-3 sm:p-8 max-w-6xl w-full relative border border-white/30 dark:border-gray-800/40 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => {
                  setShowTargetsModal(false);
                  setSelectedMonth(null);
                }} 
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

              <div className="space-y-3 sm:space-y-8">
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white text-center">Attainment Targets</h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-4">
                  {months.map((month) => (
          <motion.div
                      key={month.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMonth(month.value)}
                      className={`group relative p-2 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer transition-all ${
                        selectedMonth === month.value
                          ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800/50'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700/50 hover:border-red-200 dark:hover:border-red-800/50'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1 sm:gap-2">
                        <div className={`p-1.5 sm:p-2 rounded-lg ${
                          selectedMonth === month.value
                            ? 'bg-red-200 dark:bg-red-800/50'
                            : 'bg-gray-100 dark:bg-gray-700/50 group-hover:bg-red-100 dark:group-hover:bg-red-900/30'
                        }`}>
                          <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" />
                </div>
                        <span className="text-xs sm:text-base font-medium text-gray-900 dark:text-white">{month.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {targetFiles[month.value]?.length || 0} files
                        </span>
                      </div>
            </motion.div>
                  ))}
                </div>

                {selectedMonth && (
                  <div className="space-y-3 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white">
                        {months.find(m => m.value === selectedMonth)?.name} Files
                      </h4>
                      {(user?.role === 'admin' || user?.role === 'ultra_admin' || user?.role === 'teacher') && (
                        <label className="relative">
                          <input
                            type="file"
                            onChange={(e) => handleFileUpload(e, selectedMonth)}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                          />
                          <div className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-base rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-medium cursor-pointer hover:from-red-700 hover:to-red-800 transition-colors">
                            {uploadingFile ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                                <span>Uploading...</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Upload File</span>
                              </div>
                            )}
                          </div>
                        </label>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                      {targetFiles[selectedMonth]?.map((file) => (
            <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="group relative p-2 sm:p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 hover:border-red-200 dark:hover:border-red-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-base font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(file.uploaded_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <a
                                href={file.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                              >
                                <Download className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                              </a>
                              {(user?.role === 'admin' || user?.role === 'ultra_admin' || user?.role === 'teacher') && (
                <button
                                  onClick={() => handleFileDelete(file.id, file.url)}
                                  disabled={deletingFile === file.id}
                                  className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                >
                                  {deletingFile === file.id ? (
                                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-red-600 dark:text-red-400" />
                                  ) : (
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
                                  )}
                                </button>
                              )}
              </div>
                          </div>
    </motion.div>
                      ))}
                    </div>

                    {(!targetFiles[selectedMonth] || targetFiles[selectedMonth].length === 0) && (
                      <div className="text-center py-6 sm:py-12">
                        <FileText className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-4" />
                        <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400">No files uploaded for this month yet.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Create News Modal */}
      {isCreateNewsModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999]">
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 max-w-4xl w-full relative border border-white/30 dark:border-gray-800/40 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsCreateNewsModalOpen(false)} 
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Create News</h3>
              <form onSubmit={handleCreateNews} className="space-y-4">
                <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Title</label>
                  <input
                    type="text"
                      value={newNewsTitle} 
                      onChange={e => setNewNewsTitle(e.target.value)} 
                      className="w-full px-3 py-1.5 sm:py-2 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
                      required 
                  />
                </div>
                <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Content</label>
                  <textarea
                      value={newNewsContent} 
                      onChange={e => setNewNewsContent(e.target.value)} 
                      className="w-full px-3 py-1.5 sm:py-2 text-sm sm:text-base rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" 
                      rows={8} 
                      required 
                  />
                </div>
                  <button
                    type="submit" 
                    disabled={creatingNews} 
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm sm:text-base transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {creatingNews ? 'Creating...' : 'Create News'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Old News Modal */}
      {showOldNews && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999]">
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl p-8 sm:p-10 max-w-7xl w-full relative border border-white/30 dark:border-gray-800/40 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setShowOldNews(false)} 
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Header Section */}
              <div className="flex items-center gap-6 mb-10">
                <div className="p-5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-3xl shadow-xl border border-amber-200/50 dark:border-amber-700/30">
                  <Newspaper className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">News Archive</h3>
                  <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium">Historical news and announcements from the past</p>
                </div>
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full text-base font-bold shadow-xl border-2 border-amber-400/30">
                  {oldNews.length} {oldNews.length === 1 ? 'item' : 'items'}
                </div>
              </div>

              {oldNews.length === 0 ? (
                <div className="text-center py-20">
                  <div className="p-10 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-3xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl">
                    <div className="p-6 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Newspaper className="w-12 h-12 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">No Archived News</h4>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">There are no old news items in the archive yet.</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">News items older than 7 days will appear here automatically.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto pr-2">
                  {oldNews.map((n, idx) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-700/95 rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                    >
                      {/* Number Badge - Moved to top-right */}
                      <div className="absolute top-4 left-4 w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white dark:border-gray-900">
                        {idx + 1}
                      </div>

                      {/* Date Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="text-xs text-gray-600 dark:text-gray-300 bg-white/90 dark:bg-gray-800/90 px-3 py-1.5 rounded-full font-medium shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                          {new Date(n.created_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="mt-8">
                        <h4 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-white mb-3 leading-tight">
                          {n.title}
                        </h4>
                        <p className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-relaxed mb-4 overflow-hidden">
                          {n.content.length > 150 ? `${n.content.substring(0, 150)}...` : n.content}
                        </p>
                      </div>

                      {/* Admin Actions */}
                      {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                          <button
                            onClick={() => handleMoveToRecentNews(n.id)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-md hover:shadow-lg"
                            title="Move to Recent News"
                          >
                            <Clock className="w-4 h-4" />
                            <span>Move to Recent</span>
                          </button>
                          <button
                            onClick={() => handleDeleteNews(n.id)}
                            disabled={deletingNews === n.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                          >
                            {deletingNews === n.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Deleting...</span>
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* News Details Modal */}
      {showNewsDetailsModal && selectedNews && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999]">
          <div className="fixed inset-0 flex items-center justify-center p-2 sm:p-4">
            <div className="bg-white/90 dark:bg-gray-900/90 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 max-w-4xl w-full relative border border-white/30 dark:border-gray-800/40 backdrop-blur-xl max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => {
                  setShowNewsDetailsModal(false);
                  setSelectedNews(null);
                  setShowNewsModal(true);
                }} 
                className="absolute top-2 sm:top-4 right-2 sm:right-4 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{selectedNews.title}</h3>
                </div>
                <div className="text-sm sm:text-base text-gray-700 dark:text-gray-200">{selectedNews.content}</div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Home;