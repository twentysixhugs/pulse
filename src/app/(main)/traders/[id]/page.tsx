
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { TraderProfileView } from '@/components/user/trader-profile-view';
import {
  getTraders,
  getCategories,
  getAlerts,
  getUsers,
  AlertPost,
  Reputation,
  Report,
  Trader,
  User,
  Category,
  updateTraderReputation,
  createReport,
} from '@/lib/firestore';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function TraderProfilePage() {
  const params = useParams();
  const { user: authUser } = useAuth();

  const [traders, setTraders] = useState<Trader[]>([]);
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  
  const [trader, setTrader] = useState<Trader | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  // Local state for user's reputation action on this specific trader
  const [userRepAction, setUserRepAction] = useState<'pos' | 'neg' | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const traderId = params.id as string;
        const [tradersData, alertsData, categoriesData, usersData] = await Promise.all([
          getTraders(),
          getAlerts(),
          getCategories(),
          getUsers(),
        ]);
        
        const foundTrader = tradersData.find((t) => t.id === traderId);
        if (foundTrader) {
          setTrader(foundTrader);
        } else {
          notFound();
        }

        setTraders(tradersData);
        setAlerts(alertsData);
        setCategories(categoriesData);

        if(authUser) {
            const foundUser = usersData.find(u => u.id === authUser.uid);
            setCurrentUser(foundUser);
        }
        
      } catch (error) {
        console.error("Failed to fetch trader profile data:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.id, authUser]);
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };

  const handleUpdateTraderRep = async (traderId: string, type: 'pos' | 'neg') => {
    if (!trader) return;

    await updateTraderReputation(traderId, type, userRepAction);
    
    // Optimistically update UI
    setTrader(prevTrader => {
        if (!prevTrader) return;
        const newRep = { ...prevTrader.reputation };
        
        if (userRepAction === type) { // Undoing
            type === 'pos' ? newRep.positive-- : newRep.negative--;
            setUserRepAction(null);
        } else if (userRepAction) { // Switching
            type === 'pos' ? (newRep.positive++, newRep.negative--) : (newRep.negative++, newRep.positive--);
            setUserRepAction(type);
        } else { // New action
            type === 'pos' ? newRep.positive++ : newRep.negative++;
            setUserRepAction(type);
        }
        return { ...prevTrader, reputation: newRep };
    });
  };
  
  const handleReport = async (newReport: Omit<Report, 'id' | 'status'>) => {
    await createReport(newReport);
    // No need to update local state, admin panel will see it
    console.log("Жалоба отправлена:", newReport);
  };

  const category = trader ? categories.find((c) => c.id === trader.category) : undefined;
  const traderAlerts = trader ? alerts
    .filter((a) => a.traderId === trader.id)
    .sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime()) : [];

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
          alerts={traderAlerts}
          allTraders={traders}
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
