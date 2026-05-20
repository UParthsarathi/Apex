'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '@/backend/supabase';
import { User, Session, createClient, SupabaseClient } from '@supabase/supabase-js';

const AuthContext = createContext<{
  user: User | null;
  session: Session | null;
  loading: boolean;
}>({
  user: null,
  session: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function initAuth() {
      let client: SupabaseClient | null = getSupabase();

      if (!client) {
        try {
          const res = await fetch('/api/supabase-config');
          if (res.ok) {
            const data = await res.json();
            if (data.supabaseUrl && data.supabaseAnonKey) {
              client = createClient(data.supabaseUrl, data.supabaseAnonKey);
            }
          }
        } catch (error) {
          console.error('Failed to load dynamic Supabase runtime config', error);
        }
      }

      if (!active) return;

      if (!client) {
        console.warn('Supabase client could not be initialized');
        setLoading(false);
        return;
      }

      try {
        const { data: { session: currentSession } } = await client.auth.getSession();
        if (active) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setLoading(false);
        }

        const authListener = client.auth.onAuthStateChange((_event, session) => {
          if (active) {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
          }
        });
        subscription = authListener.data.subscription;
      } catch (err) {
        console.error('Error in auth session logic', err);
        if (active) {
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      active = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
