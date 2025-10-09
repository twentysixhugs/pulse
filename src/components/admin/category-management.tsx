
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Category,
  Trader,
  getAllCategories,
  getAllTraders,
  createCategory,
  updateCategory,
} from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, PlusCircle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { CategoryDialog } from './category-dialog';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

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
    setDialogOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setDialogOpen(true);
  };

  const handleSave = async (id: string | null, name: string) => {
    try {
      if (id) {
        await updateCategory(id, name);
        toast({ title: 'Категория обновлена' });
      } else {
        await createCategory(name);
        toast({ title: 'Категория создана' });
      }
      await fetchData(); // Refresh data
      setDialogOpen(false);
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
                <TableHead>Название категории</TableHead>
                <TableHead>Трейдеры</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const tradersInCategory = traders.filter(
                  (t) => t.category === category.id
                );
                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      {tradersInCategory.length > 0 ? (
                         <div className="flex flex-wrap gap-2 items-center">
                           {tradersInCategory.map(trader => (
                             <Link href={`/admin/traders/${trader.id}/alerts`} key={trader.id}>
                                <Badge variant="secondary" className="hover:bg-muted transition-colors">
                                  <Avatar className="h-4 w-4 -ml-1 mr-1.5">
                                    <AvatarImage src={trader.profilePicUrl} />
                                    <AvatarFallback>{trader.name.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  {trader.name}
                                </Badge>
                             </Link>
                           ))}
                         </div>
                      ) : (
                        <span className="text-muted-foreground">Нет трейдеров</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(category)}
                      >
                        <Pencil className="h-4 w-4" />
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
        isOpen={isDialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        category={editingCategory}
      />
    </div>
  );
}
