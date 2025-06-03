
'use client';

import type { Thread, User } from '@/lib/types';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { voteThreadAction } from '@/actions/threadActions';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import ReactMarkdown from 'react-markdown'; // Added

interface ThreadViewProps {
  thread: Thread;
}

export function ThreadView({ thread }: ThreadViewProps) {
  const { t } = useTranslation();

  const handleVote = async (itemId: string, type: 'upvote' | 'downvote') => {
    await voteThreadAction(itemId, type);
  };

  const getPrimaryAuthorName = (author: User): string => {
    return author.displayName || author.username;
  };
  
  const primaryAuthorName = getPrimaryAuthorName(thread.author);
  const authorUsername = thread.author.username;

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

        <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-foreground leading-relaxed">
          {/* Replace direct content rendering with ReactMarkdown */}
          <ReactMarkdown
            components={{
              // Add Tailwind classes to common Markdown elements
              // You might want to expand this or use @tailwindcss/typography plugin for more comprehensive styling
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
                  // For block code, you might want a more sophisticated highlighter
                  // For now, just a preformatted block
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
