
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { changePasswordAction } from '@/actions/threadActions';
import { useToast } from "@/hooks/use-toast";
import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const formSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters.' }),
  confirmNewPassword: z.string(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match.",
  path: ["confirmNewPassword"],
});

interface ChangePasswordFormProps {
  currentUserId: string;
}

export function ChangePasswordForm({ currentUserId }: ChangePasswordFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const result = await changePasswordAction(currentUserId, values.currentPassword, values.newPassword);
    setIsSubmitting(false);

    if (result.success) {
      toast({ 
        title: t('toast.passwordChangedTitle', "Password Changed"), 
        description: t('toast.passwordChangedDescription', "Your password has been successfully updated.") 
      });
      form.reset();
    } else {
      toast({ 
        title: t('toast.errorTitle', "Error"), 
        description: result.error || t('toast.passwordChangeFailedDescription', "Could not change your password."), 
        variant: "destructive" 
      });
      if (result.error === (PREDEFINED_TRANSLATIONS_EN['error.incorrectCurrentPassword'] || 'Incorrect current password.')) {
        form.setError("currentPassword", { type: "manual", message: result.error });
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accountPage.currentPasswordLabel', 'Current Password')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accountPage.newPasswordLabel', 'New Password')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmNewPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accountPage.confirmNewPasswordLabel', 'Confirm New Password')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? t('accountPage.savingPasswordButton', 'Saving...') : t('accountPage.savePasswordButton', 'Save Password')}
        </Button>
      </form>
    </Form>
  );
}
