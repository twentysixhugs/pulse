
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthContext, AuthUser } from '@/hooks/use-auth';
import { DUMMY_USERS, DUMMY_TRADERS, DUMMY_ADMINS } from '@/lib/dummy-auth';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut, User as FirebaseUser, signInAnonymously } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      if (firebaseUser.isAnonymous) {
         // This is a dummy user for the login page
        setUser(null);
        setLoading(false);
        return;
      }
      
      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const authUser: AuthUser = {
          uid: firebaseUser.uid,
          role: userData.role || 'user',
          name: userData.name || 'Anonymous'
        };
        setUser(authUser);
      } else {
        // This case should ideally not happen if database is seeded correctly
         setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleUser);
    return () => unsubscribe();
  }, [handleUser]);

  const login = async (credentials: any) => {
    const { email, password } = credentials;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle setting the user
    } catch (error) {
        console.error("Login failed:", error);
        throw new Error("Invalid credentials");
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
      router.push('/login');
      return;
    }

    if (user) {
        if (isAuthPage) {
            router.push('/');
        } else {
            const rolePath = user.role;
            const currentArea = pathname.split('/')[1] || 'user';
            
            let expectedArea = 'main';
            if (rolePath === 'admin') expectedArea = 'admin';
            if (rolePath === 'trader') expectedArea = 'trader';
            if (rolePath === 'user') expectedArea = 'main';

            const actualArea = pathname === '/' ? 'main' : currentArea;

            if (expectedArea !== actualArea) {
                console.warn(`Redirecting user with role '${user.role}' from '${pathname}' to '/${expectedArea === 'main' ? '' : expectedArea}'.`);
                router.push(`/${expectedArea === 'main' ? '' : expectedArea}`);
            }
        }
    }
  }, [user, loading, pathname, router]);

  const value = {
    user,
    loading,
    login,
    logout,
  };
  
  if (loading) {
    return <div className="w-screen h-screen flex items-center justify-center bg-background">Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
