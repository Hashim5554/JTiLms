import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface SessionContextType {
  session: any;
  user: Profile | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({ session: null, user: null, loading: true });

export const useSession = () => useContext(SessionContext);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
          
          try {
            // Try to get the user's profile
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (!mounted) return;
            
            if (profileError) {
              console.log('SessionProvider: No profile found, using session user', profileError);
              // Create a basic profile from session user
              const basicProfile: Profile = {
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'User',
                role: 'student',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setUser(basicProfile);
            } else {
              console.log('SessionProvider: Found existing profile', profile);
              setUser(profile as Profile);
            }
          } catch (profileError) {
            console.error('SessionProvider: Error loading profile:', profileError);
            if (mounted) {
              // Create a basic profile from session user
              const basicProfile: Profile = {
                id: session.user.id,
                username: session.user.email?.split('@')[0] || 'User',
                role: 'student',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              setUser(basicProfile);
            }
          }
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
    }, 5000);

    loadSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('SessionProvider: auth state change', event, session);
      setSession(session);
      
      if (session?.user) {
        console.log('SessionProvider: auth state change user', session.user);
        
        // Add a small delay for OAuth redirects to ensure session is fully processed
        if (event === 'SIGNED_IN') {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (!mounted) return;
          
          if (profileError) {
            console.log('SessionProvider: No profile found on auth change, using session user', profileError);
            // Create a basic profile from session user
            const basicProfile: Profile = {
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'User',
              role: 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setUser(basicProfile);
          } else {
            console.log('SessionProvider: Found existing profile on auth change', profile);
            setUser(profile as Profile);
          }
        } catch (error) {
          console.error('SessionProvider: Error loading profile on auth change:', error);
          if (mounted) {
            // Create a basic profile from session user
            const basicProfile: Profile = {
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'User',
              role: 'student',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setUser(basicProfile);
          }
        }
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
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
    </SessionContext.Provider>
  );
}; 