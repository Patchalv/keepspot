import { useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
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
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Handle deep link URL callback for OAuth (Google Sign-In redirect)
    const handleUrl = async (url: string) => {
      const parsed = Linking.parse(url);
      const params = parsed.queryParams;
      if (!params) return;

      const accessToken = params['access_token'] as string | undefined;
      const refreshToken = params['refresh_token'] as string | undefined;

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      }
    };

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, []);

  const user: User | null = session?.user ?? null;

  return {
    session,
    user,
    isLoading,
    isAuthenticated: !!session,
  };
}
