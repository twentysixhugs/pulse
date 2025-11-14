

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { miniApp, retrieveRawInitData, isUnknownEnvError } from '@telegram-apps/sdk';
import { AuthContext, AuthUser, AuthRole, AuthError } from '@/hooks/use-auth';
import { app, db } from '@/lib/firebase';
import {
  getAuth,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

const RAW_BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '')

const buildBackendUrl = (path: string) => `${RAW_BACKEND_URL ? `${RAW_BACKEND_URL}${path}` : path}`;

let hasLoggedLaunchParamsError = false;

function resolveRoleFromPath(pathname: string): AuthRole {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/trader')) return 'trader';
  return 'user';
}

function extractInitData(): string | null {
  if (typeof window === 'undefined') return null;

  miniApp.ready.ifAvailable();

  try {
    const initDataRaw = retrieveRawInitData();
    if (initDataRaw && initDataRaw.length > 0) {
      return initDataRaw;
    }
  } catch (error) {
    if (!isUnknownEnvError(error) && !hasLoggedLaunchParamsError) {
      hasLoggedLaunchParamsError = true;
      console.warn('[auth] Failed to retrieve Telegram init data via SDK.', error);
    }
  }

  const params = new URLSearchParams(window.location.search);
  const paramInit = params.get('initData') ?? params.get('tg_init_data');
  if (paramInit) {
    try {
      const decoded = decodeURIComponent(paramInit);
      if (decoded.length > 0) return decoded;
    } catch {
      if (paramInit.length > 0) {
        return paramInit;
      }
    }
  }

  const sessionInit = window.sessionStorage.getItem('tg:initData');
  if (sessionInit && sessionInit.length > 0) return sessionInit;

  const fallback = process.env.NEXT_PUBLIC_TG_STATIC_INIT_DATA;
  return fallback && fallback.length > 0 ? fallback : null;
}

async function waitForInitData(maxAttempts = 50, delayMs = 300): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const data = extractInitData();
    if (data) return data;
    if (attempt === Math.floor(maxAttempts / 2)) {
      console.warn('[auth] Still waiting for Telegram init data...');
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return extractInitData();
}

function mapBackendError(code: string): AuthError {
  switch (code) {
    case 'AUTH_EXPIRED':
      return { code: 'AUTH_EXPIRED', message: 'Сессия Telegram устарела. Повторите попытку.' };
    case 'ROLE_FORBIDDEN':
      return { code: 'ROLE_FORBIDDEN', message: 'Доступ к этой роли запрещён.' };
    case 'BOT_TOKEN_UNAVAILABLE':
      return { code: 'BOT_UNAVAILABLE', message: 'Сервис бота недоступен. Попробуйте позже.' };
    case 'INVALID_SIGNATURE':
      return { code: 'INVALID_SIGNATURE', message: 'Не удалось подтвердить данные Telegram.' };
    case 'USER_MISSING':
      return { code: 'USER_MISSING', message: 'Telegram не передал данные пользователя.' };
    default:
      return { code: 'AUTH_FAILED', message: 'Ошибка авторизации. Попробуйте позже.' };
  }
}

type Props = { children: React.ReactNode };

