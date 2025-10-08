

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext, AuthUser } from '@/hooks/use-auth';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, getFirestore, Firestore } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';
import { getUser, User } from '@/lib/firestore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const auth = getAuth(app);

  const fetchUserWithRole = useCallback(async (firebaseUser: FirebaseUser): Promise<{authUser: AuthUser, isBanned: boolean} | null> => {
    const userDoc = await getUser(firebaseUser.uid);
    if (userDoc) {
        return {
            authUser: {
                uid: firebaseUser.uid,
                role: userDoc.role,
                name: userDoc.name,
            },
            isBanned: userDoc.isBanned,
        };
    }
    return null;
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    setUser(null);
    router.push('/login');
  }, [auth, router]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const result = await fetchUserWithRole(firebaseUser);
        if (result) {
            if (result.isBanned) {
                await logout();
                return;
            }

            setUser(result.authUser);
            if (pathname === '/login') {
                if (result.authUser?.role === 'admin') router.push('/admin');
                else if (result.authUser?.role === 'trader') router.push('/trader');
                else router.push('/');
            }
        } else {
            // User exists in Auth but not in Firestore DB. This can happen if DB was cleared.
            await logout();
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, pathname, router, fetchUserWithRole, logout]);

  const login = async (credentials: any) => {
    const { email, password } = credentials;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const result = await fetchUserWithRole(userCredential.user);

    if (!result) {
        await logout(); // Sign out if no profile found
        throw new Error("Профиль пользователя не найден в базе данных.");
    }
    
    if (result.isBanned) {
        await logout(); // Sign out if banned
        throw new Error("Ваш аккаунт забанен.");
    }

    setUser(result.authUser);
    
    let targetPath = '/';
    if (result.authUser.role === 'admin') targetPath = '/admin';
    if (result.authUser.role === 'trader') targetPath = '/trader';
    router.push(targetPath);
  };


  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login' || pathname === '/seed';
    const isAdminRoute = pathname.startsWith('/admin');
    const isTraderRoute = pathname.startsWith('/trader/') || pathname === '/trader';

    if (!user && !isAuthPage) {
      router.push('/login');
    } else if (user) {
        if (isAdminRoute && user.role !== 'admin') {
            router.push('/');
        }
        if (isTraderRoute && user.role !== 'trader') {
            router.push('/');
        }
    }
    
  }, [user, loading, pathname, router]);

  const value = {
    user,
    loading,
    login,
    logout,
    db
  };
  
  const isAuthPage = pathname === '/login' || pathname === '/seed';
  if (loading && !isAuthPage) {
    return <div className="w-screen h-screen flex items-center justify-center bg-background">Загрузка...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
