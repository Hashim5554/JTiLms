import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import type { Subject, Class, SubjectMaterial, Folder } from '../types';
import { 
  PlusCircle, 
  Trash2, 
  Link as LinkIcon, 
  Image, 
  Edit, 
  Plus, 
  BookOpen, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  Edit2, 
  Loader2, 
  X,
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  Sparkles,
  Star,
  StarIcon,
  Bookmark,
  Share2
} from 'lucide-react';

interface SubjectLink {
  id: string;
  title: string;
  url: string;
  created_at: string;
  created_by: string;
  profiles: {
    username: string;
  };
}

interface ContextType {
  currentClass: Class | null;
}

interface Message {
  type: 'success' | 'error';
  text: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const folderVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
};

const materialVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 }
};

export function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [links, setLinks] = useState<SubjectLink[]>([]);
  const [materials, setMaterials] = useState<SubjectMaterial[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const { currentClass } = useOutletContext<ContextType>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'ultra_admin';
  const [message, setMessage] = useState<Message | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolder, setNewFolder] = useState({ name: '', description: '', parent_folder_id: null as string | null });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    due_date: '',
    folder_id: null as string | null
  });
  const [starredMaterials, setStarredMaterials] = useState<Set<string>>(new Set());
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    loadSubject();
    loadLinks();
    loadMaterials();
    loadFolders();
  }, [id]);

  const loadSubject = async () => {
    if (!id) return;
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (data) {
      setSubject(data);
      setEditName(data.name);
      setEditDescription(data.description);
      setEditImageUrl(data.image_url || '');
    }
  };

  const loadLinks = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('subject_links')
        .select(`
          *,
          profiles:created_by (username)
        `)
        .eq('subject_id', id)
        .order('created_at', { ascending: false });

      if (data) setLinks(data);
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('subject_id', id)
        .order('name');

      if (error) throw error;
      if (data) setFolders(data);
    } catch (error) {
      console.error('Error loading folders:', error);
      setMessage({ type: 'error', text: 'Failed to load folders' });
    }
  };

  const loadMaterials = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('subject_materials')
        .select(`
          *,
          folder:folders(*)
        `)
        .eq('subject_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setMaterials(data);
    } catch (error) {
      console.error('Error loading materials:', error);
      setMessage({ type: 'error', text: 'Failed to load materials' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const { data, error } = await supabase
      .from('subject_links')
      .insert([{
        subject_id: id,
        title: newTitle,
        url: newUrl,
        created_by: user?.id
      }])
      .select(`
        *,
        profiles:created_by (username)
      `)
      .single();

    if (data) {
      setLinks([data, ...links]);
      setNewTitle('');
      setNewUrl('');
    }
  };

  const handleDelete = async (linkId: string) => {
    const { error } = await supabase
      .from('subject_links')
      .delete()
      .eq('id', linkId);

    if (!error) {
      setLinks(links.filter(link => link.id !== linkId));
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !editDescription.trim()) return;

    const { data, error } = await supabase
      .from('subjects')
      .update({
        name: editName,
        description: editDescription,
        image_url: editImageUrl || null
      })
      .eq('id', id)
      .select();

    if (data && data[0]) {
      setSubject(data[0]);
      setIsEditing(null);
    }
  };

  const toggleImageInput = () => {
    setShowImageInput(!showImageInput);
  };

  const handleCreate = async () => {
    try {
      if (!formData.title || !formData.description) {
        setMessage({ type: 'error', text: 'Title and description are required' });
        return;
      }

      const dueDateValue = formData.due_date === '' ? null : formData.due_date;
      const { data, error } = await supabase
        .from('subject_materials')
        .insert([{
          ...formData,
          due_date: dueDateValue,
          subject_id: id,
          created_by: user?.id || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: 'success', text: 'Material created successfully' });
      setIsCreating(false);
      setFormData({
        title: '',
        description: '',
        file_url: '',
        due_date: '',
        folder_id: null
      });
      setMaterials(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error creating material:', error);
      setMessage({ type: 'error', text: 'Failed to create material' });
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    try {
      const { error } = await supabase
        .from('subject_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Material deleted successfully' });
      setMaterials(materials.filter(m => m.id !== materialId));
    } catch (error) {
      console.error('Error deleting material:', error);
      setMessage({ type: 'error', text: 'Failed to delete material' });
    }
  };

  const handleUpdateMaterial = async (materialId: string) => {
    try {
      if (!formData.title || !formData.description) {
        setMessage({ type: 'error', text: 'Title and description are required' });
        return;
      }

      const { error } = await supabase
        .from('subject_materials')
        .update(formData)
        .eq('id', materialId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Material updated successfully' });
      setIsEditing(null);
      setFormData({
        title: '',
        description: '',
        file_url: '',
        due_date: '',
        folder_id: null
      });
      setMaterials(materials.map(m => m.id === materialId ? { ...m, ...formData } : m));
    } catch (error) {
      console.error('Error updating material:', error);
      setMessage({ type: 'error', text: 'Failed to update material' });
    }
  };

  const startEditing = (material: SubjectMaterial) => {
    setIsEditing(material.id);
    setFormData({
      title: material.title,
      description: material.description,
      file_url: material.file_url || '',
      due_date: material.due_date || '',
      folder_id: material.folder_id || null
    });
  };

  const handleCreateFolder = async () => {
    setIsCreatingFolder(true);
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ ...newFolder, subject_id: id, created_by: user?.id }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setFolders(prev => [...prev, data]);
      }
      setNewFolder({ name: '', description: '', parent_folder_id: null });
    } catch (error) {
      console.error('Error creating folder:', error);
      setMessage({ type: 'error', text: 'Failed to create folder' });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? All materials inside will be moved to the root level.')) return;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      // Move materials to root level
      const { error: updateError } = await supabase
        .from('subject_materials')
        .update({ folder_id: null })
        .eq('folder_id', folderId);

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Folder deleted successfully' });
      setFolders(folders.filter(f => f.id !== folderId));
      setMaterials(materials.map(m => m.folder_id === folderId ? { ...m, folder_id: null } : m));
    } catch (error) {
      console.error('Error deleting folder:', error);
      setMessage({ type: 'error', text: 'Failed to delete folder' });
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const getFolderPath = (folderId: string): Folder[] => {
    const path: Folder[] = [];
    let currentFolder = folders.find(f => f.id === folderId);
    
    while (currentFolder) {
      path.unshift(currentFolder);
      currentFolder = folders.find(f => f.id === currentFolder?.parent_folder_id);
    }
    
    return path;
  };

  const renderFolderTree = (parentId: string | null = null, level: number = 0) => {
    const childFolders = folders.filter(f => f.parent_folder_id === parentId);
    
    return childFolders.map(folder => (
      <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
        <motion.div 
          variants={folderVariants}
          className="group flex items-center py-2 px-3 rounded-xl mb-1 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all cursor-pointer"
          onClick={() => toggleFolder(folder.id)}
        >
          <div className="flex items-center flex-grow">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 mr-3">
              <FolderIcon className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>
            <span className="text-gray-900 dark:text-white font-medium">{folder.name}</span>
          </div>
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFolder(folder.id);
              }}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="h-4 w-4" />
            </motion.button>
          )}
        </motion.div>
        {expandedFolders.has(folder.id) && (
          <>
            {renderFolderTree(folder.id, level + 1)}
            {materials
              .filter(m => m.folder_id === folder.id)
              .map(material => (
                <motion.div
                  key={material.id}
                  variants={materialVariants}
                  layout
                  className="group flex items-center py-2 px-3 ml-8 rounded-xl mb-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all"
                  style={{ marginLeft: `${(level + 1) * 20}px` }}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 mr-3">
                    <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{material.title}</span>
                  {isAdmin && (
                    <div className="flex items-center space-x-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => startEditing(material)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                      >
                        <Edit2 className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteMaterial(material.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              ))}
          </>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subject not found</h2>
        <button
          onClick={() => navigate('/subjects')}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Back to Subjects
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-red-800 p-8 mb-8 shadow-xl"
        >
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />
          <div className="relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <motion.h1 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-4xl font-bold text-white mb-2"
                >
                  {subject.name}
                </motion.h1>
                <motion.p 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-red-100 text-lg"
                >
                  {subject.description}
                </motion.p>
        </div>
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsCreatingFolder(true)}
                      className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                      <FolderPlus className="h-5 w-5 mr-2" />
                      New Folder
                    </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
                      className="flex items-center px-4 py-2 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Material
        </motion.button>
                  </>
                )}
              </div>
            </div>
      </div>
        </motion.div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-xl mb-6 backdrop-blur-sm ${
              message.type === 'success' 
                  ? 'bg-green-100/80 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                  : 'bg-red-100/80 dark:bg-red-900/50 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Folders Card */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <FolderIcon className="h-5 w-5 mr-2 text-red-500" />
                Folders
              </h2>
            </div>
            <div className="p-4">
              <LayoutGroup>
                {renderFolderTree()}
                {materials
                  .filter(m => !m.folder_id)
                  .map(material => (
          <motion.div
            key={material.id}
                      variants={materialVariants}
                      layout
                      className="group flex items-center py-2 px-3 rounded-xl mb-1 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all"
                    >
                      <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 mr-3">
                        <FileText className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">{material.title}</span>
                      {isAdmin && (
                        <div className="flex items-center space-x-2 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => startEditing(material)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            <Edit2 className="h-4 w-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </div>
                      )}
                    </motion.div>
                  ))}
              </LayoutGroup>
            </div>
          </motion.div>

          {/* Materials Card */}
          <motion.div 
            variants={itemVariants}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-red-500" />
                Materials
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map(material => (
                  <motion.div
                    key={material.id}
                    variants={materialVariants}
                    layout
                    className="group relative bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 hover:shadow-lg transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            {material.title}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                            {material.description}
                          </p>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className={`p-1 ${starredMaterials.has(material.id) ? 'text-yellow-500 dark:text-yellow-400' : 'text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400'}`}
                              onClick={() => {
                                setStarredMaterials(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(material.id)) {
                                    newSet.delete(material.id);
                                  } else {
                                    newSet.add(material.id);
                                  }
                                  return newSet;
                                });
                              }}
                              title={starredMaterials.has(material.id) ? 'Unstar' : 'Star'}
                            >
                              {starredMaterials.has(material.id) ? (
                                <StarIcon className="h-4 w-4 fill-yellow-500 text-yellow-500 dark:fill-yellow-400 dark:text-yellow-400" />
                              ) : (
                                <Star className="h-4 w-4" />
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteMaterial(material.id)}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </motion.button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                {material.file_url && (
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                              className="flex items-center hover:text-red-500 transition-colors"
                  >
                              <FileText className="h-4 w-4 mr-1" />
                              View File
                  </a>
                )}
                {material.due_date && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(material.due_date).toLocaleDateString()}
                  </div>
                )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
            </div>

        {/* Create Folder Modal */}
      <AnimatePresence>
          {isCreatingFolder && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsCreatingFolder(false);
                }
              }}
            >
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
                  className="fixed inset-0 transition-opacity"
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
                </motion.div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative"
                >
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      onClick={() => setIsCreatingFolder(false)}
                      className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <span className="sr-only">Close</span>
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                          Create New Folder
                        </h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateFolder(); }} className="mt-4 space-y-4">
                          <div>
                            <label htmlFor="folder_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Folder Name
                            </label>
                            <input
                              type="text"
                              id="folder_name"
                              value={newFolder.name}
                              onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="folder_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Description (optional)
                            </label>
                            <textarea
                              id="folder_description"
                              value={newFolder.description}
                              onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                              rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                          </div>
                          <div>
                            <label htmlFor="parent_folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Parent Folder (optional)
                            </label>
                            <select
                              id="parent_folder"
                              value={newFolder.parent_folder_id || ''}
                              onChange={(e) => setNewFolder({ ...newFolder, parent_folder_id: e.target.value || null })}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="">None (Root Level)</option>
                              {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                              Create Folder
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCreatingFolder(false)}
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Material Modal */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-y-auto"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsCreating(false);
                }
              }}
            >
              <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 transition-opacity"
                  aria-hidden="true"
                >
                  <div className="absolute inset-0 bg-gray-500 dark:bg-gray-900 opacity-75"></div>
                </motion.div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative"
                >
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <span className="sr-only">Close</span>
                      <X className="h-6 w-6" />
                </button>
              </div>
                  <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                          Add New Material
                        </h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="mt-4 space-y-4">
                <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Title
                  </label>
                  <input
                    type="text"
                              id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              required
                  />
                </div>
                <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                              id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              required
          />
        </div>
            <div>
                            <label htmlFor="file_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              File URL (optional)
              </label>
              <input
                              type="url"
                              id="file_url"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
                            <label htmlFor="file_upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Upload File (optional)
              </label>
              <input
                              type="file"
                              id="file_upload"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.rar,.txt"
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                              onChange={async (e) => {
                                if (!e.target.files?.length) return;
                                setUploadingFile(true);
                                const file = e.target.files[0];
                                const fileExt = file.name.split('.').pop();
                                const fileName = `materials/${user?.id || 'anon'}-${Date.now()}.${fileExt}`;
                                const { data: uploadData, error: uploadError } = await supabase.storage
                                  .from('subject-materials')
                                  .upload(fileName, file);
                                setUploadingFile(false);
                                if (uploadError) {
                                  alert('Failed to upload file: ' + uploadError.message);
                                  return;
                                }
                                const publicUrl = supabase.storage.from('subject-materials').getPublicUrl(fileName).data.publicUrl;
                                setFormData((prev) => ({ ...prev, file_url: publicUrl }));
                                setUploadedFileName(file.name);
                              }}
                              disabled={uploadingFile}
              />
              {uploadingFile && <span className="text-xs text-gray-500 ml-2">Uploading...</span>}
              {uploadedFileName && <span className="text-xs text-green-600 ml-2">Uploaded: {uploadedFileName}</span>}
            </div>
            <div>
                            <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Due Date (optional)
              </label>
              <input
                              type="datetime-local"
                              id="due_date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
                          <div>
                            <label htmlFor="folder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Folder (optional)
                            </label>
                            <select
                              id="folder"
                              value={formData.folder_id || ''}
                              onChange={(e) => setFormData({ ...formData, folder_id: e.target.value || null })}
                              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                              <option value="">None (Root Level)</option>
                              {folders.map(folder => (
                                <option key={folder.id} value={folder.id}>
                                  {folder.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button
                              type="submit"
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                              Create Material
                            </button>
              <button
                              type="button"
                              onClick={() => setIsCreating(false)}
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancel
              </button>
                          </div>
                        </form>
                      </div>
                    </div>
                </div>
                </motion.div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </motion.div>
  );
}