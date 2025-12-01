import { NextResponse } from 'next/server';
import { createHmac, randomUUID } from 'node:crypto';
import ValidateTelegramWebAppData from '@nanhanglim/validate-telegram-webapp-data/dist/index.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ONE_DAY_SECONDS = 60 * 60 * 24;

type MockUserConfig = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  languageCode: string;
  isPremium: boolean;
  allowsWriteToPm: boolean;
};

type MockGenerationConfig = {
  user: MockUserConfig;
  chatType: string;
  chatInstance: string;
  signature: string;
};

type GeneratedInitData = {
  initData: string;
  initDataUnsafe: TelegramWebAppInitDataUnsafe & {
    auth_date: number;
    query_id: string;
    hash: string;
    expires_at: number;
  };
  generatedAt: string;
  expiresAt: string;
};

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveMockConfig():
  | { ok: true; config: MockGenerationConfig }
  | { ok: false; error: string; missing: string[] } {
  const missing: string[] = [];

  // e.g. '715242595'
  const rawUserId = readEnv('TELEGRAM_MOCK_USER_ID');
  // e.g. 'Alice'
  const rawFirstName = readEnv('TELEGRAM_MOCK_USER_FIRST_NAME');
  // e.g. 'Doe'
  const rawLastName = readEnv('TELEGRAM_MOCK_USER_LAST_NAME');
  // e.g. '@alice'
  const rawUsername = readEnv('TELEGRAM_MOCK_USER_USERNAME');
  // e.g. 'en'
  const rawLanguageCode = readEnv('TELEGRAM_MOCK_USER_LANGUAGE_CODE');
  // e.g. 'true'
  const rawIsPremium = readEnv('TELEGRAM_MOCK_USER_IS_PREMIUM');
  // e.g. 'true'
  const rawAllowsWrite = readEnv('TELEGRAM_MOCK_USER_ALLOWS_WRITE_TO_PM');
  // e.g. 'sender'
  const rawChatType = readEnv('TELEGRAM_MOCK_CHAT_TYPE');
  // e.g. '-3860123456789098765'
  const rawChatInstance = readEnv('TELEGRAM_MOCK_CHAT_INSTANCE');
  // e.g. 'mock_signature'
  const rawSignature = readEnv('TELEGRAM_MOCK_SIGNATURE');

  const requiredEntries: [string, string | null][] = [
    ['TELEGRAM_MOCK_USER_ID', rawUserId],
    ['TELEGRAM_MOCK_USER_FIRST_NAME', rawFirstName],
    ['TELEGRAM_MOCK_USER_LAST_NAME', rawLastName],
    ['TELEGRAM_MOCK_USER_USERNAME', rawUsername],
    ['TELEGRAM_MOCK_USER_LANGUAGE_CODE', rawLanguageCode],
    ['TELEGRAM_MOCK_USER_IS_PREMIUM', rawIsPremium],
    ['TELEGRAM_MOCK_USER_ALLOWS_WRITE_TO_PM', rawAllowsWrite],
    ['TELEGRAM_MOCK_CHAT_TYPE', rawChatType],
    ['TELEGRAM_MOCK_CHAT_INSTANCE', rawChatInstance],
    ['TELEGRAM_MOCK_SIGNATURE', rawSignature],
  ];

  for (const [name, value] of requiredEntries) {
    if (!value) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    return { ok: false, error: 'MISSING_MOCK_ENV', missing };
  }

  const parsedId = Number.parseInt(rawUserId!, 10);
  if (!Number.isFinite(parsedId)) {
    return { ok: false, error: 'INVALID_USER_ID', missing: [] };
  }

  const normalizeBool = (value: string) => {
    const normalized = value.toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  };

  const config: MockGenerationConfig = {
    user: {
      id: parsedId,
      firstName: rawFirstName!,
      lastName: rawLastName!,
      username: rawUsername!,
      languageCode: rawLanguageCode!,
      isPremium: normalizeBool(rawIsPremium!),
      allowsWriteToPm: normalizeBool(rawAllowsWrite!),
    },
    chatType: rawChatType!,
    chatInstance: rawChatInstance!,
    signature: rawSignature!,
  };

  return { ok: true, config };
}

