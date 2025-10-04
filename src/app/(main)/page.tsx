'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Report,
  User,
  getAlerts,
  createReport,
  getUser,
  getAlertsCount,
  PaginatedAlertsResponse,
} from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

const ALERTS_PER_PAGE = 20;

export default function HomePage() {
  const { user } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [hasAgreed, setHasAgreed] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [alertsCache, setAlertsCache] = useState<Record<number, AlertPost[]>>({});
  const [lastDocIdCache, setLastDocIdCache] = useState<Record<number, string | null>>({ 0: null });
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const totalPages = Math.ceil(totalAlerts / ALERTS_PER_PAGE);

  useEffect(() => {
    setIsClient(true);
    const agreed = localStorage.getItem('pulsescalp-legal-agreed') === 'true';
    setHasAgreed(agreed);
  }, []);

  const fetchAlertsForPage = useCallback(async (page: number) => {
    if (alertsCache[page] || !user) return;
    
    setLoading(true);
    try {
      const startAfterDocId = lastDocIdCache[page - 1];

      const { alerts: newAlerts, lastVisibleId } = await getAlerts(startAfterDocId, ALERTS_PER_PAGE);
      
      setAlertsCache(prev => ({ ...prev, [page]: newAlerts }));
      if (lastVisibleId) {
        setLastDocIdCache(prev => ({ ...prev, [page]: lastVisibleId }));
      }
      
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить алерты.' });
    } finally {
      setLoading(false);
    }
  }, [user, alertsCache, lastDocIdCache, toast]);


  useEffect(() => {
    async function fetchInitialData() {
        if (user) {
            setLoading(true);
            try {
              const [currentUserData, initialAlertsResponse, count] = await Promise.all([
                  getUser(user.uid),
                  getAlerts(null, ALERTS_PER_PAGE),
                  getAlertsCount(),
              ]);

              setCurrentUser(currentUserData);
              setTotalAlerts(count);
              setAlertsCache({ 1: initialAlertsResponse.alerts });
              if (initialAlertsResponse.lastVisibleId) {
                setLastDocIdCache({ 1: initialAlertsResponse.lastVisibleId });
              }
            } catch (error) {
                console.error("Failed to fetch page data:", error);
                toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные.'})
            } finally {
                setLoading(false);
            }
        }
    }
    fetchInitialData();
  }, [user, toast]);
  
  useEffect(() => {
    if (currentPage > 1 && !alertsCache[currentPage]) {
      fetchAlertsForPage(currentPage);
    }
  }, [currentPage, alertsCache, fetchAlertsForPage]);


  const handleAgree = () => {
    localStorage.setItem('pulsescalp-legal-agreed', 'true');
    setHasAgreed(true);
  };
  
  const handleUpdateAlert = (updatedAlert: AlertPost) => {
    setAlertsCache(currentCache => {
      const newCache = { ...currentCache };
      for (const page in newCache) {
        newCache[page] = newCache[page].map(a => a.id === updatedAlert.id ? updatedAlert : a);
      }
      return newCache;
    });
  };
  
  const handleReport = async (newReport: Omit<Report, 'id' | 'status'>) => {
    await createReport(newReport);
    toast({
        title: 'Жалоба отправлена',
        description: 'Спасибо, мы рассмотрим вашу жалобу.',
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const currentAlerts = alertsCache[currentPage] || [];
  
  if (!isClient || (loading && !currentAlerts.length) || !currentUser) {
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
                    {loading && currentAlerts.length === 0 ? (
                        <>
                           <Skeleton className="h-96 w-full" />
                           <Skeleton className="h-96 w-full" />
                        </>
                    ) : currentAlerts.length > 0 ? (
                      <>
                        {currentAlerts.map((alert) => (
                            <AlertCard
                                key={alert.id}
                                alert={alert}
                                currentUser={currentUser}
                                onUpdateAlert={handleUpdateAlert}
                                onReport={handleReport}
                            />
                        ))}
                        {totalPages > 1 && (
                          <Pagination>
                            <PaginationContent>
                              <PaginationItem>
                                <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}/>
                              </PaginationItem>
                              {[...Array(totalPages)].map((_, i) => (
                                <PaginationItem key={i}>
                                  <PaginationLink onClick={() => handlePageChange(i + 1)} isActive={currentPage === i + 1} href="#">
                                    {i + 1}
                                  </PaginationLink>
                                </PaginationItem>
                              ))}
                              <PaginationItem>
                                <PaginationNext onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}/>
                              </PaginationItem>
                            </PaginationContent>
                          </Pagination>
                        )}
                      </>
                    ) : (
                        !loading && (
                            <div className="text-center py-16 border-dashed border-2 rounded-lg">
                                <p className="text-muted-foreground">Пока нет алертов.</p>
                            </div>
                        )
                    )}
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
