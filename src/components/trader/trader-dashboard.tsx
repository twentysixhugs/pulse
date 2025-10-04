'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trader,
  AlertPost,
  getTrader,
  getAlertsByTrader,
  createAlert,
  updateAlertText,
  deleteAlert,
  getAlertsCountByTrader,
} from '@/lib/firestore';
import { Card, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PostEditor } from './post-editor';
import { Button } from '../ui/button';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '../ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../ui/pagination';

const ALERTS_PER_PAGE = 20;

export function TraderDashboard() {
  const { user: authUser } = useAuth();
  const [currentTrader, setCurrentTrader] = useState<Trader | undefined>();
  const [alertsCache, setAlertsCache] = useState<Record<number, AlertPost[]>>({});
  const [lastDocIdCache, setLastDocIdCache] = useState<Record<number, string | null>>({ 1: null });
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<AlertPost | undefined>(undefined);
  
  const { toast } = useToast();
  const totalPages = Math.ceil(totalAlerts / ALERTS_PER_PAGE);


  const fetchAlertsForPage = useCallback(async (page: number, traderId: string) => {
    if (alertsCache[page]) return;
    
    setLoading(true);
    try {
      const startAfterDocId = lastDocIdCache[page - 1] === undefined && page > 1 ? alertsCache[page-1]?.[ALERTS_PER_PAGE-1]?.id : lastDocIdCache[page-1];
      const { alerts: newAlerts, lastVisibleId } = await getAlertsByTrader(traderId, startAfterDocId ?? null, ALERTS_PER_PAGE);
      
      setAlertsCache(prev => ({ ...prev, [page]: newAlerts }));
      if (lastVisibleId) {
        setLastDocIdCache(prev => ({ ...prev, [page]: lastVisibleId }));
      }
    } catch (error) {
      console.error(`Failed to load alerts for page ${page}:`, error);
      toast({ variant: 'destructive', title: "Error", description: `Could not load page ${page} data.`});
    } finally {
      setLoading(false);
    }
  }, [alertsCache, lastDocIdCache, toast]);


  useEffect(() => {
    async function fetchData() {
        if (authUser) {
            setLoading(true);
            try {
                const [traderData, initialAlerts, count] = await Promise.all([
                    getTrader(authUser.uid), 
                    getAlertsByTrader(authUser.uid, null, ALERTS_PER_PAGE),
                    getAlertsCountByTrader(authUser.uid),
                ]);
                setCurrentTrader(traderData);
                setTotalAlerts(count);
                setAlertsCache({ 1: initialAlerts.alerts });
                if (initialAlerts.lastVisibleId) {
                  setLastDocIdCache({ 1: initialAlerts.lastVisibleId });
                }
            } catch (error) {
                console.error("Failed to load trader dashboard:", error);
                toast({ variant: 'destructive', title: "Error", description: "Could not load dashboard data."});
            } finally {
                setLoading(false);
            }
        }
    }
    fetchData();
  }, [authUser, toast]);

  useEffect(() => {
    if (authUser && currentPage > 1 && !alertsCache[currentPage]) {
      fetchAlertsForPage(currentPage, authUser.uid);
    }
  }, [authUser, currentPage, alertsCache, fetchAlertsForPage]);

  
  const handleSavePost = async (postData: Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'> & {id?: string}) => {
    if (postData.id && editingPost) { // Editing
      await updateAlertText(postData.id, postData.text);
      
      setAlertsCache(currentCache => {
        const newCache = { ...currentCache };
        for (const page in newCache) {
          newCache[page] = newCache[page].map(a => a.id === postData.id ? {...a, text: postData.text, screenshotUrl: postData.screenshotUrl || a.screenshotUrl } : a);
        }
        return newCache;
      });
      setEditingPost(undefined);
    } else { // Creating
      if (currentTrader) {
        const { id, ...restOfPostData } = postData;
        const newPost = await createAlert({...restOfPostData, traderId: currentTrader.id });
        
        // Invalidate cache to refetch and see new post on page 1
        setAlertsCache({});
        setLastDocIdCache({ 1: null });
        setCurrentPage(1);
        setTotalAlerts(count => count + 1);
        
        // Immediately fetch page 1
        setLoading(true);
        getAlertsByTrader(currentTrader.id, null, ALERTS_PER_PAGE).then(initialAlerts => {
          setAlertsCache({ 1: initialAlerts.alerts });
          if (initialAlerts.lastVisibleId) {
            setLastDocIdCache({ 1: initialAlerts.lastVisibleId });
          }
          setLoading(false);
        });
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    await deleteAlert(postId);
    // Invalidate cache to refetch
    setAlertsCache({});
    setLastDocIdCache({ 1: null });
    setCurrentPage(1);
    setTotalAlerts(count => count - 1);

    if (authUser) {
        setLoading(true);
        getAlertsByTrader(authUser.uid, null, ALERTS_PER_PAGE).then(initialAlerts => {
            setAlertsCache({ 1: initialAlerts.alerts });
            if (initialAlerts.lastVisibleId) {
                setLastDocIdCache({ 1: initialAlerts.lastVisibleId });
            }
            setLoading(false);
        });
    }
    toast({ variant: 'destructive', title: 'Пост удален' });
  }
  
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const currentAlerts = alertsCache[currentPage] || [];

  if (loading && !currentAlerts.length || !currentTrader) {
      return (
        <div className="space-y-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-48 w-full" />
        </div>
      );
  }

  return (
    <div className="space-y-8">
      <PostEditor trader={currentTrader} onSave={handleSavePost} postToEdit={editingPost} />
      <div>
          <h2 className="text-2xl font-headline font-bold mb-4">Ваши посты</h2>
            {loading && currentAlerts.length === 0 ? (
                 <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                 </div>
            ) : currentAlerts.length > 0 ? (
                <div className="space-y-4">
                    {currentAlerts.map(alert => (
                        <Card key={alert.id}>
                            <CardHeader className="flex flex-row justify-between items-start">
                               <div>
                                 <p className="text-sm text-muted-foreground">{format(new Date(alert.timestamp as string), 'd MMMM yyyy, HH:mm', { locale: ru })}</p>
                                 <p className="mt-2">{alert.text}</p>
                               </div>
                               <AlertDialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4"/></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingPost(alert)}>
                                            <Edit className="mr-2 h-4 w-4" /> Редактировать
                                        </DropdownMenuItem>
                                        <AlertDialogTrigger asChild>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Удалить
                                            </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                 <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Удалить пост?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                        Это действие навсегда удалит ваш пост. Это действие нельзя отменить.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeletePost(alert.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Удалить
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardHeader>
                        </Card>
                    ))}
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                          </PaginationItem>
                          {[...Array(totalPages)].map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink onClick={() => handlePageChange(i + 1)} isActive={currentPage === i + 1}>
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          <PaginationItem>
                            <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                </div>
            ) : (
                <div className="text-center py-16 border-dashed border-2 rounded-lg">
                    <p className="text-muted-foreground">Вы еще не создали ни одного поста.</p>
                </div>
            )}
      </div>
    </div>
  );
}
