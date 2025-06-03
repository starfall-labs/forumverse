
'use client'; // Make this a client component to use the hook

import { getThreadByIdAction } from '@/actions/threadActions';
import { ThreadView } from '@/components/thread/ThreadView';
import { CommentSection } from '@/components/comment/CommentSection';
import { notFound, useParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SummarizeButton } from '@/components/thread/SummarizeButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';
import type { Thread } from '@/lib/types';
import { useEffect, useState } from 'react';


export default function ThreadPage() {
  const params = useParams();
  const threadId = params.threadId as string;
  const { t } = useTranslation();
  const [thread, setThread] = useState<Thread | null | undefined>(undefined); // undefined for loading, null for not found

  useEffect(() => {
    async function fetchThread() {
      if (threadId) {
        const fetchedThread = await getThreadByIdAction(threadId);
        setThread(fetchedThread);
      }
    }
    fetchThread();
  }, [threadId]);

  if (thread === undefined) {
    // Loading state
    return (
        <div className="space-y-6">
         <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 p-4 border-b animate-pulse">
                <div className="h-8 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="p-6 space-y-4 animate-pulse">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-6 bg-muted rounded w-full"></div>
                    <div className="h-6 bg-muted rounded w-5/6"></div>
                    <div className="h-6 bg-muted rounded w-full"></div>
                </div>
            </CardContent>
        </Card>
        <Separator />
        <div>
            <h2 className="text-2xl font-semibold mb-4 font-headline animate-pulse">
                <span className="h-7 bg-muted rounded w-1/3 inline-block"></span>
            </h2>
            {/* Skeleton for comment section */}
        </div>
        </div>
    );
  }

  if (!thread) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 p-4 border-b">
           <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-bold font-headline flex-grow">{thread.title}</CardTitle>
             <SummarizeButton threadContent={thread.content} threadTitle={thread.title} />
           </div>
        </CardHeader>
        <CardContent className="p-0">
           <ThreadView thread={thread} />
        </CardContent>
      </Card>
      
      <Separator />
      
      <div id="comments">
        <h2 className="text-2xl font-semibold mb-4 font-headline">
          {t('threadPage.commentsHeading', 'Comments')} ({thread.commentCount})
        </h2>
        <CommentSection threadId={thread.id} comments={thread.comments} />
      </div>
    </div>
  );
}

// Removed dynamic export as data fetching is now client-side
// export const dynamic = 'force-dynamic';

    