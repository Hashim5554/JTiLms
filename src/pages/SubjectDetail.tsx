import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { motion, AnimatePresence } from 'framer-motion';
import type { Subject, Class, SubjectMaterial } from '../types';
import { PlusCircle, Trash2, Link as LinkIcon, Image, Edit, Plus, BookOpen, Calendar, Clock, Users, FileText, Edit2, Loader2, X } from 'lucide-react';

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

export function SubjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [links, setLinks] = useState<SubjectLink[]>([]);
  const [materials, setMaterials] = useState<SubjectMaterial[]>([]);
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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    file_url: '',
    due_date: ''
  });

  useEffect(() => {
    loadSubject();
    loadLinks();
    loadMaterials();
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

  const loadMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('subject_materials')
        .select('*')
        .eq('subject_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials(data || []);
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

      const { error } = await supabase
        .from('subject_materials')
        .insert([{
          ...formData,
          subject_id: id
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Material created successfully' });
      setIsCreating(false);
      setFormData({
        title: '',
        description: '',
        file_url: '',
        due_date: ''
      });
      loadMaterials();
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
      loadMaterials();
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
        due_date: ''
      });
      loadMaterials();
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
      due_date: material.due_date || ''
    });
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{subject.name}</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">{subject.description}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Material
        </motion.button>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' 
                ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' 
                : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((material) => (
          <motion.div
            key={material.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{material.title}</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditing(material)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(material.id)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">{material.description}</p>
              <div className="space-y-2">
                {material.file_url && (
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    <span>View File</span>
                  </a>
                )}
                {material.due_date && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Due: {new Date(material.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(isCreating || isEditing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Material' : 'Add Material'}
                </h2>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(null);
                    setFormData({
                      title: '',
                      description: '',
                      file_url: '',
                      due_date: ''
                    });
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File URL
                  </label>
                  <input
                    type="text"
                    value={formData.file_url}
                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(null);
                      setFormData({
                        title: '',
                        description: '',
                        file_url: '',
                        due_date: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => isEditing ? handleUpdateMaterial(isEditing) : handleCreate()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    {isEditing ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}