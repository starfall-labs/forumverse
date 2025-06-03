
import type { Thread, User } from '@/lib/types';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { voteThreadAction } from '@/actions/threadActions';
import { formatDistanceToNow } from 'date-fns';

interface ThreadViewProps {
  thread: Thread;
}

export function ThreadView({ thread }: ThreadViewProps) {

  const handleVote = async (itemId: string, type: 'upvote' | 'downvote') => {
    await voteThreadAction(itemId, type);
  };

  const authorDisplay = (author: User) => {
    return author.displayName || author.username;
  };

  return (
    <div className="flex">
      <aside className="bg-muted/50 p-4 flex flex-col items-center justify-start space-y-2 w-20 border-r">
        <VoteButtons
          initialUpvotes={thread.upvotes}
          initialDownvotes={thread.downvotes}
          itemId={thread.id}
          onVote={handleVote}
        />
      </aside>
      <article className="p-6 flex-grow">
        <div className="mb-3 text-sm text-muted-foreground flex items-center space-x-2">
          <UserAvatar user={thread.author} className="h-6 w-6" />
          <span>Posted by {authorDisplay(thread.author)} (u/{thread.author.username})</span>
          <span>•</span>
          <time dateTime={thread.createdAt}>
            {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
          </time>
        </div>

        {/* Thread title is typically in the page title, so not repeated here unless design changes */}
        {/* <h1 className="text-3xl font-bold mb-4 font-headline">{thread.title}</h1> */}

        <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
          {thread.content}
        </div>
      </article>
    </div>
  );
}
