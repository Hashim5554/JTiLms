import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { LibraryResource } from '../types';
import { useAuthStore } from '../store/auth';
import { PlusCircle, Trash2, Book, Image, Users } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const TABS = [
  { key: 'resource', label: 'Resources', icon: <Book className="h-5 w-5 mr-2 text-red-600" /> },
  { key: 'gallery', label: 'Gallery', icon: <Image className="h-5 w-5 mr-2 text-blue-600" /> },
  { key: 'counselling', label: 'Counselling', icon: <Users className="h-5 w-5 mr-2 text-green-600" /> },
];

export function Library() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [activeTab, setActiveTab] = useState<'resource' | 'gallery' | 'counselling'>('resource');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('library_resources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setResources(data);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !user?.id) return;
    try {
      const { data, error } = await supabase
        .from('library_resources')
        .insert([{
          title: newTitle,
          content: newContent,
          type: activeTab,
          created_by: user.id
        }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setResources([data, ...resources]);
        setNewTitle('');
        setNewContent('');
        setMessage({ type: 'success', text: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} added successfully!` });
      }
    } catch (error: any) {
      console.error('Error creating resource:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('library_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setResources(resources.filter(r => r.id !== id));
      setMessage({ type: 'success', text: 'Deleted successfully!' });
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  // Animation variants
  const tabVariants = {
    active: { scale: 1.08, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' },
    inactive: { scale: 1, backgroundColor: 'rgba(0,0,0,0)', color: '#374151' },
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
    hover: { scale: 1.03, boxShadow: '0 8px 32px rgba(239,68,68,0.08)' },
  };
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } },
  };

  const filtered = resources.filter(r => r.type === activeTab);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-6 px-2 xs:px-3 sm:px-6 lg:px-8"
    >
      <div className="max-w-5xl mx-auto w-full">
        <motion.div
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">Library</h1>
          <motion.div className="flex flex-wrap gap-2 sm:gap-4" layout>
            {TABS.map(tab => (
              <motion.button
                key={tab.key}
                className={`flex items-center px-3 py-2 sm:px-4 rounded-full font-semibold text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 ${activeTab === tab.key ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                variants={tabVariants}
                animate={activeTab === tab.key ? 'active' : 'inactive'}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                {tab.icon}
                {tab.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {message && (
          <motion.div
            className={`mb-4 rounded-lg px-3 py-2 sm:px-4 sm:py-3 font-medium shadow-md ${
              message.type === 'error' ? 'bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-200' : 'bg-green-50 dark:bg-green-900/50 text-green-600 dark:text-green-200'
            }`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {message.text}
          </motion.div>
        )}

        {isAdmin && (
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 xs:p-4 sm:p-6 mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-lg xs:text-xl font-semibold mb-3 sm:mb-4 text-gray-900 dark:text-white">Add {TABS.find(t => t.key === activeTab)?.label}</h2>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={`Title for ${TABS.find(t => t.key === activeTab)?.label}`}
                  className="w-full px-3 py-2 sm:px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={`Content for ${TABS.find(t => t.key === activeTab)?.label}`}
                  rows={4}
                  className="w-full px-3 py-2 sm:px-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none text-sm sm:text-base"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="inline-flex items-center px-4 py-2 sm:px-5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg hover:from-red-700 hover:to-red-800 transition-colors text-sm sm:text-base"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Add {TABS.find(t => t.key === activeTab)?.label}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <LayoutGroup>
          <motion.div
            className="grid grid-cols-1 gap-4 xs:gap-5 sm:gap-6 md:grid-cols-2"
            layout
          >
            <AnimatePresence>
              {filtered.length > 0 ? filtered.map((resource, idx) => (
                <motion.div
                  key={resource.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 xs:p-4 sm:p-6 flex flex-col justify-between group cursor-pointer hover:shadow-2xl transition-shadow"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  whileHover="hover"
                  layout
                >
                  <div>
                    <h3 className="text-base xs:text-lg font-bold text-gray-900 dark:text-white mb-1 xs:mb-2 group-hover:text-red-600 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 xs:mb-4 whitespace-pre-wrap text-sm xs:text-base">
                      {resource.content}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between mt-2 gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      resource.type === 'resource' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      resource.type === 'gallery' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {TABS.find(t => t.key === resource.type)?.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-0 xs:ml-2">
                      {new Date(resource.created_at).toLocaleString()}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(resource.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors ml-2"
                        aria-label="Delete resource"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )) : (
                <motion.div
                  className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8 xs:py-10 sm:py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  No {TABS.find(t => t.key === activeTab)?.label} found.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>
    </motion.div>
  );
}