
'use client';

import { useState, useEffect } from 'react';
import { User, users as initialUsers } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch the current user's data
    setCurrentUser(initialUsers[0]);
    setLoading(false);
  }, []);

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к ленте
        </Link>
      </Button>
      {loading || !currentUser ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border">
                <AvatarFallback className="text-3xl">
                  {currentUser.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-headline">{currentUser.name}</CardTitle>
                <CardDescription className="mt-1">@{currentUser.telegramId}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <h3 className="text-sm font-medium text-muted-foreground">Статус подписки</h3>
                 <Badge
                    variant={currentUser.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                    className={`mt-1 ${
                      currentUser.subscriptionStatus === 'active'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }`}
                  >
                    {currentUser.subscriptionStatus === 'active' ? 'Активна' : 'Неактивна'}
                  </Badge>
            </div>
             <div>
                <h3 className="text-sm font-medium text-muted-foreground">Статус аккаунта</h3>
                 <Badge variant={currentUser.isBanned ? 'destructive' : 'outline'} className="mt-1">
                    {currentUser.isBanned ? 'Забанен' : 'Активен'}
                  </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
