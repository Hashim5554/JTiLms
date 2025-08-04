import React, { useState, useEffect, useRef } from 'react';
import { supabase, validateSession } from '../lib/supabase';
import type { LibraryResource } from '../types';
import { useSession } from '../contexts/SessionContext';
import { Plus, Trash2, Book, Image, Users, X } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';

const TABS = [
  { key: 'resource', label: 'Resources', icon: <Book className="h-5 w-5 mr-2 text-red-600" /> },
  { key: 'gallery', label: 'Gallery', icon: <Image className="h-5 w-5 mr-2 text-blue-600" /> },
  { key: 'counselling', label: 'Counselling', icon: <Users className="h-5 w-5 mr-2 text-green-600" /> },
];

export function Library() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [activeTab, setActiveTab] = useState<'resource' | 'gallery' | 'counselling'>('resource');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const { user } = useSession();
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'admin' || user?.role === 'teacher';

  useEffect(() => {
    loadResources();
    // eslint-disable-next-line
  }, []);

  const loadResources = async () => {
    setLoading(true);
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Library resources loading timeout reached');
      setLoading(false);
      setResources([]);
      setMessage({ type: 'error', text: 'Loading timeout - please try again.' });
    }, 8000); // 8 second timeout

    try {
      console.log('Loading library resources...');
      
      // Validate session before making request
      const sessionValid = await validateSession();
      if (!sessionValid) {
        console.error('Session validation failed, cannot load library resources');
        setResources([]);
        setMessage({ type: 'error', text: 'Session expired. Please refresh the page.' });
        return;
      }
      
      const { data, error } = await supabase
        .from('library_resources')
        .select('*')
        .order('created_at', { ascending: false });
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('Error loading library resources:', error);
        setMessage({ type: 'error', text: 'Failed to load resources.' });
        setResources([]);
      } else {
        console.log('Library resources loaded successfully:', data?.length || 0);
        setResources(data || []);
      }
    } catch (error) {
      console.error('Exception loading library resources:', error);
      setMessage({ type: 'error', text: 'Failed to load resources.' });
      setResources([]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !user?.id) return;
    setModalLoading(true);
    try {
      const { error } = await supabase
        .from('library_resources')
        .insert([{
          title: newTitle,
          content: newContent,
          type: activeTab,
          created_by: user.id
        }]);
      if (error) throw error;
      setShowModal(false);
      setNewTitle('');
      setNewContent('');
      setMessage({ type: 'success', text: `${TABS.find(t => t.key === activeTab)?.label} added successfully!` });
      await loadResources();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      console.error('Error creating resource:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('library_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Deleted successfully!' });
      await loadResources();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
      console.error('Error deleting resource:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // Animation variants
  const tabUnderline = {
    initial: { width: 0, x: 0 },
    animate: (el: HTMLElement | null) =>
      el
        ? { width: el.offsetWidth, x: el.offsetLeft, transition: { type: 'spring', stiffness: 300, damping: 30 } }
        : {},
  };
  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } },
    exit: { opacity: 0, y: 40, transition: { duration: 0.2 } },
    hover: { scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.10)' },
  };
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  };

  const filtered = resources.filter(r => r.type === activeTab);

  // For animated underline
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeTabIndex = TABS.findIndex(t => t.key === activeTab);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-gray-50/80 to-gray-100/90 dark:from-gray-900/90 dark:to-gray-800/80 py-6 px-2 xs:px-3 sm:px-6 lg:px-8 relative"
    >
      <div className="max-w-5xl mx-auto w-full">
        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-8 relative">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              ref={el => { tabRefs.current[i] = el; }}
              className={`relative flex items-center px-4 py-2 rounded-full font-semibold text-base transition-colors z-10 select-none ${activeTab === tab.key ? 'bg-white/90 dark:bg-gray-900/90 text-red-600 dark:text-red-400 shadow' : 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-800/70'} focus:outline-none`}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              tabIndex={0}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
          {/* Animated underline */}
          <motion.div
            className="absolute bottom-0 left-0 h-2 rounded-full bg-gradient-to-r from-red-500 to-red-400 z-20 shadow-lg shadow-red-200/30"
            style={{ pointerEvents: 'none' }}
            initial="initial"
            animate={tabUnderline.animate(tabRefs.current[activeTabIndex])}
          />
        </div>

        {/* Feedback message */}
        <AnimatePresence>
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
        </AnimatePresence>

        {/* Card grid */}
        <LayoutGroup>
          <motion.div
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3"
            layout
          >
            <AnimatePresence>
              {loading ? (
                <motion.div
                  className="col-span-full text-center text-gray-500 dark:text-gray-400 py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Loading...
                </motion.div>
              ) : filtered.length > 0 ? filtered.map((resource) => (
                <motion.div
                  key={resource.id}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur rounded-2xl shadow-lg p-5 flex flex-col justify-between group hover:shadow-2xl hover:shadow-red-200/30 transition-shadow relative"
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover="hover"
                  layout
                >
                  {isAdmin && (
                    <motion.button
                      onClick={() => handleDelete(resource.id)}
                      className={`absolute top-3 right-3 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full transition-colors z-20 ${deletingId === resource.id ? 'opacity-50 pointer-events-none' : ''}`}
                      aria-label="Delete resource"
                      whileTap={{ scale: 0.9 }}
                      disabled={!!deletingId}
                    >
                      <Trash2 className="h-5 w-5" />
                    </motion.button>
                  )}
                  <div className="flex-1 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 transition-colors">
                      {resource.title}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap text-sm flex-1">
                      {resource.content}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      resource.type === 'resource' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      resource.type === 'gallery' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {TABS.find(t => t.key === resource.type)?.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                      {new Date(resource.created_at).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              )) : (
                <motion.div
                  className="col-span-full flex flex-col items-center justify-center py-20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Image className="w-24 h-24 text-gray-200 dark:text-gray-700 mb-6" />
                  <div className="text-2xl font-semibold text-gray-400 dark:text-gray-600 mb-2">No {TABS.find(t => t.key === activeTab)?.label} found.</div>
                  <div className="text-base text-gray-400 dark:text-gray-600">Add your first {TABS.find(t => t.key === activeTab)?.label?.toLowerCase()}!</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </div>

      {/* Floating Action Button (FAB) */}
      {isAdmin && (
        <motion.button
          className="fixed bottom-8 right-8 z-50 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-full shadow-2xl p-5 flex items-center justify-center focus:outline-none"
          style={{ boxShadow: '0 12px 36px 0 rgba(239,68,68,0.22)' }}
          onClick={() => setShowModal(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.12, y: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="h-8 w-8" />
        </motion.button>
      )}

      {/* Add Resource Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-2xl shadow-2xl w-full max-w-md p-8 relative"
              initial={{ scale: 0.95, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            >
              <button
                className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add {TABS.find(t => t.key === activeTab)?.label}</h2>
              <form onSubmit={handleAddResource} className="space-y-5">
                <div>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={`Title for ${TABS.find(t => t.key === activeTab)?.label}`}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all text-lg"
                    required
                  />
                </div>
                <div>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder={`Content for ${TABS.find(t => t.key === activeTab)?.label}`}
                    rows={5}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none text-lg"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newTitle.trim() || !newContent.trim() || modalLoading}
                    className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-lg hover:from-red-700 hover:to-red-800 transition-colors text-lg disabled:opacity-60"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Add {TABS.find(t => t.key === activeTab)?.label}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}