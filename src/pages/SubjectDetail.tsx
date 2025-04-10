import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import type { Subject, Class } from '../types';
import { PlusCircle, Trash2, Link as LinkIcon, Image, Edit } from 'lucide-react';

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

export function SubjectDetail() {
  const { id } = useParams();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [links, setLinks] = useState<SubjectLink[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const { currentClass } = useOutletContext<ContextType>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin' || user?.role === 'ultra_admin';

  useEffect(() => {
    loadSubject();
    loadLinks();
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
      setIsEditing(false);
    }
  };

  const toggleImageInput = () => {
    setShowImageInput(!showImageInput);
  };

  if (!subject) return null;

  return (
    <div className="space-y-6">
      {isEditing ? (
        <div className="bg-white shadow sm:rounded-lg p-4 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Edit Subject</h2>
          <form onSubmit={handleUpdateSubject} className="space-y-4">
            <div>
              <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                Subject Name
              </label>
              <input
                type="text"
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Subject Image
                </label>
                <button
                  type="button"
                  onClick={toggleImageInput}
                  className="inline-flex items-center text-sm text-red-600 hover:text-red-700"
                >
                  <Image className="h-5 w-5 mr-1" />
                  {showImageInput ? 'Hide Image Input' : 'Add/Change Image'}
                </button>
              </div>
              
              {showImageInput && (
                <div className="mt-2">
                  <input
                    type="url"
                    value={editImageUrl}
                    onChange={(e) => setEditImageUrl(e.target.value)}
                    placeholder="Enter image URL"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter a URL for the subject image
                  </p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
            {isAdmin && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
            )}
          </div>
          {currentClass && (
            <div className="text-sm text-gray-500">
              Class {currentClass.grade}-{currentClass.section}
            </div>
          )}
        </div>
      )}

      {subject.image_url && (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <img 
            src={subject.image_url} 
            alt={subject.name} 
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      <p className="text-gray-600">{subject.description}</p>

      {isAdmin && (
        <div className="bg-white shadow sm:rounded-lg p-4">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Add Resource Link</h2>
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                URL
              </label>
              <input
                type="url"
                id="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Add Link
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Resource Links</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {links.map((link) => (
            <li key={link.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-3">
                  <LinkIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg font-medium text-red-600 hover:text-red-700"
                    >
                      {link.title}
                    </a>
                    <div className="mt-1 text-sm text-gray-500">
                      Added by {link.profiles?.username} on{' '}
                      {new Date(link.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </li>
          ))}
          {links.length === 0 && (
            <li className="p-4 text-center text-gray-500">
              No resource links yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}