// Add to existing types.ts
export interface Class {
  id: string;
  grade: number;
  section: string;
  created_at: string;
  updated_at: string;
}

export interface ClassAssignment {
  id: string;
  class_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export type UserRole = 'ultra_admin' | 'admin' | 'student';

export interface Profile {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_by: string;
  class_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
  };
}

export interface DueWork {
  id: string;
  title: string;
  description: string;
  due_date: string;
  subject_id: string;
  class_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  subjects?: {
    name: string;
  };
  profiles?: {
    username: string;
  };
}

export interface Discussion {
  id: string;
  content: string;
  created_by: string;
  class_id?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
  };
}

export interface LibraryResource {
  id: string;
  title: string;
  type: 'gallery' | 'counselling' | 'resource' | 'other';
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AttainmentTarget {
  id: string;
  title: string;
  description: string;
  class_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
  };
}