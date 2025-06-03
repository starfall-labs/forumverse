
'use client';

import type { Comment as CommentType, User } from '@/lib/types';
import { useState } from 'react';
import { Card, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { VoteButtons } from '@/components/shared/VoteButtons';
import { voteCommentAction } from '@/actions/threadActions';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquareReply } from 'lucide-react';
import { CommentForm } from './CommentForm';

interface CommentItemProps {
  comment: CommentType;
  threadId: string;
  depth?: number;
}

export function CommentItem({ comment, threadId, depth = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleVote = async (itemId: string, type: 'upvote' | 'downvote') => {
    await voteCommentAction(threadId, itemId, type);
  };

  const cardPaddingLeft = depth > 0 ? `pl-${2 + depth * 4}` : 'pl-2';

  const authorDisplay = (author: User) => {
    return author.displayName || author.username;
  };


  return (
    <Card className={`overflow-hidden shadow-sm ${depth > 0 ? 'ml-4 md:ml-8 border-l-2' : ''}`}>
      <div className="flex">
         <aside className={`bg-muted/30 p-2 flex flex-col items-center justify-start space-y-1 w-12 ${depth > 0 ? 'border-r' : ''}`}>
           <VoteButtons
            initialUpvotes={comment.upvotes}
            initialDownvotes={comment.downvotes}
            itemId={comment.id}
            onVote={handleVote}
            orientation="vertical"
            size="sm"
          />
        </aside>
        <div className={`flex-grow ${cardPaddingLeft} pr-2 py-2`}>
            <div className="flex items-center space-x-2 mb-1">
              <UserAvatar user={comment.author} className="h-5 w-5" />
              <span className="text-xs font-medium">{authorDisplay(comment.author)} (u/{comment.author.username})</span>
              <span className="text-xs text-muted-foreground">•</span>
              <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </time>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
          <CardFooter className="p-0 pt-2 flex justify-start">
            <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(!showReplyForm)} className="text-xs text-muted-foreground hover:text-primary">
              <MessageSquareReply className="mr-1 h-3 w-3" /> Reply
            </Button>
          </CardFooter>

          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                threadId={threadId}
                parentId={comment.id}
                onCommentAdded={() => setShowReplyForm(false)}
              />
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} threadId={threadId} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
