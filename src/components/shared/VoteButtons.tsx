
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth'; // Added

interface VoteButtonsProps {
  initialUpvotes: number;
  initialDownvotes: number;
  itemId: string;
  onVote: (itemId: string, type: 'upvote' | 'downvote', voterId?: string) => Promise<void>; // Added voterId
  orientation?: 'vertical' | 'horizontal';
  size?: 'sm' | 'default';
}

export function VoteButtons({
  initialUpvotes,
  initialDownvotes,
  itemId,
  onVote,
  orientation = 'vertical',
  size = 'default',
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const { user } = useAuth(); // Get current user

  useEffect(() => {
    setUpvotes(initialUpvotes);
    setDownvotes(initialDownvotes);
  }, [initialUpvotes, initialDownvotes]);


  const handleVote = async (type: 'upvote' | 'downvote') => {
    // Store previous state for potential revert
    const prevUpvotes = upvotes;
    const prevDownvotes = downvotes;
    const prevVoted = voted;

    // Optimistic update
    if (type === 'upvote') {
      if (voted === 'up') {
        setUpvotes(prev => prev -1);
        setVoted(null);
      } else {
        setUpvotes(prev => prev + 1);
        if (voted === 'down') setDownvotes(prev => prev - 1);
        setVoted('up');
      }
    } else { 
      if (voted === 'down') {
        setDownvotes(prev => prev -1);
        setVoted(null);
      } else {
        setDownvotes(prev => prev + 1);
        if (voted === 'up') setUpvotes(prev => prev - 1);
        setVoted('down');
      }
    }
    
    try {
      await onVote(itemId, type, user?.id); // Pass voterId
    } catch (error) {
      console.error("Vote failed:", error);
      // Revert optimistic update on error
      setUpvotes(prevUpvotes);
      setDownvotes(prevDownvotes);
      setVoted(prevVoted);
    }
  };
  
  const score = upvotes - downvotes;

  return (
    <div className={cn(
      "flex items-center gap-1",
      orientation === 'vertical' ? "flex-col" : "flex-row",
      size === 'sm' ? "text-xs" : ""
    )}>
      <Button
        variant="ghost"
        size={size === 'sm' ? "icon-sm" : "icon"}
        onClick={() => handleVote('upvote')}
        className={cn("p-1", voted === 'up' ? 'text-accent' : 'text-muted-foreground hover:text-accent', size === 'sm' ? "h-6 w-6" : "h-8 w-8")}
        aria-label="Upvote"
        disabled={!user} // Disable if not logged in
      >
        <ArrowBigUp className={cn("h-4 w-4", size === 'sm' ? "h-3 w-3" : "h-4 w-4", voted === 'up' ? 'fill-accent' : '')} />
      </Button>
      <span className={cn("font-medium tabular-nums", size === 'sm' ? "text-sm" : "text-base", score > 0 ? "text-accent" : score < 0 ? "text-blue-500" : "text-foreground")}>
        {score}
      </span>
      <Button
        variant="ghost"
        size={size === 'sm' ? "icon-sm" : "icon"}
        onClick={() => handleVote('downvote')}
        className={cn("p-1", voted === 'down' ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500', size === 'sm' ? "h-6 w-6" : "h-8 w-8")}
        aria-label="Downvote"
        disabled={!user} // Disable if not logged in
      >
        <ArrowBigDown className={cn("h-4 w-4", size === 'sm' ? "h-3 w-3" : "h-4 w-4", voted === 'down' ? 'fill-blue-500' : '')}/>
      </Button>
    </div>
  );
}
