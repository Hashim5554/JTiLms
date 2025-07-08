import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SessionContextType {
  session: any;
  user: any;
}

const SessionContext = createContext<SessionContextType>({ session: null, user: null });

export const useSession = () => useContext(SessionContext);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        console.log('SessionProvider: initial session user', session.user);
        
        // Try to get the user's profile - let the database trigger create it if it doesn't exist
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.log('SessionProvider: No profile found, profile will be created by database trigger', profileError);
          // Don't create profile here - let the database trigger handle it
          // Just use the session user for now
          setUser(session.user);
        } else {
          console.log('SessionProvider: Found existing profile', profile);
          setUser(profile);
        }
      } else {
        setUser(null);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('SessionProvider: auth state change', event, session);
      setSession(session);
      
      if (session?.user) {
        console.log('SessionProvider: auth state change user', session.user);
        
        // Try to get the user's profile - let the database trigger create it if it doesn't exist
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.log('SessionProvider: No profile found on auth change, profile will be created by database trigger', profileError);
          // Don't create profile here - let the database trigger handle it
          // Just use the session user for now
          setUser(session.user);
        } else {
          console.log('SessionProvider: Found existing profile on auth change', profile);
          setUser(profile);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, user }}>
      {children}
    </SessionContext.Provider>
  );
}; 