
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { changeEmailAction } from '@/actions/threadActions';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useTranslation } from '@/hooks/useTranslation';

const formSchema = z.object({
  newEmail: z.string().email({ message: 'Please enter a valid email address.' }),
  currentPassword: z.string().min(1, { message: 'Password is required to change email.' }),
});

interface ChangeEmailFormProps {
  currentUser: User;
}

export function ChangeEmailForm({ currentUser }: ChangeEmailFormProps) {
  const { updateAuthUser } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      newEmail: currentUser.email,
      currentPassword: '',
    },
  });
  
  useEffect(() => {
    form.reset({
        newEmail: currentUser.email,
        currentPassword: '',
    });
  }, [currentUser, form]);


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.newEmail === currentUser.email) {
        toast({ title: t('toast.noChangesTitle', "No Changes"), description: t('toast.emailNotChangedDescription', "The new email is the same as your current email.") });
        return;
    }
    setIsSubmitting(true);
    const result = await changeEmailAction(currentUser.id, values.newEmail, values.currentPassword);
    setIsSubmitting(false);

    if (result.success && result.user) {
      updateAuthUser(result.user); 
      toast({ 
        title: t('toast.emailChangedTitle', "Email Changed"), 
        description: t('toast.emailChangedDescription', "Your email has been successfully updated. Please check your new email for verification if applicable (mock).") 
      });
      form.reset({ newEmail: result.user.email, currentPassword: '' });
    } else {
      toast({ 
        title: t('toast.errorTitle', "Error"), 
        description: result.error || t('toast.emailChangeFailedDescription', "Could not change your email."), 
        variant: "destructive" 
      });
       if (result.error === (PREDEFINED_TRANSLATIONS_EN['error.incorrectCurrentPassword'] || 'Incorrect current password.')) {
        form.setError("currentPassword", { type: "manual", message: result.error });
      }
      if (result.error === (PREDEFINED_TRANSLATIONS_EN['error.emailInUse'] || 'This email is already in use.')) {
        form.setError("newEmail", { type: "manual", message: result.error });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="newEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accountPage.newEmailLabel', 'New Email Address')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accountPage.currentPasswordLabel', 'Current Password (to confirm)')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? t('accountPage.savingEmailButton', 'Saving...') : t('accountPage.saveEmailButton', 'Save Email')}
        </Button>
      </form>
    </Form>
  );
}
