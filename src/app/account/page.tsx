
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { EditProfileForm } from '@/components/account/EditProfileForm';
import { ChangePasswordForm } from '@/components/account/ChangePasswordForm';
import { ChangeEmailForm } from '@/components/account/ChangeEmailForm';
import { DeleteAccountSection } from '@/components/account/DeleteAccountSection';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCog, KeyRound, Mail, ShieldAlert } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AccountPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-8">
        <div className="flex items-center mb-6">
            <UserCog className="h-8 w-8 mr-3 text-primary" />
            <h1 className="text-3xl font-bold font-headline">{t('accountPage.title', 'Account Settings')}</h1>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
        <Separator />
         <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">
       <div className="flex items-center mb-6">
        <UserCog className="h-8 w-8 mr-3 text-primary" />
        <h1 className="text-3xl font-bold font-headline">{t('accountPage.title', 'Account Settings')}</h1>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">{t('accountPage.editProfileTitle', 'Edit Profile')}</CardTitle>
          <CardDescription>{t('accountPage.editProfileDescription', 'Update your display name and avatar.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileForm currentUser={user} />
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
           <div className="flex items-center">
            <KeyRound className="h-6 w-6 mr-2 text-primary" />
            <CardTitle className="text-2xl">{t('accountPage.changePasswordTitle', 'Change Password')}</CardTitle>
           </div>
          <CardDescription>{t('accountPage.changePasswordDescription', 'Update your account password.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm currentUserId={user.id} />
        </CardContent>
      </Card>
      
      <Separator />

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center">
            <Mail className="h-6 w-6 mr-2 text-primary" />
            <CardTitle className="text-2xl">{t('accountPage.changeEmailTitle', 'Change Email')}</CardTitle>
          </div>
          <CardDescription>{t('accountPage.changeEmailDescription', 'Update your account email address.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangeEmailForm currentUser={user} />
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-lg border-destructive">
        <CardHeader>
          <div className="flex items-center">
            <ShieldAlert className="h-6 w-6 mr-2 text-destructive" />
            <CardTitle className="text-2xl text-destructive">{t('accountPage.deleteAccountTitle', 'Delete Account')}</CardTitle>
          </div>
          <CardDescription>{t('accountPage.deleteAccountDescription', 'Permanently delete your account and all associated data.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DeleteAccountSection currentUserId={user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
