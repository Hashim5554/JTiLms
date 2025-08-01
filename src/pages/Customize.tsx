import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { useTheme } from '../hooks/useTheme';
import { 
  Plus, Trash2, Edit, Eye, Layout, LayoutGrid, LayoutList, Columns, Grid3X3, PanelLeft, PanelRight, PanelTop, Rows, Palette, Sun, Moon, Check, X, AlertCircle, Layers, ChevronDown, ChevronRight
} from 'lucide-react';
import type { Class } from '../types';

// Define layoutStarterContent mapping at the top of the file
const layoutStarterContent: Record<string, any[]> = {
  standard: [
    { id: '1', title: 'Welcome', body: 'Welcome to your new page! This is a standard layout. Start adding your content here.', docs: [] }
  ],
  grid: [
    { id: '1', title: 'Grid Item 1', body: 'This is the first grid item. Add your content here.', docs: [] },
    { id: '2', title: 'Grid Item 2', body: 'This is the second grid item. Add your content here.', docs: [] },
    { id: '3', title: 'Grid Item 3', body: 'This is the third grid item. Add your content here.', docs: [] },
    { id: '4', title: 'Grid Item 4', body: 'This is the fourth grid item. Add your content here.', docs: [] }
  ],
  list: [
    { id: '1', title: 'List Item 1', body: 'This is the first list item. Add your content here.', docs: [] },
    { id: '2', title: 'List Item 2', body: 'This is the second list item. Add your content here.', docs: [] },
    { id: '3', title: 'List Item 3', body: 'This is the third list item. Add your content here.', docs: [] }
  ],
  'columns-2': [
    { id: '1', title: 'Left Column', body: 'This is the left column content. Add your content here.', docs: [] },
    { id: '2', title: 'Right Column', body: 'This is the right column content. Add your content here.', docs: [] }
  ],
  'columns-3': [
    { id: '1', title: 'Column 1', body: 'This is the first column content. Add your content here.', docs: [] },
    { id: '2', title: 'Column 2', body: 'This is the second column content. Add your content here.', docs: [] },
    { id: '3', title: 'Column 3', body: 'This is the third column content. Add your content here.', docs: [] }
  ],
  'left-sidebar': [
    { id: '1', title: 'Sidebar', body: 'This is the sidebar content. Add navigation or quick links here.', docs: [] },
    { id: '2', title: 'Main Content', body: 'This is the main content area. Add your primary content here.', docs: [] }
  ],
  'right-sidebar': [
    { id: '1', title: 'Main Content', body: 'This is the main content area. Add your primary content here.', docs: [] },
    { id: '2', title: 'Sidebar', body: 'This is the sidebar content. Add navigation or quick links here.', docs: [] }
  ],
  hero: [
    { id: '1', title: 'Hero Section', body: 'This is your hero section. Add a compelling headline and description here to grab attention.', docs: [] },
    { id: '2', title: 'Content Section', body: 'This is the main content section. Add your detailed content here.', docs: [] }
  ],
  masonry: [
    { id: '1', title: 'Masonry Block 1', body: 'This is the first masonry block. Add your content here.', docs: [] },
    { id: '2', title: 'Masonry Block 2', body: 'This is the second masonry block. Add your content here.', docs: [] },
    { id: '3', title: 'Masonry Block 3', body: 'This is the third masonry block. Add your content here.', docs: [] }
  ],
};

