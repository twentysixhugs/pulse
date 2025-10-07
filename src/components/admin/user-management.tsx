
'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, getAllUsers, banUser, unbanUser, deleteUser as deleteUserFromDB, updateUserSubscription } from '@/lib/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/components/ui/alert-dialog';
import { Skeleton } from '../ui/skeleton';
import { MoreVertical, Pencil } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { db } from '@/lib/firebase';
import { SearchInput } from './search-input';
import { useDebounce } from '@/hooks/use-debounce';
import { PaginationControl } from '../common/pagination-control';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { differenceInCalendarDays, addDays } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { EditSubscriptionDialog } from './edit-subscription-dialog';


const ITEMS_PER_PAGE = 20;

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [banFilter, setBanFilter] = useState<'all' | 'banned' | 'not_banned'>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, totalCount } = await getAllUsers({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: debouncedSearchTerm,
        role: 'user', // Fetch only regular users
        subscriptionStatus: subscriptionFilter,
        banStatus: banFilter,
      });

      // Sort users: active -> inactive -> banned
      const sortedData = data.sort((a, b) => {
        if (a.isBanned && !b.isBanned) return 1;
        if (!a.isBanned && b.isBanned) return -1;
        if (a.isBanned && b.isBanned) return 0;

        if (a.subscriptionStatus === 'active' && b.subscriptionStatus !== 'active') return -1;
        if (a.subscriptionStatus !== 'active' && b.subscriptionStatus === 'active') return 1;
        
        return 0;
      });
      
      setUsers(sortedData);
      setTotalCount(totalCount);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить пользователей.' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, toast, subscriptionFilter, banFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleBanStatus = async (userId: string, isBanned: boolean) => {
    const action = isBanned ? unbanUser : banUser;
    
    try {
      await action(db, userId);
      // Refetch data to apply new sorting
      fetchData();
      toast({
        title: `Пользователь ${!isBanned ? 'забанен' : 'разбанен'}.`,
      });
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось изменить статус бана." });
    }
  };

  const deleteUser = async (userId: string) => {
    const userName = users.find(u => u.id === userId)?.name || 'Пользователь';
    try {
      await deleteUserFromDB(db, userId);
      toast({
        variant: 'destructive',
        title: 'Пользователь удален',
        description: `Пользователь ${userName} будет удалён из базы данных.`
      });
      // Refetch data after deletion
      await fetchData();
    } catch (error) {
       console.error("Failed to delete user:", error);
       toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось удалить пользователя."});
    }
  };

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };
  
  const pageCount = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const getSubscriptionInfo = (user: User) => {
    const inactiveStyle = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20';
    const activeStyle = 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20';
    const expiredStyle = 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/20';

    if (user.subscriptionStatus !== 'active' || !user.subscriptionEndDate) {
        return { text: 'Неактивна', style: inactiveStyle };
    }
    
    const endDate = (user.subscriptionEndDate as Timestamp).toDate();
    const daysLeft = differenceInCalendarDays(endDate, new Date());
    
    if (daysLeft < 0) {
        return { text: 'Просрочена', style: expiredStyle };
    }
    
    const displayDays = daysLeft + 1;
    return { text: `Активна (${displayDays} д.)`, style: activeStyle };
  };

  const handleSubscriptionUpdate = async (userId: string, newEndDate: Date) => {
    try {
      await updateUserSubscription(userId, newEndDate);
      toast({
        title: "Подписка обновлена",
      });
      fetchData(); // Refetch to show updated data
      setEditingUser(null);
    } catch (error) {
      console.error("Failed to update subscription", error);
      toast({
        variant: "destructive",
        title: "Ошибка обновления",
        description: "Не удалось обновить дату подписки.",
      });
    }
  };

  const UserActionMenu = ({ user }: { user: User }) => {
    const [isBanAlertOpen, setBanAlertOpen] = useState(false);
    const [isDeleteAlertOpen, setDeleteAlertOpen] = useState(false);

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingUser(user)}>
              <Pencil className="mr-2 h-4 w-4" />
              Редактировать подписку
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setBanAlertOpen(true)} className={user.isBanned ? '' : 'text-destructive focus:text-destructive'}>
              {user.isBanned ? 'Разбанить' : 'Забанить'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDeleteAlertOpen(true)} className="text-destructive focus:text-destructive">
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={isBanAlertOpen} onOpenChange={setBanAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие {user.isBanned ? 'разбанит' : 'забанит'} пользователя {user.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="flex-1">Отмена</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toggleBanStatus(user.id, user.isBanned)}
                className={`flex-1 ${user.isBanned ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}`}
              >
                {user.isBanned ? 'Разбанить' : 'Забанить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие нельзя отменить. Пользователь {user.name} будет удалён из базы данных.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="flex-1">Отмена</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => deleteUser(user.id)}
                        className='flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                        Подтвердить
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };

  return (
    <div className="space-y-4 px-4 md:px-0">
      <h2 className="text-2xl font-headline font-bold">Управление пользователями</h2>
      <div className="space-y-4">
        <div className="flex gap-4">
            <Select value={subscriptionFilter} onValueChange={(value) => setSubscriptionFilter(value as any)}>
                <SelectTrigger className='w-auto'>
                    <SelectValue placeholder="Фильтр по подписке" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Все подписки</SelectItem>
                    <SelectItem value="active">Активная</SelectItem>
                    <SelectItem value="inactive">Неактивная</SelectItem>
                </SelectContent>
            </Select>
            <Select value={banFilter} onValueChange={(value) => setBanFilter(value as any)}>
                <SelectTrigger className='w-auto'>
                    <SelectValue placeholder="Фильтр по статусу" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="banned">Забанен</SelectItem>
                    <SelectItem value="not_banned">Не забанен</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <SearchInput placeholder="Поиск по имени или Telegram ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      
      {loading ? (
        <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
          <p className="text-muted-foreground">Пользователи не найдены.</p>
        </div>
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className="grid gap-4 md:hidden">
            {users.map((user) => {
              const subscriptionInfo = getSubscriptionInfo(user);
              return (
              <Card key={user.id} className="w-full overflow-hidden">
                <CardHeader className="bg-muted/50 p-4 flex flex-row items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{user.name}</CardTitle>
                          {user.isBanned && <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 cursor-default hover:bg-red-500/20">Забанен</Badge>}
                        </div>
                        <a href={`https://t.me/${user.telegramId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">
                            @{user.telegramId}
                        </a>
                    </div>
                    <div className="-mt-2 -mr-2">
                        <UserActionMenu user={user} />
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-4 text-sm flex flex-col gap-3">
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Подписка:</span>
                         <Badge
                            variant={subscriptionInfo.text === 'Неактивна' || subscriptionInfo.text === 'Просрочена' ? 'secondary' : 'default'}
                            className={`text-xs ${subscriptionInfo.style} cursor-default`}
                        >
                            {subscriptionInfo.text}
                        </Badge>
                     </div>
                </CardContent>
              </Card>
            )})}
          </div>

          {/* Desktop View - Table */}
          <div className="rounded-lg border hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Подписка</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const subscriptionInfo = getSubscriptionInfo(user);
                  return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div>
                              <div>{user.name}</div>
                              <a href={`https://t.me/${user.telegramId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">
                                  @{user.telegramId}
                              </a>
                          </div>
                          {user.isBanned && <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 cursor-default hover:bg-red-500/20">Забанен</Badge>}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={subscriptionInfo.text === 'Неактивна' || subscriptionInfo.text === 'Просрочена' ? 'secondary' : 'default'}
                        className={`${subscriptionInfo.style} cursor-default`}
                      >
                        {subscriptionInfo.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <UserActionMenu user={user} />
                    </TableCell>
                  </TableRow>
                )})}
              </TableBody>
            </Table>
          </div>

          {pageCount > 1 && (
            <PaginationControl
              pageCount={pageCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
      {editingUser && (
        <EditSubscriptionDialog
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSubscriptionUpdate}
        />
      )}
    </div>
  );
}
