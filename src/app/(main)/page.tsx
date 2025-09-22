
'use client';

import { useState, useEffect } from 'react';
import { LegalModal } from '@/components/user/legal-modal';
import { SubscriptionGate } from '@/components/user/subscription-gate';
import { AlertCard } from '@/components/user/alert-card';
import { CategoryView } from '@/components/user/category-view';
import { RatingView } from '@/components/user/rating-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Flame, Layers, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertPost,
  Report,
  User,
  getAlerts,
  createReport,
  getUser,
} from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs, query, limit } from 'firebase/firestore';


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
    async function fetchData() {
        if (user) {
            setLoading(true);
            try {
              const [currentUserData, alertsData] = await Promise.all([
                  getUser(user.uid),
                  getAlerts(),
              ]);
              setCurrentUser(currentUserData);
              setAlerts(alertsData);
            } catch (error) {
                console.error("Failed to fetch page data:", error);
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные.'})
            } finally {
                setLoading(false);
            }
        }
    }
    fetchData();
  }, [user, toast]);


  const handleAgree = () => {
    localStorage.setItem('pulsescalp-legal-agreed', 'true');
    setHasAgreed(true);
  };
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };
  
  const handleReport = async (newReport: Omit<Report, 'id' | 'status'>) => {
    await createReport(newReport);
    // Don't need to optimistically add, admin panel will see it
    toast({
        title: 'Жалоба отправлена',
        description: 'Спасибо, мы рассмотрим вашу жалобу.',
    });
  };

  const activeAlerts = alerts.sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());

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
                {activeAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      currentUser={currentUser}
                      onUpdateAlert={handleUpdateAlert}
                      onReport={handleReport}
                    />
                  ))}
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
