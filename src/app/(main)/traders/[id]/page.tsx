
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { TraderProfileView } from '@/components/user/trader-profile-view';
import {
  traders as initialTraders,
  categories as initialCategories,
  alerts as initialAlerts,
  users as initialUsers,
  AlertPost,
  Reputation,
  Report,
  Trader
} from '@/lib/data';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function TraderProfilePage() {
  const params = useParams();
  const [traders, setTraders] = useState(initialTraders);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [trader, setTrader] = useState<Trader | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const traderId = params.id as string;
    const foundTrader = initialTraders.find((t) => t.id === traderId);
    if (foundTrader) {
      setTrader(foundTrader);
    } else {
      notFound();
    }
    setLoading(false);
  }, [params.id]);
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };

  const handleUpdateTraderRep = (traderId: string, newRep: Reputation) => {
    setTraders(currentTraders => currentTraders.map(t => t.id === traderId ? { ...t, reputation: newRep } : t));
    if (trader && trader.id === traderId) {
      setTrader(prevTrader => prevTrader ? { ...prevTrader, reputation: newRep } : undefined);
    }
  };
  
  const handleReport = (newReport: Omit<Report, 'id' | 'status'>) => {
    // In a real app this would be a server action
    console.log("Жалоба отправлена:", newReport);
  };

  const category = trader ? initialCategories.find((c) => c.id === trader.category) : undefined;
  const traderAlerts = trader ? alerts
    .filter((a) => a.traderId === trader.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к ленте
        </Link>
      </Button>
      {loading || !trader ? (
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
          currentUser={initialUsers[0]}
          onUpdateAlert={handleUpdateAlert}
          onUpdateTraderRep={handleUpdateTraderRep}
          onReport={handleReport}
        />
      )}
    </div>
  );
}
