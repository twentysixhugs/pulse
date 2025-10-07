
'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, getAllUsers, banUser, unbanUser, deleteUser as deleteUserFromDB } from '@/lib/firestore';
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
import { MoreVertical } from 'lucide-react';
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


const ITEMS_PER_PAGE = 20;

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
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
      });
      setUsers(data);
      setTotalCount(totalCount);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить пользователей.' });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const deleteUser = async (userId: string) => {
    const userName = users.find(u => u.id === userId)?.name || 'Пользователь';
    try {
      await deleteUserFromDB(db, userId);
      toast({
        variant: 'destructive',
        title: 'Пользователь удален',
        description: `${userName} был(а) навсегда удален(а).`
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
            <DropdownMenuItem disabled>Посмотреть детали</DropdownMenuItem>
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

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Удалить пользователя?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Это действие нельзя отменить. Это приведет к необратимому удалению {user.name} и всех связанных с ним данных.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => deleteUser(user.id)}
                        className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    >
                        Подтвердить удаление
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
      <div>
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
            {users.map((user) => (
              <Card key={user.id} className="w-full overflow-hidden">
                <CardHeader className="bg-muted/50 p-4 flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-base">{user.name}</CardTitle>
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
                            variant={user.subscriptionStatus === 'active' ? 'default' : 'secondary'}
                            className={`text-xs ${
                            user.subscriptionStatus === 'active'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}
                        >
                            {user.subscriptionStatus === 'active' ? 'активна' : 'неактивна'}
                        </Badge>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Статус:</span>
                        <Badge variant={user.isBanned ? 'destructive' : 'outline'} className="text-xs">
                            {user.isBanned ? 'Забанен' : 'Активен'}
                        </Badge>
                     </div>
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
                  <TableHead>Подписка</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                        <div>{user.name}</div>
                        <a href={`https://t.me/${user.telegramId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">
                            @{user.telegramId}
                        </a>
                    </TableCell>
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
                      <UserActionMenu user={user} />
                    </TableCell>
                  </TableRow>
                ))}
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
    </div>
  );
}
