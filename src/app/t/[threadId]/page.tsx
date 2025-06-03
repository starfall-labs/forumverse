import { getThreadByIdAction } from '@/actions/threadActions';
import { ThreadView } from '@/components/thread/ThreadView';
import { CommentSection } from '@/components/comment/CommentSection';
import { notFound } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { SummarizeButton } from '@/components/thread/SummarizeButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ThreadPageProps {
  params: {
    threadId: string;
  };
}

export default async function ThreadPage({ params }: ThreadPageProps) {
  const thread = await getThreadByIdAction(params.threadId);

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
        <h2 className="text-2xl font-semibold mb-4 font-headline">Comments ({thread.commentCount})</h2>
        <CommentSection threadId={thread.id} comments={thread.comments} />
      </div>
    </div>
  );
}

// Ensure the page is dynamically rendered to reflect mock data changes
export const dynamic = 'force-dynamic';
