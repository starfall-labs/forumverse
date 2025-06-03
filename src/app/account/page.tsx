
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { EditProfileForm } from '@/components/account/EditProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCog } from 'lucide-react';

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
      <div className="max-w-2xl mx-auto py-8">
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
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
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
    </div>
  );
}
