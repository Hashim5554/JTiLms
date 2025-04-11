import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Loader2, X } from 'lucide-react';

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface CustomPage {
  id: string;
  title: string;
  path: string;
  class_id: string | null;
  created_at: string;
}

export function Customize() {
  const { user } = useAuthStore();
  const [customPages, setCustomPages] = useState<CustomPage[]>([]);
  const [newPage, setNewPage] = useState({ title: '', path: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadCustomPages();
  }, []);

  const loadCustomPages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('custom_pages')
        .select('*')
        .order('title');

      if (error) throw error;
      setCustomPages(data || []);
    } catch (error) {
      console.error('Error loading custom pages:', error);
      setMessage({ type: 'error', text: 'Failed to load custom pages' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPage.title || !newPage.path) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_pages')
        .insert([{
          title: newPage.title,
          path: newPage.path.toLowerCase().replace(/\s+/g, '-'),
        }])
        .select()
        .single();

      if (error) throw error;

      setCustomPages([...customPages, data]);
      setNewPage({ title: '', path: '' });
      setIsCreateModalOpen(false);
      setMessage({ type: 'success', text: 'Page created successfully!' });
    } catch (error) {
      console.error('Error creating page:', error);
      setMessage({ type: 'error', text: 'Failed to create page' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomPages(customPages.filter(page => page.id !== id));
      setMessage({ type: 'success', text: 'Page deleted successfully!' });
    } catch (error) {
      console.error('Error deleting page:', error);
      setMessage({ type: 'error', text: 'Failed to delete page' });
    }
  };

  if (user?.role !== 'ultra_admin') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900"
      >
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Only ultra admins can customize the system.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Custom Pages
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Page
          </motion.button>
        </div>

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
        ) : customPages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              No custom pages found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Create your first custom page to get started
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid gap-6">
              {customPages.map((page) => (
                <motion.div
                  key={page.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {page.title}
                        </h3>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">
                          Path: /custom/{page.path}
                        </p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Created on {new Date(page.created_at).toLocaleString()}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeletePage(page.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Create New Page
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newPage.title}
                    onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Path
                  </label>
                  <input
                    type="text"
                    value={newPage.path}
                    onChange={(e) => setNewPage({ ...newPage, path: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </div>
                    ) : (
                      'Create'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}