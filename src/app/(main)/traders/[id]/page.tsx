'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import { TraderProfileView } from '@/components/user/trader-profile-view';
import {
  traders as initialTraders,
  categories as initialCategories,
  alerts as initialAlerts,
  users as initialUsers,
  AlertPost,
  Reputation,
  Report,
} from '@/lib/data';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function TraderProfilePage({ params }: { params: { id: string } }) {
  const [traders, setTraders] = useState(initialTraders);
  const [alerts, setAlerts] = useState(initialAlerts);

  const trader = traders.find((t) => t.id === params.id);
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };

  const handleUpdateTraderRep = (traderId: string, newRep: Reputation) => {
    setTraders(currentTraders => currentTraders.map(t => t.id === traderId ? { ...t, reputation: newRep } : t));
  };
  
  const handleReport = (newReport: Omit<Report, 'id' | 'status'>) => {
    // In a real app this would be a server action
    console.log("Жалоба отправлена:", newReport);
  };

  if (!trader) {
    notFound();
  }

  const category = initialCategories.find((c) => c.id === trader.category);
  const traderAlerts = alerts
    .filter((a) => a.traderId === trader.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="container mx-auto max-w-3xl py-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Назад к ленте
        </Link>
      </Button>
      {trader ? (
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
      ) : (
        <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-64 w-full" />
        </div>
      )}
    </div>
  );
}