function resolveBotToken(): string | null {
  const candidates = [
    process.env.TELEGRAM_WEBAPP_MOCK_BOT_TOKEN,
    process.env.NEXT_PUBLIC_TG_MOCK_BOT_TOKEN,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return null;
}

function buildDataCheckString(values: Record<string, string>): string {
  return Object.keys(values)
    .sort()
    .map((key) => `${key}=${values[key]}`)
    .join('\n');
}

function generateMockInitData(
  botToken: string,
  mockConfig: MockGenerationConfig,
): GeneratedInitData {
  const authDate = Math.floor(Date.now() / 1000);
  const queryId = `mock-${randomUUID()}`;

  const baseParams: Record<string, string> = {
    auth_date: String(authDate),
    chat_instance: mockConfig.chatInstance,
    chat_type: mockConfig.chatType,
    query_id: queryId,
    signature: mockConfig.signature,
    user: JSON.stringify({
      id: mockConfig.user.id,
      first_name: mockConfig.user.firstName,
      last_name: mockConfig.user.lastName,
      username: mockConfig.user.username,
      is_premium: mockConfig.user.isPremium,
      language_code: mockConfig.user.languageCode,
      allows_write_to_pm: mockConfig.user.allowsWriteToPm,
    }),
  };

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hash = createHmac('sha256', secretKey).update(buildDataCheckString(baseParams)).digest('hex');

  const expiresAtSeconds = authDate + ONE_DAY_SECONDS;
  const initDataUnsafe: GeneratedInitData['initDataUnsafe'] = {
    user: {
      id: mockConfig.user.id,
      first_name: mockConfig.user.firstName,
      last_name: mockConfig.user.lastName,
      username: mockConfig.user.username,
      is_premium: mockConfig.user.isPremium,
      language_code: mockConfig.user.languageCode,
      allows_write_to_pm: mockConfig.user.allowsWriteToPm,
    },
    chat_type: mockConfig.chatType,
    chat_instance: mockConfig.chatInstance,
    auth_date: authDate,
    query_id: queryId,
    hash,
    expires_at: expiresAtSeconds,
    signature: mockConfig.signature,
  };

  const params = new URLSearchParams({
    ...baseParams,
    hash,
  });

  return {
    initData: params.toString(),
    initDataUnsafe,
    generatedAt: new Date(authDate * 1000).toISOString(),
    expiresAt: new Date(expiresAtSeconds * 1000).toISOString(),
  };
}

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('[mock-init-data] Attempted access outside development environment.');
    return NextResponse.json({ ok: false, error: 'NOT_AVAILABLE' }, { status: 404 });
  }

  const botToken = resolveBotToken();
  if (!botToken) {
    console.error('[mock-init-data] Missing TELEGRAM_WEBAPP_MOCK_BOT_TOKEN environment variable.');
    return NextResponse.json(
      { ok: false, error: 'MISSING_BOT_TOKEN' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  const mockConfigResult = resolveMockConfig();
  if (!mockConfigResult.ok) {
    console.error('[mock-init-data] Missing or invalid mock configuration.', mockConfigResult);
    return NextResponse.json(
      { ok: false, error: mockConfigResult.error, missing: mockConfigResult.missing },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  const generated = generateMockInitData(botToken, mockConfigResult.config);

  const validator = new ValidateTelegramWebAppData(botToken);
  const validation = validator.ValidateData(generated.initData, ONE_DAY_SECONDS);
  if (!validation.isValid) {
    console.error('[mock-init-data] Generated initData failed validation.');
    return NextResponse.json(
      { ok: false, error: 'VALIDATION_FAILED' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }

  console.info('[mock-init-data] Generated new mock init data.', {
    generatedAt: generated.generatedAt,
    expiresAt: generated.expiresAt,
  });

  return NextResponse.json(
    {
      ok: true,
      ...generated,
      ttlSeconds: ONE_DAY_SECONDS,
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}


