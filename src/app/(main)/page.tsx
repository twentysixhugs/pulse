
'use client';

import { useState, useEffect } from 'react';
import { LegalModal } from '@/components/user/legal-modal';
import { SubscriptionGate } from '@/components/user/subscription-gate';
import { AlertCard } from '@/components/user/alert-card';
import { CategoryView } from '@/components/user/category-view';
import { RatingView } from '@/components/user/rating-view';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Flame, Layers, Database, AlertCircle } from 'lucide-react';
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
import { db } from '@/lib/firebase';
import { seedDatabase } from '@/lib/seed-db';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { collection, getDocs, query, limit } from 'firebase/firestore';


export default function HomePage() {
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDbEmpty, setIsDbEmpty] = useState<boolean | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
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
                const userCheckQuery = query(collection(db, 'users'), limit(1));
                const userCheckSnapshot = await getDocs(userCheckQuery);
                const dbIsEmpty = userCheckSnapshot.empty;
                setIsDbEmpty(dbIsEmpty);

                if (!dbIsEmpty) {
                  const [currentUserData, alertsData] = await Promise.all([
                      getUser(user.uid),
                      getAlerts(),
                  ]);
                  setCurrentUser(currentUserData);
                  setAlerts(alertsData);
                }
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
    await createReport(db, newReport);
    // Don't need to optimistically add, admin panel will see it
  };
  
  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      await seedDatabase(db);
      toast({
        title: "База данных заполнена",
        description: "База данных была заполнена исходными данными.",
      });
      setIsDbEmpty(false);
      window.location.reload(); 
    } catch (error) {
      console.error("Failed to seed database:", error);
      toast({
        variant: "destructive",
        title: "Ошибка заполнения",
        description: "Произошла ошибка при заполнении базы данных.",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const activeAlerts = alerts.sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());

  if (!isClient || loading) {
    return <div className="container mx-auto max-w-2xl py-8 space-y-4 px-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
    </div>;
  }
  
  if(isDbEmpty) {
    return (
      <div className="container mx-auto max-w-2xl py-8 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
           <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
           <h2 className="text-2xl font-bold mb-2">Данные не найдены</h2>
           <p className="text-muted-foreground mb-6">База данных пуста. Заполните ее, чтобы начать использовать приложение.</p>
          <Button
            onClick={handleSeed}
            disabled={isSeeding}
            variant="destructive"
            size="lg"
          >
            <Database className="h-5 w-5 mr-2" />
            {isSeeding ? "Заполнение..." : "Заполнить базу данных"}
          </Button>
        </div>
      </div>
    );
  }

  const isSubscribed = currentUser?.subscriptionStatus === 'active';

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <LegalModal isOpen={!hasAgreed} onAccept={handleAgree} />
      {hasAgreed && currentUser && (
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
