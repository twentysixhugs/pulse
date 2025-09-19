'use client';

import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertPost } from '@/lib/data';
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
  text: z.string().min(10, 'Post must be at least 10 characters.'),
  screenshot: z.any().optional(),
});

type PostEditorProps = {
  traderId: string;
  postToEdit?: AlertPost;
  onSave: (post: Omit<AlertPost, 'id' | 'timestamp' | 'likes' | 'dislikes' | 'comments'> & {id?: string}) => void;
};

export function PostEditor({ traderId, postToEdit, onSave }: PostEditorProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: postToEdit?.text || '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const newPostData = {
      id: postToEdit?.id,
      traderId,
      text: values.text,
      // In a real app, screenshot would be uploaded and URL returned
      screenshotUrl: postToEdit?.screenshotUrl || `https://picsum.photos/seed/${Date.now()}/800/600`,
      screenshotHint: 'stock chart',
    };
    onSave(newPostData);
    toast({
      title: postToEdit ? 'Post Updated' : 'Post Created',
      description: 'Your alert has been successfully saved.',
    });
    if (!postToEdit) {
      form.reset({ text: '' });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">
          {postToEdit ? 'Edit Alert' : 'Create New Alert'}
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
                  <FormLabel>Alert Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g. BTC looking bullish, watching for a break above..."
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
                  <FormLabel>Screenshot</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="file" className="pl-10"/>
                      <Paperclip className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">{postToEdit ? 'Save Changes' : 'Post Alert'}</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
