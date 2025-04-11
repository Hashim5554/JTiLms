import React, { useState, useEffect } from 'react';
import { Search, Plus, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { AnnouncementCard } from '../components/AnnouncementCard';
import '../styles/animations.css';

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
          profiles (username),
          classes (name)
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
      const { error } = await supabase.from('announcements').insert([
        {
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          class_id: newAnnouncement.class_id || null,
          user_id: user?.id,
        },
      ]);

      if (error) throw error;

      setNewAnnouncement({ title: '', content: '', class_id: '' });
      setMessage({ type: 'success', text: 'Announcement created successfully' });
      loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      setMessage({ type: 'error', text: 'Failed to create announcement' });
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) =>
    announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    announcement.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Announcements</h1>
        {isAdmin && (
          <button
            onClick={() => {
              const modal = document.getElementById('create-announcement-modal') as HTMLDialogElement;
              modal?.showModal();
            }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Announcement
          </button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
      </div>

      {message && (
        <div className={`alert alert-${message.type} mb-6 fade-in`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="text-center py-12 fade-in">
          <Bell className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No announcements found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAnnouncements.map((announcement) => (
            <div key={announcement.id} className="fade-in">
              <AnnouncementCard announcement={announcement} onDelete={loadAnnouncements} />
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <dialog id="create-announcement-modal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Announcement</h3>
            <form onSubmit={handleCreateAnnouncement}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Title</span>
                </label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="input input-bordered"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Content</span>
                </label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="textarea textarea-bordered h-32"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Class (Optional)</span>
                </label>
                <select
                  value={newAnnouncement.class_id}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, class_id: e.target.value })}
                  className="select select-bordered"
                >
                  <option value="">All Classes</option>
                  {classes.map((class_) => (
                    <option key={class_.id} value={class_.id}>
                      {class_.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modal-action">
                <button type="button" className="btn" onClick={() => {
                  const modal = document.getElementById('create-announcement-modal') as HTMLDialogElement;
                  modal?.close();
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}