

'use client';

import { useState, useEffect } from 'react';
import {
  Trader,
  AlertPost,
  getTrader,
  createAlert,
  updateAlert,
  deleteAlert,
  listenToAlertsByTrader,
  Comment,
} from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { PostEditor } from './post-editor';
import { Button } from '../ui/button';
import { MoreVertical, Edit, Trash2, ZoomIn, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { format, formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '../ui/skeleton';
import Image from 'next/image';
import { ImageModal } from '../user/image-modal';
import { Unsubscribe } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


function CommentsModal({ alert }: { alert: AlertPost }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>{alert.comments.length}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Комментарии</DialogTitle>
                    <DialogDescription>
                        {format(new Date(alert.timestamp as string), 'd MMMM yyyy, HH:mm', { locale: ru })}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4 my-4">
                    {alert.comments.length === 0 ? (
                        <p className="text-muted-foreground text-center">Комментариев пока нет.</p>
                    ) : (
                        alert.comments.map((comment: Comment) => (
                            <div key={comment.id} className="flex gap-3 items-start">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold">{comment.userName}</p>
                                    <p className="text-sm text-muted-foreground break-words">{comment.text}</p>
                                    <p className="text-xs text-muted-foreground/70">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: ru })}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export function TraderDashboard() {
  const { user: authUser } = useAuth();
  const [currentTrader, setCurrentTrader] = useState<Trader | undefined>();
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<AlertPost | undefined>(undefined);
  const [imageModalState, setImageModalState] = useState<{isOpen: boolean; imageUrl?: string; imageHint?: string; title?: string; alertId?: string}>({isOpen: false});
  
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribe: Unsubscribe | undefined;

    async function fetchData() {
        if (authUser) {
            setLoading(true);
            try {
                const traderData = await getTrader(authUser.uid);
                setCurrentTrader(traderData);

                if (!traderData) {
                  setLoading(false);
                  return;
                }

                unsubscribe = listenToAlertsByTrader(authUser.uid, (newAlerts) => {
                    setAlerts(newAlerts);
                    setLoading(false);
                }, (error) => {
                    console.error(`Failed to listen for trader alerts:`, error);
                    toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось загрузить посты."});
                    setLoading(false);
                });

            } catch (error) {
                console.error("Failed to load trader dashboard:", error);
                toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось загрузить данные."});
                setLoading(false);
            }
        }
    }
    fetchData();

    return () => {
      if (unsubscribe) unsubscribe();
    };

  }, [authUser, toast]);

  
  const handleSavePost = async (postData: Partial<Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'>> & {id?: string}) => {
    try {
      if (postData.id && editingPost) { // Editing
        const { id, ...updateData } = postData;
        
        const dataToSend = {...updateData};
        if (dataToSend.screenshotUrl === undefined) delete (dataToSend as any).screenshotUrl;
        if (dataToSend.screenshotHint === undefined) delete (dataToSend as any).screenshotHint;

        await updateAlert(id, dataToSend);
        toast({ title: 'Пост обновлен' });
      } else { // Creating
        if (currentTrader) {
          const { id, ...restOfPostData } = postData;
          const newPost = {
              ...restOfPostData,
              traderId: currentTrader.id,
              traderName: currentTrader.name,
              traderProfilePicUrl: currentTrader.profilePicUrl,
              traderProfilePicHint: currentTrader.profilePicHint,
          };
          await createAlert(newPost);
          toast({ title: 'Пост создан' });
        }
      }
      setEditingPost(undefined);
    } catch (error) {
      console.error("Failed to save post", error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить пост.'})
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
        await deleteAlert(postId);
        toast({ variant: 'destructive', title: 'Пост удален' });
    } catch (error) {
        console.error("Failed to delete post", error);
        toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить пост.'})
    }
  }
  
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


  if (loading || !currentTrader) {
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
            {loading && alerts.length === 0 ? (
                 <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                 </div>
            ) : alerts.length > 0 ? (
                <div className="space-y-4">
                    {alerts.map(alert => (
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
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(alert.timestamp as string), { addSuffix: true, locale: ru })}</p>
                                    </div>
                                    <AlertDialog>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1"><MoreVertical className="h-4 w-4"/></Button>
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
                                  </div>
                                  <p className="text-sm break-words">{alert.text}</p>
                               </div>
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
                             <CardFooter className="flex justify-between p-2 px-4 border-t items-center">
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
                                <div>
                                    <CommentsModal alert={alert} />
                                </div>
                             </CardFooter>
                        </Card>
                    ))}
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
