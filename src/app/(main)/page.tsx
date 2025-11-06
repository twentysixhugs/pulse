
'use client';

import { useState, useEffect } from 'react';
import { LegalModal } from '@/components/user/legal-modal';
import { SubscriptionGate } from '@/components/user/subscription-gate';
import { AlertCard } from '@/components/user/alert-card';
import { CategoryView } from '@/components/user/category-view';
import { RatingView } from '@/components/user/rating-view';
import { BarChart, Flame, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertPost,
  Report,
  User,
  createReport,
  getUser,
  listenToAlerts,
} from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { PaginationControl } from '@/components/common/pagination-control';
import { ResponsiveTabs } from '@/components/common/responsive-tabs';

const ALERTS_PER_PAGE = 20;

const tabTriggers = [
  { value: "alerts", label: "Все алерты", icon: Flame },
  { value: "categories", label: "Категории", icon: Layers },
  { value: "rating", label: "Рейтинг", icon: BarChart },
];


export default function HomePage() {
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);

  useEffect(() => {
    setIsClient(true);
    const agreed = localStorage.getItem('pulsescalp-legal-agreed') === 'true';
    setHasAgreed(agreed);
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getUser(user.uid)
      .then(setCurrentUser)
      .catch(error => {
        console.error("Failed to fetch initial user data:", error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные пользователя.' });
      });

    const unsubscribe = listenToAlerts(
      ({ alerts: newAlerts, totalCount }) => {
        setAlerts(newAlerts);
        setTotalAlerts(totalCount);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to listen for alerts:", error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить алерты.' });
        setLoading(false);
      },
      currentPage,
      ALERTS_PER_PAGE
    );

    return () => unsubscribe();
  }, [user, toast, currentPage]);


  const handleAgree = () => {
    localStorage.setItem('pulsescalp-legal-agreed', 'true');
    setHasAgreed(true);
  };
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };
  
  const handleReport = async (newReport: Omit<Report, 'id' | 'status' | 'createdAt'>) => {
    try {
        await createReport(newReport); 
        toast({
            title: 'Жалоба отправлена',
            description: 'Спасибо, мы рассмотрим вашу жалобу.',
        });
    } catch(e) {
        console.error("Failed to create report", e);
        toast({
            variant: 'destructive',
            title: 'Ошибка',
            description: 'Не удалось отправить жалобу.',
        });
    }
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };
  
  const pageCount = Math.ceil(totalAlerts / ALERTS_PER_PAGE);

  if (!isClient || !currentUser) {
    return <div className="container mx-auto max-w-2xl py-8 space-y-4 px-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
    </div>;
  }

  const isSubscribed = currentUser?.subscriptionStatus === 'active';

  const tabContents = [
    {
      value: "alerts",
      children: (
        <div className="space-y-4">
            {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-96 w-full" />
                  <Skeleton className="h-96 w-full" />
                </div>
            ) : alerts.length > 0 ? (
              <>
                {alerts.map((alert) => (
                    <AlertCard
                        key={alert.id}
                        alert={alert}
                        currentUser={currentUser}
                        onUpdateAlert={handleUpdateAlert}
                        onReport={handleReport}
                        interactionsDisabled={currentUser.roles?.includes('trader') ?? currentUser.role === 'trader'}
                    />
                ))}
                {pageCount > 1 && (
                    <PaginationControl
                        pageCount={pageCount}
                        currentPage={currentPage}
                        onPageChange={handlePageChange}
                    />
                )}
              </>
            ) : (
              <div className="text-center py-16 border-dashed border-2 rounded-lg">
                  <p className="text-muted-foreground">Пока нет алертов.</p>
              </div>
            )}
        </div>
      )
    },
    { value: "categories", children: <CategoryView /> },
    { value: "rating", children: <RatingView /> }
  ];
  
  return (
    <div className="container mx-auto max-w-3xl py-8 px-4">
      <LegalModal isOpen={!hasAgreed} onAccept={handleAgree} />
      {hasAgreed && (
        <SubscriptionGate isSubscribed={isSubscribed}>
           <ResponsiveTabs
            defaultValue="alerts"
            triggers={tabTriggers}
            contents={tabContents}
          />
        </SubscriptionGate>
      )}
    </div>
  );
}
