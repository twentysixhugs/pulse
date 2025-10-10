
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // State for deletion flow
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isReassignDialogOpen, setReassignDialogOpen] = useState(false);

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
    setEditingCategory(null);
    setEditDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  };
  
  const handleAttemptDelete = (category: Category) => {
    setCategoryToDelete(category);
    const tradersInCategoryCount = traders.filter(t => t.category === category.id).length;
    if (tradersInCategoryCount > 0) {
        setReassignDialogOpen(true);
    } else {
        setDeleteConfirmOpen(true);
    }
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
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id);
      toast({ variant: 'destructive', title: `Категория "${categoryToDelete.name}" удалена`});
      setDeleteConfirmOpen(false);
      setCategoryToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Failed to delete category:', error);
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить категорию.'});
    }
  };
  
  const handleReassignAndClose = async (assignments: { [traderId: string]: string }) => {
    if (!categoryToDelete) return;

    try {
      await reassignTraders(assignments, categoryToDelete.id);
      toast({
        title: 'Трейдеры переназначены',
        description: `Категория "${categoryToDelete.name}" была успешно удалена.`,
      });
      setReassignDialogOpen(false);
      setCategoryToDelete(null);
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
                         <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleAttemptDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
      )}
      <CategoryDialog
        isOpen={isEditDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
      
      {categoryToDelete && (
        <>
            <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Удалить категорию &quot;{categoryToDelete.name}&quot;?</AlertDialogTitle>
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
            </AlertDialog>
            <ReassignTradersDialog
                isOpen={isReassignDialogOpen}
                onClose={() => {
                    setReassignDialogOpen(false);
                    setCategoryToDelete(null);
                }}
                categoryToDelete={categoryToDelete}
                allCategories={categories}
                tradersToReassign={traders.filter(t => t.category === categoryToDelete.id)}
                onConfirm={handleReassignAndClose}
            />
        </>
      )}
    </div>
  );
}
