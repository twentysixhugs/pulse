'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Category, Trader } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

type ReassignTradersDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  categoryToDelete: Category;
  allCategories: Category[];
  tradersToReassign: Trader[];
  onConfirm: (assignments: { [traderId: string]: string }) => Promise<void>;
};

export function ReassignTradersDialog({
  isOpen,
  onClose,
  categoryToDelete,
  allCategories,
  tradersToReassign,
  onConfirm,
}: ReassignTradersDialogProps) {
  const [assignments, setAssignments] = useState<{ [traderId: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const availableCategories = allCategories.filter(c => c.id !== categoryToDelete.id);

  useEffect(() => {
    // Initialize assignments with empty strings when the dialog opens
    if (isOpen) {
      const initialAssignments = tradersToReassign.reduce((acc, trader) => {
        acc[trader.id] = '';
        return acc;
      }, {} as { [traderId: string]: string });
      setAssignments(initialAssignments);
    }
  }, [isOpen, tradersToReassign]);

  const handleAssignmentChange = (traderId: string, newCategoryId: string) => {
    setAssignments(prev => ({ ...prev, [traderId]: newCategoryId }));
  };

  const canConfirm = tradersToReassign.length > 0 && tradersToReassign.every(trader => assignments[trader.id] && assignments[trader.id] !== '');

  const handleSubmit = async () => {
    if (!canConfirm) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Пожалуйста, назначьте новую категорию для каждого трейдера.',
      });
      return;
    }
    setIsSubmitting(true);
    await onConfirm(assignments);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Невозможно удалить категорию</DialogTitle>
          <DialogDescription>
            К категории &quot;{categoryToDelete.name}&quot; привязаны трейдеры. Пожалуйста, переназначьте их в другие категории перед удалением.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
            {availableCategories.length > 0 ? (
                 <ScrollArea className="h-full pr-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Трейдер</TableHead>
                                <TableHead>Новая категория</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tradersToReassign.map(trader => (
                                <TableRow key={trader.id}>
                                    <TableCell className="font-medium">{trader.name}</TableCell>
                                    <TableCell>
                                        <Select 
                                            onValueChange={(value) => handleAssignmentChange(trader.id, value)}
                                            value={assignments[trader.id] || ''}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите категорию..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableCategories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            ) : (
                <div className="text-center text-destructive p-4 border border-destructive/50 rounded-md">
                    Нет других категорий для переназначения. Пожалуйста, сначала создайте новую категорию.
                </div>
            )}
        </div>
        <DialogFooter className="flex-col gap-2 pt-4">
          <Button onClick={handleSubmit} disabled={!canConfirm || isSubmitting} size="lg" className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Выполнение...' : 'Переназначить и удалить'}
          </Button>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} size="lg" className="w-full">
            Отмена
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
