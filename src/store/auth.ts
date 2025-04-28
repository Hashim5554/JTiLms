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
  user: null,
  profile: null,
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

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Error fetching user profile');
      }
      
      if (!profile) {
        // Create a profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: session.user.id,
              username: email.split('@')[0],
              email: email,
              role: 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select()
          .single();
          
        if (createError) {
          console.error('Create profile error:', createError);
          throw new Error('Error creating user profile');
        }
        
        set({ 
          user: newProfile, 
          profile: newProfile,
          loading: false, 
          error: null 
        });
      } else {
        set({ 
          user: profile, 
          profile: profile,
          loading: false, 
          error: null 
        });
      }
    } catch (error: any) {
      console.error('Sign in store error:', error);
      set({ error: error.message || 'Authentication failed', loading: false });
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