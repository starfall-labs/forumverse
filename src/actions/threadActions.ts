
'use server';

import { revalidatePath } from 'next/cache';
import { initialMockThreads, initialMockUsers } from '@/lib/mock-data';
import type { Thread, Comment, User, Notification, NotificationType, NotificationEntityType } from '@/lib/types';
import { PREDEFINED_TRANSLATIONS_EN } from '@/lib/translations-en'; // For generating default content

// Initialize global mock data store if it doesn't exist.
if (typeof global.mockDataStore === 'undefined') {
  const initialUsersWithFollow = initialMockUsers.map(u => ({
    ...u,
    followingIds: u.followingIds || [],
    followerIds: u.followerIds || [],
  }));

  global.mockDataStore = {
    threads: JSON.parse(JSON.stringify(initialMockThreads)) as Thread[],
    users: JSON.parse(JSON.stringify(initialUsersWithFollow)) as User[],
    notifications: [] as Notification[], // Initialize notifications
  };
}

// Helper to get a user by ID (simulating DB access)
function findUserById(userId: string): User | undefined {
  return global.mockDataStore.users.find(u => u.id === userId);
}

// Helper function to create and store a notification
function createMockNotification(
  recipientId: string,
  type: NotificationType,
  actorId: string | null,
  entityId: string, // ID of the item being acted upon (thread, comment, or user being followed)
  entityType: NotificationEntityType,
  relatedEntityId?: string | null, // e.g., threadId if entityType is 'comment'
  contentKey?: string, 
  contentArgs?: Record<string, string>
): Notification | null {
  if (actorId === recipientId && type !== NotificationType.USER_FOLLOWED_YOU) { 
    if (type === NotificationType.THREAD_UPVOTE || type === NotificationType.THREAD_DOWNVOTE ||
        type === NotificationType.COMMENT_UPVOTE || type === NotificationType.COMMENT_DOWNVOTE) {
      return null;
    }
  }

  const actor = actorId ? findUserById(actorId) : null;
  const actorName = actor?.displayName || actor?.username || 'Someone';
  let link = '/';

  const threadForContent = entityType === 'thread' ? global.mockDataStore.threads.find(t => t.id === entityId) : 
                           (entityType === 'comment' && relatedEntityId) ? global.mockDataStore.threads.find(t => t.id === relatedEntityId) : null;
  const threadTitle = threadForContent?.title || 'a thread';

  switch (type) {
    case NotificationType.NEW_THREAD_FROM_FOLLOWED_USER:
      link = `/t/${entityId}`;
      break;
    case NotificationType.NEW_COMMENT_ON_THREAD:
      link = `/t/${relatedEntityId}#comment-${entityId}`;
      break;
    case NotificationType.NEW_REPLY_TO_COMMENT:
      link = `/t/${relatedEntityId}#comment-${entityId}`;
      break;
    case NotificationType.USER_FOLLOWED_YOU:
      link = `/u/${actor?.username}`;
      break;
    case NotificationType.THREAD_UPVOTE:
    case NotificationType.THREAD_DOWNVOTE:
      link = `/t/${entityId}`;
      break;
    case NotificationType.COMMENT_UPVOTE:
    case NotificationType.COMMENT_DOWNVOTE:
      link = `/t/${relatedEntityId}#comment-${entityId}`;
      break;
    default:
      return null; 
  }
  
  const finalContentKey = contentKey || `notification.default.${type}`; 
  const finalContentArgs = contentArgs || { actorName, itemTitle: entityType === 'thread' ? threadTitle : (entityType === 'comment' ? "your comment" : "you") };


  const newNotification: Notification = {
    id: `notif${Date.now()}${Math.random()}`,
    userId: recipientId,
    type,
    actorId,
    entityId,
    entityType,
    relatedEntityId,
    contentKey: finalContentKey,
    contentArgs: finalContentArgs,
    link,
    createdAt: new Date().toISOString(),
    isRead: false,
  };

  global.mockDataStore.notifications.unshift(newNotification);
  revalidatePath('/notifications'); 
  revalidatePath('/api/unread-notifications'); // For potential API endpoint if Navbar fetches directly
  return newNotification;
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

  author.followerIds?.forEach(followerId => {
    createMockNotification(
      followerId,
      NotificationType.NEW_THREAD_FROM_FOLLOWED_USER,
      author.id,
      newThread.id,
      'thread',
      null,
      'notification.newThreadFromFollowedUser',
      { actorName: author.displayName || author.username, threadTitle: newThread.title}
    );
  });

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

  let parentCommentAuthorId: string | null = null;

  if (parentId) {
    const findParentAndAddReply = (comments: Comment[]): boolean => {
      for (let c of comments) {
        if (c.id === parentId) {
          c.replies = c.replies ? [...c.replies, newComment] : [newComment];
          parentCommentAuthorId = c.author.id;
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
  
  if (thread.author.id !== author.id) {
    createMockNotification(
      thread.author.id,
      NotificationType.NEW_COMMENT_ON_THREAD,
      author.id,
      newComment.id,
      'comment',
      thread.id,
      'notification.newCommentOnThread',
      { actorName: author.displayName || author.username, threadTitle: thread.title }
    );
  }

  if (parentId && parentCommentAuthorId && parentCommentAuthorId !== author.id) {
    createMockNotification(
      parentCommentAuthorId,
      NotificationType.NEW_REPLY_TO_COMMENT,
      author.id,
      newComment.id,
      'comment',
      thread.id,
      'notification.newReplyToComment',
      { actorName: author.displayName || author.username, threadTitle: thread.title }
    );
  }
  
  revalidatePath(`/t/${threadId}`);
  return newComment;
}

export async function voteThreadAction(threadId: string, type: 'upvote' | 'downvote', voterId?: string): Promise<void> {
  const thread = global.mockDataStore.threads.find(t => t.id === threadId);
  if (thread) {
    if (type === 'upvote') {
      thread.upvotes += 1;
    } else {
      thread.downvotes += 1;
    }

    if (voterId && thread.author.id !== voterId) {
      const voter = findUserById(voterId);
      createMockNotification(
        thread.author.id,
        type === 'upvote' ? NotificationType.THREAD_UPVOTE : NotificationType.THREAD_DOWNVOTE,
        voterId,
        thread.id,
        'thread',
        null,
        type === 'upvote' ? 'notification.threadUpvoted' : 'notification.threadDownvoted',
        { actorName: voter?.displayName || voter?.username || "Someone", threadTitle: thread.title }
      );
    }
  }
  revalidatePath('/');
  revalidatePath(`/t/${threadId}`);
}

export async function voteCommentAction(threadId: string, commentId: string, type: 'upvote' | 'downvote', voterId?: string): Promise<void> {
  const thread = global.mockDataStore.threads.find(t => t.id === threadId);
  if (!thread) return;

  let targetComment: Comment | null = null;
  const findComment = (comments: Comment[]): Comment | null => {
    for (let c of comments) {
      if (c.id === commentId) return c;
      if (c.replies) {
        const foundInReply = findComment(c.replies);
        if (foundInReply) return foundInReply;
      }
    }
    return null;
  }
  targetComment = findComment(thread.comments);

  if (targetComment) {
    if (type === 'upvote') {
      targetComment.upvotes += 1;
    } else {
      targetComment.downvotes += 1;
    }

    if (voterId && targetComment.author.id !== voterId) {
      const voter = findUserById(voterId);
      createMockNotification(
        targetComment.author.id,
        type === 'upvote' ? NotificationType.COMMENT_UPVOTE : NotificationType.COMMENT_DOWNVOTE,
        voterId,
        targetComment.id,
        'comment',
        thread.id, 
        type === 'upvote' ? 'notification.commentUpvoted' : 'notification.commentDownvoted',
        { actorName: voter?.displayName || voter?.username || "Someone", threadTitle: thread.title }
      );
    }
  }
  revalidatePath(`/t/${threadId}`);
}


export async function getThreadsAction(): Promise<Thread[]> {
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

export async function getUserByIdAction(userId: string): Promise<User | undefined> {
  const user = (global.mockDataStore.users || []).find((u: User) => u.id === userId);
  return user ? JSON.parse(JSON.stringify(user)) : undefined;
}

export async function getThreadsByAuthorUsernameAction(username: string): Promise<Thread[]> {
  const user = (global.mockDataStore.users || []).find((u: User) => u.username === username);
  if (!user) {
    return [];
  }
  const userThreads = (global.mockDataStore.threads || []).filter((t: Thread) => t.author.id === user.id);
  return JSON.parse(JSON.stringify(userThreads));
}

export async function followUserAction(targetUserId: string, currentUserId: string): Promise<{ success: boolean, error?: string }> {
  const targetUser = global.mockDataStore.users.find(u => u.id === targetUserId);
  const currentUser = global.mockDataStore.users.find(u => u.id === currentUserId);

  if (!targetUser || !currentUser) {
    return { success: false, error: 'User not found.' };
  }

  if (currentUser.followingIds?.includes(targetUserId)) {
    return { success: false, error: 'Already following this user.' };
  }

  currentUser.followingIds = [...(currentUser.followingIds || []), targetUserId];
  targetUser.followerIds = [...(targetUser.followerIds || []), currentUserId];

  createMockNotification(
    targetUserId,
    NotificationType.USER_FOLLOWED_YOU,
    currentUserId,
    currentUserId, 
    'user',
    null,
    'notification.userFollowedYou',
    { actorName: currentUser.displayName || currentUser.username }
  );
  
  revalidatePath(`/u/${targetUser.username}`);
  revalidatePath(`/u/${currentUser.username}`);
  return { success: true };
}

export async function unfollowUserAction(targetUserId: string, currentUserId: string): Promise<{ success: boolean, error?: string }> {
  const targetUser = global.mockDataStore.users.find(u => u.id === targetUserId);
  const currentUser = global.mockDataStore.users.find(u => u.id === currentUserId);

  if (!targetUser || !currentUser) {
    return { success: false, error: 'User not found.' };
  }

  currentUser.followingIds = (currentUser.followingIds || []).filter(id => id !== targetUserId);
  targetUser.followerIds = (targetUser.followerIds || []).filter(id => id !== currentUserId);
  
  revalidatePath(`/u/${targetUser.username}`);
  revalidatePath(`/u/${currentUser.username}`);
  return { success: true };
}

export async function getNotificationsForUserAction(userId: string): Promise<Notification[]> {
  const userNotifications = (global.mockDataStore.notifications || []).filter(n => n.userId === userId);
  return JSON.parse(JSON.stringify(userNotifications));
}

export async function getUnreadNotificationCountAction(userId: string): Promise<number> {
  const userNotifications = (global.mockDataStore.notifications || []).filter(n => n.userId === userId && !n.isRead);
  return userNotifications.length;
}

export async function markNotificationAsReadAction(notificationId: string, userId: string): Promise<void> {
  const notification = (global.mockDataStore.notifications || []).find(n => n.id === notificationId && n.userId === userId);
  if (notification) {
    notification.isRead = true;
  }
  revalidatePath('/notifications');
}

export async function markAllNotificationsAsReadAction(userId: string): Promise<void> {
  (global.mockDataStore.notifications || []).forEach(n => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  revalidatePath('/notifications');
}

    