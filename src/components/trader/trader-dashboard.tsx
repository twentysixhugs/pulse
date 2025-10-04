'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trader,
  AlertPost,
  getTrader,
  getAlertsByTrader,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertsCountByTrader,
} from '@/lib/firestore';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PostEditor } from './post-editor';
import { Button } from '../ui/button';
import { MoreVertical, Edit, Trash2, ZoomIn } from 'lucide-react';
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
import Image from 'next/image';
import { ImageModal } from '../user/image-modal';
import { PaginationControl } from '../common/pagination-control';

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
  const [imageModalState, setImageModalState] = useState<{isOpen: boolean; imageUrl?: string; imageHint?: string; title?: string; alertId?: string}>({isOpen: false});
  
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
      await updateAlert(postData.id, { text: postData.text, screenshotUrl: postData.screenshotUrl });
      
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
        
        // Optimistic update: add the new post to the top of the list for page 1
        setAlertsCache(prevCache => {
            const pageOneAlerts = prevCache[1] || [];
            // To prevent issues with pagination keys if we just unshift, we'll refetch page 1 in the background
            // but for the UI, we just add it to the top.
            // A more robust solution might involve re-validating the entire cache, but this avoids a full refresh.
            return {
                ...prevCache,
                1: [newPost, ...pageOneAlerts].slice(0, ALERTS_PER_PAGE)
            };
        });

        setTotalAlerts(count => count + 1);

        // If we were on a different page, go back to page 1 to see the new post.
        if (currentPage !== 1) {
            setCurrentPage(1);
        }

        // We can optionally invalidate the lastDocId for page 1 if we want to ensure perfect consistency on next load,
        // but for now, this provides a smooth UX.
        // setLastDocIdCache(prev => ({...prev, 1: newPost.id}));
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
  
  const openImageModal = (alert: AlertPost) => {
    if (alert.screenshotUrl) {
      setImageModalState({
        isOpen: true,
        imageUrl: alert.screenshotUrl,
        imageHint: alert.screenshotHint,
        title: `Скриншот от ${alert.traderName}`,
        alertId: alert.id,
      });
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
                            <CardHeader className="flex flex-row justify-between items-start p-4">
                               <div className="flex-1">
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
                            {alert.screenshotUrl && (
                                <CardContent className="px-4 pt-0 pb-4">
                                     <div
                                        className="relative aspect-video w-full max-w-sm cursor-pointer overflow-hidden rounded-lg border"
                                        onClick={() => openImageModal(alert)}
                                        >
                                        <Image
                                            src={alert.screenshotUrl}
                                            alt="Скриншот предупреждения"
                                            fill
                                            className="object-cover transition-transform duration-300 hover:scale-105"
                                            data-ai-hint={alert.screenshotHint}
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                                            <ZoomIn className="h-10 w-10 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                    {totalPages > 1 && (
                      <PaginationControl
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                      />
                    )}
                </div>
            ) : (
                <div className="text-center py-16 border-dashed border-2 rounded-lg">
                    <p className="text-muted-foreground">Вы еще не создали ни одного поста.</p>
                </div>
            )}
      </div>
       {imageModalState.isOpen && imageModalState.alertId && (
        <ImageModal
          isOpen={imageModalState.isOpen}
          onClose={() => setImageModalState({isOpen: false})}
          imageUrl={imageModalState.imageUrl!}
          imageHint={imageModalState.imageHint}
          alertId={imageModalState.alertId}
          title={imageModalState.title}
        />
      )}
    </div>
  );
}
