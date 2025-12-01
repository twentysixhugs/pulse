'use client';

import { auth } from './firebase';

const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');

export type BotChannel = {
  id: string;
  title: string;
  inviteLink?: string;
  description?: string;
  fileId?: string;
  updatedAt?: number;
};

export type SaveBotChannelInput = {
  id: string;
  title: string;
  inviteLink?: string;
  description?: string;
  fileId?: string;
};

export class BackendRequestError extends Error {
  status?: number;
  payload?: unknown;
}

function ensureBackendUrl(): string {
  if (!backendBaseUrl) {
    throw new Error('BACKEND_URL_MISSING');
  }
  return backendBaseUrl;
}

async function getIdToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    const error = new BackendRequestError('AUTH_REQUIRED');
    error.status = 401;
    throw error;
  }
  return user.getIdToken();
}

async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getIdToken();
  const base = ensureBackendUrl();
  const headers = new Headers(init.headers ?? {});

  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody =
    init.body !== undefined &&
    init.body !== null &&
    !(init.body instanceof FormData) &&
    !(init.body instanceof Blob);

  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(`${base}${path}`, {
    cache: 'no-store',
    ...init,
    headers,
  });
}

async function parseJson<T>(response: Response): Promise<T> {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    // Ignore JSON parse errors; treat as null payload
  }

  if (!response.ok) {
    const error = new BackendRequestError(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}`,
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload as T;
}

export async function fetchBotChannels(): Promise<BotChannel[]> {
  const response = await authenticatedFetch('/admin/channels', { method: 'GET' });
  const data = await parseJson<{ ok: boolean; channels: BotChannel[] }>(response);
  return data.channels ?? [];
}

export async function saveBotChannel(input: SaveBotChannelInput): Promise<BotChannel> {
  const response = await authenticatedFetch('/admin/channels', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ ok: boolean; channel: BotChannel }>(response);
  return data.channel;
}

export async function deleteBotChannel(id: string): Promise<void> {
  const response = await authenticatedFetch(`/admin/channels/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  await parseJson<{ ok: boolean }>(response);
}

