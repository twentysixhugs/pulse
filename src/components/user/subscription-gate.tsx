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
            Access Denied
          </CardTitle>
          <CardDescription>
            Your subscription is inactive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            To access TeleTrader Hub, please ensure you have an active subscription and are a member of our private Telegram channel.
          </p>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="https://t.me/fashopet983jrt292rk01jf9h3f8j" target="_blank" rel="noopener noreferrer">
              Join Telegram Channel
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
