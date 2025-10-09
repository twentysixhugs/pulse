

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
import { Copy, Loader2, RefreshCw } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Имя должно содержать не менее 2 символов.' }),
  email: z.string().email({ message: 'Неверный формат email.' }),
  telegramId: z.string().min(3, { message: 'ID в Telegram должен содержать не менее 3 символов.' }),
  category: z.string().min(1, { message: 'Выберите категорию.' }),
  specialization: z.string().min(5, { message: 'Описание должно содержать не менее 5 символов.' }),
  profilePicUrl: z.string().url({ message: 'Неверный URL изображения.' }).optional().or(z.literal('')),
  password: z.string().min(8, { message: 'Пароль должен содержать не менее 8 символов.' }),
});

type CreateTraderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (traderData: Omit<Trader & { email: string }, 'id' | 'status' | 'reputation'>, password: string) => Promise<void>;
  categories: Category[];
};

export function CreateTraderDialog({ isOpen, onClose, onSave, categories }: CreateTraderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      password: '',
    },
  });

  const generatePassword = () => {
    const length = 25;
    const specialCharsCount = 7;
    const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
    const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*';

    let password = '';
    
    for (let i = 0; i < specialCharsCount; i++) {
        password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
    }

    password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
    password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
    password += numberChars.charAt(Math.floor(Math.random() * numberChars.length));

    const allChars = lowerChars + upperChars + numberChars + specialChars;
    while (password.length < length) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    const shuffledPassword = password.split('').sort(() => 0.5 - Math.random()).join('');

    form.setValue('password', shuffledPassword, { shouldValidate: true });
  };
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    const { password, ...traderDataPayload } = values;

    const traderData = {
        ...traderDataPayload,
        profilePicUrl: values.profilePicUrl || `https://picsum.photos/seed/${values.telegramId}/200/200`,
        profilePicHint: 'person portrait',
    };

    try {
        await onSave(traderData, password);
        form.reset();
    } finally {
        setIsSubmitting(false);
    }
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
                      <Input placeholder="Иван Петров" {...field} disabled={isSubmitting} />
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
                      <Input placeholder="trader@example.com" {...field} disabled={isSubmitting} />
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
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                     <div className="flex items-center gap-2">
                        <FormControl>
                            <Input type="text" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <Button type="button" variant="outline" size="icon" onClick={generatePassword} disabled={isSubmitting}><RefreshCw className="h-4 w-4" /></Button>
                     </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className='pt-4 grid grid-cols-2 gap-2'>
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Отмена</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Создание...' : 'Создать'}
                  </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
