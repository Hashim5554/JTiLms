import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import type { Discussion, Class, Announcement, DueWork } from '../types';
import { 
  MessageSquare,
  Calendar,
  Target,
  FileText,
  Bell,
  PlusCircle
} from 'lucide-react';
import '../styles/cards.css';

interface ContextType {
  currentClass: Class | null;
}

export function Home() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dueWorks, setDueWorks] = useState<DueWork[]>([]);
  const [activeTab, setActiveTab] = useState<'discussions' | 'attainment' | 'due' | 'answers'>('discussions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);
  const { currentClass } = useOutletContext<ContextType>();

  useEffect(() => {
    if (currentClass || user?.role === 'ultra_admin') {
      loadData();
    }
  }, [currentClass, user?.role]);

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
          creator:profiles!discussions_created_by_fkey (username)
        `)
        .order('created_at', { ascending: false });

      // If currentClass exists, filter by class_id or null (global announcements)
      if (currentClass?.id) {
        announcementsQuery = announcementsQuery.or(`class_id.eq.${currentClass.id},class_id.is.null`);
        discussionsQuery = discussionsQuery.eq('class_id', currentClass.id);
      } else {
        // If no class selected, only show global announcements
        announcementsQuery = announcementsQuery.is('class_id', null);
      }

      let dueWorksQuery = supabase
        .from('due_works')
        .select(`
          *,
          subjects (name),
          profiles!due_works_created_by_fkey (username)
        `)
        .order('due_date', { ascending: true });

      // If currentClass exists, filter by class_id
      if (currentClass?.id) {
        dueWorksQuery = dueWorksQuery.eq('class_id', currentClass.id);
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
          creator:profiles!discussions_created_by_fkey (username)
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

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-theme-text-secondary dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="card p-8 max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={loadData} className="button-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="content-container animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-500 hover:scale-[1.02]">
        <div className="px-8 py-16 sm:px-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6 animate-fade-in">
            Welcome to LGS JTi Learning Management System
          </h1>
          <p className="text-xl text-red-100 mb-8 animate-fade-in delay-100">
            Your Learning Dashboard
          </p>
          <div className="flex flex-wrap gap-4">
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
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Latest News */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Bell className="h-5 w-5 mr-2 text-red-600" />
                Latest News
              </h2>
            </div>
            <div className="divide-y divide-theme-border-primary dark:divide-gray-700">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div 
                    key={announcement.id} 
                    className="p-6 hover:bg-theme-tertiary dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <h3 className="card-title">{announcement.title}</h3>
                    <p className="card-content">{announcement.content}</p>
                    <div className="card-meta">
                      <span className="card-author">Posted by {announcement.creator?.username}</span>
                      <span className="card-date">
                        {' '}
                        • {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-theme-text-tertiary dark:text-gray-400">
                  No announcements yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Due Works */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <Calendar className="h-5 w-5 mr-2 text-red-600" />
                Upcoming Due Works
              </h2>
            </div>
            <div className="divide-y divide-theme-border-primary dark:divide-gray-700">
              {dueWorks.length > 0 ? (
                dueWorks.map((work) => (
                  <div 
                    key={work.id} 
                    className="p-4 hover:bg-theme-tertiary dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="card-title">{work.title}</h3>
                        <p className="card-content">{work.subjects?.name}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        new Date(work.due_date) < new Date()
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {new Date(work.due_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-theme-text-tertiary dark:text-gray-400">
                  No due works assigned.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discussion Section */}
      <div className="card">
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
            {discussions.map((discussion) => (
              <div key={discussion.id} className="card">
                <div className="card-content">{discussion.content}</div>
                <div className="card-meta">
                  <span className="card-author">Posted by {discussion.creator?.username}</span>
                  <span className="card-date">
                    {' '}
                    • {new Date(discussion.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}