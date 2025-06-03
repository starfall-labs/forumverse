import { ThreadList } from '@/components/thread/ThreadList';
import { getThreadsAction } from '@/actions/threadActions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';

export default async function HomePage() {
  const threads = await getThreadsAction();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Popular Threads</h1>
        <Link href="/submit" passHref>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Create New Thread
          </Button>
        </Link>
      </div>
      {threads.length > 0 ? (
        <ThreadList threads={threads} />
      ) : (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-muted-foreground">No threads yet.</h2>
          <p className="text-muted-foreground mt-2">Be the first to start a discussion!</p>
          <Link href="/submit" passHref>
            <Button className="mt-6">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Thread
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// Ensure the page is dynamically rendered to reflect mock data changes
export const dynamic = 'force-dynamic';
