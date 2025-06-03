import type { Thread } from '@/lib/types';
import { ThreadItem } from './ThreadItem';

interface ThreadListProps {
  threads: Thread[];
}

export function ThreadList({ threads }: ThreadListProps) {
  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <ThreadItem key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
