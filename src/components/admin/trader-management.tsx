
'use client';

import { useState, useEffect } from 'react';
import { Trader, Category, getAllTraders, activateTrader, deactivateTrader, getAllCategories } from '@/lib/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { useAuth } from '@/hooks/use-auth';

export function TraderManagement() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { db } = useAuth();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [tradersData, categoriesData] = await Promise.all([getAllTraders(), getAllCategories()]);
        setTraders(tradersData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось загрузить трейдеров или категории." });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const toggleTraderStatus = async (traderId: string, currentStatus: 'active' | 'inactive') => {
    if (!db) return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? activateTrader : deactivateTrader;
    
    try {
        await action(db, traderId);
        setTraders((currentTraders) =>
            currentTraders.map((trader) =>
            trader.id === traderId ? { ...trader, status: newStatus } : trader
            )
        );
        toast({
            title: `Трейдер ${newStatus === 'active' ? 'активирован' : 'деактивирован'}`,
        });
    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось изменить статус трейдера." });
    }
  };
  
  const deleteTrader = (traderId: string) => {
    // This is a placeholder. In a real app, you would have a `deleteTrader` function in firestore.ts
    const trader = traders.find(t => t.id === traderId);
    setTraders((currentTraders) => currentTraders.filter(t => t.id !== traderId));
    toast({
      variant: 'destructive',
      title: 'Трейдер удален (симуляция)',
      description: `${trader?.name} был(а) навсегда удален(а).`
    })
  }
  
  if (loading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-8 w-1/3 mb-4" />
            <Skeleton className="h-48 w-full" />
        </div>
    )
  }

  const TraderActionMenu = ({ trader }: {trader: Trader}) => (
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
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold">Управление трейдерами</h2>
      
      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {traders.map((trader) => {
            const category = categories.find(c => c.id === trader.category);
            return (
              <Card key={trader.id} className="w-full">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{trader.name}</CardTitle>
                        <CardDescription>@{trader.telegramId}</CardDescription>
                    </div>
                    <div className="mt-1">
                        <TraderActionMenu trader={trader} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Категория:</span>
                        <span>{category?.name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Статус:</span>
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
                    </div>
                </CardContent>
              </Card>
            )
        })}
      </div>

      {/* Desktop View */}
      <div className="rounded-lg border hidden md:block">
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
            {traders.map((trader) => {
              const category = categories.find(c => c.id === trader.category);
              return (
              <TableRow key={trader.id}>
                <TableCell className="font-medium">{trader.name}</TableCell>
                <TableCell>{category?.name || trader.category}</TableCell>
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
                  <TraderActionMenu trader={trader} />
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
