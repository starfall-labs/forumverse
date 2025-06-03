'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation'; // For redirecting if not logged in
import { addCommentAction } from '@/actions/threadActions';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';

const formSchema = z.object({
  content: z.string().min(1, { message: 'Comment cannot be empty.' }).max(2000, {message: 'Comment too long.'}),
});

interface CommentFormProps {
  threadId: string;
  parentId?: string | null;
  onCommentAdded?: () => void; // Optional: callback after comment is added
}

export function CommentForm({ threadId, parentId = null, onCommentAdded }: CommentFormProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to comment.", variant: "destructive" });
      router.push('/login');
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('content', values.content);

    const result = await addCommentAction(threadId, formData, user.email, parentId);
    
    setIsSubmitting(false);
    if ('error' in result) {
      toast({ title: "Error posting comment", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Comment posted!", description: "Your comment has been added." });
      form.reset(); // Reset form after successful submission
      if (onCommentAdded) {
        onCommentAdded();
      }
    }
  }
  
  if (!user) {
    return <p className="text-sm text-muted-foreground">Please <Link href="/login" className="text-primary hover:underline">log in</Link> to comment.</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={parentId ? "Write a reply..." : "What are your thoughts?"}
                  {...field}
                  rows={parentId ? 3 : 4}
                  className="text-sm"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? (parentId ? 'Replying...' : 'Commenting...') : (parentId ? 'Reply' : 'Comment')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
