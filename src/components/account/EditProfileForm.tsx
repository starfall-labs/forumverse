
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { updateUserProfileAction } from '@/actions/threadActions';
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from 'react';
import type { User, UpdateProfileData } from '@/lib/types';
import { useTranslation } from '@/hooks/useTranslation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Display name must be at least 2 characters.' }).max(50, { message: 'Display name must be at most 50 characters.' }),
  avatarUrl: z.string().url({ message: 'Please enter a valid URL for the avatar.' }).or(z.literal('')).optional(),
});

interface EditProfileFormProps {
  currentUser: User;
}

export function EditProfileForm({ currentUser }: EditProfileFormProps) {
  const { updateAuthUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState(currentUser.avatarUrl || '');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: currentUser.displayName || currentUser.username,
      avatarUrl: currentUser.avatarUrl || '',
    },
  });
  
  useEffect(() => {
    setPreviewAvatarUrl(currentUser.avatarUrl || '');
    form.reset({
        displayName: currentUser.displayName || currentUser.username,
        avatarUrl: currentUser.avatarUrl || '',
    });
  }, [currentUser, form]);

  const handleAvatarUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('avatarUrl', event.target.value);
    setPreviewAvatarUrl(event.target.value);
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const dataToUpdate: UpdateProfileData = {};
    if (values.displayName !== (currentUser.displayName || currentUser.username)) {
      dataToUpdate.displayName = values.displayName;
    }
    if (values.avatarUrl !== currentUser.avatarUrl) {
      dataToUpdate.avatarUrl = values.avatarUrl || `https://placehold.co/100x100.png?text=${(values.displayName || currentUser.username).charAt(0).toUpperCase()}`;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      toast({ title: t('toast.noChangesTitle', "No Changes"), description: t('toast.noChangesDescription', "You haven't made any changes to save.") });
      setIsSubmitting(false);
      return;
    }

    const result = await updateUserProfileAction(currentUser.id, dataToUpdate);
    setIsSubmitting(false);

    if (result.success && result.user) {
      updateAuthUser(result.user); // Update user in AuthContext and localStorage
      toast({ 
        title: t('toast.profileUpdatedTitle', "Profile Updated"), 
        description: t('toast.profileUpdatedDescription', "Your profile has been successfully updated.") 
      });
      router.refresh(); // Refresh to ensure all parts of UI update if needed
    } else {
      toast({ 
        title: t('toast.errorTitle', "Error"), 
        description: result.error || t('toast.profileUpdateFailedDescription', "Could not update your profile."), 
        variant: "destructive" 
      });
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 text-3xl">
            <AvatarImage src={previewAvatarUrl} alt={form.getValues('displayName')} data-ai-hint="user profile large" />
            <AvatarFallback>
                {form.getValues('displayName') ? form.getValues('displayName').charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
            </Avatar>
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('accountPage.displayNameLabel', 'Display Name')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('accountPage.displayNamePlaceholder', 'Your display name')} {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="avatarUrl"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('accountPage.avatarUrlLabel', 'Avatar URL')}</FormLabel>
                <FormControl>
                    <Input 
                        type="url" 
                        placeholder={t('accountPage.avatarUrlPlaceholder', 'https://example.com/avatar.png')} 
                        {...field} 
                        onChange={handleAvatarUrlChange}
                        disabled={isSubmitting} 
                    />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? t('accountPage.savingChangesButton', 'Saving...') : t('accountPage.saveChangesButton', 'Save Changes')}
            </Button>
        </form>
        </Form>
    </div>
  );
}
