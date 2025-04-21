import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare,
  Send, 
  Trash2, 
  User, 
  Plus,
  Mail,
  Loader2,
  Calendar,
  Bell,
  PlusCircle,
  Clock,
  AlertCircle,
  X,
  Megaphone
} from 'lucide-react';
import { Class } from '../types';
import '../styles/cards.css';

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
  username?: string;
  subjects?: {
    name: string;
  };
  profiles?: {
    username: string;
  };
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

export function Home() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dueWorks, setDueWorks] = useState<DueWork[]>([]);
  const [activeTab, setActiveTab] = useState<'discussions' | 'due'>('discussions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDueWorkModal, setShowDueWorkModal] = useState(false);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [newDueWork, setNewDueWork] = useState({
    title: '',
    description: '',
    due_date: '',
    subject_id: '',
    class_id: ''
  });
  const [subjects, setSubjects] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);
  const { currentClass, classes } = useOutletContext<HomeContextType>();
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [newNews, setNewNews] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (currentClass || user?.role === 'ultra_admin') {
      loadData();
      loadSubjects();
    }
  }, [currentClass, user?.role]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch announcements using the function
        const { data, error: announcementsError } = await supabase
          .rpc('get_announcements_with_profiles')
          .order('created_at', { ascending: false });

        if (announcementsError) throw announcementsError;
        setAnnouncements(data || []);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (error) throw error;
      setSubjects(data || []);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadClassStudents = async () => {
    if (!currentClass?.id) return;
    try {
      const { data, error } = await supabase
        .from('class_assignments')
        .select(`
          profiles (
            id,
            username
          )
        `)
        .eq('class_id', currentClass.id);

      if (error) throw error;
      setClassStudents(data?.map(d => d.profiles) || []);
    } catch (error) {
      console.error('Error loading class students:', error);
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch announcements using the function
      const { data, error: announcementsError } = await supabase
        .rpc('get_announcements_with_profiles')
        .order('created_at', { ascending: false });

      if (announcementsError) throw announcementsError;
      setAnnouncements(data || []);

      // Fetch discussions using the function
      let discussionsQuery = supabase
        .rpc('get_discussions_with_profiles')
        .order('created_at', { ascending: false });

      if (currentClass?.id) {
        discussionsQuery = discussionsQuery.eq('class_id', currentClass.id);
      }

      const { data: discussionsData, error: discussionsError } = await discussionsQuery;
      if (discussionsError) throw discussionsError;
      setDiscussions(discussionsData || []);

      // Fetch due works using the function
      const { data: dueWorksData, error: dueWorksError } = await supabase
        .from('due_works')
        .select(`
          *,
          subjects (name),
          profiles (username)
        `)
        .order('due_date', { ascending: true });

      if (dueWorksError) throw dueWorksError;
      setDueWorks(dueWorksData || []);
    } catch (error: any) {
      console.error('Error loading home data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentClass]);

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

  const handleCreateDueWork = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is logged in
    if (!user) {
      setError('You must be logged in to create due work');
      return;
    }

    // Check if user has permission
    if (user.role !== 'admin' && user.role !== 'ultra_admin') {
      setError('You do not have permission to create due work');
      return;
    }

    // Check if class is selected
    if (!currentClass?.id) {
      setError('Please select a class first');
      return;
    }

    // Validate required fields
    if (!newDueWork.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!newDueWork.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!newDueWork.due_date) {
      setError('Due date is required');
      return;
    }
    if (!newDueWork.subject_id) {
      setError('Subject is required');
      return;
    }

    try {
      setLoading(true);
      // Format the due date to ISO string
      const formattedDueDate = new Date(newDueWork.due_date).toISOString();

      const { data, error } = await supabase
        .from('due_works')
        .insert([{
          title: newDueWork.title.trim(),
          description: newDueWork.description.trim(),
          due_date: formattedDueDate,
          subject_id: newDueWork.subject_id,
          created_by: user.id,
          class_id: currentClass.id
        }])
        .select(`
          *,
          subjects (name),
          profiles (username)
        `)
        .single();

      if (error) throw error;

      if (data) {
        // Add the new due work to the beginning of the list
        setDueWorks(prevWorks => [data, ...prevWorks]);
        
        // Close the modal and reset the form
        setShowDueWorkModal(false);
        setNewDueWork({
          title: '',
          description: '',
          due_date: '',
          subject_id: '',
          class_id: ''
        });
        setError(null);
      }
    } catch (error: any) {
      console.error('Error creating due work:', error);
      setError(error.message || 'Failed to create due work');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('grade')
        .order('section');

      if (error) throw error;
      if (data) {
        // Update the classes state through the context
        const context = useOutletContext<HomeContextType>();
        context.classes = data;
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      setError('Failed to load classes. Please try again.');
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles!announcements_created_by_fkey (
            username,
            photo_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      if (data) {
        setAnnouncements(prevAnnouncements => prevAnnouncements.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create news');
      return;
    }

    if (user.role !== 'admin' && user.role !== 'ultra_admin') {
      setError('You do not have permission to create news');
      return;
    }

    if (!newNews.title.trim() || !newNews.content.trim()) {
      setError('Title and content are required');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title: newNews.title.trim(),
          content: newNews.content.trim(),
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAnnouncements(prev => [data, ...prev]);
        setIsNewsModalOpen(false);
        setNewNews({ title: '', content: '' });
        setError(null);
      }
    } catch (error: any) {
      console.error('Error creating news:', error);
      setError(error.message || 'Failed to create news');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (error) {
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="content-container"
    >
      {/* Hero Banner */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-8 py-16 sm:px-12">
          <motion.h1 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-6"
          >
            Welcome to LGS JTi Learning Management System
          </motion.h1>
          <motion.p 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-red-100 mb-8"
          >
            Your Learning Dashboard
          </motion.p>
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap gap-4"
          >
            <button 
              onClick={() => setActiveTab('discussions')}
              className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-2xl font-medium hover:bg-red-50 transform transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Discussions
            </button>
            <button 
              onClick={() => setActiveTab('due')}
              className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-2xl font-medium hover:bg-red-50 transform transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Due Works
            </button>
            {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
              <button 
                onClick={() => setShowDueWorkModal(true)}
                className="inline-flex items-center px-6 py-3 bg-white text-red-600 rounded-2xl font-medium hover:bg-red-50 transform transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Assign Work
              </button>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        {/* Latest News */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/20">
                    <Megaphone className="h-5 w-5 text-red-500" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Latest News</h2>
                </div>
                {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
                  <button
                    onClick={() => setIsNewsModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      <span>Post News</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
            <div className="divide-y divide-theme-border-primary dark:divide-gray-700">
              <div className="space-y-4">
                <div className="grid gap-4">
                  {announcements.map((announcement) => (
                    <motion.div
                      key={announcement.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/20">
                            <Megaphone className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {announcement.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                              {announcement.content}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <User className="h-4 w-4" />
                              <span>{announcement.username}</span>
                              <span>•</span>
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        {(user?.role === 'admin' || user?.role === 'ultra_admin') && (
                          <button
                            onClick={() => handleDeleteAnnouncement(announcement.id)}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Trash2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Due Works */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Calendar className="h-5 w-5 mr-2 text-red-600" />
                Upcoming Due Works
              </h2>
            </div>
            <div className="divide-y divide-theme-border-primary dark:divide-gray-700">
              <AnimatePresence>
                {dueWorks.map((work) => (
                  <motion.div 
                    key={work.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 hover:bg-theme-tertiary dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="card-title">{work.title}</h3>
                        <p className="card-content">{work.subjects?.name}</p>
                        <p className="text-sm text-theme-text-secondary dark:text-gray-400 mt-1">
                          {work.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`px-2 py-1 text-xs rounded-full mb-2 ${
                        new Date(work.due_date) < new Date()
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {new Date(work.due_date).toLocaleDateString()}
                      </span>
                        {new Date(work.due_date) < new Date() ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {dueWorks.length === 0 && (
                <div className="p-6 text-center text-theme-text-tertiary dark:text-gray-400">
                  No due works assigned.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Discussion Section */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="card mt-8"
      >
        <div className="card-header">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('discussions')}
              className={`px-4 py-2 rounded-2xl transition-colors ${
                activeTab === 'discussions'
                  ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200'
                  : 'text-theme-text-secondary dark:text-gray-400 hover:bg-theme-tertiary dark:hover:bg-gray-700'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <button
              onClick={() => setActiveTab('due')}
              className={`px-4 py-2 rounded-2xl transition-colors ${
                activeTab === 'due'
                  ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200'
                  : 'text-theme-text-secondary dark:text-gray-400 hover:bg-theme-tertiary dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {activeTab === 'discussions' && (
            <>
              <div className="mb-6">
                <textarea
                  value={newDiscussion}
                  onChange={(e) => setNewDiscussion(e.target.value)}
                  placeholder="Start a discussion..."
                  className="input-primary resize-none"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handlePostDiscussion}
                    disabled={!newDiscussion.trim()}
                    className="button-primary disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Post
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                <AnimatePresence>
                  {discussions.map((discussion) => (
                    <motion.div 
                      key={discussion.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="card"
                    >
                      <div className="card-content">{discussion.content}</div>
                      <div className="card-meta">
                        <span className="card-author">Posted by {discussion.profiles?.username}</span>
                        <span className="card-date">
                          {' '}
                          • {new Date(discussion.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}

          {activeTab === 'due' && (
            <div className="space-y-4">
              <AnimatePresence>
                {dueWorks.map((work) => (
                  <motion.div 
                    key={work.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="card"
                  >
                    <div className="card-header">
                      <h3 className="card-title">{work.title}</h3>
                    </div>
                    <div className="card-content">{work.description}</div>
                    <div className="card-meta">
                      <span className="card-author">Posted by {work.profiles?.username}</span>
                      <span className="card-date">
                        {' '}
                        • Due {new Date(work.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>

      {/* Due Work Modal */}
      <AnimatePresence>
        {showDueWorkModal && (
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
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assign New Work</h2>
                <button
                  onClick={() => setShowDueWorkModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newDueWork.title}
                    onChange={(e) => setNewDueWork({ ...newDueWork, title: e.target.value })}
                    className="input-primary w-full"
                    placeholder="Enter work title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newDueWork.description}
                    onChange={(e) => setNewDueWork({ ...newDueWork, description: e.target.value })}
                    className="input-primary w-full resize-none"
                    rows={3}
                    placeholder="Enter work description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newDueWork.due_date}
                    onChange={(e) => setNewDueWork({ ...newDueWork, due_date: e.target.value })}
                    className="input-primary w-full"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={newDueWork.subject_id}
                    onChange={(e) => setNewDueWork({ ...newDueWork, subject_id: e.target.value })}
                    className="input-primary w-full"
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Class
                  </label>
                  <select
                    value={newDueWork.class_id}
                    onChange={(e) => setNewDueWork({ ...newDueWork, class_id: e.target.value })}
                    className="w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">All Classes</option>
                    {classes.map((class_) => (
                      <option key={class_.id} value={class_.id}>
                        Grade {class_.grade} - Section {class_.section}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDueWorkModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDueWork}
                    className="button-primary"
                    disabled={!newDueWork.title.trim() || !newDueWork.description.trim() || !newDueWork.due_date || !newDueWork.subject_id || !newDueWork.class_id}
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}