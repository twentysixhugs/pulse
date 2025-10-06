
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
import { Skeleton } from '../ui/skeleton';
import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        try {
            const usersData = await getAllUsers();
            // Filter for regular users only
            const regularUsers = usersData.filter(user => user.role === 'user');
            setUsers(regularUsers);
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
              <h2 className="text-2xl font-headline font-bold">Управление пользователями</h2>
              <div className="space-y-4 px-4 md:px-0">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
              </div>
              <div className="rounded-lg border hidden md:block">
                <Skeleton className="h-48 w-full" />
              </div>
          </div>
      )
  }

  const UserActionMenu = ({ user }: { user: User }) => (
     <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
           <DropdownMenuItem disabled>
              Посмотреть детали
            </DropdownMenuItem>
          <AlertDialogTrigger asChild>
             <DropdownMenuItem className={user.isBanned ? '' : 'text-destructive focus:text-destructive'}>
              {user.isBanned ? 'Разбанить' : 'Забанить'}
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

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
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-headline font-bold px-4 md:px-0">Управление пользователями</h2>
      
      {/* Mobile View - Cards */}
      <div className="grid gap-4 md:hidden px-4">
        {users.map((user) => (
          <Card key={user.id} className="w-full">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 space-y-2">
                    <div>
                        <p className="font-semibold text-base">{user.name}</p>
                        <p className="text-sm text-muted-foreground">@{user.telegramId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge
                            variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                            className={`text-xs ${
                            user.subscriptionStatus === 'active'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}
                        >
                            {user.subscriptionStatus === 'active' ? 'Подписка' : 'Нет подписки'}
                        </Badge>
                        <Badge variant={user.isBanned ? 'destructive' : 'outline'} className="text-xs">
                            {user.isBanned ? 'Забанен' : 'Активен'}
                        </Badge>
                    </div>
                </div>
                <UserActionMenu user={user} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="rounded-lg border hidden md:block">
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
