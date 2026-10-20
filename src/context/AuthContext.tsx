import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User,
  testConnection
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isOnline: boolean;
  signInWithGoogle: () => Promise<User>;
  signInWithEmail: (email: string, pass: string) => Promise<User>;
  signUpWithEmail: (email: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Clear any obsolete mock session
    try {
      localStorage.removeItem('niaganova_user_session');
    } catch {
      // ignore
    }

    testConnection().then((connected) => {
      setIsOnline(connected);
    });

    // 100% Genuine Firebase Authentication listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Genuine Google Sign-In via Firebase Auth
  const signInWithGoogle = async (): Promise<User> => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      return res.user;
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('auth/unauthorized-domain')) {
        console.warn('Firebase domain authorization required:', typeof window !== 'undefined' ? window.location.hostname : '');
      } else {
        console.error('Google Sign-in error:', err);
      }
      throw err;
    }
  };

  // 2. Genuine Email & Password Login via Firebase Auth
  const signInWithEmail = async (email: string, pass: string): Promise<User> => {
    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  };

  // 3. Genuine Email & Password Registration via Firebase Auth
  const signUpWithEmail = async (email: string, pass: string): Promise<User> => {
    const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    return res.user;
  };

  // 4. Genuine Logout via Firebase Auth
  const logout = async () => {
    await firebaseSignOut(auth);
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
        logout
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
