'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertPost, Trader } from '@/lib/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Paperclip } from 'lucide-react';

const formSchema = z.object({
  text: z.string().min(1, 'Пост не может быть пустым.'),
  screenshot: z.any().optional(),
});

type PostEditorProps = {
  trader: Trader;
  postToEdit?: AlertPost;
  onSave: (postData: Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'> & {id?: string}) => void;
};

export function PostEditor({ trader, postToEdit, onSave }: PostEditorProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: postToEdit?.text || '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you would handle file uploads properly.
    // For now, we simulate it with a placeholder or keep the existing one.
    const hasNewScreenshot = values.screenshot && values.screenshot.length > 0;
    const screenshotUrl = hasNewScreenshot 
      ? `https://picsum.photos/seed/${Date.now()}/800/600` 
      : postToEdit?.screenshotUrl;
    const screenshotHint = hasNewScreenshot 
      ? 'stock chart'
      : postToEdit?.screenshotHint;

    const newPostData: Omit<AlertPost, 'timestamp' | 'likes' | 'dislikes' | 'comments'> & {id?: string} = {
      id: postToEdit?.id,
      traderId: trader.id,
      traderName: trader.name,
      traderProfilePicUrl: trader.profilePicUrl,
      traderProfilePicHint: trader.profilePicHint,
      text: values.text,
    };

    if (screenshotUrl) {
      newPostData.screenshotUrl = screenshotUrl;
      newPostData.screenshotHint = screenshotHint;
    }

    onSave(newPostData);
    toast({
      title: postToEdit ? 'Пост обновлен' : 'Пост создан',
      description: 'Ваше оповещение было успешно сохранено.',
    });
    if (!postToEdit) {
      form.reset({ text: '', screenshot: null });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">
          {postToEdit ? 'Редактировать оповещение' : 'Создать новое оповещение'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Содержание оповещения</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="например, BTC выглядит бычьим, жду прорыва выше..."
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="screenshot"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Скриншот (необязательно)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="file" className="pl-10" onChange={(e) => field.onChange(e.target.files)} />
                      <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">{postToEdit ? 'Сохранить изменения' : 'Опубликовать оповещение'}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
