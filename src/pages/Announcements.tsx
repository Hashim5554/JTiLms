import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import type { Announcement, Class } from '../types';
import { PlusCircle, Trash2, Bell, Calendar } from 'lucide-react';
import { createNotification } from '../lib/notifications';
import '../styles/cards.css';

interface ContextType {
  currentClass: Class | null;
}

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const user = useAuthStore((state) => state.user);
  const { currentClass } = useOutletContext<ContextType>();
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';

  useEffect(() => {
    loadAnnouncements();
  }, [currentClass]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('announcements')
        .select(`
          *,
          profiles!announcements_created_by_fkey (username)
        `)
        .order('created_at', { ascending: false });

      if (currentClass?.id) {
        query = query.or(`class_id.eq.${currentClass.id},class_id.is.null`);
      } else {
        query = query.is('class_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) setAnnouncements(data);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title: newTitle,
          content: newContent,
          created_by: user.id,
          class_id: currentClass?.id || null
        }])
        .select(`
          *,
          profiles!announcements_created_by_fkey (username)
        `)
        .single();

      if (error) throw error;
      
      if (data) {
        setAnnouncements([data, ...announcements]);
        setNewTitle('');
        setNewContent('');
        setMessage({ type: 'success', text: 'Announcement posted successfully!' });
      }
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAnnouncements(announcements.filter(a => a.id !== id));
      setMessage({ type: 'success', text: 'Announcement deleted successfully!' });
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      setMessage({ type: 'error', text: error.message });
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

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-theme-text-primary dark:text-white">Announcements</h1>
        {currentClass && (
          <div className="text-theme-text-secondary dark:text-gray-300">
            Class {currentClass.grade}-{currentClass.section}
          </div>
        )}
      </div>

      {message && (
        <div className={`card mb-4 ${
          message.type === 'error' ? 'bg-red-50 dark:bg-red-900/50' : 'bg-green-50 dark:bg-green-900/50'
        }`}>
          <p className={`${
            message.type === 'error' ? 'text-red-600 dark:text-red-200' : 'text-green-600 dark:text-green-200'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {isAdmin && (
        <div className="card mb-8">
          <h2 className="card-title">Create Announcement</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Announcement Title"
                className="input-primary w-full"
              />
            </div>
            <div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Announcement Content"
                rows={4}
                className="input-primary w-full resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newTitle.trim() || !newContent.trim()}
                className="button-primary"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Post Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title flex items-center">
            <Bell className="h-5 w-5 mr-2 text-red-600" />
            All Announcements
          </h2>
        </div>
        <div className="divide-y divide-theme-border-primary dark:divide-gray-700">
          {announcements.map((announcement) => (
            <div 
              key={announcement.id} 
              className="p-6 hover:bg-theme-tertiary dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <h3 className="card-title">{announcement.title}</h3>
                  <p className="card-content">{announcement.content}</p>
                  <div className="card-meta">
                    <span className="card-author">Posted by {announcement.profiles?.username}</span>
                    <span className="card-date">
                      {' '}
                      • {new Date(announcement.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                    aria-label="Delete announcement"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-theme-text-secondary dark:text-gray-400">No announcements yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}