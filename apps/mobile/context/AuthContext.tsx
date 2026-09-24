import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { MobilePushManager } from '../lib/push';

type Profile = {
  first_name: string;
  last_name: string;
  display_name: string | null;
  account_status: string;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchProfile = async (userId: string, retryCount = 0): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, account_status')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // PGRST303 indicates the device clock is slightly behind the auth server JWT iat timestamp.
        // Wait 1.5 seconds for the clock skew window to pass, then retry up to 2 times.
        if ((error.code === 'PGRST303' || error.message?.includes('JWT issued at future')) && retryCount < 2) {
          await sleep(1500);
          return fetchProfile(userId, retryCount + 1);
        }
        console.error('AuthContext: Failed to fetch profile', error);
      } else if (!data) {
        console.warn('AuthContext: Profile record not found for authenticated user.');
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error('AuthContext: Exception fetching profile', e);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          if (data.session?.user) {
            await fetchProfile(data.session.user.id);
          }
        }
      } catch (e) {
        console.error('AuthContext: Failed to get initial session', e);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      // Revoke push device token in the background so it doesn't block UI
      MobilePushManager.revokeOnSignOut().catch(() => {});
      
      // Attempt server signout (has a built-in timeout in the client)
      await supabase.auth.signOut();
    } catch (e) {
      console.error('AuthContext: Error signing out', e);
    } finally {
      // Guarantee local state clears instantly regardless of network
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };


  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
