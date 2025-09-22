
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
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

// TODO: Replace with firestore data
import {
  AlertPost,
  Category,
  Trader,
  User,
  Report,
  alerts as initialAlerts,
  categories as initialCategories,
  traders as initialTraders,
  users as initialUsers,
  reports as initialReports,
} from '@/lib/data';


export default function HomePage() {
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [currentUser] = useState<User>(initialUsers[0]);
  const [alerts, setAlerts] = useState<AlertPost[]>(initialAlerts);
  const [traders, setTraders] = useState<Trader[]>(initialTraders);
  const [reports, setReports] = useState<Report[]>(initialReports);

  useEffect(() => {
    setIsClient(true);
    const agreed = localStorage.getItem('pulsescalp-legal-agreed') === 'true';
    setHasAgreed(agreed);
  }, []);

  const handleAgree = () => {
    localStorage.setItem('pulsescalp-legal-agreed', 'true');
    setHasAgreed(true);
  };
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };
  
  const handleReport = (newReport: Omit<Report, 'id' | 'status'>) => {
    const reportWithId: Report = {
      ...newReport,
      id: `report-${Date.now()}`,
      status: 'pending'
    };
    setReports(currentReports => [...currentReports, reportWithId]);
  };

  const activeTraders = traders.filter(t => t.status === 'active');
  const activeAlerts = alerts
    .filter(a => activeTraders.some(t => t.id === a.traderId))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());


  if (!isClient) {
    return <div className="container mx-auto max-w-2xl py-8 space-y-4 px-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
    </div>;
  }

  // TODO: currentUser.subscriptionStatus should come from firestore
  const isSubscribed = true;

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
              <CategoryView categories={initialCategories} traders={traders} />
            </TabsContent>
            <TabsContent value="rating" className="mt-6">
              <RatingView traders={traders} categories={initialCategories} />
            </TabsContent>
          </Tabs>
        </SubscriptionGate>
      )}
    </div>
  );
}
