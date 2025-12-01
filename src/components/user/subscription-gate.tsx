 'use client';

import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { AuthUser, ChannelSummary } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type SubscriptionGateProps = {
  isSubscribed: boolean;
  channelStatus?: AuthUser['channelStatus'] | null;
  channelListUpdated?: boolean;
  channelList?: ChannelSummary[] | null;
  children: React.ReactNode;
};

export function SubscriptionGate({
  isSubscribed,
  channelStatus,
  channelListUpdated,
  channelList,
  children,
}: SubscriptionGateProps) {
  const channelsOk = channelStatus?.ok !== false;
  const needsUpdate = channelListUpdated === true;
  const shouldBlock = needsUpdate || !isSubscribed || !channelsOk;

  if (!shouldBlock) {
    return <>{children}</>;
  }

  const missingChannels =
    channelStatus?.missingChannels ??
    (channelStatus?.missingChannelIds ?? []).map((id) => ({
      id,
      title: id,
      inviteLink: undefined as string | undefined,
    }));

  const allChannels: ChannelSummary[] =
    channelList && channelList.length > 0
      ? channelList
      : missingChannels.length > 0
        ? missingChannels
        : [];

  const descriptionLines: string[] = [];

  if (!isSubscribed) {
    descriptionLines.push(
      'Ваша подписка неактивна. Проверьте статус оплаты и повторите попытку.',
    );
  }

  if (needsUpdate) {
    descriptionLines.push(
      'Список обязательных каналов был обновлён. Подпишитесь на все каналы ниже и перезагрузите мини-приложение.',
    );
  }

  if (!channelsOk && !needsUpdate) {
    if (missingChannels.length > 0) {
      descriptionLines.push('Присоединитесь к обязательным каналам:');
    } else {
      descriptionLines.push(
        'Мы не смогли подтвердить подписку на требуемые каналы. Присоединитесь и перезагрузите мини-приложение.',
      );
    }
  }
  descriptionLines.push(
    'После подписки нажмите «Я подписался» в сообщении бота и перезагрузите мини-приложение.',
  );

  const inviteButtons = allChannels
    .filter((channel) => !!channel.inviteLink)
    .map((channel) => (
      <Button
        key={channel.id}
        asChild
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        <Link
          href={channel.inviteLink as string}
          target="_blank"
          rel="noopener noreferrer"
        >
          {channel.title}
        </Link>
      </Button>
    ));

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-[460px] text-center">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
            <ShieldAlert className="h-8 w-8 text-primary" />
            {needsUpdate ? 'Список каналов обновлён' : 'Доступ запрещён'}
          </CardTitle>
          <CardDescription className="space-y-3 text-muted-foreground">
            {descriptionLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            {allChannels.length > 0 && (
              <ul className="text-left text-sm space-y-1">
                {allChannels.map((channel) => (
                  <li key={channel.id} className="flex flex-col">
                    <span className="font-medium">{channel.title}</span>
                    {channel.inviteLink ? (
                      <span className="text-xs text-muted-foreground break-all">
                        {channel.inviteLink}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {inviteButtons.length > 0 ? inviteButtons : null}
          {inviteButtons.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Обратитесь к администратору для получения ссылок на каналы.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
