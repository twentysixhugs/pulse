
'use client';

import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { Copy, RefreshCw } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Имя должно содержать не менее 2 символов.' }),
  email: z.string().email({ message: 'Неверный формат email.' }),
  telegramId: z.string().min(3, { message: 'ID в Telegram должен содержать не менее 3 символов.' }),
  category: z.string().min(1, { message: 'Выберите категорию.' }),
  specialization: z.string().min(5, { message: 'Описание должно содержать не менее 5 символов.' }),
  profilePicUrl: z.string().url({ message: 'Неверный URL изображения.' }).optional().or(z.literal('')),
});

type CreateTraderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (traderData: Omit<Trader, 'id' | 'status' | 'reputation'>, password: string) => void;
  categories: Category[];
};

export function CreateTraderDialog({ isOpen, onClose, onSave, categories }: CreateTraderDialogProps) {
  const [generatedPassword, setGeneratedPassword] = useState('');
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      telegramId: '',
      category: '',
      specialization: '',
      profilePicUrl: '',
    },
  });

  const generatePassword = () => {
    const newPassword = Math.random().toString(36).slice(-8);
    setGeneratedPassword(newPassword);
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Пароль скопирован" });
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!generatedPassword) {
      toast({ variant: 'destructive', title: 'Сгенерируйте пароль' });
      return;
    }
    const traderData = {
        ...values,
        profilePicUrl: values.profilePicUrl || `https://picsum.photos/seed/${values.telegramId}/200/200`,
        profilePicHint: 'person portrait',
    };
    onSave(traderData, generatedPassword);
    form.reset();
    setGeneratedPassword('');
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создать нового трейдера</DialogTitle>
          <DialogDescription>
            Введите данные для создания нового профиля трейдера.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[80vh] p-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя</FormLabel>
                    <FormControl>
                      <Input placeholder="Иван Петров" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="trader@example.com" {...field} />
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
                    <FormLabel>ID в Telegram</FormLabel>
                    <FormControl>
                      <Input placeholder="ivan_petrov" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Textarea placeholder="Специалист по BTC и ETH" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                  <FormLabel>Пароль</FormLabel>
                  <div className="flex items-center gap-2 mt-2">
                      <Input value={generatedPassword} readOnly placeholder="Нажмите 'Сгенерировать'"/>
                      <Button type="button" variant="outline" size="icon" onClick={generatePassword}><RefreshCw className="h-4 w-4" /></Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(generatedPassword)} disabled={!generatedPassword}><Copy className="h-4 w-4" /></Button>
                  </div>
              </div>

              <DialogFooter className='pt-4'>
                  <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
                  <Button type="submit">Создать</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
