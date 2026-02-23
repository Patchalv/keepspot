import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { identifyUser, resetUser } from '@/lib/analytics';
import * as Sentry from '@sentry/react-native';
import type { Session, User } from '@supabase/supabase-js';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        identifyUser(session.user.id);
        Sentry.setUser({ id: session.user.id, email: session.user.email });
      } else {
        resetUser();
        Sentry.setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const user: User | null = session?.user ?? null;

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
  };
}
