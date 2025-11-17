
'use client';

import { createContext, useContext } from 'react';
import type { InitData } from '@telegram-apps/types';

export type AuthRole = 'user' | 'admin' | 'trader';

export type PaymentStatus = 'inactive' | 'active';

export type TelegramProfile = InitData['user'] | null;

export type AuthUser = {
  uid: string;
  roles: AuthRole[];
  paymentStatus: PaymentStatus;
  telegram: TelegramProfile;
  profile: Record<string, unknown>;
  name?: string;
  role?: AuthRole;
};

export type AuthErrorCode =
  | 'NO_INIT_DATA'
  | 'BACKEND_MISSING'
  | 'AUTH_FAILED'
  | 'AUTH_EXPIRED'
  | 'ROLE_FORBIDDEN'
  | 'BOT_UNAVAILABLE'
  | 'INVALID_SIGNATURE'
  | 'USER_MISSING'
  | 'NETWORK_ERROR'
  | 'USER_DOC_MISSING'
  | 'FIRESTORE_ERROR';

export type AuthError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  error: AuthError | null;
  expectedRole: AuthRole;
  hasRole: (role: AuthRole) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
