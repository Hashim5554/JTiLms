import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';

interface OtherContent {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export function Other() {
  const [contents, setContents] = useState<OtherContent[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadContents();
  }, []);

  async function loadContents() {
    const { data } = await supabase
      .from('other_content')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setContents(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const { data, error } = await supabase
      .from('other_content')
      .insert([{
        title: newTitle,
        content: newContent,
        created_by: user?.id
      }])
      .select();

    if (data) {
      setContents([data[0], ...contents]);
      setNewTitle('');
      setNewContent('');
    }
  }

  if (user?.role !== 'ultra_admin') {
    return <div>Access denied. Only ultra admins can view this page.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Other Content</h1>

      <div className="bg-white shadow sm:rounded-lg p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              id="content"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark transition-colors"
            >
              Add Content
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {contents.map((content) => (
            <li key={content.id} className="px-4 py-4">
              <h3 className="text-lg font-medium text-gray-900">{content.title}</h3>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap">{content.content}</p>
              <div className="mt-2 text-sm text-gray-500">
                Added on {new Date(content.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}