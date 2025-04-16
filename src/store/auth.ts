import { create } from 'zustand';
import { supabase, signInWithEmail } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: Profile | null) => void;
  setProfile: (profile: Profile | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // For development, set a default ultra admin user
  user: {
    id: '00000000-0000-0000-0000-000000000000',
    username: 'ultraadmin',
    email: 'ultraadmin@lgs.edu.pk',
    role: 'ultra_admin' as const,
    photo_url: undefined,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  profile: {
    id: '00000000-0000-0000-0000-000000000000',
    username: 'ultraadmin',
    email: 'ultraadmin@lgs.edu.pk',
    role: 'ultra_admin' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  loading: false,
  error: null,
  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { session } = await signInWithEmail(email, password);
      
      if (!session?.user) {
        throw new Error('Invalid email or password');
      }

      // Get full profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Error fetching user profile');
      }

      set({ 
        user: profile, 
        profile: profile,
        loading: false, 
        error: null 
      });
    } catch (error: any) {
      console.error('Sign in store error:', error);
      set({ error: error.message, loading: false });
    }
  },
  signOut: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, profile: null, loading: false, error: null });
      localStorage.removeItem('selectedClassId');
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  clearError: () => set({ error: null }),
}));