import { promises as fs } from 'node:fs';
import path from 'node:path';

export type ChannelEntry = {
  id: string;
  title: string;
  inviteLink?: string;
  description?: string;
  fileId?: string;
  updatedAt?: number;
};

const STORE_PATH = path.join(process.cwd(), '.channels.json');

type ChannelStore = {
  channels: ChannelEntry[];
};

let cachedStore: ChannelStore | null = null;

function trimToOptional(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeChannelEntry(raw: any): ChannelEntry | null {
  if (!raw || typeof raw !== 'object') return null;

  const value = raw as {
    id?: unknown;
    title?: unknown;
    inviteLink?: unknown;
    description?: unknown;
    fileId?: unknown;
    updatedAt?: unknown;
  };

  let id: string | null = null;
  if (typeof value.id === 'string') {
    id = value.id.trim();
  } else if (typeof value.id === 'number' && Number.isFinite(value.id)) {
    id = String(value.id);
  }
  if (!id) return null;

  const entry: ChannelEntry = {
    id,
    title: trimToOptional(value.title) ?? id,
  };

  const inviteLink = trimToOptional(value.inviteLink);
  if (inviteLink) entry.inviteLink = inviteLink;

  const description = trimToOptional(value.description);
  if (description) entry.description = description;

  const fileId = trimToOptional(value.fileId);
  if (fileId) entry.fileId = fileId;

  const updatedAt =
    typeof value.updatedAt === 'number' && Number.isFinite(value.updatedAt)
      ? value.updatedAt
      : undefined;
  if (updatedAt) entry.updatedAt = updatedAt;

  return entry;
}

function sanitizeStore(raw: unknown): ChannelStore {
  if (raw == null) return { channels: [] };

  const source = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as any).channels)
      ? (raw as any).channels
      : [];

  const channels = source
    .map((entry) => sanitizeChannelEntry(entry))
    .filter((entry): entry is ChannelEntry => entry !== null);

  return { channels };
}

function normalizeChannelInput(entry: ChannelEntry): ChannelEntry {
  const sanitized = sanitizeChannelEntry(entry);
  if (!sanitized) {
    throw new Error('Invalid channel entry');
  }
  return sanitized;
}

async function readStore(): Promise<ChannelStore | null> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return sanitizeStore(JSON.parse(raw));
  } catch (err: any) {
    if (err?.code === 'ENOENT') return null;
    throw err;
  }
}

async function writeStore(store: ChannelStore): Promise<void> {
  const sanitized = sanitizeStore(store);
  await fs.writeFile(STORE_PATH, JSON.stringify(sanitized, null, 2), 'utf8');
}

export async function getChannelStore(): Promise<ChannelStore> {
  if (cachedStore) return cachedStore;
  const stored = await readStore();
  cachedStore = stored ?? { channels: [] };
  return cachedStore;
}

export async function getChannels(): Promise<ChannelEntry[]> {
  const store = await getChannelStore();
  return store.channels.slice();
}

export async function listChannels(): Promise<ChannelEntry[]> {
  const channels = await getChannels();
  return channels
    .slice()
    .sort(
      (a, b) =>
        (b.updatedAt ?? 0) - (a.updatedAt ?? 0) ||
        a.title.localeCompare(b.title),
    );
}

export async function addOrUpdateChannel(entry: ChannelEntry): Promise<void> {
  const store = await getChannelStore();
  const normalized = normalizeChannelInput(entry);
  const existingIndex = store.channels.findIndex(
    (ch) => ch.id === normalized.id,
  );
  const payload: ChannelEntry = {
    ...normalized,
    updatedAt: Date.now(),
  };
  if (existingIndex >= 0) {
    store.channels.splice(existingIndex, 1, payload);
  } else {
    store.channels.push(payload);
  }
  const nextStore = sanitizeStore(store.channels);
  cachedStore = nextStore;
  await writeStore(nextStore);
}

export async function removeChannel(channelId: string): Promise<boolean> {
  const store = await getChannelStore();
  const nextChannels = store.channels.filter((ch) => ch.id !== channelId);
  const changed = nextChannels.length !== store.channels.length;
  if (changed) {
    const nextStore = sanitizeStore(nextChannels);
    cachedStore = nextStore;
    await writeStore(nextStore);
  }
  return changed;
}

export async function clearChannels(): Promise<void> {
  cachedStore = { channels: [] };
  await writeStore(cachedStore);
}

export type ChannelMembershipCheck = {
  ok: ChannelEntry[];
  missing: ChannelEntry[];
  details: Record<
    string,
    {
      status?: string;
      isMember?: boolean;
      raw?: unknown;
      ok: boolean;
    }
  >;
};

export async function verifyUserChannels(
  botToken: string,
  userId: number,
): Promise<ChannelMembershipCheck> {
  const channels = await getChannels();
  const ok: ChannelEntry[] = [];
  const missing: ChannelEntry[] = [];
  const details: ChannelMembershipCheck['details'] = {};

  if (channels.length === 0) {
    return { ok, missing, details };
  }

  for (const channel of channels) {
    const url = new URL(
      `https://api.telegram.org/bot${botToken}/getChatMember`,
    );
    url.searchParams.set('chat_id', channel.id);
    url.searchParams.set('user_id', String(userId));

    let payload: any = null;
    try {
      const response = await fetch(url, { method: 'GET' });
      payload = await response.json();
    } catch (err) {
      details[channel.id] = { ok: false, raw: err };
      missing.push(channel);
      continue;
    }

    if (!payload?.ok) {
      details[channel.id] = { ok: false, raw: payload };
      missing.push(channel);
      continue;
    }

    const status: string | undefined = payload.result?.status;
    const isMember =
      status === 'creator' ||
      status === 'administrator' ||
      status === 'member' ||
      (status === 'restricted' && payload.result?.is_member === true);

    details[channel.id] = {
      ok: isMember,
      raw: payload,
      status,
      isMember,
    };

    if (isMember) {
      ok.push(channel);
    } else {
      missing.push(channel);
    }
  }

  return { ok, missing, details };
}

