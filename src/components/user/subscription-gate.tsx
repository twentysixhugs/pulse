'use client';

import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type SubscriptionGateProps = {
  isSubscribed: boolean;
  children: React.ReactNode;
};

export function SubscriptionGate({ isSubscribed, children }: SubscriptionGateProps) {
  if (isSubscribed) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <Card className="w-[420px] text-center">
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center justify-center gap-2">
            <ShieldAlert className="h-8 w-8 text-primary" />
            Доступ запрещен
          </CardTitle>
          <CardDescription>
            Ваша подписка неактивна.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            Чтобы получить доступ к TeleTrader Hub, убедитесь, что у вас есть активная подписка и вы являетесь участником нашего частного Telegram-канала.
          </p>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="https://t.me/fashopet983jrt292rk01jf9h3f8j" target="_blank" rel="noopener noreferrer">
              Присоединиться к Telegram-каналу
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
