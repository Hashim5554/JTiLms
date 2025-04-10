import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import type { Subject } from '../types';
import { PlusCircle, Trash2 } from 'lucide-react';
import '../styles/cards.css';

export function Subjects() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const isAdmin = user?.role === 'ultra_admin' || user?.role === 'teacher';

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (data) setSubjects(data);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (!error) {
      setSubjects(subjects.filter(subject => subject.id !== id));
    }
  };

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-theme-text-primary dark:text-white">Subjects</h1>
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
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}