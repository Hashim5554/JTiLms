import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { PlusCircle, Trash2 } from 'lucide-react';

export function Customize() {
  const { user } = useAuthStore();
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [newPage, setNewPage] = useState({ title: '', path: '' });
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadCustomPages();
    loadClasses();
  }, []);

  const loadCustomPages = async () => {
    const { data } = await supabase
      .from('custom_pages')
      .select('*')
      .order('title');
    if (data) setCustomPages(data);
  };

  const loadClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('grade')
      .order('section');
    if (data) setClasses(data);
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
          class_id: selectedClass || null
        }])
        .select();

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else if (data) {
        setCustomPages([...customPages, data[0]]);
        setNewPage({ title: '', path: '' });
        setSelectedClass('');
        setMessage({ type: 'success', text: 'Page created successfully!' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id: string) => {
    const { error } = await supabase
      .from('custom_pages')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setCustomPages(customPages.filter(page => page.id !== id));
      setMessage({ type: 'success', text: 'Page deleted successfully!' });
    }
  };

  if (user?.role !== 'ultra_admin') {
    return <div>Access denied. Only ultra admins can customize the system.</div>;
  }

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <h2>Customize Page</h2>
        </div>
        <div className="card-content">
          <form onSubmit={handleCreatePage} className="form">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={newPage.title}
                onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="path">Path</label>
              <input
                type="text"
                id="path"
                value={newPage.path}
                onChange={(e) => setNewPage({ ...newPage, path: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="class">Class</label>
              <select
                id="class"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    Class {cls.grade}-{cls.section}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              Create Page
            </button>
          </form>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Pages</h3>
          <div className="divide-y divide-gray-200">
            {customPages.map((page) => (
              <div key={page.id} className="py-4 flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{page.title}</h4>
                  <p className="text-sm text-gray-500">Path: /custom/{page.path}</p>
                  {page.class_id && (
                    <p className="text-sm text-gray-500">
                      Class: {classes.find(c => c.id === page.class_id)?.grade}-
                      {classes.find(c => c.id === page.class_id)?.section}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeletePage(page.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}