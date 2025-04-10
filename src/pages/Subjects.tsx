import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase, isNotFoundError } from '../lib/supabase';
import type { Subject } from '../types';
import { PlusCircle, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import '../styles/cards.css';

interface Message {
  type: 'error' | 'success';
  text: string;
}

export function Subjects() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('name', { ascending: true });

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

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-theme-text-primary dark:text-white">Subjects</h1>
        <div className="flex gap-4">
          <button
            onClick={loadSubjects}
            className="button-secondary inline-flex items-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 mr-2" />
            )}
            Refresh
          </button>
          {isAdmin && (
            <Link
              to="/subjects/new"
              className="button-primary inline-flex items-center"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add Subject
            </Link>
          )}
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No subjects found.</p>
          {isAdmin && (
            <Link
              to="/subjects/new"
              className="mt-4 inline-flex items-center text-primary hover:text-primary-dark"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add your first subject
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="relative">
              <Link
                to={`/subjects/${subject.id}`}
                className="card block overflow-hidden"
              >
                {subject.image_url && (
                  <div className="h-40 overflow-hidden">
                    <img 
                      src={subject.image_url} 
                      alt={subject.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="card-title">{subject.name}</h3>
                  <p className="card-content">{subject.description}</p>
                </div>
              </Link>
              {isAdmin && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(subject.id);
                  }}
                  disabled={deleting === subject.id}
                  className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {deleting === subject.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Trash2 className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}