'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, PencilLine, RefreshCcw, Trash2, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  BackendRequestError,
  deleteBotChannel,
  fetchBotChannels,
  saveBotChannel,
  type BotChannel,
  type SaveBotChannelInput,
} from '@/lib/backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type ChannelFormState = {
  id: string;
  title: string;
  inviteLink: string;
  description: string;
  fileId: string;
};

const EMPTY_FORM: ChannelFormState = {
  id: '',
  title: '',
  inviteLink: '',
  description: '',
  fileId: '',
};

function resolveErrorMessage(error: unknown): string {
  if (error instanceof BackendRequestError) {
    const payload = (error.payload ?? undefined) as { error?: string; message?: string } | undefined;
    const code = payload?.error ?? error.message;
    switch (code) {
      case 'BACKEND_URL_MISSING':
        return 'Не задан адрес backend-сервера. Проверьте переменную NEXT_PUBLIC_BACKEND_URL.';
      case 'AUTH_REQUIRED':
      case 'AUTH_INVALID_TOKEN':
        return 'Не удалось подтвердить права администратора. Перезайдите в мини-приложение.';
      case 'INVALID_CHANNEL_ID':
        return 'Укажите корректный идентификатор канала (например, -1001234567890).';
      case 'INVALID_CHANNEL_TITLE':
        return 'Добавьте название канала.';
      case 'CHANNEL_NOT_FOUND':
        return 'Канал не найден. Возможно, он уже был удалён.';
      default:
        if (payload?.message) return payload.message;
        break;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Произошла неожиданная ошибка. Попробуйте ещё раз.';
}

function toFormState(channel: BotChannel): ChannelFormState {
  return {
    id: channel.id,
    title: channel.title ?? '',
    inviteLink: channel.inviteLink ?? '',
    description: channel.description ?? '',
    fileId: channel.fileId ?? '',
  };
}

export function BotManagement() {
  const { hasRole, loading: authLoading } = useAuth();
  const isAdmin = hasRole('admin');
  const { toast } = useToast();

  const [channels, setChannels] = useState<BotChannel[]>([]);
  const [form, setForm] = useState<ChannelFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadChannels = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await fetchBotChannels();
      setChannels(data);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Не удалось загрузить каналы',
        description: resolveErrorMessage(err),
      });
    } finally {
      setLoadingList(false);
      setHasLoadedOnce(true);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      void loadChannels();
    }
  }, [authLoading, isAdmin, loadChannels]);

  const isEditing = editingId !== null;

  const handleFormChange = useCallback((field: keyof ChannelFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, []);

  const handleEdit = useCallback((channel: BotChannel) => {
    setEditingId(channel.id);
    setForm(toFormState(channel));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const trimmedId = form.id.trim();
      const trimmedTitle = form.title.trim();

      if (!trimmedId || !trimmedTitle) {
        toast({
          variant: 'destructive',
          title: 'Заполните обязательные поля',
          description: 'ID канала и название обязательны.',
        });
        return;
      }

      const payload: SaveBotChannelInput = {
        id: trimmedId,
        title: trimmedTitle,
      };

      const trimmedInviteLink = form.inviteLink.trim();
      if (trimmedInviteLink) payload.inviteLink = trimmedInviteLink;

      const trimmedDescription = form.description.trim();
      if (trimmedDescription) payload.description = trimmedDescription;

      const trimmedFileId = form.fileId.trim();
      if (trimmedFileId) payload.fileId = trimmedFileId;

      setSubmitting(true);
      try {
        await saveBotChannel(payload);
        toast({
          title: isEditing ? 'Канал обновлён' : 'Канал добавлен',
          description: isEditing
            ? `Канал «${payload.title}» обновлён.`
            : `Добавлен новый канал «${payload.title}».`,
        });
        await loadChannels();
        resetForm();
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Не удалось сохранить канал',
          description: resolveErrorMessage(err),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [form, isEditing, loadChannels, resetForm, toast],
  );

  const handleDelete = useCallback(
    async (channel: BotChannel) => {
      const confirmed = window.confirm(
        `Удалить канал «${channel.title}»? Пользователи перестанут проверяться на подписку.`,
      );
      if (!confirmed) return;

      setDeletingId(channel.id);
      try {
        await deleteBotChannel(channel.id);
        toast({
          title: 'Канал удалён',
          description: `Канал «${channel.title}» удалён из списка проверки.`,
        });
        if (editingId === channel.id) {
          resetForm();
        }
        await loadChannels();
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Не удалось удалить канал',
          description: resolveErrorMessage(err),
        });
      } finally {
        setDeletingId(null);
      }
    },
    [editingId, loadChannels, resetForm, toast],
  );

  const formDisabled = submitting || deletingId !== null;

  const listContent = useMemo(() => {
    if (!hasLoadedOnce && loadingList) {
      return (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      );
    }

    if (!loadingList && channels.length === 0) {
      return (
        <p className="text-sm text-muted-foreground">
          Список каналов пуст. Добавьте хотя бы один канал, чтобы проверять подписку пользователей.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {channels.map((channel) => {
          const isDeleting = deletingId === channel.id;
          return (
            <div
              key={channel.id}
              className="flex flex-col gap-4 rounded-lg border border-border bg-card/40 p-4 md:flex-row md:items-start md:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{channel.title}</h3>
                  {channel.inviteLink ? (
                    <Badge variant="secondary">Есть ссылка</Badge>
                  ) : (
                    <Badge variant="outline">Без ссылки</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">ID:</span> {channel.id}
                </div>
                {channel.inviteLink ? (
                  <div className="text-sm">
                    <span className="font-medium text-muted-foreground">Ссылка:</span>{' '}
                    <a
                      href={channel.inviteLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-primary underline-offset-4 hover:underline"
                    >
                      {channel.inviteLink}
                    </a>
                  </div>
                ) : null}
                {channel.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {channel.description}
                  </p>
                ) : null}
                {channel.updatedAt ? (
                  <div className="text-xs text-muted-foreground">
                    Обновлено {new Date(channel.updatedAt).toLocaleString()}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2 md:flex-col md:items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(channel)}
                  disabled={formDisabled}
                >
                  <PencilLine className="mr-2 h-4 w-4" />
                  Изменить
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(channel)}
                  disabled={isDeleting || submitting}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Удалить
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [channels, deletingId, handleDelete, handleEdit, hasLoadedOnce, loadingList, formDisabled, submitting]);

  if (authLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет доступа</CardTitle>
          <CardDescription>
            Только пользователи с ролью администратора могут управлять настройками бота.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Настройка каналов Telegram</CardTitle>
          <CardDescription>
            Эти каналы проверяются при входе в мини-приложение. Пользователь получает доступ только
            если подписан на все обязательные каналы.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="mb-4 flex items-center justify-between rounded-md bg-muted px-4 py-2 text-sm">
              <span>
                Редактирование канала <span className="font-medium">{editingId}</span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetForm}
                disabled={submitting}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Отменить
              </Button>
            </div>
          ) : null}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="channel-id">ID канала *</Label>
                <Input
                  id="channel-id"
                  placeholder="-1001234567890"
                  value={form.id}
                  onChange={(event) => handleFormChange('id', event.target.value)}
                  disabled={formDisabled || isEditing}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="channel-title">Название *</Label>
                <Input
                  id="channel-title"
                  placeholder="PulseScalp Premium"
                  value={form.title}
                  onChange={(event) => handleFormChange('title', event.target.value)}
                  disabled={formDisabled}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-invite">Пригласительная ссылка</Label>
              <Input
                id="channel-invite"
                placeholder="https://t.me/+AbCdEf123"
                value={form.inviteLink}
                onChange={(event) => handleFormChange('inviteLink', event.target.value)}
                disabled={formDisabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-description">Описание</Label>
              <Textarea
                id="channel-description"
                placeholder="Например: Основной канал сигналов"
                value={form.description}
                onChange={(event) => handleFormChange('description', event.target.value)}
                disabled={formDisabled}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-file">ID медиа из Telegram (опционально)</Label>
              <Input
                id="channel-file"
                placeholder="BQACAgIAAxk..."
                value={form.fileId}
                onChange={(event) => handleFormChange('fileId', event.target.value)}
                disabled={formDisabled}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isEditing ? 'Сохранить изменения' : 'Добавить канал'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void loadChannels()}
                disabled={loadingList || submitting}
              >
                {loadingList ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Обновить список
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Текущие каналы</CardTitle>
          <CardDescription>
            Перечень каналов, на которые должен быть подписан пользователь. Нажмите «Изменить», чтобы
            обновить данные, или удалите канал, если он больше не требуется.
          </CardDescription>
        </CardHeader>
        <CardContent>{listContent}</CardContent>
      </Card>
    </div>
  );
}

