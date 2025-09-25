
'use client';

import { useState, useEffect } from 'react';
import { User, getAllUsers, banUser, unbanUser } from '@/lib/firestore';
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
import { Skeleton } from '../ui/skeleton';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { db } = useAuth();

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const usersData = await getAllUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить пользователей.' });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  const toggleBanStatus = async (userId: string, isBanned: boolean) => {
    if (!db) return;
    const action = isBanned ? unbanUser : banUser;
    const newBanStatus = !isBanned;

    try {
        await action(db, userId);
        setUsers((currentUsers) =>
            currentUsers.map((user) =>
            user.id === userId ? { ...user, isBanned: newBanStatus } : user
            )
        );
        toast({
            title: `Пользователь ${newBanStatus ? 'забанен' : 'разбанен'}.`,
        });
    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось изменить статус бана." });
    }
  };
  
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
      <h2 className="text-2xl font-headline font-bold">Управление пользователями</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>ID в Telegram</TableHead>
              <TableHead>Подписка</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.telegramId}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                    className={
                      user.subscriptionStatus === 'active'
                        ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                    }
                  >
                    {user.subscriptionStatus === 'active' ? 'активна' : 'неактивна'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.isBanned ? 'destructive' : 'outline'}>
                    {user.isBanned ? 'Забанен' : 'Активен'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant={user.isBanned ? 'secondary' : 'destructive'}
                        size="sm"
                      >
                        {user.isBanned ? 'Разбанить' : 'Забанить'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Это действие {user.isBanned ? 'разбанит' : 'забанит'} пользователя {user.name}.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => toggleBanStatus(user.id, user.isBanned)}
                          className={user.isBanned ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
                        >
                          Подтвердить
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
