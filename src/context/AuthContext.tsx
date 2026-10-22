import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppUser {
  id: string;
  uid: string; // backwards compatibility with existing components
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  modalAwal?: number;
  rawUser?: SupabaseUser;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isOnline: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<AppUser>;
  signUpWithEmail: (email: string, pass: string) => Promise<{ user: AppUser | null; needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSupabaseUser(sbUser: SupabaseUser): AppUser {
  return {
    id: sbUser.id,
    uid: sbUser.id,
    email: sbUser.email || null,
    displayName: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || (sbUser.email ? sbUser.email.split('@')[0] : 'Pengguna Toko'),
    photoURL: sbUser.user_metadata?.avatar_url || null,
    modalAwal: typeof sbUser.user_metadata?.modalAwal === 'number' ? sbUser.user_metadata.modalAwal : undefined,
    rawUser: sbUser,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check initial Supabase session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error fetching Supabase session:', error);
      }
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen to real-time auth state changes in Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Simple online ping
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. Supabase Google OAuth
  const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      console.error('Supabase Google Sign-in error:', error);
      throw error;
    }
  };

  // 2. Supabase Email & Password Sign In
  const signInWithEmail = async (email: string, pass: string): Promise<AppUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: pass,
    });
    if (error) {
      throw error;
    }
    if (!data.user) {
      throw new Error('Gagal mendapatkan data pengguna.');
    }
    const appU = mapSupabaseUser(data.user);
    setUser(appU);
    return appU;
  };

  // 3. Supabase Email & Password Sign Up
  const signUpWithEmail = async (
    email: string,
    pass: string
  ): Promise<{ user: AppUser | null; needsEmailConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: pass,
      options: {
        data: {
          full_name: email.trim().split('@')[0],
        },
      },
    });
    if (error) {
      throw error;
    }

    const appU = data.user ? mapSupabaseUser(data.user) : null;
    const needsEmailConfirmation = !data.session;
    if (appU && !needsEmailConfirmation) {
      setUser(appU);
    }
    return { user: appU, needsEmailConfirmation };
  };

  // 4. Supabase Logout
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOnline,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
