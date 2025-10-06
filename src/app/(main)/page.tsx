
'use client';

import { useState, useEffect, useCallback } from 'react';
import { LegalModal } from '@/components/user/legal-modal';
import { SubscriptionGate } from '@/components/user/subscription-gate';
import { AlertCard } from '@/components/user/alert-card';
import { CategoryView } from '@/components/user/category-view';
import { RatingView } from '@/components/user/rating-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Flame, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertPost,
  Report,
  User,
  getUser,
  listenToAlerts,
} from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Unsubscribe } from 'firebase/firestore';

export default function HomePage() {
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    const agreed = localStorage.getItem('pulsescalp-legal-agreed') === 'true';
    setHasAgreed(agreed);
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    async function fetchInitialDataAndListen() {
      if (user) {
        setLoading(true);
        try {
          const userData = await getUser(user.uid);
          setCurrentUser(userData);

          unsubscribe = listenToAlerts((newAlerts) => {
            setAlerts(newAlerts);
            setLoading(false);
          }, (error) => {
            console.error("Failed to listen for alerts:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить алерты.' });
            setLoading(false);
          });

        } catch (error) {
          console.error("Failed to fetch initial user data:", error);
          toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные пользователя.' });
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    fetchInitialDataAndListen();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, toast]);


  const handleAgree = () => {
    localStorage.setItem('pulsescalp-legal-agreed', 'true');
    setHasAgreed(true);
  };
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };
  
  const handleReport = async (newReport: Omit<Report, 'id' | 'status'>) => {
    // This function would call a method to create a report in Firestore
    // For now, it just shows a toast.
    // await createReport(newReport); 
    toast({
        title: 'Жалоба отправлена',
        description: 'Спасибо, мы рассмотрим вашу жалобу.',
    });
  };

  if (!isClient || loading || !currentUser) {
    return <div className="container mx-auto max-w-2xl py-8 space-y-4 px-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
    </div>;
  }

  const isSubscribed = currentUser?.subscriptionStatus === 'active';
  
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <LegalModal isOpen={!hasAgreed} onAccept={handleAgree} />
      {hasAgreed && (
        <SubscriptionGate isSubscribed={isSubscribed}>
          <Tabs defaultValue="alerts" className="w-full">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="alerts" className="flex-1">
                <Flame className="h-4 w-4 mr-2" />
                Все алерты
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex-1">
                <Layers className="h-4 w-4 mr-2" />
                Категории
              </TabsTrigger>
              <TabsTrigger value="rating" className="flex-1">
                <BarChart className="h-4 w-4 mr-2" />
                Рейтинг
              </TabsTrigger>
            </TabsList>
            <TabsContent value="alerts" className="mt-6">
                <div className="space-y-4">
                    {alerts.length > 0 ? (
                      <>
                        {alerts.map((alert) => (
                            <AlertCard
                                key={alert.id}
                                alert={alert}
                                currentUser={currentUser}
                                onUpdateAlert={handleUpdateAlert}
                                onReport={handleReport}
                            />
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-16 border-dashed border-2 rounded-lg">
                          <p className="text-muted-foreground">Пока нет алертов.</p>
                      </div>
                    )}
                </div>
            </TabsContent>
            <TabsContent value="categories" className="mt-6">
              <CategoryView />
            </TabsContent>
            <TabsContent value="rating" className="mt-6">
              <RatingView />
            </TabsContent>
          </Tabs>
        </SubscriptionGate>
      )}
    </div>
  );
}
