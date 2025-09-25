
'use client';

import { useState, useEffect } from 'react';
import { User, getUser, updateUserSubscription } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Minus, Plus, RefreshCcw } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUser() {
      if (authUser) {
        setLoading(true);
        const foundUser = await getUser(authUser.uid);
        setCurrentUser(foundUser);
        setLoading(false);
      }
    }
    fetchUser();
  }, [authUser]);

  const handleSubscriptionChange = async (days: number, isReset = false) => {
    if (!currentUser || !currentUser.subscriptionEndDate) return;
    
    let newEndDate;
    if (isReset) {
      newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() - 1); // Set to yesterday to make it 0 or less days
    } else {
      newEndDate = new Date(currentUser.subscriptionEndDate as string);
      newEndDate.setDate(newEndDate.getDate() + days);
    }

    try {
      await updateUserSubscription(currentUser.id, newEndDate);
      const updatedUser = await getUser(currentUser.id);
      setCurrentUser(updatedUser);
      toast({
        title: "Subscription Updated",
        description: `Subscription end date changed.`,
      });
    } catch (error) {
      console.error("Failed to update subscription", error);
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Could not update subscription date.",
      });
    }
  };


  const getSubscriptionInfo = () => {
    if (!currentUser || !currentUser.subscriptionEndDate) {
      return { daysLeft: 0, color: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Неактивна' };
    }

    const today = new Date();
    const endDate = new Date(currentUser.subscriptionEndDate as string);
    const daysLeft = differenceInDays(endDate, today);

    if (daysLeft < 0) {
      return { daysLeft: 0, color: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Просрочена' };
    }
    if (daysLeft < 5) {
      return { daysLeft, color: 'bg-red-500/20 text-red-400 border-red-500/30', text: `Осталось ${daysLeft} д.` };
    }
    if (daysLeft < 10) {
      return { daysLeft, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: `Осталось ${daysLeft} д.` };
    }
    return { daysLeft, color: 'bg-green-500/20 text-green-400 border-green-500/30', text: `Осталось ${daysLeft} д.` };
  };

  const subscriptionInfo = getSubscriptionInfo();


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
            <div>
              <CardTitle className="text-3xl font-headline">{currentUser.name}</CardTitle>
              <CardDescription className="mt-1">@{currentUser.telegramId}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
             <div>
                <h3 className="text-sm font-medium text-muted-foreground">Статус подписки</h3>
                 <Badge
                    variant={currentUser.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                    className={`mt-1 ${subscriptionInfo.color}`}
                  >
                    {currentUser.subscriptionStatus === 'active' ? subscriptionInfo.text : 'Неактивна'}
                  </Badge>
            </div>
            <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Изменить подписку (для теста)</h3>
                <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => handleSubscriptionChange(1)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                     <Button size="icon" variant="outline" onClick={() => handleSubscriptionChange(-1)}>
                        <Minus className="h-4 w-4" />
                    </Button>
                     <Button size="icon" variant="destructive" onClick={() => handleSubscriptionChange(0, true)}>
                        <RefreshCcw className="h-4 w-4" />
                    </Button>
                </div>
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