export function AuthProvider({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const expectedRole = useMemo(() => resolveRoleFromPath(pathname), [pathname]);
  const auth = useMemo(() => getAuth(app), []);

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const docUnsubRef = useRef<Unsubscribe | null>(null);
  const authUnsubRef = useRef<Unsubscribe | null>(null);
  const authenticatingRef = useRef(false);

  const cleanupDoc = useCallback(() => {
    if (docUnsubRef.current) {
      docUnsubRef.current();
      docUnsubRef.current = null;
    }
  }, []);

  const subscribeToUserDoc = useCallback(
    (uid: string, expected: AuthRole) => {
      cleanupDoc();
      docUnsubRef.current = onSnapshot(
        doc(db, 'users', uid),
        (snapshot) => {
          if (!snapshot.exists()) {
            setError({ code: 'USER_DOC_MISSING', message: 'Профиль пользователя не найден.' });
            setUser(null);
            return;
          }
          const data = snapshot.data() as Record<string, unknown>;
          const rolesArray = Array.isArray(data.roles)
            ? (data.roles as string[])
            : data.role
              ? [data.role as string]
              : [];
          const normalizedRoles = rolesArray.filter((r): r is AuthRole =>
            r === 'user' || r === 'admin' || r === 'trader',
          );
          if (expected && normalizedRoles.length > 0 && !normalizedRoles.includes(expected)) {
            setError({ code: 'ROLE_FORBIDDEN', message: 'Доступ к этой роли запрещён.' });
          } else {
            setError(null);
          }

          setUser((prev) => ({
            uid,
            roles: normalizedRoles,
            paymentStatus: (data.paymentStatus as any) ?? 'inactive',
            telegram: prev?.telegram ?? null,
            profile: data,
            name: (data.name as string) ?? prev?.name ?? undefined,
            role:
              normalizedRoles[0] ??
              ((typeof data.role === 'string' &&
                (data.role === 'user' || data.role === 'admin' || data.role === 'trader')
                  ? data.role
                  : undefined) as AuthRole | undefined),
          }));
        },
        (err) => {
          console.error('[auth] Firestore listener failed:', err);
          setError({ code: 'FIRESTORE_ERROR', message: 'Ошибка загрузки профиля.' });
        },
      );
    },
    [cleanupDoc],
  );

  const performAuth = useCallback(
    async (forcedRole?: AuthRole) => {
      if (authenticatingRef.current) return;
      authenticatingRef.current = true;
      setLoading(true);
      setError(null);
      try {
        const initDataRaw = await waitForInitData();
        if (!initDataRaw) {
          throw { code: 'NO_INIT_DATA', message: 'Telegram не передал данные авторизации.' } as AuthError;
        }
        const role = forcedRole ?? expectedRole;
        const response = await fetch(buildBackendUrl('/auth/telegram'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataRaw, botName: role }),
        }).catch((err) => {
          console.error('[auth] Network error:', err);
          throw { code: 'NETWORK_ERROR', message: JSON.stringify(error) } as AuthError;
        });

        const payload = await response.json().catch(() => ({ ok: false }));

        if (!response.ok || !payload?.ok) {
          const backendCode = payload?.error ?? 'AUTH_FAILED';
          throw mapBackendError(backendCode);
        }

        if (payload.customToken) {
          await signInWithCustomToken(auth, payload.customToken);
        }
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tg:initData', initDataRaw);
        }

        const payloadRoles = Array.isArray(payload.roles)
          ? (payload.roles as string[]).filter((r): r is AuthRole =>
              r === 'user' || r === 'admin' || r === 'trader',
            )
          : [];

        subscribeToUserDoc(payload.uid, role);
        setUser((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: payload.paymentStatus,
                roles: payloadRoles.length ? payloadRoles : prev.roles,
                telegram: {
                  id: payload.telegram?.id ?? null,
                  username: payload.telegram?.username ?? null,
                  firstName: payload.telegram?.firstName ?? null,
                  lastName: payload.telegram?.lastName ?? null,
                  languageCode: payload.telegram?.languageCode ?? null,
                  isPremium: payload.telegram?.isPremium ?? null,
                },
                role: (payloadRoles[0] ?? prev.role) as AuthRole | undefined,
              }
            : {
                uid: payload.uid,
                roles: payloadRoles,
                paymentStatus: payload.paymentStatus ?? 'inactive',
                telegram: {
                  id: payload.telegram?.id ?? null,
                  username: payload.telegram?.username ?? null,
                  firstName: payload.telegram?.firstName ?? null,
                  lastName: payload.telegram?.lastName ?? null,
                  languageCode: payload.telegram?.languageCode ?? null,
                  isPremium: payload.telegram?.isPremium ?? null,
                },
                profile: {},
                name: undefined,
                role: (payloadRoles[0] ?? undefined) as AuthRole | undefined,
              },
        );
      } catch (err) {
        const authError = (err as AuthError).code ? (err as AuthError) : { code: 'AUTH_FAILED', message: 'Ошибка авторизации.' };
        setError(authError as AuthError);
        await signOut(auth).catch(() => undefined);
        setUser(null);
      } finally {
        authenticatingRef.current = false;
        setLoading(false);
      }
    },
    [auth, expectedRole, subscribeToUserDoc],
  );

  const refresh = useCallback(async () => {
    await performAuth();
  }, [performAuth]);

  const handleLogout = useCallback(async () => {
    cleanupDoc();
    await signOut(auth).catch(() => undefined);
    setUser(null);
    setError(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('tg:initData');
    }
    miniApp.close.ifAvailable();
    router.push('/');
  }, [auth, cleanupDoc, router]);

  useEffect(() => {
    setLoading(true);
    performAuth();

    authUnsubRef.current = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        cleanupDoc();
        setUser(null);
      }
    });

    return () => {
      cleanupDoc();
      authUnsubRef.current?.();
    };
  }, [auth, cleanupDoc, performAuth, expectedRole]);

  const hasRole = useCallback(
    (role: AuthRole) => !!user?.roles?.includes(role),
    [user?.roles],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      expectedRole,
      hasRole,
      refresh,
      logout: handleLogout,
    }),
    [user, loading, error, expectedRole, hasRole, refresh, handleLogout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
