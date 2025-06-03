'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { createThreadAction } from '@/actions/threadActions';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }).max(150, { message: 'Title must be at most 150 characters.' }),
  content: z.string().min(10, { message: 'Content must be at least 10 characters.' }),
});

export function CreateThreadForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to create a post.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('content', values.content);

    const result = await createThreadAction(formData, user.email);

    setIsSubmitting(false);
    if ('error' in result) {
      toast({ title: "Error creating post", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Post created!", description: "Your post has been successfully created." });
      router.push(`/t/${result.id}`);
    }
  }

  if (!user && typeof window !== 'undefined') { // Check typeof window to avoid SSR issues with router.push
     // router.push('/login'); // This can cause issues if called during render. Better to show a message or disable form.
     return <p className="text-center text-muted-foreground">Please <Link href="/login" className="text-primary hover:underline">log in</Link> to create a post.</p>;
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter a descriptive title" {...field} disabled={isSubmitting || !user} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea placeholder="Share your thoughts (Markdown not supported yet)" {...field} rows={8} disabled={isSubmitting || !user} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting || !user}>
          {isSubmitting ? 'Submitting...' : 'Create Post'}
        </Button>
      </form>
    </Form>
  );
}
