
import type { Thread } from '@/lib/types';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { voteThreadAction } from '@/actions/threadActions';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from '@/components/shared/UserAvatar';

interface ThreadItemProps {
  thread: Thread;
}

export function ThreadItem({ thread }: ThreadItemProps) {

  const handleVote = async (itemId: string, type: 'upvote' | 'downvote') => {
    await voteThreadAction(itemId, type);
  };

  const authorDisplay = thread.author.displayName || thread.author.username;

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex">
        <aside className="bg-muted/50 p-3 flex flex-col items-center justify-start space-y-2 w-16">
           <VoteButtons
            initialUpvotes={thread.upvotes}
            initialDownvotes={thread.downvotes}
            itemId={thread.id}
            onVote={handleVote}
          />
        </aside>
        <div className="flex-grow">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="text-xs text-muted-foreground flex items-center space-x-2">
              <UserAvatar user={thread.author} className="h-5 w-5" />
              <span>Posted by {authorDisplay} (u/{thread.author.username})</span>
              <span>•</span>
              <time dateTime={thread.createdAt}>
                {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
              </time>
            </div>
            <CardTitle className="text-xl mt-1 font-headline">
              <Link href={`/t/${thread.id}`} className="hover:text-primary transition-colors">
                {thread.title}
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 text-sm text-foreground/80 line-clamp-2">
            {thread.content}
          </CardContent>
          <CardFooter className="px-4 pb-3">
            <Link href={`/t/${thread.id}#comments`} passHref>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                <MessageSquare className="mr-2 h-4 w-4" />
                {thread.commentCount} Comments
              </Button>
            </Link>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
