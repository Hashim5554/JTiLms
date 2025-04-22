export type UserRole = 'ultra_admin' | 'admin' | 'student';

export interface Profile {
  id: string;
  username: string;
  role: UserRole;
  photo_url?: string;
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
  created_at: string;
  created_by: string;
  class_id: string | null;
  profiles?: {
    username: string;
  };
}

export interface DueWork {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  created_by: string;
  class_id: string;
  subject_id: string;
  creator?: {
    username: string;
  };
  subjects?: {
    name: string;
  };
}

export interface Class {
  id: string;
  grade: number;
  section: string;
  max_students: number;
  created_at: string;
  updated_at: string;
}

export interface ClassAssignment {
  id: string;
  user_id: string;
  class_id: string;
  created_at: string;
  updated_at: string;
}

export interface ClassStudent {
  user_id: string;
  username: string;
  photo_url: string | null;
}

export interface ContextType {
  currentClass: Class | null;
  classes: Class[];
}

export interface Discussion {
  id: string;
  content: string;
  created_by: string;
  class_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
  };
}

export interface LibraryResource {
  id: string;
  title: string;
  type: 'gallery' | 'counselling' | 'resource';
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AttainmentTarget {
  id: string;
  title: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}