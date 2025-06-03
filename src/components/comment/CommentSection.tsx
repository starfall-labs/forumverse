import type { Comment as CommentType } from '@/lib/types';
import { CommentItem } from './CommentItem';
import { CommentForm } from './CommentForm';
import { Card, CardContent } from '@/components/ui/card';

interface CommentSectionProps {
  threadId: string;
  comments: CommentType[];
}

export function CommentSection({ threadId, comments }: CommentSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4 font-headline">Leave a comment</h3>
          <CommentForm threadId={threadId} />
        </CardContent>
      </Card>
      
      {comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} threadId={threadId} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to share your thoughts!</p>
      )}
    </div>
  );
}
