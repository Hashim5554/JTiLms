import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import type { Class } from '../types';

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
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadPage();
  }, [path, currentClass]);

  const loadPage = async () => {
    if (!path) return;
    
    const { data } = await supabase
      .from('custom_pages')
      .select('*')
      .eq('path', path)
      .single();
    
    if (data) {
      setPage(data);
      setEditContent(data.content || '');
    }
  };

  const handleSave = async () => {
    if (!page) return;

    const { error } = await supabase
      .from('custom_pages')
      .update({ content: editContent })
      .eq('id', page.id);

    if (!error) {
      setPage({ ...page, content: editContent });
      setIsEditing(false);
    }
  };

  if (!page) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
        {user?.role === 'ultra_admin' && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full h-64 p-4 border rounded-md"
          />
          <button
            onClick={handleSave}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Save Changes
          </button>
        </div>
      ) : (
        <div className="prose max-w-none">
          {page.content ? (
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
          ) : (
            <p className="text-gray-500">No content yet.</p>
          )}
        </div>
      )}
    </div>
  );
}