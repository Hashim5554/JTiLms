import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { Discussion, Announcement, DueWork, ContextType } from '../types';
import { 
  MessageSquare,
  Calendar,
  Target,
  FileText,
  Bell,
  PlusCircle,
  BookOpen,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import '../styles/cards.css';

export function Home() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dueWorks, setDueWorks] = useState<DueWork[]>([]);
  const [activeTab, setActiveTab] = useState<'discussions' | 'attainment' | 'due' | 'answers'>('discussions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDueWorkModal, setShowDueWorkModal] = useState(false);
  const [newDueWork, setNewDueWork] = useState({
    title: '',
    description: '',
    due_date: '',
    subject_id: '',
    class_id: ''
  });
  const [subjects, setSubjects] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);
  const { currentClass, classes } = useOutletContext<ContextType>();

  useEffect(() => {
    if (currentClass || user?.role === 'ultra_admin') {
      loadData();
      loadSubjects();
    }
  }, [currentClass, user?.role]);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let announcementsQuery = supabase
        .from('announcements')
        .select(`
          *,
          creator:profiles!announcements_created_by_fkey (username)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      let discussionsQuery = supabase
        .from('discussions')
        .select(`
          *,
          profiles!discussions_created_by_fkey (
            username
          )
        `)
        .order('created_at', { ascending: false });

      let dueWorksQuery = supabase
        .from('due_works')
        .select(`
          *,
          subjects (name),
          profiles!due_works_created_by_fkey (username)
        `)
        .order('due_date', { ascending: true });

      if (currentClass?.id) {
        announcementsQuery = announcementsQuery.or(`class_id.eq.${currentClass.id},class_id.is.null`);
        discussionsQuery = discussionsQuery.eq('class_id', currentClass.id);
        dueWorksQuery = dueWorksQuery.eq('class_id', currentClass.id);
      } else {
        announcementsQuery = announcementsQuery.is('class_id', null);
        discussionsQuery = discussionsQuery.is('class_id', null);
        dueWorksQuery = dueWorksQuery.is('class_id', null);
      }

      const [announcementsData, dueWorksData, discussionsData] = await Promise.all([
        announcementsQuery,
        dueWorksQuery,
        discussionsQuery
      ]);

      if (announcementsData.error) throw announcementsData.error;
      if (dueWorksData.error) throw dueWorksData.error;
      if (discussionsData.error) throw discussionsData.error;

      setAnnouncements(announcementsData.data || []);
      setDueWorks(dueWorksData.data || []);
      setDiscussions(discussionsData.data || []);
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

  const handleCreateDueWork = async () => {
    if (!user?.id || !currentClass?.id) return;

    try {
      const { data, error } = await supabase
        .from('due_works')
        .insert([{
          ...newDueWork,
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
        setDueWorks([...dueWorks, data]);
        setShowDueWorkModal(false);
        setNewDueWork({
          title: '',
          description: '',
          due_date: '',
          subject_id: '',
          class_id: ''
        });
      }
    } catch (error) {
      console.error('Error creating due work:', error);
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
            {(user?.role === 'teacher' || user?.role === 'ultra_admin') && (
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
              <h2 className="card-title">
                <Bell className="h-5 w-5 mr-2 text-red-600" />
                Latest News
              </h2>
            </div>
            <div className="divide-y divide-theme-border-primary dark:divide-gray-700">
              <AnimatePresence>
                {announcements.map((announcement) => (
                  <motion.div 
                    key={announcement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-6 hover:bg-theme-tertiary dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <h3 className="card-title">{announcement.title}</h3>
                    <p className="card-content">{announcement.content}</p>
                    <div className="card-meta">
                      <span className="card-author">Posted by {announcement.profiles?.username || 'Unknown'}</span>
                      <span className="card-date">
                        {' '}
                        • {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {announcements.length === 0 && (
                <div className="p-6 text-center text-theme-text-tertiary dark:text-gray-400">
                  No announcements yet.
                </div>
              )}
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
          </div>
        </div>
        <div className="p-6">
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
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDueWorkModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateDueWork}
                    disabled={!newDueWork.title || !newDueWork.due_date || !newDueWork.subject_id}
                    className="button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Assign Work
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