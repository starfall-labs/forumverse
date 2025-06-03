'use server';

import { revalidatePath } from 'next/cache';
import { 
  mockThreads, 
  mockUsers, 
  addThread as addThreadToMock, 
  addComment as addCommentToMock,
  updateThreadVotes as updateThreadVotesInMock,
  updateCommentVotes as updateCommentVotesInMock
} from '@/lib/mock-data';
import type { Thread, Comment, User } from '@/lib/types';

// This is a hack to make mock data somewhat persistent across server action calls in dev mode.
// In a real app, this would be a database.
if (typeof global.mockThreads === 'undefined') {
  global.mockThreads = mockThreads;
}
if (typeof global.mockUsers === 'undefined') {
  global.mockUsers = mockUsers;
}


export async function createThreadAction(formData: FormData, authorEmail: string): Promise<Thread | { error: string }> {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) {
    return { error: 'Title and content are required.' };
  }
  
  const author = global.mockUsers.find(u => u.email === authorEmail);
  if (!author) {
    return { error: 'User not found.' };
  }

  const newThreadData = { title, content, author };
  const newThread = await addThreadToMock(newThreadData);
  global.mockThreads.unshift(newThread); // Ensure global mockThreads is updated if addThreadToMock doesn't do it.

  revalidatePath('/');
  revalidatePath(`/t/${newThread.id}`);
  return newThread;
}

export async function addCommentAction(threadId: string, formData: FormData, authorEmail: string, parentId?: string | null): Promise<Comment | { error: string }> {
  const content = formData.get('content') as string;

  if (!content) {
    return { error: 'Comment content cannot be empty.' };
  }

  const author = global.mockUsers.find(u => u.email === authorEmail);
  if (!author) {
    return { error: 'User not found.' };
  }
  
  const commentData = { content, author };
  const newComment = await addCommentToMock(threadId, commentData, parentId);

  if (!newComment) {
    return { error: 'Failed to add comment or thread not found.' };
  }
  
  // Update global.mockThreads
  const threadIndex = global.mockThreads.findIndex(t => t.id === threadId);
  if (threadIndex !== -1) {
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
        findParentAndAddReply(global.mockThreads[threadIndex].comments);
      } else {
        global.mockThreads[threadIndex].comments.push(newComment);
      }
      global.mockThreads[threadIndex].commentCount +=1;
  }


  revalidatePath(`/t/${threadId}`);
  return newComment;
}

export async function voteThreadAction(threadId: string, type: 'upvote' | 'downvote'): Promise<void> {
  const updatedThread = await updateThreadVotesInMock(threadId, type);
  if (updatedThread) {
    const index = global.mockThreads.findIndex(t => t.id === threadId);
    if (index !== -1) {
      global.mockThreads[index] = updatedThread;
    }
  }
  revalidatePath('/');
  revalidatePath(`/t/${threadId}`);
}

export async function voteCommentAction(threadId: string, commentId: string, type: 'upvote' | 'downvote'): Promise<void> {
  await updateCommentVotesInMock(threadId, commentId, type);
  // Need to re-fetch/update the specific comment in global.mockThreads if necessary,
  // but updateCommentVotesInMock already modifies the mock data structure.
  revalidatePath(`/t/${threadId}`);
}

// These are needed because server actions are run in a separate context from the module cache sometimes
// This ensures that components calling these functions get the most up-to-date mock data
export async function getThreadsAction(): Promise<Thread[]> {
  return JSON.parse(JSON.stringify(global.mockThreads || []));
}

export async function getThreadByIdAction(id: string): Promise<Thread | undefined> {
  const thread = (global.mockThreads || []).find((t: Thread) => t.id === id);
  return thread ? JSON.parse(JSON.stringify(thread)) : undefined;
}
