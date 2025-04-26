import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Trash2, 
  X, 
  Loader2, 
  Settings, 
  FileText, 
  Link2, 
  AlertCircle, 
  CheckCircle,
  Shield
} from 'lucide-react';

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
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error creating page:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to create page' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
    const { error } = await supabase
      .from('custom_pages')
      .delete()
      .eq('id', id);

      if (error) throw error;

      setCustomPages(customPages.filter(page => page.id !== id));
      setMessage({ type: 'success', text: 'Page deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('Error deleting page:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete page' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'ultra_admin' && user?.role !== 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
      >
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Only administrators can customize the system.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Custom Pages
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">
                    Manage and customize your pages
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreateModalOpen(true)}
                className="btn btn-primary gap-2 rounded-xl"
              >
                <Plus className="w-5 h-5" />
                New Page
              </motion.button>
            </div>

            <AnimatePresence mode="wait">
      {message && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`alert ${
                    message.type === 'success' ? 'alert-success' : 'alert-error'
                  } rounded-xl mb-6`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                  <span>{message.text}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {loading && customPages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center items-center py-12"
              >
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </motion.div>
            ) : customPages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No custom pages found
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Create your first custom page to get started
                </p>
              </motion.div>
            ) : (
              <motion.div layout className="grid gap-4">
                {customPages.map((page, index) => (
                  <motion.div
                    key={page.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                            <FileText className="w-4 h-4 text-primary" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {page.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Link2 className="w-4 h-4" />
                          <span className="truncate">/custom/{page.path}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Created on {new Date(page.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeletePage(page.id)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
        </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Create New Page
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
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
                    className="input input-bordered w-full bg-gray-50 dark:bg-gray-700 rounded-xl"
                    placeholder="Enter page title"
                    required
            />
          </div>
          <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Path
            </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 dark:text-gray-400">/custom/</span>
                    </div>
            <input
              type="text"
              value={newPage.path}
              onChange={(e) => setNewPage({ ...newPage, path: e.target.value })}
                      className="input input-bordered w-full pl-16 bg-gray-50 dark:bg-gray-700 rounded-xl"
                      placeholder="page-url"
                      required
            />
          </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn btn-ghost rounded-xl"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
              type="submit"
                    className="btn btn-primary rounded-xl"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Create Page'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}