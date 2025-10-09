
'use client';

import { useState, useEffect } from 'react';
import { AlertCard } from '@/components/user/alert-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertPost,
  User,
  listenToAlerts,
} from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { PaginationControl } from '@/components/common/pagination-control';

const ALERTS_PER_PAGE = 20;

type AllAlertsViewProps = {
    currentUser: User;
}

export function AllAlertsView({ currentUser }: AllAlertsViewProps) {
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);

  useEffect(() => {
    setLoading(true);
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
  }, [toast, currentPage]);


  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    // This is read-only, so we don't expect updates from the card, but good to have
    setAlerts(currentAlerts => currentAlerts.map(a => a.id === updatedAlert.id ? updatedAlert : a));
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };
  
  const pageCount = Math.ceil(totalAlerts / ALERTS_PER_PAGE);

  return (
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
                    onReport={() => {}} // No reporting for traders
                    interactionsDisabled={true}
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
  );
}

