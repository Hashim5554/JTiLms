import React from 'react';
import { Trash2, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import '../styles/animations.css';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  created_by: string;
  class_id: string | null;
  profiles: {
    username: string;
  };
  classes: {
    name: string;
  } | null;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete?: () => void;
}

export function AnnouncementCard({ announcement, onDelete }: AnnouncementCardProps) {
  const user = useAuthStore((state) => state.user);
  const canDelete = user?.role === 'admin' || user?.role === 'ultra_admin';

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (error) throw error;
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  return (
    <div className="card bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 fade-in">
      <div className="card-body p-4 sm:p-6">
        <div className="flex justify-between items-start gap-2">
          <h3 className="card-title text-base sm:text-lg font-semibold text-gray-900 dark:text-white break-words">
            {announcement.title}
          </h3>
          {canDelete && (
            <button
              onClick={handleDelete}
              className="btn btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 sm:p-2"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mt-2 break-words">
          {announcement.content}
        </p>
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span>By {announcement.profiles.username}</span>
          <span>
            {new Date(announcement.created_at).toLocaleDateString()}
          </span>
        </div>
        {announcement.classes?.name && (
          <div className="mt-2">
            <span className="badge badge-primary text-xs sm:text-sm">
              {announcement.classes.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 