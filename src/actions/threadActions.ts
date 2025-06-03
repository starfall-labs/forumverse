
'use server';

import { revalidatePath } from 'next/cache';
import { initialMockThreads, initialMockUsers } from '@/lib/mock-data';
import type { Thread, Comment, User } from '@/lib/types';

// Initialize global mock data store if it doesn't exist.
// This ensures data persistence across server action calls in dev mode.
if (typeof global.mockDataStore === 'undefined') {
  global.mockDataStore = {
    threads: JSON.parse(JSON.stringify(initialMockThreads)) as Thread[],
    users: JSON.parse(JSON.stringify(initialMockUsers)) as User[],
  };
}

export async function createThreadAction(formData: FormData, authorEmail: string): Promise<Thread | { error: string }> {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) {
    return { error: 'Title and content are required.' };
  }
  
  const author = global.mockDataStore.users.find(u => u.email === authorEmail);
  if (!author) {
    return { error: 'User not found.' };
  }

  const newThread: Thread = {
    id: `thread${global.mockDataStore.threads.length + 1 + Date.now()}`,
    title,
    content,
    author,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    downvotes: 0,
    comments: [],
    commentCount: 0,
  };

  global.mockDataStore.threads.unshift(newThread);

  revalidatePath('/');
  revalidatePath(`/t/${newThread.id}`);
  return newThread;
}

export async function addCommentAction(threadId: string, formData: FormData, authorEmail: string, parentId?: string | null): Promise<Comment | { error: string }> {
  const content = formData.get('content') as string;

  if (!content) {
    return { error: 'Comment content cannot be empty.' };
  }

  const author = global.mockDataStore.users.find(u => u.email === authorEmail);
  if (!author) {
    return { error: 'User not found.' };
  }
  
  const thread = global.mockDataStore.threads.find(t => t.id === threadId);
  if (!thread) {
    return { error: 'Thread not found.' };
  }

  const newComment: Comment = {
    id: `comment${Date.now()}`,
    threadId,
    parentId: parentId || null,
    author,
    content,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    downvotes: 0,
    replies: [],
  };

  if (parentId) {
    const findParentAndAddReply = (comments: Comment[]): boolean => {
      for (let c of comments) {
        if (c.id === parentId) {
          c.replies = c.replies ? [...c.replies, newComment] : [newComment];
          return true;
        }
        if (c.replies && findParentAndAddReply(c.replies)) {
          return true;
        }
      }
      return false;
    }
    findParentAndAddReply(thread.comments);
  } else {
    thread.comments.push(newComment);
  }
  thread.commentCount +=1;
  
  revalidatePath(`/t/${threadId}`);
  return newComment;
}

export async function voteThreadAction(threadId: string, type: 'upvote' | 'downvote'): Promise<void> {
  const thread = global.mockDataStore.threads.find(t => t.id === threadId);
  if (thread) {
    if (type === 'upvote') {
      thread.upvotes += 1;
    } else {
      thread.downvotes += 1;
    }
  }
  revalidatePath('/');
  revalidatePath(`/t/${threadId}`);
}

export async function voteCommentAction(threadId: string, commentId: string, type: 'upvote' | 'downvote'): Promise<void> {
  const thread = global.mockDataStore.threads.find(t => t.id === threadId);
  if (!thread) return;

  const findAndUpdateComment = (comments: Comment[]): boolean => {
    for (let c of comments) {
      if (c.id === commentId) {
        if (type === 'upvote') c.upvotes += 1;
        else c.downvotes += 1;
        return true;
      }
      if (c.replies && findAndUpdateComment(c.replies)) return true;
    }
    return false;
  }

  findAndUpdateComment(thread.comments);
  revalidatePath(`/t/${threadId}`);
}

export async function getThreadsAction(): Promise<Thread[]> {
  // Return a deep copy to prevent direct mutation issues in components if they were to receive the raw array
  return JSON.parse(JSON.stringify(global.mockDataStore.threads || []));
}

export async function getThreadByIdAction(id: string): Promise<Thread | undefined> {
  const thread = (global.mockDataStore.threads || []).find((t: Thread) => t.id === id);
  return thread ? JSON.parse(JSON.stringify(thread)) : undefined;
}

export async function getUserByUsernameAction(username: string): Promise<User | undefined> {
  const user = (global.mockDataStore.users || []).find((u: User) => u.username === username);
  return user ? JSON.parse(JSON.stringify(user)) : undefined;
}
