
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
  activateTrader,
  deactivateTrader,
} from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const { user: authUser, db } = useAuth();
  const [currentTrader, setCurrentTrader] = useState<Trader | undefined>();
  const [alerts, setAlerts] = useState<AlertPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<AlertPost | undefined>(undefined);
  
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        if (authUser && db) {
            setLoading(true);
            try {
                const [traderData, alertsData] = await Promise.all([
                    getTrader(db, authUser.uid), 
                    getAlertsByTrader(db, authUser.uid)
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
  }, [authUser, db, toast]);

  const handleStatusChange = async (isActive: boolean) => {
    if (!currentTrader || !db) return;
    const newStatus = isActive ? 'active' : 'inactive';
    const action = isActive ? activateTrader : deactivateTrader;

    try {
      await action(db, currentTrader.id);
      setCurrentTrader({ ...currentTrader, status: newStatus });
      toast({
        title: 'Статус обновлен',
        description: `Ваш статус теперь ${newStatus === 'active' ? 'активен' : 'неактивен'}.`,
      });
    } catch (error) {
      console.error("Failed to update status", error);
      toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось обновить статус."});
    }
  };
  
  const handleSavePost = async (postData: Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'> & {id?: string}) => {
    if (!db) return;
    if (postData.id && editingPost) { // Editing
      await updateAlertText(db, postData.id, postData.text);
      setAlerts(alerts.map(a => a.id === postData.id ? {...a, text: postData.text, screenshotUrl: postData.screenshotUrl || a.screenshotUrl } : a));
      setEditingPost(undefined);
    } else { // Creating
      if (currentTrader) {
        const newPost = await createAlert(db, {...postData, traderId: currentTrader.id });
        setAlerts([newPost, ...alerts]);
      }
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!db) return;
    await deleteAlert(db, postId);
    setAlerts(alerts.filter(a => a.id !== postId));
    toast({ variant: 'destructive', title: 'Пост удален' });
  }

  if (loading || !currentTrader) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
            <div className="lg:col-span-1">
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
      );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
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
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Ваш статус</CardTitle>
            <CardDescription>
              Установите свой профиль в активное состояние, чтобы он был виден пользователям.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="trader-status"
                checked={currentTrader.status === 'active'}
                onCheckedChange={handleStatusChange}
              />
              <Label htmlFor="trader-status" className={currentTrader.status === 'active' ? 'text-primary' : ''}>
                {currentTrader.status === 'active' ? 'Активен' : 'Неактивен'}
              </Label>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
