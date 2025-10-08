
'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { Category, Trader } from '@/lib/firestore';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Имя должно содержать не менее 2 символов.' }),
  telegramId: z.string().min(3, { message: 'ID в Telegram должен содержать не менее 3 символов.' }),
  category: z.string().min(1, { message: 'Выберите категорию.' }),
  specialization: z.string().min(5, { message: 'Описание должно содержать не менее 5 символов.' }),
});

type EditTraderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  trader: Trader;
  onSave: (traderId: string, data: Partial<Omit<Trader, 'id' | 'email' | 'status' | 'reputation'>>) => Promise<void>;
  categories: Category[];
};

export function EditTraderDialog({ isOpen, onClose, trader, onSave, categories }: EditTraderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        name: trader.name,
        telegramId: trader.telegramId,
        category: trader.category,
        specialization: trader.specialization,
    },
  });

  useEffect(() => {
    if (trader) {
        form.reset({
            name: trader.name,
            telegramId: trader.telegramId,
            category: trader.category,
            specialization: trader.specialization,
        });
    }
  }, [trader, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
        await onSave(trader.id, values);
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSubmitting && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать профиль трейдера</DialogTitle>
          <DialogDescription>
            Изменение данных для {trader.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[80vh] p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-3">
              <FormItem>
                <FormLabel>Email (нельзя изменить)</FormLabel>
                <FormControl>
                  <Input value={trader.email} disabled />
                </FormControl>
              </FormItem>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Иван Петров" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telegramId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Текущий username в телеграм</FormLabel>
                    <FormControl>
                      <Input placeholder="ivan_petrov" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                      <FormItem>
                      <FormLabel>Категория</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                          <SelectTrigger>
                              <SelectValue placeholder="Выберите специализацию" />
                          </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                          {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание профиля</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Специалист по BTC и ETH" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             
              <DialogFooter className='pt-4 grid grid-cols-2 gap-2'>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Отмена</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                  </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

    