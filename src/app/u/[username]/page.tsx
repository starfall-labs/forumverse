
'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { User, Thread } from '@/lib/types';
import { getUserByUsernameAction, getThreadsByAuthorUsernameAction } from '@/actions/threadActions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/hooks/useTranslation';
import { UserCircle } from 'lucide-react';
import { ThreadList } from '@/components/thread/ThreadList';
import { Separator } from '@/components/ui/separator';

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null | undefined>(undefined); // undefined for loading, null for not found
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userThreads, setUserThreads] = useState<Thread[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      if (username) {
        setIsLoadingUser(true);
        const fetchedUser = await getUserByUsernameAction(username);
        setUser(fetchedUser);
        setIsLoadingUser(false);

        if (fetchedUser) {
          setIsLoadingThreads(true);
          const fetchedThreads = await getThreadsByAuthorUsernameAction(fetchedUser.username);
          setUserThreads(fetchedThreads);
          setIsLoadingThreads(false);
        } else {
          setIsLoadingThreads(false); // No user, so no threads to load
        }
      }
    }
    fetchUserData();
  }, [username]);

  if (isLoadingUser || user === undefined) {
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
    notFound(); 
  }
  
  const primaryDisplayName = user.displayName || user.username;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
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
            {t('userProfile.memberSince', 'Member since:')} {new Date(user.createdAt || Date.now()).toLocaleDateString()}
          </p>
          
          <div className="mt-6 text-center text-muted-foreground">
            {/* This placeholder can be removed or adapted if other info is added */}
            {/* <p>{t('userProfile.moreComingSoon', 'More profile information and activity will be displayed here in the future.')}</p> */}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h2 className="text-2xl font-semibold mb-6 font-headline">
          {t('userProfile.postsBy', 'Threads by')} {primaryDisplayName}
        </h2>
        {isLoadingThreads ? (
           <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="overflow-hidden shadow-md">
                <div className="flex">
                  <aside className="bg-muted/50 p-3 flex flex-col items-center justify-start space-y-2 w-16">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </aside>
                  <div className="flex-grow p-4 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : userThreads.length > 0 ? (
          <ThreadList threads={userThreads} />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">{t('userProfile.noPosts', "This user hasn't created any threads yet.")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
