'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertPost,
  Trader,
  User,
  Comment as CommentType,
  Report,
} from '@/lib/data';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ImageModal } from './image-modal';
import { formatDistanceToNow } from 'date-fns';

type AlertCardProps = {
  alert: AlertPost;
  trader: Trader;
  currentUser: User;
  onUpdateAlert: (updatedAlert: AlertPost) => void;
  onReport: (report: Omit<Report, 'id' | 'status'>) => void;
};

export function AlertCard({
  alert,
  trader,
  currentUser,
  onUpdateAlert,
  onReport,
}: AlertCardProps) {
  const { toast } = useToast();
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const hasLiked = alert.likes.includes(currentUser.id);
  const hasDisliked = alert.dislikes.includes(currentUser.id);

  const handleLike = () => {
    const newLikes = hasLiked
      ? alert.likes.filter((id) => id !== currentUser.id)
      : [...alert.likes, currentUser.id];
    const newDislikes = alert.dislikes.filter((id) => id !== currentUser.id);
    onUpdateAlert({
      ...alert,
      likes: newLikes,
      dislikes: newDislikes,
    });
  };

  const handleDislike = () => {
    const newDislikes = hasDisliked
      ? alert.dislikes.filter((id) => id !== currentUser.id)
      : [...alert.dislikes, currentUser.id];
    const newLikes = alert.likes.filter((id) => id !== currentUser.id);
    onUpdateAlert({
      ...alert,
      likes: newLikes,
      dislikes: newDislikes,
    });
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: CommentType = {
      id: `comment-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text: commentText,
      timestamp: new Date().toISOString(),
    };
    onUpdateAlert({ ...alert, comments: [...alert.comments, newComment] });
    setCommentText('');
    toast({
      title: 'Comment posted',
      description: 'Your comment has been added to the alert.',
    });
  };

  const handleReport = (reason: string) => {
    if (!reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Report failed',
        description: 'Please provide a reason for the report.',
      });
      return;
    }
    onReport({
      alertId: alert.id,
      reporterId: currentUser.id,
      reason,
    });
    toast({
      title: 'Post Reported',
      description: 'Thank you for your feedback. Admins will review this post.',
    });
  };

  return (
    <>
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex flex-row items-start gap-4 p-4">
          <Link href={`/traders/${trader.id}`} legacyBehavior>
            <a className="cursor-pointer">
              <Avatar>
                <AvatarImage
                  src={trader.profilePicUrl}
                  alt={trader.name}
                  data-ai-hint={trader.profilePicHint}
                />
                <AvatarFallback>
                  {trader.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </a>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Link href={`/traders/${trader.id}`} legacyBehavior>
                  <a className="font-bold hover:underline">{trader.name}</a>
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                </p>
              </div>
              <ReportDialog onConfirm={handleReport} />
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
              alt="Alert screenshot"
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
              onClick={handleLike}
              className={`flex items-center gap-2 ${
                hasLiked ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>{alert.likes.length}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislike}
              className={`flex items-center gap-2 ${
                hasDisliked ? 'text-destructive' : 'text-muted-foreground'
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
              <span>{alert.dislikes.length}</span>
            </Button>
            <CommentDialog
              alert={alert}
              trader={trader}
              currentUser={currentUser}
              commentText={commentText}
              setCommentText={setCommentText}
              onAddComment={handleAddComment}
            />
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground"
            onClick={() => window.open(alert.screenshotUrl, '_blank')}
          >
            Open image in browser
          </Button>
        </CardFooter>
      </Card>
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setImageModalOpen(false)}
        imageUrl={alert.screenshotUrl}
        imageHint={alert.screenshotHint}
        title={`Screenshot from ${trader.name}`}
      />
    </>
  );
}

function CommentDialog({ alert, trader, currentUser, commentText, setCommentText, onAddComment }: any) {
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
                    <DialogTitle>Comments</DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto pr-4 space-y-4 my-4">
                    {alert.comments.length === 0 ? (
                        <p className="text-muted-foreground text-center">No comments yet.</p>
                    ) : (
                        alert.comments.map((comment: CommentType) => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold">{comment.userName}</p>
                                    <p className="text-sm text-muted-foreground">{comment.text}</p>
                                    <p className="text-xs text-muted-foreground/70">{formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Input
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && onAddComment()}
                    />
                    <Button onClick={onAddComment}>Post</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function ReportDialog({ onConfirm }: { onConfirm: (reason: string) => void }) {
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
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <ShieldAlert className="mr-2 h-4 w-4" />
              <span>Report Post</span>
            </DropdownMenuItem>
          </DialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Post</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Please provide a reason for reporting this post..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm}>Submit Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
