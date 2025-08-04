import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';
import { supabase, isNotFoundError } from '../lib/supabase';
import type { Subject, Class } from '../types';
import { 
  PlusCircle, 
  Trash2, 
  RefreshCw, 
  Loader2,
  Search,
  Book,
  Edit2,
  X,
  Check,
  ChevronRight,
  BookOpen,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  type: 'error' | 'success';
  text: string;
}

interface ContextType {
  currentClass: Class | null;
  classes: Class[];
}

export function Subjects() {
  const { user } = useSession();
  const { currentClass, classes } = useOutletContext<ContextType>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubject, setNewSubject] = useState({ name: '', description: '', image_url: '' });
  const [isMultiClassModalOpen, setIsMultiClassModalOpen] = useState(false);
  const [multiClassSubject, setMultiClassSubject] = useState({ name: '', description: '', image_url: '' });
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [multiClassLoading, setMultiClassLoading] = useState(false);
  const [allSubjects, setAllSubjects] = useState<{ name: string; class_count: number }[]>([]);
  const [loadingAllSubjects, setLoadingAllSubjects] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'ultra_admin';
  const isTeacher = user?.role === 'teacher';
  const canManageSubjects = isAdmin; // Only admins can manage subjects themselves
  const canManageContent = isAdmin || isTeacher; // Both admins and teachers can manage folders/materials

  useEffect(() => {
    if (currentClass) {
      loadSubjects();
    }
  }, [currentClass]);

  const loadSubjects = async () => {
    if (!currentClass) return;
    
    setLoading(true);
    setMessage(null);
    try {
      // Use direct query to get subjects for the current class
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_id', currentClass.id)
        .order('name');

      if (error) {
        if (isNotFoundError(error)) {
          setSubjects([]);
          return;
        }
        throw error;
      }

      setSubjects(data || []);
    } catch (error: any) {
      console.error('Error loading subjects:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load subjects. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subject?')) return;

    try {
      setDeleting(id);
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

      if (error) throw error;

      setSubjects(subjects.filter(subject => subject.id !== id));
      setMessage({
        type: 'success',
        text: 'Subject deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete subject. Please try again.'
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) {
      setMessage({
        type: 'error',
        text: 'No class selected. Please select a class first.'
      });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([{ ...newSubject, class_id: currentClass.id }])
        .select()
        .single();

      if (error) throw error;

      setSubjects([data, ...subjects]);
      setNewSubject({ name: '', description: '', image_url: '' });
      setIsCreateModalOpen(false);
      setMessage({
        type: 'success',
        text: 'Subject created successfully'
      });
    } catch (error: any) {
      console.error('Error creating subject:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create subject. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .update({
          name: editingSubject.name,
          description: editingSubject.description,
          image_url: editingSubject.image_url
        })
        .eq('id', editingSubject.id)
        .select()
        .single();

      if (error) throw error;

      setSubjects(subjects.map(s => s.id === data.id ? data : s));
      setEditingSubject(null);
      setIsEditModalOpen(false);
      setMessage({
        type: 'success',
        text: 'Subject updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating subject:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update subject. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMultiClassSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClasses.length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select at least one class.'
      });
      return;
    }

    setMultiClassLoading(true);
    setMessage(null);
    try {
      // Create subjects for all selected classes
      const subjectsToCreate = selectedClasses.map(classId => ({
        name: multiClassSubject.name,
        description: multiClassSubject.description,
        image_url: multiClassSubject.image_url,
        class_id: classId
      }));

      const { data, error } = await supabase
        .from('subjects')
        .insert(subjectsToCreate)
        .select();

      if (error) throw error;

      // Refresh subjects if current class is in selected classes
      if (currentClass && selectedClasses.includes(currentClass.id)) {
        await loadSubjects();
      }

      setMultiClassSubject({ name: '', description: '', image_url: '' });
      setSelectedClasses([]);
      setIsMultiClassModalOpen(false);
      setMessage({
        type: 'success',
        text: `Subject "${multiClassSubject.name}" created successfully in ${selectedClasses.length} class${selectedClasses.length > 1 ? 'es' : ''}`
      });
    } catch (error: any) {
      console.error('Error creating multi-class subject:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create subject. Please try again.'
      });
    } finally {
      setMultiClassLoading(false);
    }
  };

  const handleDeleteMultiClassSubject = async (subjectName: string) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}" from all classes?`)) return;

    setMultiClassLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('name', subjectName);

      if (error) throw error;

      // Refresh subjects if current class had this subject
      if (currentClass && subjects.some(s => s.name === subjectName)) {
        await loadSubjects();
      }

      setMessage({
        type: 'success',
        text: `Subject "${subjectName}" deleted successfully from all classes`
      });
    } catch (error: any) {
      console.error('Error deleting multi-class subject:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete subject. Please try again.'
      });
    } finally {
      setMultiClassLoading(false);
    }
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const selectAllClasses = () => {
    setSelectedClasses(classes.map(c => c.id));
  };

  const clearClassSelection = () => {
    setSelectedClasses([]);
  };

  const loadAllSubjects = async () => {
    setLoadingAllSubjects(true);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('name')
        .order('name');

      if (error) throw error;

      // Group by name and count occurrences
      const subjectCounts = data.reduce((acc: { [key: string]: number }, subject: { name: string }) => {
        acc[subject.name] = (acc[subject.name] || 0) + 1;
        return acc;
      }, {});

      const subjectsWithCounts = Object.entries(subjectCounts).map(([name, count]) => ({
        name,
        class_count: count
      }));

      setAllSubjects(subjectsWithCounts);
    } catch (error: any) {
      console.error('Error loading all subjects:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load subjects. Please try again.'
      });
    } finally {
      setLoadingAllSubjects(false);
    }
  };

  useEffect(() => {
    if (isMultiClassModalOpen) {
      loadAllSubjects();
    }
  }, [isMultiClassModalOpen]);

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subjects</h1>
        <div className="flex items-center space-x-4">
          {canManageSubjects && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsMultiClassModalOpen(false);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Subject
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                  setIsMultiClassModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                <Layers className="h-5 w-5 mr-2" />
                Multi-Class Subject
              </motion.button>
            </>
          )}
        </div>
      </motion.div>

      {/* No Class Selected Message */}
      {!currentClass && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                No Class Selected
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>Please select a class to view its subjects and materials.</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6"
      >
        <div className="relative">
          <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-gray-500 focus:ring-gray-500"
          />
        </div>
      </motion.div>

      {/* Subjects Grid */}
      {loading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center h-64"
        >
          <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-gray-400" />
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredSubjects.map((subject, index) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {subject.image_url ? (
                      <img
                        src={subject.image_url}
                        alt={subject.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Book className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {subject.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {subject.description}
                      </p>
                    </div>
                  </div>
                  {canManageSubjects && (
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          setIsMultiClassModalOpen(false);
                          setEditingSubject(subject);
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit2 className="h-5 w-5" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(subject.id)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        disabled={deleting === subject.id}
                      >
                        {deleting === subject.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </motion.button>
                    </div>
                  )}
                </div>
                <Link
                  to={`/subjects/${subject.id}`}
                  className="mt-4 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  View Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Subject Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={(e) => {
              // Close modal when clicking outside
              if (e.target === e.currentTarget) {
                setIsCreateModalOpen(false);
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
                    onClick={() => setIsCreateModalOpen(false)}
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
                        Create New Subject
                      </h3>
                      <form onSubmit={handleCreateSubject} className="mt-4 space-y-4">
            <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject Name
              </label>
              <input
                type="text"
                id="name"
                            value={newSubject.name}
                            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
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
                            value={newSubject.description}
                            onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
              />
            </div>
            <div>
                          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Image URL (optional)
                </label>
                          <input
                            type="url"
                            id="image_url"
                            value={newSubject.image_url}
                            onChange={(e) => setNewSubject({ ...newSubject, image_url: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Subject'
                            )}
                          </button>
                <button
                  type="button"
                            onClick={() => setIsCreateModalOpen(false)}
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

      {/* Edit Subject Modal */}
      <AnimatePresence>
        {isEditModalOpen && editingSubject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={(e) => {
              // Close modal when clicking outside
              if (e.target === e.currentTarget) {
                setIsEditModalOpen(false);
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
                    onClick={() => setIsEditModalOpen(false)}
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
                        Edit Subject
                      </h3>
                      <form onSubmit={handleUpdateSubject} className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="edit_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Subject Name
                          </label>
                          <input
                            type="text"
                            id="edit_name"
                            value={editingSubject.name}
                            onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="edit_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                          </label>
                          <textarea
                            id="edit_description"
                            value={editingSubject.description}
                            onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="edit_image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Image URL (optional)
                          </label>
                          <input
                            type="url"
                            id="edit_image_url"
                            value={editingSubject.image_url}
                            onChange={(e) => setEditingSubject({ ...editingSubject, image_url: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                            disabled={loading}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Update Subject'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditModalOpen(false)}
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

      {/* Multi-Class Subject Modal */}
      <AnimatePresence>
        {isMultiClassModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] overflow-y-auto"
            onClick={(e) => {
              // Close modal when clicking outside
              if (e.target === e.currentTarget) {
                setIsMultiClassModalOpen(false);
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
                className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-[70]"
              >
                <div className="absolute top-0 right-0 pt-4 pr-4">
                  <button
                    type="button"
                    onClick={() => setIsMultiClassModalOpen(false)}
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
                        Create Subject for Multiple Classes
                      </h3>
                      <form onSubmit={handleCreateMultiClassSubject} className="mt-4 space-y-4">
                        <div>
                          <label htmlFor="multi_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Subject Name
                          </label>
                          <input
                            type="text"
                            id="multi_name"
                            value={multiClassSubject.name}
                            onChange={(e) => setMultiClassSubject({ ...multiClassSubject, name: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="multi_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                          </label>
                          <textarea
                            id="multi_description"
                            value={multiClassSubject.description}
                            onChange={(e) => setMultiClassSubject({ ...multiClassSubject, description: e.target.value })}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="multi_image_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Image URL (optional)
                          </label>
                          <input
                            type="url"
                            id="multi_image_url"
                            value={multiClassSubject.image_url}
                            onChange={(e) => setMultiClassSubject({ ...multiClassSubject, image_url: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        
                        {/* Class Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Classes
                          </label>
                          <div className="flex gap-2 mb-3">
                            <button
                              type="button"
                              onClick={selectAllClasses}
                              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={clearClassSelection}
                              className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-gray-50 dark:bg-gray-700">
                            {classes.map((cls) => (
                              <label key={cls.id} className="flex items-center space-x-2 py-1">
                                <input
                                  type="checkbox"
                                  checked={selectedClasses.includes(cls.id)}
                                  onChange={() => toggleClassSelection(cls.id)}
                                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  Grade {cls.grade}-{cls.section}
                                </span>
                              </label>
                            ))}
                          </div>
                          {selectedClasses.length > 0 && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              Selected: {selectedClasses.length} class{selectedClasses.length > 1 ? 'es' : ''}
                            </p>
                          )}
                        </div>

                        {/* Existing Subjects Section */}
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
                          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                            Existing Subjects
                          </h4>
                          {loadingAllSubjects ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-gray-600 dark:text-gray-400" />
                            </div>
                          ) : allSubjects.length > 0 ? (
                            <div className="max-h-32 overflow-y-auto space-y-2">
                              {allSubjects.map((subject) => (
                                <div key={subject.name} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                  <div>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {subject.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                      ({subject.class_count} class{subject.class_count > 1 ? 'es' : ''})
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteMultiClassSubject(subject.name)}
                                    disabled={multiClassLoading}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                    title={`Delete "${subject.name}" from all classes`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                              No subjects found
                            </p>
                          )}
                        </div>

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                          <button
                            type="submit"
                            disabled={multiClassLoading || selectedClasses.length === 0}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {multiClassLoading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              `Create in ${selectedClasses.length} Class${selectedClasses.length !== 1 ? 'es' : ''}`
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsMultiClassModalOpen(false)}
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

      {/* Message Toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${
              message.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}
          >
            <div className="flex items-center">
              {message.type === 'success' ? (
                <Check className="h-5 w-5 mr-2" />
              ) : (
                <X className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}