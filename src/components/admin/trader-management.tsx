

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trader, Category, getAllTraders, activateTrader, deactivateTrader, getAllCategories, createTrader, deleteTrader as deleteTraderFromDB, updateTrader } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { MoreVertical, PlusCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { db } from '@/lib/firebase';
import { SearchInput } from './search-input';
import { useDebounce } from '@/hooks/use-debounce';
import { PaginationControl } from '../common/pagination-control';
import { CreateTraderDialog } from './create-trader-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { EditTraderDialog } from './edit-trader-dialog';

const ITEMS_PER_PAGE = 20;

export function TraderManagement() {
  const [traders, setTraders] = useState<Trader[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTrader, setEditingTrader] = useState<Trader | null>(null);
  const { toast } = useToast();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tradersData, categoriesData] = await Promise.all([
        getAllTraders({ page: currentPage, limit: ITEMS_PER_PAGE, search: debouncedSearchTerm }),
        getAllCategories()
      ]);
      setTraders(tradersData.data);
      setTotalCount(tradersData.totalCount);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось загрузить трейдеров или категории." });
    } finally {
      setLoading(false);
    }
  }, [toast, currentPage, debouncedSearchTerm]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const toggleTraderStatus = async (traderId: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? activateTrader : deactivateTrader;
    
    try {
        await action(db, traderId);
        await fetchData(); // Refetch to get updated list
        toast({
            title: `Трейдер ${newStatus === 'active' ? 'активирован' : 'деактивирован'}`,
        });
    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось изменить статус трейдера." });
    }
  };
  
  const deleteTrader = async (traderId: string) => {
    const traderName = traders.find(t => t.id === traderId)?.name || 'Трейдер';
    try {
      await deleteTraderFromDB(db, traderId);
      toast({
        variant: 'destructive',
        title: 'Трейдер удален',
        description: `${traderName} был(а) удален(а) из базы. Пользователя нужно удалить из Firebase Auth вручную.`
      });
      await fetchData(); // Refresh list
    } catch (error) {
      console.error("Failed to delete trader:", error);
      toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось удалить трейдера."});
    }
  }

  const handleCreateTrader = async (traderData: Omit<Trader & { email: string }, 'id' | 'status' | 'reputation'>, password: string) => {
    try {
      await createTrader(db, traderData, password);
      setCreateDialogOpen(false);
      toast({
        title: "Трейдер создан",
        description: `Аккаунт для ${traderData.name} успешно создан.`
      });
      await fetchData();
    } catch (error: any) {
        console.error("Failed to create trader:", error);
        toast({
            variant: "destructive",
            title: "Ошибка создания трейдера",
            description: error.message,
        });
    }
  };

  const handleUpdateTrader = async (traderId: string, data: Partial<Omit<Trader, 'id' | 'email' | 'status' | 'reputation'>>) => {
    try {
        await updateTrader(db, traderId, data);
        setEditingTrader(null);
        toast({
            title: "Профиль трейдера обновлен",
        });
        await fetchData();
    } catch (error: any) {
        console.error("Failed to update trader:", error);
        toast({
            variant: "destructive",
            title: "Ошибка обновления",
            description: error.message || "Не удалось обновить профиль трейдера.",
        });
    }
  }

  const pageCount = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected + 1);
  };
  
  const TraderActionMenu = ({ trader }: {trader: Trader}) => {
    const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditingTrader(trader)}>
              Редактировать профиль
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleTraderStatus(trader.id, trader.status)}>
                {trader.status === 'active' ? 'Деактивировать' : 'Активировать'}
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Редактировать посты</DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive focus:text-destructive"
              onClick={() => setDeleteAlertOpen(true)}
            >
              Удалить трейдера
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
  
        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
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
      </>
    );
  };

  return (
    <div className="space-y-4 px-4 md:px-0">
       <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
          <h2 className="text-2xl font-headline font-bold self-start">Управление трейдерами</h2>
          <Button onClick={() => setCreateDialogOpen(true)} className='w-full sm:w-auto'>
              <PlusCircle className="mr-2 h-4 w-4" />
              Создать трейдера
          </Button>
       </div>
      <div>
        <SearchInput placeholder="Поиск по имени или Telegram ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>
      
      {loading ? (
         <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
      ) : traders.length === 0 ? (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
          <p className="text-muted-foreground">Трейдеры не найдены.</p>
        </div>
      ) : (
      <>
        {/* Mobile View */}
        <div className="grid gap-4 md:hidden">
          {traders.map((trader) => {
              const category = categories.find(c => c.id === trader.category);
              return (
                <Card key={trader.id} className="w-full overflow-hidden">
                  <CardHeader className="bg-muted/50 p-4 flex flex-row items-start justify-between">
                      <div>
                          <CardTitle className="text-base">{trader.name}</CardTitle>
                          <CardDescription>
                            <a href={`https://t.me/${trader.telegramId}`} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:underline">
                              @{trader.telegramId}
                            </a>
                          </CardDescription>
                      </div>
                      <div className="-mt-2 -mr-2">
                          <TraderActionMenu trader={trader} />
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm p-4 pt-4 flex flex-col">
                      <p className='text-muted-foreground break-all text-sm'>{trader.specialization}</p>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Категория:</span>
                          <span>{category?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
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
                <TableHead>Описание</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {traders.map((trader) => {
                const category = categories.find(c => c.id === trader.category);
                return (
                <TableRow key={trader.id}>
                  <TableCell className="font-medium">
                    <div>{trader.name}</div>
                    <a href={`https://t.me/${trader.telegramId}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:underline text-xs">
                        @{trader.telegramId}
                    </a>
                  </TableCell>
                  <TableCell>{category?.name || trader.category}</TableCell>
                  <TableCell className='text-muted-foreground max-w-xs truncate'>{trader.specialization}</TableCell>
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
        {pageCount > 1 && (
            <PaginationControl
              pageCount={pageCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
       <CreateTraderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSave={handleCreateTrader}
        categories={categories}
      />
      {editingTrader && (
        <EditTraderDialog
          trader={editingTrader}
          isOpen={!!editingTrader}
          onClose={() => setEditingTrader(null)}
          onSave={handleUpdateTrader}
          categories={categories}
        />
      )}
    </div>
  );
}

    
