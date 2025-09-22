
'use client';

import { createContext, useContext } from 'react';

export type AuthUser = {
  uid: string;
  role: 'user' | 'admin' | 'trader';
  name: string;
};

export type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
