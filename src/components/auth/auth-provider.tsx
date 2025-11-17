

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  init,
  initData,
  miniApp,
  retrieveLaunchParams,
  retrieveRawInitData,
  isUnknownEnvError,
} from '@telegram-apps/sdk';
import { AuthContext, AuthUser, AuthRole, AuthError, TelegramProfile } from '@/hooks/use-auth';
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

const RAW_BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

const buildBackendUrl = (path: string) => `${RAW_BACKEND_URL ? `${RAW_BACKEND_URL}${path}` : path}`;

let hasLoggedLaunchParamsError = false;
let hasLoggedInitDataError = false;
let sdkInitialized = false;

function ensureSdkInit(): void {
  if (sdkInitialized) return;
  if (typeof window === 'undefined') return;
  try {
    init();
    initData.restore();
  } catch (error) {
    if (!isUnknownEnvError(error)) {
      console.warn('[auth] Telegram SDK init failed:', error);
    }
  }
  sdkInitialized = true;
}

function refreshInitData(): void {
  if (typeof window === 'undefined') return;
  try {
    initData.restore();
  } catch (error) {
    if (!isUnknownEnvError(error) && !hasLoggedInitDataError) {
      hasLoggedInitDataError = true;
      console.warn('[auth] Unable to refresh Telegram init data.', error);
    }
  }
}

function resolveRoleFromPath(pathname: string): AuthRole {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/trader')) return 'trader';
  return 'user';
}

function rememberInitData(raw: string): void {
  try {
    window.sessionStorage.setItem('tg:initData', raw);
  } catch {
    // ignore quota errors
  }
}

function extractInitData(): string | null {
  if (typeof window === 'undefined') return null;

  ensureSdkInit();
  refreshInitData();
  miniApp.ready.ifAvailable();

  try {
    const directRaw = retrieveRawInitData();
    if (directRaw && directRaw.length > 0) {
      rememberInitData(directRaw);
      return directRaw;
    }
  } catch (error) {
    if (!isUnknownEnvError(error) && !hasLoggedInitDataError) {
      hasLoggedInitDataError = true;
      console.warn('[auth] Failed to read raw init data.', error);
    }
  }

  const rawFromSignal = initData.raw();
  if (rawFromSignal && rawFromSignal.length > 0) {
    rememberInitData(rawFromSignal);
    return rawFromSignal;
  }

  try {
    const launchParams = retrieveLaunchParams(true);
    const rawFromLaunchParams =
      (launchParams as { tgWebAppData?: string | undefined }).tgWebAppData ??
      (launchParams as { initDataRaw?: string | undefined }).initDataRaw ??
      null;
    if (rawFromLaunchParams && rawFromLaunchParams.length > 0) {
      rememberInitData(rawFromLaunchParams);
      return rawFromLaunchParams;
    }
  } catch (error) {
    if (!isUnknownEnvError(error) && !hasLoggedLaunchParamsError) {
      hasLoggedLaunchParamsError = true;
      console.warn('[auth] Failed to retrieve Telegram launch params.', error);
    }
  }

  const params = new URLSearchParams(window.location.search);
  const paramInit = params.get('initData') ?? params.get('tg_init_data');
  if (paramInit && paramInit.length > 0) {
    rememberInitData(paramInit);
    return paramInit;
  }

  const sessionInit = window.sessionStorage.getItem('tg:initData');
  if (sessionInit && sessionInit.length > 0) return sessionInit;

  const fallback = process.env.NEXT_PUBLIC_TG_STATIC_INIT_DATA;
  if (fallback && fallback.length > 0) {
    rememberInitData(fallback);
    return fallback;
  }
  return null;
}

async function waitForInitData(maxAttempts = 50, delayMs = 300): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    refreshInitData();
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

type TelegramPayload = Partial<{
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  language_code: string;
  photo_url: string;
  allows_write_to_pm: boolean;
  is_premium: boolean;
  firstName: string;
  lastName: string;
  languageCode: string;
  photoUrl: string;
  allowsWriteToPm: boolean;
  isPremium: boolean;
}>;

function normalizeTelegramProfile(
  source: unknown,
  fallback: TelegramProfile = null,
): TelegramProfile {
  const payload = (source ?? undefined) as TelegramPayload | undefined;
  if (!payload) return fallback ?? null;

  const resolvedId = typeof payload.id === 'number' ? payload.id : fallback?.id;
  const resolvedFirstName =
    typeof payload.first_name === 'string'
      ? payload.first_name
      : typeof payload.firstName === 'string'
        ? payload.firstName
        : fallback?.first_name;

  if (typeof resolvedId !== 'number' || typeof resolvedFirstName !== 'string') {
    return fallback ?? null;
  }

  const resolveString = (
    primary?: unknown,
    secondary?: unknown,
    fallbackValue?: string,
  ) => {
    if (typeof primary === 'string') return primary;
    if (typeof secondary === 'string') return secondary;
    return fallbackValue;
  };

  const resolveBoolean = (
    primary?: unknown,
    secondary?: unknown,
    fallbackValue?: boolean,
  ) => {
    if (typeof primary === 'boolean') return primary;
    if (typeof secondary === 'boolean') return secondary;
    return fallbackValue;
  };

  return {
    id: resolvedId,
    first_name: resolvedFirstName,
    last_name: resolveString(payload.last_name, payload.lastName, fallback?.last_name),
    username: resolveString(payload.username, undefined, fallback?.username),
    language_code: resolveString(
      payload.language_code,
      payload.languageCode,
      fallback?.language_code,
    ),
    photo_url: resolveString(payload.photo_url, payload.photoUrl, fallback?.photo_url),
    allows_write_to_pm: resolveBoolean(
      payload.allows_write_to_pm,
      payload.allowsWriteToPm,
      fallback?.allows_write_to_pm,
    ),
    is_premium: resolveBoolean(
      payload.is_premium,
      payload.isPremium,
      fallback?.is_premium,
    ),
  };
}

// initData подгружается, запрос на бек уходит. Но бек разворачивает по INVALID_SIGNATURE
// деплой на vercel, там лежит env
// я хз нужно ли реранить скрипт, может вообще проблема в том что я не ранил
// посмотри какие данные уходят с фронта на бек и как бек их парсит
// cors ошибку на беке починил

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
          console.warn('[auth] initData not available; aborting auth request.');
          throw { code: 'NO_INIT_DATA', message: 'Telegram не передал данные авторизации.' } as AuthError;
        }
        const role = forcedRole ?? expectedRole;
        const backendUrl = buildBackendUrl('/auth/telegram');
        console.log('[auth] Sending Telegram auth request', { backendUrl, role });

        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: initDataRaw, botName: role }),
        }).catch((err) => {
          console.error('[auth] Network error:', err);
          throw {
            code: 'NETWORK_ERROR',
            message: `Не удалось связаться с сервером (${backendUrl}).`,
          } as AuthError;
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
        setUser((prev) => {
          const telegramProfile = normalizeTelegramProfile(
            payload.telegram,
            prev?.telegram ?? null,
          );

          if (prev) {
            return {
              ...prev,
              paymentStatus: payload.paymentStatus,
              roles: payloadRoles.length ? payloadRoles : prev.roles,
              telegram: telegramProfile,
              role: (payloadRoles[0] ?? prev.role) as AuthRole | undefined,
            };
          }

          return {
            uid: payload.uid,
            roles: payloadRoles,
            paymentStatus: payload.paymentStatus ?? 'inactive',
            telegram: telegramProfile,
            profile: {},
            name: undefined,
            role: (payloadRoles[0] ?? undefined) as AuthRole | undefined,
          };
        });
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
