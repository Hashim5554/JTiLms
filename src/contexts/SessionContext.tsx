import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface SessionContextType {
  session: any;
  user: Profile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({ 
  session: null, 
  user: null, 
  loading: true,
  refreshUser: async () => {}
});

export const useSession = () => useContext(SessionContext);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.log('SessionProvider: No profile found, user needs approval', profileError);
        // Don't create a profile here - let the database trigger handle it
        // Just set a basic user object to show pending status
        const pendingUser: Profile = {
          id: userId,
          email: session?.user?.email || '',
          username: session?.user?.email?.split('@')[0] || 'User',
          role: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(pendingUser);
      } else {
        console.log('SessionProvider: Found existing profile', profile);
        setUser(profile as Profile);
      }
    } catch (error) {
      console.error('SessionProvider: Error loading profile:', error);
      // Set pending user status
      const pendingUser: Profile = {
        id: userId,
        email: session?.user?.email || '',
        username: session?.user?.email?.split('@')[0] || 'User',
        role: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setUser(pendingUser);
    }
  };

  const refreshUser = async () => {
    if (session?.user) {
      console.log('SessionProvider: Refreshing user profile...');
      await loadUserProfile(session.user.id);
    }
  };

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;

    const loadSession = async () => {
      try {
        console.log('SessionProvider: Loading initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('SessionProvider: Error getting session:', error);
          setLoading(false);
          return;
        }

        setSession(session);
        
        if (session?.user) {
          console.log('SessionProvider: initial session user', session.user);
          await loadUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('SessionProvider: Error in loadSession:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set a timeout to prevent infinite loading
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.log('SessionProvider: Loading timeout reached, setting loading to false');
        setLoading(false);
      }
    }, 4000);

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('SessionProvider: auth state change', event, session);
      setSession(session);
      
      if (session?.user) {
        console.log('SessionProvider: auth state change user', session.user);
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, loading, refreshUser }}>
      {children}
    </SessionContext.Provider>
  );
}; 