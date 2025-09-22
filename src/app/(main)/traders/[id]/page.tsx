
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { TraderProfileView } from '@/components/user/trader-profile-view';
import {
  getTrader,
  getCategory,
  getAlertsByTrader,
  getUser,
  AlertPost,
  Report,
  Trader,
  User,
  Category,
  updateTraderReputation,
  getUserTraderReputation,
  createReport,
} from '@/lib/firestore';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { db } from '@/lib/firebase';

export default function TraderProfilePage() {
  const params = useParams();
  const { user: authUser } = useAuth();
  const traderId = params.id as string;

  const [trader, setTrader] = useState<Trader | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [userRepAction, setUserRepAction] = useState<'pos' | 'neg' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!traderId) return;
      setLoading(true);
      try {
        const [traderData, alertsData] = await Promise.all([
          getTrader(traderId),
          getAlertsByTrader(traderId),
        ]);
        
        if (traderData) {
          setTrader(traderData);
          if (traderData.category) {
            const categoryData = await getCategory(traderData.category);
            setCategory(categoryData);
          }
        } else {
          notFound();
          return;
        }
        setAlerts(alertsData);
        
      } catch (error) {
        console.error("Failed to fetch trader profile data:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [traderId]);

  useEffect(() => {
    async function fetchUserAndRep() {
        if(authUser && traderId) {
            const [userData, repAction] = await Promise.all([
                getUser(authUser.uid),
                getUserTraderReputation(authUser.uid, traderId)
            ]);
            setCurrentUser(userData);
            setUserRepAction(repAction);
        }
    }
    fetchUserAndRep();
  }, [authUser, traderId]);
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };

  const handleUpdateTraderRep = async (traderId: string, type: 'pos' | 'neg') => {
    if (!trader || !authUser) return;

    const newReputationAction = await updateTraderReputation(traderId, authUser.uid, type);
    setUserRepAction(newReputationAction);
    
    // For immediate feedback, we can refetch the trader or optimistically update
    const updatedTrader = await getTrader(traderId);
    if(updatedTrader) setTrader(updatedTrader);
  };
  
  const handleReport = async (newReport: Omit<Report, 'id' | 'status'>) => {
    await createReport(db, newReport);
    console.log("Жалоба отправлена:", newReport);
  };

  const sortedAlerts = alerts.sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к ленте
        </Link>
      </Button>
      {loading || !trader || !currentUser ? (
        <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <TraderProfileView
          trader={trader}
          category={category}
          alerts={sortedAlerts}
          currentUser={currentUser}
          userRepAction={userRepAction}
          onUpdateAlert={handleUpdateAlert}
          onUpdateTraderRep={handleUpdateTraderRep}
          onReport={handleReport}
        />
      )}
    </div>
  );
}
