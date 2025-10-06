
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext, AuthUser } from '@/hooks/use-auth';
import { ALL_DUMMY_USERS } from '@/lib/dummy-auth';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { doc, getDoc, getFirestore, Firestore } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on the client
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('authUser');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);


  const login = async (credentials: any) => {
    const { email, password } = credentials;
    const userToLogin = ALL_DUMMY_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (userToLogin) {
      const authUser: AuthUser = {
        uid: userToLogin.uid,
        role: userToLogin.role as 'user' | 'admin' | 'trader',
        name: userToLogin.name
      };
      setUser(authUser);
      localStorage.setItem('authUser', JSON.stringify(authUser));
      
      const role = authUser.role;
      let targetPath = '/';
      if (role === 'admin') targetPath = '/admin';
      if (role === 'trader') targetPath = '/trader';
      router.push(targetPath);

    } else {
      throw new Error('Invalid credentials');
    }
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('authUser');
    router.push('/login');
  };

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/seed';

    if (!user && !isAuthPage) {
      router.push('/login');
    }
    
  }, [user, loading, pathname, router]);

  const value = {
    user,
    loading,
    login,
    logout,
    db
  };
  
  if (loading && pathname !== '/login' && pathname !== '/seed') {
    return <div className="w-screen h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
