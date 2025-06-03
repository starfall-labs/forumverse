
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { User } from '@/lib/types';
import { getUserByUsernameAction } from '@/actions/threadActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { UserCircle } from 'lucide-react';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined for loading, null for not found
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      if (username) {
        setIsLoading(true);
        const fetchedUser = await getUserByUsernameAction(username);
        setUser(fetchedUser);
        setIsLoading(false);
      }
    }
    fetchUser();
  }, [username]);

  if (isLoading || user === undefined) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader className="items-center text-center">
            <Skeleton className="h-24 w-24 rounded-full mb-4" />
            <Skeleton className="h-7 w-40 mb-1" />
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    notFound(); // Or display a custom "User not found" message
  }
  
  const primaryDisplayName = user.displayName || user.username;

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader className="items-center text-center border-b pb-6">
          <Avatar className="h-24 w-24 mb-4 text-3xl">
            <AvatarImage src={user.avatarUrl} alt={primaryDisplayName} data-ai-hint="user profile large" />
            <AvatarFallback>
              {primaryDisplayName ? primaryDisplayName.charAt(0).toUpperCase() : <UserCircle />}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-3xl font-headline">{primaryDisplayName}</CardTitle>
          <CardDescription className="text-md text-muted-foreground">u/{user.username}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-3 font-headline">{t('userProfile.about', 'About')} {primaryDisplayName}</h3>
          <p className="text-muted-foreground">
            {t('userProfile.memberSince', 'Member since:')} {new Date(user.createdAt || Date.now()).toLocaleDateString()} {/* Assuming createdAt exists, add to User type if needed */}
          </p>
          {/* Placeholder for future content like user's posts or comments */}
          <div className="mt-6 text-center text-muted-foreground">
            <p>{t('userProfile.moreComingSoon', 'More profile information and activity will be displayed here in the future.')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
