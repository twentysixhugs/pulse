
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
import { Paperclip, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

const formSchema = z.object({
  text: z.string().min(1, 'Пост не может быть пустым.'),
  screenshot: z.any().optional(),
});

type PostEditorProps = {
  trader: Trader;
  postToEdit?: AlertPost;
  onSave: (postData: Partial<Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'>> & {id?: string}) => void;
};

export function PostEditor({ trader, postToEdit, onSave }: PostEditorProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: postToEdit?.text || '',
      screenshot: undefined,
    },
  });
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Reset form when postToEdit changes (i.e., when editing starts or stops)
  useEffect(() => {
    form.reset({
      text: postToEdit?.text || '',
      screenshot: undefined,
    });
    setSelectedFileName(null);
  }, [postToEdit, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you would handle file uploads properly.
    // For now, we simulate it with a placeholder or keep the existing one.
    const hasNewScreenshot = values.screenshot && values.screenshot.length > 0;
    
    const newPostData: Partial<Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'>> & {id?: string} = {
      id: postToEdit?.id,
      traderId: trader.id,
      traderName: trader.name,
      traderProfilePicUrl: trader.profilePicUrl,
      traderProfilePicHint: trader.profilePicHint,
      text: values.text,
    };

    if (hasNewScreenshot) {
      newPostData.screenshotUrl = `https://picsum.photos/seed/${Date.now()}/800/600`;
      newPostData.screenshotHint = 'stock chart';
    } else if (postToEdit?.screenshotUrl) {
      newPostData.screenshotUrl = postToEdit.screenshotUrl;
      newPostData.screenshotHint = postToEdit.screenshotHint;
    }


    onSave(newPostData);
    toast({
      title: postToEdit ? 'Пост обновлен' : 'Пост создан',
      description: 'Ваше оповещение было успешно сохранено.',
    });
    
    form.reset({ text: '', screenshot: undefined });
    setSelectedFileName(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('screenshot', event.target.files);
    setSelectedFileName(event.target.files?.[0]?.name || null);
  };
  
  const clearFile = () => {
    form.setValue('screenshot', undefined);
    setSelectedFileName(null);
    if (postToEdit) {
      postToEdit.screenshotUrl = undefined;
      postToEdit.screenshotHint = undefined;
    }
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">
          {postToEdit ? 'Редактировать алерт' : 'Новый алерт'}
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
                  <FormControl>
                    <Textarea
                      placeholder=""
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
              render={() => (
                <FormItem>
                   <FormLabel>Скриншот (необязательно)</FormLabel>
                   {(postToEdit?.screenshotUrl || selectedFileName) && (
                      <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
                         <Image src={selectedFileName ? URL.createObjectURL(form.getValues('screenshot')[0]) : postToEdit!.screenshotUrl!} alt="Current screenshot" fill className="object-cover" />
                         <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6 z-10" onClick={clearFile}><X className="h-4 w-4"/></Button>
                      </div>
                    )}
                   <FormControl>
                     <label className="relative flex items-center gap-2 cursor-pointer text-sm text-muted-foreground border rounded-md p-2 hover:bg-muted">
                        <Paperclip className="h-4 w-4"/>
                        <span>{selectedFileName || 'Прикрепить скриншот'}</span>
                        <Input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                         />
                     </label>
                   </FormControl>
                   <FormMessage/>
                </FormItem>
              )}
            />
            <Button type="submit">{postToEdit ? 'Сохранить' : 'Опубликовать'}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
