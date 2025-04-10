export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          role: 'ultra_admin' | 'admin' | 'student'
          photo_url: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          role?: 'ultra_admin' | 'admin' | 'student'
          photo_url?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          role?: 'ultra_admin' | 'admin' | 'student'
          photo_url?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Add other table definitions as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'ultra_admin' | 'admin' | 'student'
    }
  }
}