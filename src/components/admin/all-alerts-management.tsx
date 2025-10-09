
'use client';

import { useState, useEffect } from 'react';
import {
  AlertPost,
  listenToAlerts,
  updateAlert,
  deleteAlert,
  Comment,
  deleteCommentFromAlert,
  getTrader,
  Trader,
} from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, MessageSquare, ThumbsUp, ThumbsDown, ZoomIn } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { Unsubscribe } from 'firebase/firestore';
import { PaginationControl } from '@/components/common/pagination-control';
import { PostEditor } from '@/components/trader/post-editor';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import Image from 'next/image';
import { ImageModal } from '@/components/user/image-modal';

const ALERTS_PER_PAGE = 20;

export function AllAlertsManagement() {
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<AlertPost | null>(null);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);
  const [imageModalState, setImageModalState] = useState<{isOpen: boolean; imageUrl?: string; imageHint?: string; title?: string; alertId?: string}>({isOpen: false});

  const [currentPage, setCurrentPage] = useState(1);
  const [totalAlerts, setTotalAlerts] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToAlerts(
      ({ alerts: newAlerts, totalCount }) => {
        setAlerts(newAlerts);
        setTotalAlerts(totalCount);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить посты.' });
        setLoading(false);
      },
      currentPage,
      ALERTS_PER_PAGE
    );

    return () => unsubscribe();
  }, [currentPage, toast]);

  const handleEditClick = async (alert: AlertPost) => {
    try {
        const traderData = await getTrader(alert.traderId);
        if (traderData) {
            setEditingTrader(traderData);
            setEditingPost(alert);
        } else {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось найти трейдера для этого поста.' });
        }
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные трейдера.' });
    }
  }

  const handleSavePost = async (postData: Partial<Omit<AlertPost, 'id'>> & { id?: string }) => {
    if (!postData.id) return;
    try {
      const { id, ...updateData } = postData;
      await updateAlert(id, updateData);
      toast({ title: 'Пост обновлен' });
      setEditingPost(null);
      setEditingTrader(null);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить пост.' });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteAlert(postId);
      toast({ variant: 'destructive', title: 'Пост удален' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить пост.' });
    }
  };

  const handleDeleteComment = async (alertId: string, commentId: string) => {
    try {
      await deleteCommentFromAlert(alertId, commentId);
      toast({ title: 'Комментарий удален' });
    } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить комментарий.' });
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

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };

  const pageCount = Math.ceil(totalAlerts / ALERTS_PER_PAGE);

  return (
    <div className="space-y-4 px-4 md:px-0">
      <h2 className="text-2xl font-headline font-bold">Все алерты</h2>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="w-full overflow-hidden">
              <CardHeader className="flex flex-row items-start gap-4 p-4">
                <Avatar>
                  <AvatarImage src={alert.traderProfilePicUrl} alt={alert.traderName} data-ai-hint={alert.traderProfilePicHint} />
                  <AvatarFallback>{alert.traderName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="leading-[1.3rem]">
                      <p className="font-bold">{alert.traderName}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(alert.timestamp as string), 'd MMMM yyyy, HH:mm', { locale: ru })}</p>
                    </div>
                    <AlertActionMenu
                      alert={alert}
                      onEdit={() => handleEditClick(alert)}
                      onDelete={() => handleDeletePost(alert.id)}
                      onDeleteComment={handleDeleteComment}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-2 pt-0">
                <p className="mb-4 text-sm text-foreground/90 break-words">{alert.text}</p>
                 {alert.screenshotUrl && (
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
                )}
              </CardContent>
              <CardFooter className="flex justify-between p-2 px-4 border-t">
                 <div className="flex gap-4 text-sm text-muted-foreground pointer-events-none">
                    <div className="flex items-center gap-1.5">
                        <ThumbsUp className="h-4 w-4 text-green-500" />
                        <span>{alert.likes.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ThumbsDown className="h-4 w-4 text-red-500" />
                        <span>{alert.dislikes.length}</span>
                    </div>
                </div>
                <CommentsModal alert={alert} onDeleteComment={handleDeleteComment} />
              </CardFooter>
            </Card>
          ))}
          {pageCount > 1 && (
            <PaginationControl
              pageCount={pageCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
          <p className="text-muted-foreground">Алертов пока нет.</p>
        </div>
      )}

      {editingPost && editingTrader && (
        <Dialog open={!!editingPost} onOpenChange={(isOpen) => !isOpen && (setEditingPost(null), setEditingTrader(null))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать пост</DialogTitle>
              <DialogDescription>Внесите изменения и сохраните их.</DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <PostEditor
                trader={editingTrader}
                onSave={handleSavePost}
                postToEdit={editingPost}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

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

function AlertActionMenu({ alert, onEdit, onDelete, onDeleteComment }: { alert: AlertPost; onEdit: () => void; onDelete: () => void, onDeleteComment: (alertId: string, commentId: string) => void }) {
    return (
      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1"><MoreVertical className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" /> Редактировать
            </DropdownMenuItem>
            <CommentsModal alert={alert} onDeleteComment={onDeleteComment} asDropdownItem />
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Удалить пост
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить пост?</AlertDialogTitle>
            <AlertDialogDescription>Это действие нельзя отменить. Пост будет удален навсегда.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }
  
  function CommentsModal({ alert, onDeleteComment, asDropdownItem }: { alert: AlertPost; onDeleteComment: (alertId: string, commentId: string) => void, asDropdownItem?: boolean }) {
    const triggerElement = asDropdownItem ? (
      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
        <MessageSquare className="mr-2 h-4 w-4" /> Комментарии ({alert.comments.length})
      </DropdownMenuItem>
    ) : (
      <Button variant="ghost" size="sm">
        <MessageSquare className="h-4 w-4 mr-2" />
        <span>{alert.comments.length}</span>
      </Button>
    );
  
    return (
      <Dialog>
        <DialogTrigger asChild>{triggerElement}</DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Комментарии к посту</DialogTitle>
            <DialogDescription>
              {format(new Date(alert.timestamp as string), 'd MMMM yyyy, HH:mm', { locale: ru })}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4 my-4">
            {alert.comments.length === 0 ? (
              <p className="text-muted-foreground text-center">Комментариев пока нет.</p>
            ) : (
              alert.comments.map((comment: Comment) => (
                <div key={comment.id} className="flex gap-3 items-start group">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{comment.userName}</p>
                    <p className="text-sm text-muted-foreground break-words">{comment.text}</p>
                    <p className="text-xs text-muted-foreground/70">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: ru })}</p>
                  </div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive">
                                <Trash2 className="h-4 w-4"/>
                           </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
                              <AlertDialogDescription>Это действие нельзя будет отменить.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Отмена</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeleteComment(alert.id, comment.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Удалить
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
