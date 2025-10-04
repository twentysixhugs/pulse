'use client';

import { useState, useEffect, useCallback } from 'react';
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
  createReport,
  getAlertsCountByTrader,
} from '@/lib/firestore';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function TraderProfilePage() {
  const params = useParams();
  const { user: authUser } = useAuth();
  const traderId = params.id as string;

  const [trader, setTrader] = useState<Trader | undefined>(undefined);
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [userRepAction, setUserRepAction] = useState<'pos' | 'neg' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!traderId) return;
      setLoading(true);
      try {
        const traderData = await getTrader(traderId);
        
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
    async function fetchUser() {
        if(authUser) {
            const userData = await getUser(authUser.uid);
            setCurrentUser(userData);
        }
    }
    fetchUser();
  }, [authUser]);
  

  const handleReport = async (newReport: Omit<Report, 'id' | 'status'>) => {
    await createReport(newReport);
    console.log("Жалоба отправлена:", newReport);
  };

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
          currentUser={currentUser}
          userRepAction={userRepAction}
          onUpdateTraderRep={(trader, rep) => {
              setTrader(trader);
              setUserRepAction(rep);
          }}
          onReport={handleReport}
        />
      )}
    </div>
  );
}
