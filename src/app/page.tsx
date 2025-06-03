
'use client'; // Make this a client component to use the hook

import { ThreadList } from '@/components/thread/ThreadList';
import { getThreadsAction } from '@/actions/threadActions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, ListFilter } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState } from 'react';
import type { Thread } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from '@/components/ui/skeleton';


export default function HomePage() {
  const { t, currentLanguage } = useTranslation();
  const [allThreads, setAllThreads] = useState<Thread[]>([]); // Store all fetched threads
  const [threads, setThreads] = useState<Thread[]>([]); // Store sorted/displayed threads
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'popular' | 'newest' | 'oldest'>('popular');

  // Fetch threads once on mount
  useEffect(() => {
    async function fetchInitialThreads() {
      setIsLoading(true);
      const fetchedThreads = await getThreadsAction();
      setAllThreads(fetchedThreads);
      setIsLoading(false);
    }
    fetchInitialThreads();
  }, []);

  // Sort threads whenever allThreads or sortOrder changes
  useEffect(() => {
    if (allThreads.length > 0) {
      let sorted = [...allThreads]; // Create a copy to sort
      if (sortOrder === 'newest') {
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortOrder === 'oldest') {
        sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else { // 'popular'
        sorted.sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes));
      }
      setThreads(sorted);
    } else if (!isLoading) { // Only set to empty if not loading and allThreads is empty
      setThreads([]);
    }
  }, [allThreads, sortOrder, isLoading]);
  
  const pageTitleKey = `homePage.popularThreads.${currentLanguage}`;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold font-headline">{t('home.popularThreads', 'Popular Threads')}</h1>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>
              <ListFilter className="mr-2 h-4 w-4" />
              {t('home.sortBy', 'Sort by')}
            </Button>
            <Button disabled>
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('home.createThreadButton', 'Create New Thread')}
            </Button>
          </div>
        </div>
        <div className="space-y-4">
            {[1,2,3].map(i => (
                <CardSkeleton key={i} />
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold font-headline" key={pageTitleKey}>{t('home.popularThreads', 'Popular Threads')}</h1>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <ListFilter className="mr-2 h-4 w-4" />
                {t('home.sortBy', 'Sort by')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>{t('home.sortBy', 'Sort by')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={(value) => setSortOrder(value as 'popular' | 'newest' | 'oldest')}>
                <DropdownMenuRadioItem value="popular">{t('home.sort.popular', 'Popular')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="newest">{t('home.sort.newest', 'Newest')}</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">{t('home.sort.oldest', 'Oldest')}</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/submit" passHref>
            <Button>
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('home.createThreadButton', 'Create New Thread')}
            </Button>
          </Link>
        </div>
      </div>
      {threads.length > 0 ? (
        <ThreadList threads={threads} />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-muted-foreground">{t('home.noThreads', 'No threads yet.')}</h2>
          <p className="text-muted-foreground mt-2">{t('home.beTheFirst', 'Be the first to start a discussion!')}</p>
          <Link href="/submit" passHref>
            <Button className="mt-6">
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('home.createThreadButton', 'Create New Thread')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

const CardSkeleton = () => (
  <div className="flex rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
    <aside className="bg-muted/50 p-3 flex flex-col items-center justify-start space-y-2 w-16">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-4 w-8" />
      <Skeleton className="h-6 w-6 rounded-full" />
    </aside>
    <div className="flex-grow p-4 space-y-2">
      <div className="flex items-center space-x-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);
