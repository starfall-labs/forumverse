
'use client'; // Make this a client component to use the hook

import { ThreadList } from '@/components/thread/ThreadList';
import { getThreadsAction } from '@/actions/threadActions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation'; // Added
import { useEffect, useState } from 'react'; // Added
import type { Thread } from '@/lib/types'; // Added

export default function HomePage() {
  const { t, currentLanguage } = useTranslation(); // Added
  const [threads, setThreads] = useState<Thread[]>([]); // Added
  const [isLoading, setIsLoading] = useState(true); // Added

  useEffect(() => {
    async function fetchThreads() {
      setIsLoading(true);
      const fetchedThreads = await getThreadsAction();
      setThreads(fetchedThreads);
      setIsLoading(false);
    }
    fetchThreads();
  }, []);
  
  // Key for page title translation to ensure re-render on language change
  const pageTitleKey = `homePage.popularThreads.${currentLanguage}`;


  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold font-headline">{t('home.popularThreads', 'Popular Threads')}</h1>
            <Button disabled>
              <PlusCircle className="mr-2 h-5 w-5" />
              {t('home.createThreadButton', 'Create New Thread')}
            </Button>
        </div>
        {/* Skeleton loader could be added here */}
        <p className="text-center py-12 text-muted-foreground">{t('home.loadingThreads', 'Loading threads...')}</p>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold font-headline" key={pageTitleKey}>{t('home.popularThreads', 'Popular Threads')}</h1>
        <Link href="/submit" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            {t('home.createThreadButton', 'Create New Thread')}
          </Button>
        </Link>
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

// Keep dynamic rendering if you expect mock data to change via actions frequently,
// though for translations, client-side rendering with useEffect is handling data fetching.
// export const dynamic = 'force-dynamic'; // Removed as data fetching is now client-side for threads
