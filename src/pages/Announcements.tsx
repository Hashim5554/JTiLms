import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { AnnouncementCard } from '../components/AnnouncementCard';

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
  };
  classes: {
    name: string;
  };
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<Message | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    class_id: '',
  });
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';

  useEffect(() => {
    loadAnnouncements();
    loadClasses();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          profiles:created_by(username),
          classes:class_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      setMessage({ type: 'error', text: 'Failed to load announcements' });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.from('announcements').insert({
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        class_id: newAnnouncement.class_id || null,
        created_by: user?.id,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Announcement created successfully' });
      setNewAnnouncement({ title: '', content: '', class_id: '' });
      loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      setMessage({ type: 'error', text: 'Failed to create announcement' });
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Announcements
          </h1>
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => {
                const modal = document.getElementById('create-announcement-modal');
                if (modal) (modal as HTMLDialogElement).showModal();
              }}
            >
              <Plus className="h-5 w-5" />
              New Announcement
            </motion.button>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </motion.div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No announcements found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Check back later for updates'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid gap-6">
              {filteredAnnouncements.map((announcement) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnnouncementCard
                    announcement={announcement}
                    onDelete={loadAnnouncements}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>

      {isAdmin && (
        <dialog id="create-announcement-modal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      title: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      content: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Class (Optional)
                </label>
                <select
                  value={newAnnouncement.class_id}
                  onChange={(e) =>
                    setNewAnnouncement({
                      ...newAnnouncement,
                      class_id: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Classes</option>
                  {classes.map((class_) => (
                    <option key={class_.id} value={class_.id}>
                      {class_.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={() => {
                    const modal = document.getElementById(
                      'create-announcement-modal'
                    );
                    if (modal) (modal as HTMLDialogElement).close();
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}