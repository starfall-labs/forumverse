
'use client';

import type { Thread, User } from '@/lib/types';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { voteThreadAction } from '@/actions/threadActions';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import ReactMarkdown from 'react-markdown'; 

interface ThreadViewProps {
  thread: Thread;
}

export function ThreadView({ thread }: ThreadViewProps) {
  const { t } = useTranslation();

  const handleVote = async (itemId: string, type: 'upvote' | 'downvote', voterId?: string) => {
    await voteThreadAction(itemId, type, voterId);
  };

  const getPrimaryAuthorName = (author: User): string => {
    return author.displayName || author.username;
  };
  
  const primaryAuthorName = getPrimaryAuthorName(thread.author);
  const authorUsername = thread.author.username;

  return (
    <div className="flex flex-col md:flex-row">
      {/* Desktop Vote Buttons */}
      <aside className="hidden md:flex bg-muted/50 p-4 flex-col items-center justify-start space-y-2 w-20 border-r">
        <VoteButtons
          initialUpvotes={thread.upvotes}
          initialDownvotes={thread.downvotes}
          itemId={thread.id}
          onVote={handleVote}
          orientation="vertical"
        />
      </aside>
      <article className="p-4 md:p-6 flex-grow">
        <div className="mb-3 text-sm text-muted-foreground flex items-center space-x-2">
          <UserAvatar user={thread.author} className="h-6 w-6" />
          <span>
            {t('threadView.postedBy', 'Posted by')}{' '}
            <Link href={`/u/${authorUsername}`} className="hover:underline text-foreground/90 font-medium">
                {primaryAuthorName} (u/{authorUsername})
            </Link>
          </span>
          <span>•</span>
          <time dateTime={thread.createdAt}>
            {formatDistanceToNow(new Date(thread.createdAt), { addSuffix: true })}
          </time>
        </div>

        {/* Mobile Vote Buttons - Integrated into header area */}
        <div className="md:hidden flex items-center space-x-3 mb-3 border-b pb-3">
            <VoteButtons
                initialUpvotes={thread.upvotes}
                initialDownvotes={thread.downvotes}
                itemId={thread.id}
                onVote={handleVote}
                orientation="horizontal"
                size="sm"
            />
        </div>

        <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-foreground leading-relaxed">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-bold my-4 font-headline" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-semibold my-3 font-headline" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-semibold my-2 font-headline" {...props} />,
              p: ({node, ...props}) => <p className="my-2" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside my-2" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
              li: ({node, ...props}) => <li className="my-1" {...props} />,
              a: ({node, ...props}) => <a className="text-primary hover:underline" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-muted pl-4 italic my-2 text-muted-foreground" {...props} />,
              code: ({node, inline, className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <pre className="bg-muted p-2 rounded-md my-2 overflow-x-auto"><code className={className} {...props}>{children}</code></pre>
                ) : (
                  <code className="bg-muted/50 px-1 py-0.5 rounded-sm font-code text-sm" {...props}>{children}</code>
                )
              },
              img: ({node, ...props}) => <img className="max-w-full h-auto rounded-md my-2" {...props} />,
            }}
          >
            {thread.content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
