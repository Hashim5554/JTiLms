import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { LibraryResource } from '../types';
import { useAuthStore } from '../store/auth';
import { PlusCircle, Trash2, Book } from 'lucide-react';
import '../styles/cards.css';

export function Library() {
  const [resources, setResources] = useState<LibraryResource[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<LibraryResource['type']>('resource');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';

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
          type: newType,
          created_by: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        setResources([data, ...resources]);
        setNewTitle('');
        setNewContent('');
        setMessage({ type: 'success', text: 'Resource added successfully!' });
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
      setMessage({ type: 'success', text: 'Resource deleted successfully!' });
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      setMessage({ type: 'error', text: error.message });
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="card p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-theme-text-secondary dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-theme-text-primary dark:text-white">Library</h1>
      </div>

      {message && (
        <div className={`card mb-4 ${
          message.type === 'error' ? 'bg-red-50 dark:bg-red-900/50' : 'bg-green-50 dark:bg-green-900/50'
        }`}>
          <p className={`${
            message.type === 'error' ? 'text-red-600 dark:text-red-200' : 'text-green-600 dark:text-green-200'
          }`}>
            {message.text}
          </p>
        </div>
      )}

      {isAdmin && (
        <div className="card mb-8">
          <h2 className="card-title">Add Resource</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Resource Title"
                className="input-primary w-full"
              />
            </div>
            <div>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as LibraryResource['type'])}
                className="input-primary w-full"
              >
                <option value="resource">Resource</option>
                <option value="gallery">Gallery</option>
                <option value="counselling">Counselling</option>
              </select>
            </div>
            <div>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Resource Content"
                rows={4}
                className="input-primary w-full resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newTitle.trim() || !newContent.trim()}
                className="button-primary"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Resource
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title flex items-center">
            <Book className="h-5 w-5 mr-2 text-red-600" />
            Resources
          </h2>
        </div>
        <div className="divide-y divide-theme-border-primary dark:divide-gray-700">
          {resources.map((resource) => (
            <div 
              key={resource.id} 
              className="p-6 hover:bg-theme-tertiary dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-3">
                  <h3 className="card-title">{resource.title}</h3>
                  <p className="card-content whitespace-pre-wrap">{resource.content}</p>
                  <div className="card-meta">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      {resource.type}
                    </span>
                    <span className="card-date ml-2">
                      Added on {new Date(resource.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                    aria-label="Delete resource"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {resources.length === 0 && (
            <div className="p-8 text-center">
              <Book className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-theme-text-secondary dark:text-gray-400">No resources yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}