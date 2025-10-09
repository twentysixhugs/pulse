
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertPost,
  User,
  listenToAlerts,
  Comment,
} from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { PaginationControl } from '@/components/common/pagination-control';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '../ui/button';
import { MessageSquare, ThumbsDown, ThumbsUp, ZoomIn } from 'lucide-react';
import { ImageModal } from '../user/image-modal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const ALERTS_PER_PAGE = 20;

type AllAlertsViewProps = {
    currentUser: User;
}

function ReadOnlyAlertCard({ alert }: { alert: AlertPost }) {
    const [imageModalState, setImageModalState] = useState<{isOpen: boolean; imageUrl?: string; imageHint?: string; title?: string; alertId?: string}>({isOpen: false});
    
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
    
    return (
        <>
        <Card className="w-full overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 p-4">
                <Link href={`/traders/${alert.traderId}`}>
                <Avatar>
                    <AvatarImage src={alert.traderProfilePicUrl} alt={alert.traderName} data-ai-hint={alert.traderProfilePicHint} />
                    <AvatarFallback>{alert.traderName.charAt(0)}</AvatarFallback>
                </Avatar>
                </Link>
                <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                    <div className="leading-[1.3rem]">
                    <Link href={`/traders/${alert.traderId}`} className="font-bold hover:underline">{alert.traderName}</Link>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(alert.timestamp as string), { addSuffix: true, locale: ru })}</p>
                    </div>
                </div>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-2 pt-0">
                <p className="text-sm break-words">{alert.text}</p>
                {alert.screenshotUrl && (
                    <div
                        className="relative aspect-video w-full max-w-sm cursor-pointer overflow-hidden rounded-lg border mt-4"
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
        </>
    );
}

function CommentsModal({ alert }: { alert: AlertPost }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span>{alert.comments.length}</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Комментарии</DialogTitle>
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
                <ReadOnlyAlertCard key={alert.id} alert={alert} />
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
