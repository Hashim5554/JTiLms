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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });

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

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert([newSubject])
        .returning('*');

      if (error) throw error;

      setSubjects(data || []);
      setNewSubject({ name: '', description: '' });
      setShowAddForm(false);
      setMessage({
        type: 'success',
        text: 'Subject added successfully'
      });
    } catch (error: any) {
      console.error('Error adding subject:', error);
      setMessage({
        type: 'error',
        text: 'Failed to add subject. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <h2>Subjects</h2>
          {isAdmin && (
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              Add Subject
            </button>
          )}
        </div>
        <div className="card-content">
          {loading ? (
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject) => (
                <div key={subject.id} className="card">
                  <div className="card-header">
                    <h3>{subject.name}</h3>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="btn btn-danger"
                        disabled={deleting === subject.id}
                      >
                        {deleting === subject.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="card-content">
                    <p>{subject.description}</p>
                    <Link
                      to={`/subjects/${subject.id}`}
                      className="btn btn-primary mt-4"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="card">
          <div className="card-header">
            <h2>Add New Subject</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="btn btn-danger"
            >
              Cancel
            </button>
          </div>
          <div className="card-content">
            <form onSubmit={handleAddSubject} className="form">
              <div className="form-group">
                <label htmlFor="name">Subject Name</label>
                <input
                  type="text"
                  id="name"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newSubject.description}
                  onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                Add Subject
              </button>
            </form>
          </div>
        </div>
      )}

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  );
}