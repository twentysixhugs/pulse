let mockApplied = false;

const runtimeBrowserFlag = (process.env.NEXT_PUBLIC_RUNTIME_BROWSER ?? '').toLowerCase();
const isRuntimeBrowserEnabled = runtimeBrowserFlag === 'true' || runtimeBrowserFlag === '1';
const MOCK_ENDPOINT = '/api/dev/mock-init-data';
const DEV_LOG_PREFIX = '[dev] Telegram WebApp mock';

type MockInitDataResponse =
  | {
      ok: true;
      initData: string;
      initDataUnsafe: TelegramWebAppInitDataUnsafe & {
        auth_date: number;
        query_id: string;
        hash: string;
        expires_at?: number;
      };
      expiresAt: string;
      generatedAt: string;
    }
  | {
      ok: false;
      error: string;
    };

function shouldApplyMock(): boolean {
  if (mockApplied) return false;
  if (process.env.NODE_ENV !== 'development') return false;
  if (!isRuntimeBrowserEnabled) return false;
  if (typeof window === 'undefined') return false;

  const existingInitData = window.Telegram?.WebApp?.initData;
  if (existingInitData && existingInitData.length > 0) {
    mockApplied = true;
    return false;
  }
  return true;
}

async function fetchMockInitData(): Promise<MockInitDataResponse | null> {
  try {
    const response = await fetch(MOCK_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
    });

    const payload = (await response.json().catch(() => null)) as MockInitDataResponse | null;

    if (payload) {
      return payload;
    }

    if (!response.ok) {
      return {
        ok: false,
        error: `HTTP_${response.status}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function applyMockToWindow(payload: Extract<MockInitDataResponse, { ok: true }>): void {
  const mockWebApp: TelegramWebApp = {
    ...(window.Telegram?.WebApp ?? {}),
    initData: payload.initData,
    initDataUnsafe: {
      ...(window.Telegram?.WebApp?.initDataUnsafe ?? {}),
      ...payload.initDataUnsafe,
    },
    disableVerticalSwipes: window.Telegram?.WebApp?.disableVerticalSwipes ?? (() => undefined),
  };

  window.Telegram = window.Telegram ?? {};
  window.Telegram.WebApp = mockWebApp;

  if (mockWebApp.initData) {
    try {
      window.sessionStorage.setItem('tg:initData', mockWebApp.initData);
    } catch {
      // ignore quota errors or access failures
    }
  }

  console.info(`${DEV_LOG_PREFIX} enabled via NEXT_PUBLIC_RUNTIME_BROWSER`, {
    expiresAt: payload.expiresAt,
  });
}

export function setupTelegramMock(): void {
  if (!shouldApplyMock()) return;

  void (async () => {
    const payload = await fetchMockInitData();
    if (!payload || !payload.ok) {
      const reason = payload?.error ?? 'UNKNOWN_ERROR';
      console.warn(`${DEV_LOG_PREFIX} init data fetch failed.`, reason);
      return;
    }

    applyMockToWindow(payload);
    mockApplied = true;
  })();
}

