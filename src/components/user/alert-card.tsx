
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertPost,
  User,
  Comment as CommentType,
  Report,
  toggleAlertLike,
  toggleAlertDislike,
  addCommentToAlert
} from '@/lib/firestore';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  MoreVertical,
  ShieldAlert,
  ZoomIn,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ImageModal } from './image-modal';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

type AlertCardProps = {
  alert: AlertPost;
  currentUser: User;
  onUpdateAlert: (updatedAlert: AlertPost) => void;
  onReport: (report: Omit<Report, 'id' | 'status'>) => void;
};

export function AlertCard({
  alert,
  currentUser,
  onUpdateAlert,
  onReport,
}: AlertCardProps) {
  const { toast } = useToast();
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const hasLiked = currentUser && alert.likes.includes(currentUser.id);
  const hasDisliked = currentUser && alert.dislikes.includes(currentUser.id);

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!currentUser || isSubmittingReaction) return;

    setIsSubmittingReaction(true);

    const originalAlertState = { ...alert, likes: [...alert.likes], dislikes: [...alert.dislikes] };

    // Optimistic update
    let newLikes: string[], newDislikes: string[];
    if (type === 'like') {
      newLikes = hasLiked ? alert.likes.filter((id) => id !== currentUser.id) : [...alert.likes, currentUser.id];
      newDislikes = alert.dislikes.filter((id) => id !== currentUser.id);
    } else { // dislike
      newDislikes = hasDisliked ? alert.dislikes.filter((id) => id !== currentUser.id) : [...alert.dislikes, currentUser.id];
      newLikes = alert.likes.filter((id) => id !== currentUser.id);
    }
    onUpdateAlert({ ...alert, likes: newLikes, dislikes: newDislikes });
    
    try {
      if (type === 'like') {
        await toggleAlertLike(alert.id, currentUser.id, hasLiked);
      } else {
        await toggleAlertDislike(alert.id, currentUser.id, hasDisliked);
      }
    } catch (error) {
      console.error("Failed to update reaction:", error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить реакцию.'});
      // Revert UI on failure
      onUpdateAlert(originalAlertState);
    } finally {
      setIsSubmittingReaction(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentUser || isSubmittingComment) return;
    
    setIsSubmittingComment(true);

    const optimisticCommentId = `optimistic-${Date.now()}`;
    const newComment: CommentType = {
      id: optimisticCommentId,
      userId: currentUser.id,
      userName: currentUser.name,
      text: commentText,
      timestamp: new Date().toISOString(),
    };
    
    const originalComments = [...alert.comments];
    // Optimistic update
    onUpdateAlert({ ...alert, comments: [...alert.comments, newComment] });
    setCommentText('');

    try {
      await addCommentToAlert(alert.id, newComment);
      // We might want to refetch the alert here to get the real comment ID from the server
      // For now, the optimistic one will do.
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить комментарий.'});
      // Revert UI on failure
      onUpdateAlert({ ...alert, comments: originalComments });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReport = (reason: string) => {
    if (!currentUser) return;
    if (!reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Не удалось отправить жалобу',
        description: 'Пожалуйста, укажите причину жалобы.',
      });
      return;
    }
    onReport({
      alertId: alert.id,
      reporterId: currentUser.id,
      reason,
    });
    toast({
      title: 'На пост отправлена жалоба',
      description: 'Спасибо за ваш отзыв. Администраторы рассмотрят этот пост.',
    });
  };

  return (
    <>
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex flex-row items-start gap-4 p-4">
          <Link href={`/traders/${alert.traderId}`}>
            <Avatar>
              <AvatarImage
                src={alert.traderProfilePicUrl}
                alt={alert.traderName}
                data-ai-hint={alert.traderProfilePicHint}
              />
              <AvatarFallback>
                {alert.traderName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/traders/${alert.traderId}`} className="font-bold hover:underline">{alert.traderName}</Link>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.timestamp as string), { addSuffix: true, locale: ru })}
                </p>
              </div>
              <ReportDialog onConfirm={handleReport} disabled={!currentUser} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-2 pt-0">
          <p className="mb-4 text-sm text-foreground/90">{alert.text}</p>
          <div
            className="relative aspect-video w-full cursor-pointer overflow-hidden rounded-lg border"
            onClick={() => setImageModalOpen(true)}
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
        <CardFooter className="flex justify-between p-2 px-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('like')}
              className={`flex items-center gap-2 ${
                hasLiked ? 'text-primary' : 'text-muted-foreground'
              }`}
              disabled={!currentUser || isSubmittingReaction}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{alert.likes.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('dislike')}
              className={`flex items-center gap-2 ${
                hasDisliked ? 'text-destructive' : 'text-muted-foreground'
              }`}
              disabled={!currentUser || isSubmittingReaction}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{alert.dislikes.length}</span>
            </Button>
            <CommentDialog
              alert={alert}
              currentUser={currentUser}
              commentText={commentText}
              setCommentText={setCommentText}
              onAddComment={handleAddComment}
              isSubmitting={isSubmittingComment}
            />
          </div>
        </CardFooter>
      </Card>
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={alert.screenshotUrl}
        imageHint={alert.screenshotHint || 'stock chart'}
        alertId={alert.id}
        title={`Скриншот от ${alert.traderName}`}
      />
    </>
  );
}

function CommentDialog({ alert, currentUser, commentText, setCommentText, onAddComment, isSubmitting }: any) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground" disabled={!currentUser}>
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
                        alert.comments.map((comment: CommentType) => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold">{comment.userName}</p>
                                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                                    <p className="text-xs text-muted-foreground/70">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true, locale: ru })}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="Добавьте комментарий..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onAddComment()}
                        disabled={!currentUser || isSubmitting}
                    />
                    <Button onClick={onAddComment} disabled={!currentUser || !commentText.trim() || isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Публикация...' : 'Опубликовать'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ReportDialog({ onConfirm, disabled }: { onConfirm: (reason: string) => void, disabled: boolean }) {
  const [reason, setReason] = useState('');
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm(reason);
    setOpen(false);
    setReason('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={disabled}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              <span>Пожаловаться на пост</span>
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Пожаловаться на пост</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Пожалуйста, укажите причину жалобы на этот пост..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!reason.trim()}>Отправить жалобу</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    