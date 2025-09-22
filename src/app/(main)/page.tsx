
'use client';

import { useState, useEffect } from 'react';
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
  Category,
  Trader,
  User,
  Report,
  getAlerts,
  getCategories,
  getTraders,
  getUsers,
  getReports,
  toggleAlertLike,
  toggleAlertDislike,
  addCommentToAlert,
  createReport,
} from '@/lib/firestore';


export default function HomePage() {
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const agreed = localStorage.getItem('pulsescalp-legal-agreed') === 'true';
    setHasAgreed(agreed);
    
    async function fetchData() {
        if (user) {
            try {
                const [usersData, alertsData, tradersData, categoriesData, reportsData] = await Promise.all([
                    getUsers(),
                    getAlerts(),
                    getTraders(),
                    getCategories(),
                    getReports(),
                ]);
                const foundUser = usersData.find(u => u.id === user.uid);
                setCurrentUser(foundUser);
                setAlerts(alertsData);
                setTraders(tradersData);
                setCategories(categoriesData);
                setReports(reportsData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
                // Optionally, set an error state to show a message to the user
            } finally {
                setLoading(false);
            }
        }
    }

    fetchData();
  }, [user]);

  const handleAgree = () => {
    localStorage.setItem('pulsescalp-legal-agreed', 'true');
    setHasAgreed(true);
  };
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };
  
  const handleReport = async (newReport: Omit<Report, 'id' | 'status'>) => {
    await createReport(newReport);
    // Optimistically add to local state or refetch
    setReports(currentReports => [...currentReports, { ...newReport, id: `temp-${Date.now()}`, status: 'pending' }]);
  };

  const activeTraders = traders.filter(t => t.status === 'active');
  const activeAlerts = alerts
    .filter(a => activeTraders.some(t => t.id === a.traderId))
    .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());


  if (!isClient || loading) {
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
                {activeAlerts.map((alert) => {
                  const trader = traders.find((t) => t.id === alert.traderId);
                  if (!trader) return null;
                  return (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      trader={trader}
                      currentUser={currentUser}
                      onUpdateAlert={handleUpdateAlert}
                      onReport={handleReport}
                    />
                  );
                })}
              </div>
            </TabsContent>
            <TabsContent value="categories" className="mt-6">
              <CategoryView categories={categories} traders={traders} />
            </TabsContent>
            <TabsContent value="rating" className="mt-6">
              <RatingView traders={traders} categories={categories} />
            </TabsContent>
          </Tabs>
        </SubscriptionGate>
      )}
    </div>
  );
}
