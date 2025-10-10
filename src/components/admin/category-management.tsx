
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Category,
  Trader,
  getAllCategories,
  getAllTraders,
  createCategory,
  updateCategory,
  deleteCategory,
  reassignTraders,
} from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, PlusCircle, Users, Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
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
import { CategoryDialog } from './category-dialog';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ReassignTradersDialog } from './reassign-traders-dialog';

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesData, tradersData] = await Promise.all([
        getAllCategories(),
        getAllTraders(),
      ]);
      setCategories(categoriesData);
      setTraders(tradersData.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось загрузить категории или трейдеров.',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenCreate = () => {
    setDeletingCategory(null);
    setEditDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setDeletingCategory(category);
    setEditDialogOpen(true);
  };
  
  const handleAttemptDelete = (category: Category) => {
    setDeletingCategory(category);
  };

  const handleSaveCategory = async (id: string | null, name: string) => {
    try {
      if (id) {
        await updateCategory(id, name);
        toast({ title: 'Категория обновлена' });
      } else {
        await createCategory(name);
        toast({ title: 'Категория создана' });
      }
      await fetchData();
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error('Failed to save category:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка сохранения',
        description:
          error.message || 'Не удалось сохранить категорию.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    try {
      await deleteCategory(deletingCategory.id);
      toast({ variant: 'destructive', title: `Категория "${deletingCategory.name}" удалена`});
      setDeletingCategory(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить категорию.'});
    }
  };
  
  const handleReassignAndclose = async (assignments: { [traderId: string]: string }) => {
    if (!deletingCategory) return;

    try {
      await reassignTraders(assignments, deletingCategory.id);
      toast({
        title: 'Трейдеры переназначены',
        description: `Категория "${deletingCategory.name}" была успешно удалена.`,
      });
      setDeletingCategory(null);
      await fetchData();
    } catch (error) {
      console.error('Failed to reassign traders and delete category:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось переназначить трейдеров и удалить категорию.',
      });
    }
  };

  const tradersInCategory = deletingCategory 
    ? traders.filter(t => t.category === deletingCategory.id) 
    : [];


  return (
    <div className="space-y-4 px-4 md:px-0">
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        <h2 className="text-2xl font-headline font-bold self-start">
          Управление категориями
        </h2>
        <Button onClick={handleOpenCreate} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Создать категорию
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16 border-dashed border-2 rounded-lg">
          <p className="text-muted-foreground">Категории не найдены.</p>
        </div>
      ) : (
        <AlertDialog onOpenChange={(open) => !open && setDeletingCategory(null)}>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Трейдеры</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const tradersInCategoryCount = traders.filter(
                    (t) => t.category === category.id
                  ).length;
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        {tradersInCategoryCount > 0 ? (
                          <Dialog>
                              <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                      <Users className="mr-2 h-4 w-4" />
                                      {tradersInCategoryCount}
                                  </Button>
                              </DialogTrigger>
                              <DialogContent>
                                  <DialogHeader>
                                      <DialogTitle>Трейдеры в категории &quot;{category.name}&quot;</DialogTitle>
                                      <DialogDescription>Список всех трейдеров, привязанных к этой категории.</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
                                      {traders.filter(t => t.category === category.id).map(trader => (
                                          <Link href={`/admin/traders/${trader.id}/alerts`} key={trader.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted">
                                              <Avatar>
                                                  <AvatarImage src={trader.profilePicUrl} />
                                                  <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
                                              </Avatar>
                                              <div>
                                                  <div className='font-semibold'>{trader.name}</div>
                                                  <div className='text-sm text-muted-foreground'>@{trader.telegramId}</div>
                                              </div>
                                          </Link>
                                      ))}
                                  </div>
                              </DialogContent>
                          </Dialog>
                        ) : (
                          <Button variant="outline" size="sm" disabled>
                             <Users className="mr-2 h-4 w-4" />0
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialogTrigger asChild>
                             <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleAttemptDelete(category)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {deletingCategory && tradersInCategory.length === 0 && (
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить категорию &quot;{deletingCategory.name}&quot;?</AlertDialogTitle>
                <AlertDialogDescription>
                  Это действие нельзя отменить. Категория будет удалена навсегда.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      )}
      <CategoryDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveCategory}
        category={deletingCategory}
      />
      {deletingCategory && tradersInCategory.length > 0 && (
         <ReassignTradersDialog
            isOpen={true}
            onClose={() => setDeletingCategory(null)}
            categoryToDelete={deletingCategory}
            allCategories={categories}
            tradersToReassign={tradersInCategory}
            onConfirm={handleReassignAndclose}
        />
      )}
    </div>
  );
}
