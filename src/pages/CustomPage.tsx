import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import type { Class } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, Loader2, FileText, AlertCircle, Check } from 'lucide-react';

interface CustomPageData {
  id: string;
  title: string;
  content: string;
  class_id: string;
}

interface ContextType {
  currentClass: Class | null;
  customPages: Array<{ id: string; title: string; path: string }>;
}

export function CustomPage() {
  const { path } = useParams();
  const { currentClass } = useOutletContext<ContextType>();
  const [page, setPage] = useState<CustomPageData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadPage();
  }, [path, currentClass]);

  const loadPage = async () => {
    if (!path) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_pages')
        .select('*')
        .eq('path', path)
        .single();
      
      if (error) throw error;
      if (data) {
        setPage(data);
        setEditContent(data.content || '');
      }
    } catch (error: any) {
      console.error('Error loading page:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!page) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('custom_pages')
        .update({ content: editContent })
        .eq('id', page.id);

      if (error) throw error;
      setPage({ ...page, content: editContent });
      setIsEditing(false);
      setSuccess('Changes saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving page:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg"
        >
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading page...</p>
        </motion.div>
      </motion.div>
    );
  }

  if (!page) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center"
      >
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300">The requested page could not be found.</p>
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
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/20">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {page.title}
                </h1>
              </div>
              {(user?.role === 'ultra_admin' || user?.role === 'admin') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(!isEditing)}
                  className={`btn gap-2 rounded-xl ${
                    isEditing 
                      ? 'btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                      : 'btn-primary'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <X className="w-5 h-5" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Edit
                    </>
                  )}
                </motion.button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="alert alert-error rounded-xl mb-6"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="alert alert-success rounded-xl mb-6"
                >
                  <Check className="w-5 h-5" />
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {isEditing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-[500px] p-4 border rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter page content..."
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="btn btn-primary gap-2 rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prose prose-lg max-w-none dark:prose-invert"
              >
                {page.content ? (
                  <div dangerouslySetInnerHTML={{ __html: page.content }} />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">No content yet.</p>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}