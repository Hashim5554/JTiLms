import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSession } from '../contexts/SessionContext';
import type { Class } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Save, X, Loader2, FileText, AlertCircle, Check, Plus, Trash2, UploadCloud, BookOpen, BookOpenCheck } from 'lucide-react';
import CustomPageRenderer from '../components/pageComponents/CustomPageRenderer';
import type { CustomCardProps } from '../components/pageComponents/CustomCard';

interface CustomPageData {
  id: string;
  title: string;
  content: string;
  class_id: string;
  config: {
    layout: string;
    theme: string;
    [key: string]: any;
  };
}

interface ContextType {
  currentClass: Class | null;
  customPages: Array<{ id: string; title: string; path: string }>;
}

export function CustomPage() {
  const { path } = useParams();
  const { currentClass } = useOutletContext<ContextType>();
  const [page, setPage] = useState<CustomPageData | null>(null);
  const [blocks, setBlocks] = useState<CustomCardProps[]>([]);
  const [editingBlock, setEditingBlock] = useState<number | null>(null);
  const [editBlockData, setEditBlockData] = useState<CustomCardProps>({ title: '', body: '', docs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBlockTypeSelector, setShowBlockTypeSelector] = useState(false);
  const [isInSidebar, setIsInSidebar] = useState(false);
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [showSidebarModal, setShowSidebarModal] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [sidebarModalLoading, setSidebarModalLoading] = useState(false);
  const { user } = useSession();

  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'admin';

  useEffect(() => { 
    loadPage(); 
  }, [path]);

  // Check sidebar status when page becomes available
  useEffect(() => {
    if (page) {
      checkSidebarStatus(page.id);
    }
  }, [page]);

  const loadPage = async () => {
    if (!path) {
      console.log('No path provided');
      return;
    }
    
    console.log('Loading page with path:', path);
    setLoading(true);
    try {
      // First try to load by path (for direct URL access)
      let { data, error } = await supabase
        .from('custom_pages')
        .select('*')
        .eq('path', path)
        .single();
      
      // If not found by path, try to load by ID (for sidebar access)
      if (error && error.code === 'PGRST116') {
        console.log('Page not found by path, trying by ID:', path);
        const { data: dataById, error: errorById } = await supabase
          .from('custom_pages')
          .select('*')
          .eq('id', path)
          .single();
        
        data = dataById;
        error = errorById;
      }
      
      console.log('Query result:', { data, error });
      
      if (error) throw error;

      if (data) {
        setPage(data);
        try {
          const parsedContent = JSON.parse(data.content || '[]');
          setBlocks(Array.isArray(parsedContent) ? parsedContent : []);
        } catch {
          setBlocks([]);
        }
        
        // Check if page is in sidebar for current class (if available)
        if (currentClass) {
          checkSidebarStatus(data.id);
        }
      }
    } catch (error: any) {
      console.error('Error loading page:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const checkSidebarStatus = async (pageId: string) => {
    try {
      const { data, error } = await supabase
        .from('sidebar_pages')
        .select('*')
        .eq('page_id', pageId);

      if (error) {
        console.error('Error checking sidebar status:', error);
        return;
      }

      setIsInSidebar(data && data.length > 0);
    } catch (error) {
      console.error('Error checking sidebar status:', error);
    }
  };

  const loadAllClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('grade')
        .order('section');

      if (error) throw error;
      setAllClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleSidebarToggle = async () => {
    if (!page || sidebarLoading) return;
    
    if (isInSidebar) {
      // Remove from all sidebars
      setSidebarLoading(true);
      try {
        const { error } = await supabase
          .from('sidebar_pages')
          .delete()
          .eq('page_id', page.id);

        if (error) throw error;
        setIsInSidebar(false);
        setSuccess('Page removed from all sidebars!');
      } catch (error: any) {
        console.error('Sidebar toggle error:', error);
        setError(error.message);
      } finally {
        setSidebarLoading(false);
        setTimeout(() => setSuccess(null), 3000);
        setTimeout(() => setError(null), 3000);
      }
    } else {
      // Show modal to select classes
      await loadAllClasses();
      setShowSidebarModal(true);
    }
  };

  const handleAddToSidebar = async () => {
    if (!page || selectedClasses.length === 0) return;
    
    setSidebarModalLoading(true);
    try {
      const sidebarEntries = selectedClasses.map(classId => ({
        page_id: page.id,
        class_id: classId,
        title: page.title,
        order_index: 999
      }));

      const { error } = await supabase
        .from('sidebar_pages')
        .insert(sidebarEntries);

      if (error) throw error;
      
      setIsInSidebar(true);
      setShowSidebarModal(false);
      setSelectedClasses([]);
      setSuccess(`Page added to ${selectedClasses.length} class${selectedClasses.length > 1 ? 'es' : ''}!`);
    } catch (error: any) {
      console.error('Error adding to sidebar:', error);
      setError(error.message);
    } finally {
      setSidebarModalLoading(false);
      setTimeout(() => setSuccess(null), 3000);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSavePage = async () => {
    if (!page) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('custom_pages')
        .update({ content: JSON.stringify(blocks) })
        .eq('id', page.id);

      if (error) throw error;
      setPage({ ...page, content: JSON.stringify(blocks) });
      setSuccess('Changes saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Error saving page:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlock = () => {
    setShowBlockTypeSelector(true);
  };

  const handleSelectBlockType = (type: 'block' | 'column' | 'card') => {
    const newBlock: CustomCardProps = { 
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, 
      body: `Add your content here...`, 
      docs: [],
      type: type // Add type to distinguish between block types
    };
    setBlocks([...blocks, newBlock]);
    setShowBlockTypeSelector(false);
    setTimeout(() => handleSavePage(), 100); // Auto-save
  };

  const handleEditBlock = (index: number) => {
    setEditingBlock(index);
    setEditBlockData(blocks[index]);
  };

  const handleSaveBlock = () => {
    if (editingBlock !== null) {
      const updatedBlocks = [...blocks];
      updatedBlocks[editingBlock] = editBlockData;
      setBlocks(updatedBlocks);
      setEditingBlock(null);
      setEditBlockData({ title: '', body: '', docs: [] });
      // Auto-save after editing block
      setTimeout(() => handleSavePage(), 100);
    }
  };

  const handleDeleteBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
    // Auto-save after deleting block
    setTimeout(() => handleSavePage(), 100);
  };

  const handleDeleteDocument = (blockIdx: number, docIdx: number) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIdx].docs.splice(docIdx, 1);
    setBlocks(updatedBlocks);
    // Auto-save after deleting document
    setTimeout(() => handleSavePage(), 100);
  };

  const handleUploadDocument = async (blockIdx: number, file: File) => {
    setUploading(blockIdx);
    try {
      // Check file size (50MB limit)
      if (file.size > 52428800) {
        throw new Error('File size must be less than 50MB');
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported. Please upload PDF, Word documents, text files, or images.');
      }

      // Upload file to Supabase storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('custom-page-docs')
        .upload(fileName, file);

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error('Storage bucket not configured. Please contact an administrator.');
        }
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('custom-page-docs')
        .getPublicUrl(fileName);

      // Update block with new document
      const updatedBlocks = [...blocks];
      updatedBlocks[blockIdx].docs.push({
        name: file.name,
        url: publicUrl
      });
      setBlocks(updatedBlocks);

      // Save to database
      await handleSavePage();
      
      setSuccess('Document uploaded successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError('Failed to upload document: ' + error.message);
      setTimeout(() => setError(null), 5000);
    } finally {
      setUploading(null);
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
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
        >
          <div className="p-6 sm:p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex items-center justify-between mb-8"
            >
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {page.title}
                </h1>
                {isInSidebar && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium"
                  >
                    <BookOpenCheck className="w-4 h-4" />
                    In Sidebar
                  </motion.div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Sidebar Toggle Button - Admin Only */}
                {isAdmin && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSidebarToggle}
                    disabled={sidebarLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isInSidebar
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    } ${sidebarLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isInSidebar ? 'Remove from sidebar' : 'Add to sidebar'}
                  >
                    {sidebarLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isInSidebar ? (
                      <BookOpenCheck className="w-4 h-4" />
                    ) : (
                      <BookOpen className="w-4 h-4" />
                    )}
                    {sidebarLoading ? 'Updating...' : isInSidebar ? 'Remove from Sidebar' : 'Add to Sidebar'}
                  </motion.button>
                )}

                {/* Add Block Button */}
                {isAdmin && (
                  <motion.button 
                    onClick={handleAddBlock} 
                    className="btn btn-primary gap-2 rounded-xl"
                  >
                    <Plus className="w-5 h-5" /> Add Block
                </motion.button>
              )}
            </div>
            </motion.div>

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

            {/* Block Editor Modal */}
            <AnimatePresence>
              {editingBlock !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: 40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold">Edit Content Block</h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingBlock(null)}
                          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </motion.button>
                      </div>
                      <p className="text-red-100 mt-2">Update the title and content for this block</p>
                    </div>

                    {/* Form */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Block Title
                        </label>
                        <input
                          type="text"
                          value={editBlockData.title}
                          onChange={(e) => setEditBlockData({ ...editBlockData, title: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-lg"
                          placeholder="Enter block title..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Content
                        </label>
                <textarea
                          value={editBlockData.body}
                          onChange={(e) => setEditBlockData({ ...editBlockData, body: e.target.value })}
                          rows={8}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 resize-none"
                          placeholder="Enter your content here..."
                        />
                        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>Use line breaks to create paragraphs</span>
                          <span>{editBlockData.body.length} characters</span>
                        </div>
                      </div>

                      {/* Preview */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                          Live Preview
                        </label>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[100px] max-h-[200px] overflow-y-auto">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                            {editBlockData.title || 'Untitled Block'}
                          </h4>
                          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                            {editBlockData.body || 'No content yet...'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-6 flex gap-3 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setEditingBlock(null)}
                        className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                        onClick={handleSaveBlock}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Save Changes
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Block Type Selector Modal */}
            <AnimatePresence>
              {showBlockTypeSelector && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: 40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold">Choose Block Type</h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setShowBlockTypeSelector(false)}
                          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </motion.button>
                      </div>
                      <p className="text-red-100 mt-2">Select the type of content block you want to add</p>
                    </div>

                    {/* Block Type Options */}
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                      {/* Block Option */}
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectBlockType('block')}
                        className="w-full p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                              Content Block
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              Large, prominent section for main content
                            </p>
                          </div>
                        </div>
                      </motion.button>

                      {/* Column Option */}
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectBlockType('column')}
                        className="w-full p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                              Column
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              Tall, narrow section for sidebar content
                            </p>
                          </div>
                        </div>
                      </motion.button>

                      {/* Card Option */}
                      <motion.button
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectBlockType('card')}
                        className="w-full p-6 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all duration-200 text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl">
                            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                              Card
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              Compact component for grid layouts
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Page Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {blocks.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No content yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">This page doesn't have any content blocks yet.</p>
                  {isAdmin && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddBlock}
                      className="btn btn-primary gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Your First Block
                    </motion.button>
                  )}
                </div>
              ) : (
                <CustomPageRenderer
                  layout={page.config?.layout || 'standard'}
                  blocks={blocks}
                  onUploadDoc={isAdmin ? handleUploadDocument : undefined}
                  editable={isAdmin}
                  onEditCard={isAdmin ? handleEditBlock : undefined}
                  onDeleteCard={isAdmin ? handleDeleteBlock : undefined}
                  onDeleteDoc={isAdmin ? handleDeleteDocument : undefined}
                />
              )}
              </motion.div>

            {/* Auto-save indicator */}
            {saving && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </motion.div>
            )}

            {/* Sidebar Class Selection Modal */}
            <AnimatePresence>
              {showSidebarModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ scale: 0.8, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, y: 40, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                  >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-bold">Add to Sidebar</h3>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            setShowSidebarModal(false);
                            setSelectedClasses([]);
                          }}
                          className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                          <X className="w-6 h-6" />
                        </motion.button>
                      </div>
                      <p className="text-red-100 mt-2">Select which classes should see this page in their sidebar</p>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      {/* Select All Option */}
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                        <input
                          type="checkbox"
                          id="select-all"
                          checked={selectedClasses.length === allClasses.length && allClasses.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClasses(allClasses.map(c => c.id));
                            } else {
                              setSelectedClasses([]);
                            }
                          }}
                          className="w-5 h-5 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                        <label htmlFor="select-all" className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer">
                          Add to All Classes
                        </label>
                      </div>

                      {/* Class List */}
                      <div className="space-y-3">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Or select specific classes:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                          {allClasses.map((cls) => (
                            <label key={cls.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={selectedClasses.includes(cls.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedClasses([...selectedClasses, cls.id]);
                                  } else {
                                    setSelectedClasses(selectedClasses.filter(id => id !== cls.id));
                                  }
                                }}
                                className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                              />
                              <span className="text-gray-900 dark:text-white font-medium">
                                Grade {cls.grade}-{cls.section}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setShowSidebarModal(false);
                          setSelectedClasses([]);
                        }}
                        className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleAddToSidebar}
                        disabled={selectedClasses.length === 0 || sidebarModalLoading}
                        className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {sidebarModalLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            Add to {selectedClasses.length} Class{selectedClasses.length !== 1 ? 'es' : ''}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default CustomPage;