// --- Layout and Theme Options ---
const layoutOptions = [
  { id: 'standard', name: 'Standard', icon: <Layout className="w-5 h-5" />, preview: <div className="h-10 w-16 bg-gradient-to-br from-gray-200 to-gray-400 rounded-lg mx-auto" /> },
  { id: 'grid', name: 'Grid', icon: <LayoutGrid className="w-5 h-5" />, preview: <div className="grid grid-cols-2 gap-1 h-10 w-16"><div className="bg-gray-300 rounded"></div><div className="bg-gray-400 rounded"></div><div className="bg-gray-200 rounded"></div><div className="bg-gray-400 rounded"></div></div> },
  { id: 'list', name: 'List', icon: <LayoutList className="w-5 h-5" />, preview: <div className="flex flex-col gap-1 h-10 w-16"><div className="bg-gray-300 h-2 rounded"></div><div className="bg-gray-400 h-2 rounded"></div><div className="bg-gray-200 h-2 rounded"></div></div> },
  { id: 'columns-2', name: '2 Columns', icon: <Columns className="w-5 h-5" />, preview: <div className="flex h-10 w-16"><div className="bg-gray-300 w-1/2 h-full rounded-l"></div><div className="bg-gray-400 w-1/2 h-full rounded-r"></div></div> },
  { id: 'columns-3', name: '3 Columns', icon: <Grid3X3 className="w-5 h-5" />, preview: <div className="grid grid-cols-3 gap-1 h-10 w-16"><div className="bg-gray-300 rounded"></div><div className="bg-gray-400 rounded"></div><div className="bg-gray-200 rounded"></div></div> },
  { id: 'left-sidebar', name: 'Left Sidebar', icon: <PanelLeft className="w-5 h-5" />, preview: <div className="flex h-10 w-16"><div className="bg-gray-400 w-1/4 h-full rounded-l"></div><div className="bg-gray-200 w-3/4 h-full rounded-r"></div></div> },
  { id: 'right-sidebar', name: 'Right Sidebar', icon: <PanelRight className="w-5 h-5" />, preview: <div className="flex h-10 w-16"><div className="bg-gray-200 w-3/4 h-full rounded-l"></div><div className="bg-gray-400 w-1/4 h-full rounded-r"></div></div> },
  { id: 'hero', name: 'Hero', icon: <PanelTop className="w-5 h-5" />, preview: <div className="h-10 w-16 bg-gradient-to-t from-gray-400 to-gray-200 rounded-lg mx-auto" /> },
  { id: 'masonry', name: 'Masonry', icon: <Rows className="w-5 h-5" />, preview: <div className="grid grid-cols-2 gap-1 h-10 w-16"><div className="bg-gray-300 h-6 rounded"></div><div className="bg-gray-400 h-3 rounded"></div><div className="bg-gray-200 h-3 rounded col-span-2"></div></div> },
];
const themeOptions = [
  { id: 'default', name: 'Default', icon: <Palette className="w-5 h-5" />, preview: <div className="h-6 w-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 mx-auto" /> },
  { id: 'light', name: 'Light', icon: <Sun className="w-5 h-5" />, preview: <div className="h-6 w-6 rounded-full bg-white border mx-auto" /> },
  { id: 'dark', name: 'Dark', icon: <Moon className="w-5 h-5" />, preview: <div className="h-6 w-6 rounded-full bg-gray-900 mx-auto" /> },
  { id: 'red', name: 'Red', icon: <Palette className="w-5 h-5 text-red-500" />, preview: <div className="h-6 w-6 rounded-full bg-gradient-to-br from-red-400 to-red-700 mx-auto" /> },
  { id: 'blue', name: 'Blue', icon: <Palette className="w-5 h-5 text-blue-500" />, preview: <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 mx-auto" /> },
  { id: 'green', name: 'Green', icon: <Palette className="w-5 h-5 text-green-500" />, preview: <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-400 to-green-700 mx-auto" /> },
];

interface CustomPageData {
  id: string;
  title: string;
  path: string;
  content: string;
  class_id: string | null;
  config: {
    layout: string;
    theme: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}
interface ContextType {
  currentClass: Class | null;
  classes: Class[];
}

export function Customize() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { currentClass, classes } = useOutletContext<ContextType>();
  const [pages, setPages] = useState<CustomPageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPage, setSelectedPage] = useState<CustomPageData | null>(null);
  const [newPage, setNewPage] = useState({
    title: '',
    path: '',
    class_id: '',
    layout: 'standard',
    theme: 'default',
    content: layoutStarterContent['standard'], // Now stores JSON array
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'updated_at'>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'all' | 'class'>('all');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [layoutPreview, setLayoutPreview] = useState('standard');
  const [themePreview, setThemePreview] = useState('default');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const classDropdownRef = useRef<HTMLDivElement>(null);
  
  // --- Data Loading ---
  useEffect(() => {
    if (user?.role !== 'ultra_admin' && user?.role !== 'admin') return;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: pagesData, error: pagesError } = await supabase
          .from('custom_pages')
          .select('*')
          .order(sortBy, { ascending: sortDirection === 'asc' });
        if (pagesError) throw pagesError;
        setPages(pagesData || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user?.role, sortBy, sortDirection]);
  
  // --- Filtering ---
  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) || page.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'class' && page.class_id === currentClass?.id);
    return matchesSearch && matchesTab;
  });
  
  // --- Handlers ---
  // Update handleTitleChange to also update content if layout changes
  const handleTitleChange = (title: string) => {
    setNewPage(prev => ({
      ...prev,
      title,
      path: title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    }));
  };
  const handleCreatePage = async () => {
    if (!user) return;
    if (!newPage.title.trim()) { setError('Title is required'); return; }
    if (!newPage.path.trim()) { setError('Path is required'); return; }
    setIsCreating(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('custom_pages')
        .insert([{
          title: newPage.title.trim(),
          path: newPage.path.trim(),
          class_id: newPage.class_id || null,
          content: JSON.stringify(newPage.content || []), // Store as JSON string
          config: { layout: newPage.layout, theme: newPage.theme },
        }])
        .select()
        .single();
      if (error) throw error;
      setPages([...pages, data]);
      setShowCreateModal(false);
      setNewPage({ title: '', path: '', class_id: '', layout: 'standard', theme: 'default', content: layoutStarterContent['standard'] });
      setSuccess('Page created successfully!');
      setTimeout(() => setSuccess(null), 3000);
      navigate(`/custom/${data.path}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };
  const handleDeletePage = async () => {
    if (!selectedPage) return;
    setIsDeleting(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('custom_pages')
        .delete()
        .eq('id', selectedPage.id);
      if (error) throw error;
      setPages(pages.filter(p => p.id !== selectedPage.id));
      setShowDeleteModal(false);
      setSelectedPage(null);
      setSuccess('Page deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };
  const handleSortChange = (field: 'title' | 'updated_at') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };
  // --- 3D/Scroll Animations ---
  const cardVariants = {
    initial: { opacity: 0, y: 40, rotateY: -10 },
    animate: { opacity: 1, y: 0, rotateY: 0, transition: { type: 'spring', stiffness: 80, damping: 18 } },
    whileHover: { scale: 1.04, rotateY: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' },
  };
  // --- Accessibility: Close dropdown on outside click ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (classDropdownRef.current && !classDropdownRef.current.contains(event.target as Node)) {
        setClassDropdownOpen(false);
      }
    }
    if (classDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [classDropdownOpen]);
  
  // Check if user is admin for admin functions
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'admin';
  
  // --- Access Denied ---
  if (!isAdmin) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="text-center p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800 max-w-md">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="mx-auto mb-6 p-4 rounded-full bg-red-100 dark:bg-red-900/30 w-20 h-20 flex items-center justify-center">
            <Layers className="w-10 h-10 text-red-600 dark:text-red-400" />
          </motion.div>
          <motion.h2 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Access Denied</motion.h2>
          <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="text-gray-600 dark:text-gray-300">Only administrators can customize the system.</motion.p>
        </motion.div>
      </motion.div>
    );
  }
  
  // --- Main UI ---
  return (
    <div className="min-h-screen bg-white dark:bg-[#181929] flex items-center justify-center py-4 px-1 sm:py-6 sm:px-2 transition-colors duration-300">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-7xl bg-gradient-to-br from-red-700 to-red-900 rounded-[32px] sm:rounded-[40px] md:rounded-[48px] shadow-2xl p-2 sm:p-4 md:p-8 lg:p-12 overflow-hidden">
        {/* 3D Hero Section */}
        <motion.div initial={{ scale: 0.95, opacity: 0, y: -40 }} animate={{ scale: 1, opacity: 1, y: 0 }} transition={{ duration: 0.7, type: 'spring', stiffness: 80 }} className="relative z-10">
          <div className="max-w-5xl mx-auto px-4 pt-16 pb-10">
            <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.7 }} className="backdrop-blur-xl bg-white/20 dark:bg-gray-900/30 rounded-3xl shadow-2xl p-10 flex flex-col items-center border border-white/30 dark:border-gray-800/40 relative overflow-hidden">
              <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 8, ease: 'linear' }} className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-red-400/40 to-red-800/40 rounded-full blur-2xl z-0" />
              <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 10, ease: 'linear' }} className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-red-200/40 to-red-700/40 rounded-full blur-2xl z-0" />
              <div className="relative z-10 flex flex-col items-center">
                <Layers className="w-14 h-14 text-white drop-shadow-lg mb-4" />
                <h1 className="text-4xl sm:text-5xl font-extrabold text-white text-center mb-3 drop-shadow-lg">Customize Pages</h1>
                {currentClass && (
                  <div className="text-lg text-white/90 text-center font-semibold mb-2">
                    Grade {currentClass.grade} - {currentClass.section}
            </div>
                )}
                <p className="text-lg text-white/80 text-center max-w-2xl mb-6">Create beautiful, interactive custom pages for your LMS. Assign them to all classes or specific classes, and choose from a variety of layouts and themes. All with stunning 3D and animated effects.</p>
                <motion.button whileHover={{ scale: 1.07, rotate: 2 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-8 py-4 bg-white/90 text-red-700 rounded-2xl font-bold text-lg shadow-lg hover:bg-white/100 transition-all">
                  <Plus className="w-6 h-6" /> Create New Page
                </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
        {/* Main Content Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Search and sort controls */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-auto">
              <input type="text" placeholder="Search pages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-80 px-4 py-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200" aria-label="Search pages" />
              <div className="absolute left-3 top-3.5 text-gray-400 dark:text-gray-500 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => handleSortChange('title')} className={`px-4 py-2 rounded-xl border transition-colors ${sortBy === 'title' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}> <span>Title</span> {sortBy === 'title' && (<ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />)} </button>
              <button onClick={() => handleSortChange('updated_at')} className={`px-4 py-2 rounded-xl border transition-colors ${sortBy === 'updated_at' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400' : 'bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'}`}> <span>Updated</span> {sortBy === 'updated_at' && (<ChevronDown className={`w-4 h-4 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />)} </button>
          </div>
        </motion.div>
        {/* Notifications */}
        <AnimatePresence>
          {error && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
                <button onClick={() => setError(null)} className="ml-auto p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/50"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
          {success && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 flex items-center gap-3">
              <Check className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
                <button onClick={() => setSuccess(null)} className="ml-auto p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-800/50"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Pages grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="inline-block"><Layout className="w-12 h-12 text-red-600 mx-auto mb-4 animate-spin" /></motion.div>
                <p className="text-gray-100 dark:text-gray-300">Loading pages...</p>
            </div>
          </div>
        ) : filteredPages.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center py-20 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-md">
              <Layout className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">No pages found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{searchTerm ? 'No pages match your search criteria.' : 'Create your first custom page to get started.'}</p>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"><Plus className="w-5 h-5" />Create New Page</motion.button>
          </motion.div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPages.map((page, idx) => (
                <motion.div key={page.id} variants={cardVariants} initial="initial" whileInView="animate" whileHover="whileHover" viewport={{ once: true, amount: 0.3 }} transition={{ delay: idx * 0.06 }} className="group relative bg-white/90 dark:bg-gray-900/80 rounded-3xl shadow-xl overflow-hidden border border-white/30 dark:border-gray-800/40 transition-all duration-300 hover:shadow-2xl cursor-pointer" tabIndex={0} aria-label={`View or edit page ${page.title}`}> {/* Card header with gradient */}
                  <div className="h-24 bg-gradient-to-r from-red-500 to-red-700 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/10 rounded-lg"><Layout className="w-5 h-5 text-white" /></div>
                      <h3 className="text-lg font-semibold text-white truncate max-w-[150px]">{page.title}</h3>
                    </div>
                    <div className="p-2 bg-white/10 rounded-lg">{(() => { const layoutId = page.config?.layout || 'standard'; const layout = layoutOptions.find(l => l.id === layoutId); return layout?.icon || <Layout className="w-5 h-5 text-white" />; })()}</div>
                  </div>
                {/* Card content */}
                <div className="p-6">
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Path</div>
                      <div className="text-gray-900 dark:text-white font-medium flex items-center"><span className="truncate">/custom/{page.path}</span></div>
                    </div>
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Class</div>
                      <div className="text-gray-900 dark:text-white">{page.class_id ? (classes.find(c => c.id === page.class_id) ? `Grade ${classes.find(c => c.id === page.class_id)?.grade}-${classes.find(c => c.id === page.class_id)?.section}` : 'Unknown Class') : 'All Classes'}</div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div>Updated {new Date(page.updated_at).toLocaleDateString()}</div>
                      <div className="flex items-center gap-1"><Palette className="w-4 h-4" /><span className="capitalize">{page.config?.theme || 'Default'}</span></div>
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="p-4 border-t border-white/30 dark:border-gray-800/40 flex justify-between">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/custom/${page.path}`)} className="px-4 py-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"><Eye className="w-4 h-4" /><span>View</span></motion.button>
                    <div className="flex gap-2">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedPage(page); setShowDeleteModal(true); }} className="p-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 className="w-4 h-4" /></motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/custom/${page.path}`)} className="p-2 rounded-xl bg-gray-100/80 dark:bg-gray-700/80 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"><Edit className="w-4 h-4" /></motion.button>
                    </div>
                  </div>
                  {/* 3D hover overlay */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: hoveredCard === page.id ? 0.08 : 0 }} className="absolute inset-0 bg-white dark:bg-black pointer-events-none" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
        {/* --- Create Page Modal --- */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 w-full max-w-lg relative border border-white/30 dark:border-gray-800/40 max-h-[90vh] overflow-y-auto">
                <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white text-center">Create Custom Page</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Title</label>
                    <input type="text" value={newPage.title} onChange={e => handleTitleChange(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" placeholder="Page title" aria-label="Page title" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Path</label>
                    <input type="text" value={newPage.path} onChange={e => setNewPage({ ...newPage, path: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" placeholder="custom-page-path" aria-label="Page path" />
                  </div>
                    <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Class</label>
                    <div className="relative" ref={classDropdownRef}>
                      <button type="button" onClick={() => setClassDropdownOpen(v => !v)} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white flex items-center justify-between focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" aria-haspopup="listbox" aria-expanded={classDropdownOpen} aria-label="Select class">
                        {newPage.class_id ? (classes.find(c => c.id === newPage.class_id) ? `Grade ${classes.find(c => c.id === newPage.class_id)?.grade}-${classes.find(c => c.id === newPage.class_id)?.section}` : 'Unknown Class') : 'All Classes'}
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </button>
                      <AnimatePresence>
                        {classDropdownOpen && (
                          <motion.ul initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto" role="listbox">
                            <li onClick={() => { setNewPage({ ...newPage, class_id: '' }); setClassDropdownOpen(false); }} className="px-3 py-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-900 dark:text-white" role="option" aria-selected={!newPage.class_id}>All Classes</li>
                            {classes.map(c => (
                              <li key={c.id} onClick={() => { setNewPage({ ...newPage, class_id: c.id }); setClassDropdownOpen(false); }} className="px-3 py-2 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-900 dark:text-white" role="option" aria-selected={newPage.class_id === c.id}>{`Grade ${c.grade}-${c.section}`}</li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Layout</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {layoutOptions.map(opt => (
                        <motion.button
                          key={opt.id}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            setNewPage(prev => ({
                              ...prev,
                              layout: opt.id,
                              content: layoutStarterContent[opt.id] || [],
                            }));
                            setLayoutPreview(opt.id);
                          }}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${newPage.layout === opt.id ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-transparent bg-white/80 dark:bg-gray-800/80'}`}
                          aria-pressed={newPage.layout === opt.id}
                          aria-label={opt.name}
                        >
                          {opt.icon}
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{opt.name}</span>
                          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: newPage.layout === opt.id ? 1 : 0.5, scale: newPage.layout === opt.id ? 1.1 : 0.9 }} className="mt-1">{opt.preview}</motion.div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{getLayoutDescription(opt.id)}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Live Preview</label>
                    <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-800 min-h-[120px] max-h-[200px] overflow-y-auto">
                      {Array.isArray(newPage.content) ? (
                        <div className="space-y-2">
                          {newPage.content.map((block, idx) => (
                            <div key={idx} className="p-2 bg-white dark:bg-gray-700 rounded border">
                              <div className="font-medium text-sm">{block.title}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{block.body}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400 text-sm">No preview available</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-200 font-medium mb-1">Theme</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {themeOptions.map(opt => (
                        <motion.button key={opt.id} type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={() => { setNewPage({ ...newPage, theme: opt.id }); setThemePreview(opt.id); }} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${newPage.theme === opt.id ? 'border-red-500 bg-red-50 dark:bg-red-900/30' : 'border-transparent bg-white/80 dark:bg-gray-800/80'}` } aria-pressed={newPage.theme === opt.id} aria-label={opt.name}>
                          {opt.icon}
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-200">{opt.name}</span>
                          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: newPage.theme === opt.id ? 1 : 0.5, scale: newPage.theme === opt.id ? 1.1 : 0.9 }} className="mt-1">{opt.preview}</motion.div>
                        </motion.button>
                      ))}
                  </div>
                </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCreatePage} disabled={isCreating} className="w-full mt-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isCreating ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Layout className="w-5 h-5 animate-spin" /></motion.span> : <Plus className="w-5 h-5" />} Create Page
                    </motion.button>
                  </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* --- Delete Modal --- */}
        <AnimatePresence>
          {showDeleteModal && selectedPage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <motion.div initial={{ scale: 0.8, y: 40, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.8, y: 40, opacity: 0 }} transition={{ type: 'spring', stiffness: 180, damping: 18 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 w-full max-w-md relative border border-white/30 dark:border-gray-800/40">
                <button onClick={() => setShowDeleteModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Close"><X className="w-5 h-5" /></button>
                <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">Delete Page</h2>
                <p className="text-gray-700 dark:text-gray-200 mb-6 text-center">Are you sure you want to delete <span className="font-bold">{selectedPage.title}</span>? This action cannot be undone.</p>
                <div className="flex gap-4 justify-center">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleDeletePage} disabled={isDeleting} className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">{isDeleting ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Trash2 className="w-5 h-5 animate-spin" /></motion.span> : <Trash2 className="w-5 h-5" />} Delete</motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowDeleteModal(false)} className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-bold transition-colors flex items-center gap-2"><X className="w-5 h-5" />Cancel</motion.button>
                </div>
              </motion.div>
            </motion.div>
        )}
        </AnimatePresence>
      </motion.div>
      </div>
  );
}

export default Customize;

// Add this helper function for layout descriptions
function getLayoutDescription(layoutId: string): string {
  switch (layoutId) {
    case 'standard': return 'A simple, flexible page.';
    case 'grid': return 'A grid of content blocks.';
    case 'list': return 'A vertical list of items.';
    case 'columns-2': return 'Two side-by-side columns.';
    case 'columns-3': return 'Three columns for more content.';
    case 'left-sidebar': return 'Sidebar on the left, content on the right.';
    case 'right-sidebar': return 'Content on the left, sidebar on the right.';
    case 'hero': return 'A large hero section at the top.';
    case 'masonry': return 'Masonry-style blocks.';
    default: return '';
  }
}
