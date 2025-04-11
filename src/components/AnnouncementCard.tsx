import React from 'react';
import { Trash2, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

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

interface AnnouncementCardProps {
  announcement: Announcement;
  onDelete?: () => void;
}

export function AnnouncementCard({ announcement, onDelete }: AnnouncementCardProps) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';

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
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {announcement.title}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {announcement.content}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>Posted by {announcement.profiles?.username}</span>
              <span>•</span>
              <span>{new Date(announcement.created_at).toLocaleString()}</span>
              {announcement.classes?.name && (
                <>
                  <span>•</span>
                  <span>Class {announcement.classes.name}</span>
                </>
              )}
            </div>
          </div>
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleDelete}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
              aria-label="Delete announcement"
            >
              <Trash2 className="h-5 w-5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
} 