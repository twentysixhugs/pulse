
'use client';

import { useState, useEffect } from 'react';
import { Trader, getTraders, activateTrader, deactivateTrader } from '@/lib/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
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
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';

export function TraderManagement() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const tradersData = await getTraders();
        setTraders(tradersData);
      } catch (error) {
        console.error("Failed to fetch traders:", error);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось загрузить трейдеров." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleTraderStatus = async (traderId: string, currentStatus: Trader['status']) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? activateTrader : deactivateTrader;
    
    try {
        await action(traderId);
        setTraders((current) => current.map(t => t.id === traderId ? {...t, status: newStatus} : t));
        toast({
          title: `Трейдер ${newStatus === 'active' ? 'активирован' : 'деактивирован'}`,
        });
    } catch(e) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: `Не удалось ${newStatus === 'active' ? 'активировать' : 'деактивировать'} трейдера.`,
        });
    }
  };
  
  const deleteTrader = (traderId: string) => {
    const trader = traders.find(t => t.id === traderId);
    // Optimistic update
    setTraders((currentTraders) => currentTraders.filter(t => t.id !== traderId));
    toast({
      variant: 'destructive',
      title: 'Трейдер удален (симуляция)',
      description: `${trader?.name} был(а) навсегда удален(а).`
    })
    // In a real app, you would call a Firestore function to delete the trader document
    // and all related data (e.g., their alerts).
  }
  
  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold">Управление трейдерами</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>ID в Telegram</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {traders.map((trader) => (
              <TableRow key={trader.id}>
                <TableCell className="font-medium">{trader.name}</TableCell>
                <TableCell>{trader.specialization}</TableCell>
                <TableCell>{trader.telegramId}</TableCell>
                <TableCell>
                  <Badge
                    variant={trader.status === 'active' ? 'default' : 'secondary'}
                    className={
                      trader.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border-red-500/30'
                    }
                  >
                    {trader.status === 'active' ? 'активен' : 'неактивен'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleTraderStatus(trader.id, trader.status)}>
                            {trader.status === 'active' ? 'Деактивировать' : 'Активировать'}
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled>Редактировать посты</DropdownMenuItem>
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                Удалить трейдера
                            </DropdownMenuItem>
                         </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>

                     <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить трейдера?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие нельзя отменить. Это приведет к необратимому удалению {trader.name} и всех связанных данных.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteTrader(trader.id)}
                          className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                          Подтвердить удаление
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
