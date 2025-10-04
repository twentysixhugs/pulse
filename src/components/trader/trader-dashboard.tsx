
'use client';

import { useState, useEffect } from 'react';
import {
  Trader,
  AlertPost,
  getTrader,
  getAlertsByTrader,
  createAlert,
  updateAlertText,
  deleteAlert,
} from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

export function TraderDashboard() {
  const { user: authUser } = useAuth();
  const [currentTrader, setCurrentTrader] = useState<Trader | undefined>();
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<AlertPost | undefined>(undefined);
  
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if (authUser) {
            setLoading(true);
            try {
                const [traderData, alertsData] = await Promise.all([
                    getTrader(authUser.uid), 
                    getAlertsByTrader(authUser.uid)
                ]);
                setCurrentTrader(traderData);
                setAlerts(alertsData);

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

  
  const handleSavePost = async (postData: Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'> & {id?: string}) => {
    if (postData.id && editingPost) { // Editing
      await updateAlertText(postData.id, postData.text);
      setAlerts(alerts.map(a => a.id === postData.id ? {...a, text: postData.text, screenshotUrl: postData.screenshotUrl || a.screenshotUrl } : a));
      setEditingPost(undefined);
    } else { // Creating
      if (currentTrader) {
        const { id, ...restOfPostData } = postData;
        const newPost = await createAlert({...restOfPostData, traderId: currentTrader.id });
        setAlerts([newPost, ...alerts]);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    await deleteAlert(postId);
    setAlerts(alerts.filter(a => a.id !== postId));
    toast({ variant: 'destructive', title: 'Пост удален' });
  }

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
          <div className="space-y-4">
              {alerts.map(alert => (
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
          </div>
      </div>
    </div>
  );
}
