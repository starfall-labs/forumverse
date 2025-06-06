'use server';

import { revalidatePath } from 'next/cache';
import { db, schema } from '@/lib/db';
import { eq, and, isNull, desc, asc, sql, inArray } from 'drizzle-orm';
import type { Thread, Comment, User, Notification, NotificationType, NotificationEntityType, UpdateProfileData } from '@/lib/types';
import { PREDEFINED_TRANSLATIONS_EN } from '@/lib/translations-en';

const DELETED_USER_PLACEHOLDER: User = {
  id: 'deleted_user_placeholder',
  username: 'deleted_user',
  displayName: 'Deleted User',
  email: 'deleted@example.com',
  avatarUrl: 'https://placehold.co/40x40.png?text=X',
  createdAt: new Date(0).toISOString(),
  isAdmin: false,
  isOwner: false,
  followerIds: [],
  followingIds: [],
};

// Helper to get a user by ID
async function findUserById(userId: string): Promise<User | undefined> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    with: {
      followedBy: true,
      following: true,
    }
  });

  if (!user) return undefined;

  // Chuyển đổi từ dạng DB sang dạng User
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email,
    avatarUrl: user.avatarUrl || `https://placehold.co/40x40.png?text=${(user.displayName || user.username).charAt(0).toUpperCase()}`,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin || false,
    isOwner: user.isOwner || false,
    followerIds: user.followedBy.map(f => f.followerId),
    followingIds: user.following.map(f => f.followingId),
    password: user.password, // Chỉ sử dụng nội bộ
  };
}

// Helper để lấy thông tin thread đầy đủ
async function getThreadWithDetails(threadId: string): Promise<Thread | null> {
  const thread = await db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    with: {
      author: true,
      comments: {
        where: isNull(schema.comments.parentId),
        with: {
          author: true,
          replies: {
            with: {
              author: true,
            }
          }
        },
        orderBy: [desc(schema.comments.createdAt)]
      }
    }
  });

  if (!thread) return null;

  // Chuyển đổi từ dạng DB sang dạng Thread
  const authorUser: User = {
    id: thread.author.id,
    username: thread.author.username,
    displayName: thread.author.displayName || thread.author.username,
    email: thread.author.email,
    avatarUrl: thread.author.avatarUrl || `https://placehold.co/40x40.png?text=${(thread.author.displayName || thread.author.username).charAt(0).toUpperCase()}`,
    createdAt: thread.author.createdAt,
    isAdmin: thread.author.isAdmin || false,
    isOwner: thread.author.isOwner || false,
    followerIds: [],
    followingIds: [],
  };

  // Hàm đệ quy để chuyển đổi comments
  const mapComments = (comments: any[]): Comment[] => {
    return comments.map(comment => {
      const authorUser: User = {
        id: comment.author.id,
        username: comment.author.username,
        displayName: comment.author.displayName || comment.author.username,
        email: comment.author.email,
        avatarUrl: comment.author.avatarUrl || `https://placehold.co/40x40.png?text=${(comment.author.displayName || comment.author.username).charAt(0).toUpperCase()}`,
        createdAt: comment.author.createdAt,
        isAdmin: comment.author.isAdmin || false,
        isOwner: comment.author.isOwner || false,
        followerIds: [],
        followingIds: [],
      };

      return {
        id: comment.id,
        threadId: comment.threadId,
        parentId: comment.parentId,
        author: authorUser,
        content: comment.content,
        createdAt: comment.createdAt,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
        replies: comment.replies ? mapComments(comment.replies) : [],
      };
    });
  };

  return {
    id: thread.id,
    title: thread.title,
    content: thread.content,
    author: authorUser,
    createdAt: thread.createdAt,
    upvotes: thread.upvotes,
    downvotes: thread.downvotes,
    comments: mapComments(thread.comments),
    commentCount: thread.commentCount,
  };
}

async function createNotification(
  recipientId: string,
  type: NotificationType,
  actorId: string | null,
  entityId: string, 
  entityType: NotificationEntityType,
  relatedEntityId?: string | null, 
  contentKey?: string, 
  contentArgs?: Record<string, string>
): Promise<Notification | null> {
  if (actorId === recipientId && type !== NotificationType.USER_FOLLOWED_YOU) { 
    if (type === NotificationType.THREAD_UPVOTE || type === NotificationType.THREAD_DOWNVOTE ||
        type === NotificationType.COMMENT_UPVOTE || type === NotificationType.COMMENT_DOWNVOTE) {
      return null;
    }
  }

  const actor = actorId ? await findUserById(actorId) : null;
  const actorName = actor?.displayName || actor?.username || 'Someone';
  let link = '/';

  let threadTitle = 'a thread';
  
  if (entityType === 'thread') {
    const thread = await db.query.threads.findFirst({
      where: eq(schema.threads.id, entityId),
      columns: { title: true }
    });
    if (thread) threadTitle = thread.title;
  } else if (entityType === 'comment' && relatedEntityId) {
    const thread = await db.query.threads.findFirst({
      where: eq(schema.threads.id, relatedEntityId),
      columns: { title: true }
    });
    if (thread) threadTitle = thread.title;
  }

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

  const notificationId = `notif${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
  
  // Lưu notification vào database
  await db.insert(schema.notifications).values({
    id: notificationId,
    userId: recipientId,
    type: type as string,
    actorId,
    entityId,
    entityType,
    relatedEntityId,
    contentKey: finalContentKey,
    contentArgs: JSON.stringify(finalContentArgs),
    link,
    createdAt: new Date().toISOString(),
    isRead: false,
  });

  // Lấy notification vừa tạo
  const newNotification = await db.query.notifications.findFirst({
    where: eq(schema.notifications.id, notificationId)
  });

  if (!newNotification) return null;

  // Chuyển đổi từ dạng DB sang dạng Notification
  const notification: Notification = {
    id: newNotification.id,
    userId: newNotification.userId,
    type: newNotification.type as NotificationType,
    actorId: newNotification.actorId,
    entityId: newNotification.entityId,
    entityType: newNotification.entityType as NotificationEntityType,
    relatedEntityId: newNotification.relatedEntityId,
    contentKey: newNotification.contentKey,
    contentArgs: JSON.parse(newNotification.contentArgs || '{}'),
    link: newNotification.link,
    createdAt: newNotification.createdAt,
    isRead: newNotification.isRead,
  };

  revalidatePath('/notifications'); 
  revalidatePath('/api/unread-notifications'); 
  return notification;
}

export async function createThreadAction(formData: FormData, authorEmail: string): Promise<Thread | { error: string }> {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.titleContentRequired'] || 'Title and content are required.' };
  }
  
  // Tìm user theo email
  const author = await db.query.users.findFirst({
    where: eq(schema.users.email, authorEmail),
    with: {
      followedBy: true
    }
  });

  if (!author) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  const threadId = `thread${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
  
  // Tạo thread mới
  await db.insert(schema.threads).values({
    id: threadId,
    title,
    content,
    authorId: author.id,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    downvotes: 0,
    commentCount: 0,
  });

  // Lấy thread vừa tạo
  const thread = await getThreadWithDetails(threadId);
  
  if (!thread) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.threadCreationFailed'] || 'Failed to create thread.' };
  }

  // Gửi thông báo cho người theo dõi
  for (const follower of author.followedBy) {
    await createNotification(
      follower.followerId,
      NotificationType.NEW_THREAD_FROM_FOLLOWED_USER,
      author.id,
      threadId,
      'thread',
      null,
      'notification.newThreadFromFollowedUser',
      { actorName: author.displayName || author.username || 'Someone', threadTitle: title }
    );
  }

  revalidatePath('/');
  revalidatePath(`/t/${threadId}`);
  return thread;
}

export async function addCommentAction(threadId: string, formData: FormData, authorEmail: string, parentId?: string | null): Promise<Comment | { error: string }> {
  const content = formData.get('content') as string;

  if (!content) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.commentEmpty'] || 'Comment content cannot be empty.' };
  }

  // Tìm user theo email
  const author = await db.query.users.findFirst({
    where: eq(schema.users.email, authorEmail)
  });

  if (!author) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }
  
  // Tìm thread
  const thread = await db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    with: {
      author: true
    }
  });

  if (!thread) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.threadNotFound'] || 'Thread not found.' };
  }

  const commentId = `comment${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
  
  // Tạo comment mới
  await db.insert(schema.comments).values({
    id: commentId,
    threadId,
    parentId: parentId || null,
    authorId: author.id,
    content,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    downvotes: 0,
  });

  // Cập nhật số lượng comment của thread
  await db.update(schema.threads)
    .set({ commentCount: thread.commentCount + 1 })
    .where(eq(schema.threads.id, threadId));

  let parentCommentAuthorId: string | null = null;
  
  // Nếu là reply, tìm parent comment
  if (parentId) {
    const parentComment = await db.query.comments.findFirst({
      where: eq(schema.comments.id, parentId),
      columns: { authorId: true }
    });
    
    if (parentComment) {
      parentCommentAuthorId = parentComment.authorId;
    }
  }

  // Lấy comment vừa tạo
  const comment = await db.query.comments.findFirst({
    where: eq(schema.comments.id, commentId),
    with: {
      author: true
    }
  });

  if (!comment) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.commentCreationFailed'] || 'Failed to create comment.' };
  }

  // Chuyển đổi từ dạng DB sang dạng Comment
  const newComment: Comment = {
    id: comment.id,
    threadId: comment.threadId,
    parentId: comment.parentId,
    author: {
      id: comment.author.id,
      username: comment.author.username,
      displayName: comment.author.displayName || comment.author.username,
      email: comment.author.email,
      avatarUrl: comment.author.avatarUrl || `https://placehold.co/40x40.png?text=${(comment.author.displayName || comment.author.username).charAt(0).toUpperCase()}`,
      createdAt: comment.author.createdAt,
      isAdmin: comment.author.isAdmin || false,
      isOwner: comment.author.isOwner || false,
      followerIds: [],
      followingIds: [],
    },
    content: comment.content,
    createdAt: comment.createdAt,
    upvotes: comment.upvotes,
    downvotes: comment.downvotes,
    replies: [],
  };
  
  // Gửi thông báo cho chủ thread
  if (thread.author.id !== author.id) {
    await createNotification(
      thread.author.id,
      NotificationType.NEW_COMMENT_ON_THREAD,
      author.id,
      commentId,
      'comment',
      threadId,
      'notification.newCommentOnThread',
      { actorName: author.displayName || author.username || 'Someone', threadTitle: thread.title }
    );
  }

  // Gửi thông báo cho chủ comment nếu là reply
  if (parentId && parentCommentAuthorId && parentCommentAuthorId !== author.id && parentCommentAuthorId !== DELETED_USER_PLACEHOLDER.id) {
    await createNotification(
      parentCommentAuthorId,
      NotificationType.NEW_REPLY_TO_COMMENT,
      author.id,
      commentId,
      'comment',
      threadId,
      'notification.newReplyToComment',
      { actorName: author.displayName || author.username || 'Someone', threadTitle: thread.title }
    );
  }
  
  revalidatePath(`/t/${threadId}`);
  return newComment;
}

export async function voteThreadAction(threadId: string, type: 'upvote' | 'downvote', voterId?: string): Promise<void> {
  // Tìm thread
  const thread = await db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    with: {
      author: true
    }
  });

  if (!thread) return;

  // Cập nhật số lượng vote
  if (type === 'upvote') {
    await db.update(schema.threads)
      .set({ upvotes: thread.upvotes + 1 })
      .where(eq(schema.threads.id, threadId));
  } else {
    await db.update(schema.threads)
      .set({ downvotes: thread.downvotes + 1 })
      .where(eq(schema.threads.id, threadId));
  }

  // Gửi thông báo cho chủ thread
  if (voterId && thread.author.id !== voterId && thread.author.id !== DELETED_USER_PLACEHOLDER.id) {
    const voter = voterId ? await findUserById(voterId) : null;
    await createNotification(
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

  revalidatePath('/');
  revalidatePath(`/t/${threadId}`);
}

export async function voteCommentAction(threadId: string, commentId: string, type: 'upvote' | 'downvote', voterId?: string): Promise<void> {
  // Tìm thread và comment
  const thread = await db.query.threads.findFirst({
    where: eq(schema.threads.id, threadId),
    columns: { title: true }
  });

  if (!thread) return;

  const comment = await db.query.comments.findFirst({
    where: eq(schema.comments.id, commentId),
    with: {
      author: true
    }
  });

  if (!comment) return;

  // Cập nhật số lượng vote
  if (type === 'upvote') {
    await db.update(schema.comments)
      .set({ upvotes: comment.upvotes + 1 })
      .where(eq(schema.comments.id, commentId));
  } else {
    await db.update(schema.comments)
      .set({ downvotes: comment.downvotes + 1 })
      .where(eq(schema.comments.id, commentId));
  }

  // Gửi thông báo cho chủ comment
  if (voterId && comment.author.id !== voterId && comment.author.id !== DELETED_USER_PLACEHOLDER.id) {
    const voter = voterId ? await findUserById(voterId) : null;
    await createNotification(
      comment.author.id,
      type === 'upvote' ? NotificationType.COMMENT_UPVOTE : NotificationType.COMMENT_DOWNVOTE,
      voterId,
      commentId,
      'comment',
      threadId,
      type === 'upvote' ? 'notification.commentUpvoted' : 'notification.commentDownvoted',
      { actorName: voter?.displayName || voter?.username || "Someone", threadTitle: thread.title }
    );
  }

  revalidatePath(`/t/${threadId}`);
}

export async function getThreadsAction(): Promise<Thread[]> {
  const threads = await db.query.threads.findMany({
    orderBy: [desc(schema.threads.createdAt)],
    with: {
      author: true,
      comments: {
        with: {
          author: true,
          replies: {
            with: {
              author: true
            }
          }
        }
      }
    }
  });

  // Chuyển đổi từ dạng DB sang dạng Thread
  return threads.map(thread => {
    const authorUser: User = {
      id: thread.author.id,
      username: thread.author.username,
      displayName: thread.author.displayName || thread.author.username,
      email: thread.author.email,
      avatarUrl: thread.author.avatarUrl || `https://placehold.co/40x40.png?text=${(thread.author.displayName || thread.author.username).charAt(0).toUpperCase()}`,
      createdAt: thread.author.createdAt,
      isAdmin: thread.author.isAdmin || false,
      isOwner: thread.author.isOwner || false,
      followerIds: [],
      followingIds: [],
    };

    // Hàm đệ quy để chuyển đổi comments
    const mapComments = (comments: any[]): Comment[] => {
      return comments.map(comment => {
        const authorUser: User = {
          id: comment.author.id,
          username: comment.author.username,
          displayName: comment.author.displayName || comment.author.username,
          email: comment.author.email,
          avatarUrl: comment.author.avatarUrl || `https://placehold.co/40x40.png?text=${(comment.author.displayName || comment.author.username).charAt(0).toUpperCase()}`,
          createdAt: comment.author.createdAt,
          isAdmin: comment.author.isAdmin || false,
          isOwner: comment.author.isOwner || false,
          followerIds: [],
          followingIds: [],
        };

        return {
          id: comment.id,
          threadId: comment.threadId,
          parentId: comment.parentId,
          author: authorUser,
          content: comment.content,
          createdAt: comment.createdAt,
          upvotes: comment.upvotes,
          downvotes: comment.downvotes,
          replies: comment.replies ? mapComments(comment.replies) : [],
        };
      });
    };

    return {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      author: authorUser,
      createdAt: thread.createdAt,
      upvotes: thread.upvotes,
      downvotes: thread.downvotes,
      comments: mapComments(thread.comments),
      commentCount: thread.commentCount,
    };
  });
}

export async function getThreadByIdAction(id: string): Promise<Thread | undefined> {
  const thread = await getThreadWithDetails(id);
  return thread || undefined;
}

export async function getUserByUsernameAction(username: string): Promise<User | undefined> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
    with: {
      followedBy: true,
      following: true,
    }
  });

  if (!user) return undefined;

  // Chuyển đổi từ dạng DB sang dạng User
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email,
    avatarUrl: user.avatarUrl || `https://placehold.co/40x40.png?text=${(user.displayName || user.username).charAt(0).toUpperCase()}`,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin || false,
    isOwner: user.isOwner || false,
    followerIds: user.followedBy.map(f => f.followerId),
    followingIds: user.following.map(f => f.followingId),
  };
}

export async function getUserByIdAction(userId: string): Promise<User | undefined> {
  return await findUserById(userId);
}

export async function getThreadsByAuthorUsernameAction(username: string): Promise<Thread[]> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.username, username),
    columns: { id: true }
  });

  if (!user) {
    return [];
  }

  const threads = await db.query.threads.findMany({
    where: eq(schema.threads.authorId, user.id),
    orderBy: [desc(schema.threads.createdAt)],
    with: {
      author: true,
      comments: {
        with: {
          author: true,
          replies: {
            with: {
              author: true
            }
          }
        }
      }
    }
  });

  // Chuyển đổi từ dạng DB sang dạng Thread (tương tự như getThreadsAction)
  return threads.map(thread => {
    const authorUser: User = {
      id: thread.author.id,
      username: thread.author.username,
      displayName: thread.author.displayName || thread.author.username,
      email: thread.author.email,
      avatarUrl: thread.author.avatarUrl || `https://placehold.co/40x40.png?text=${(thread.author.displayName || thread.author.username).charAt(0).toUpperCase()}`,
      createdAt: thread.author.createdAt,
      isAdmin: thread.author.isAdmin || false,
      isOwner: thread.author.isOwner || false,
      followerIds: [],
      followingIds: [],
    };

    // Hàm đệ quy để chuyển đổi comments
    const mapComments = (comments: any[]): Comment[] => {
      return comments.map(comment => {
        const authorUser: User = {
          id: comment.author.id,
          username: comment.author.username,
          displayName: comment.author.displayName || comment.author.username,
          email: comment.author.email,
          avatarUrl: comment.author.avatarUrl || `https://placehold.co/40x40.png?text=${(comment.author.displayName || comment.author.username).charAt(0).toUpperCase()}`,
          createdAt: comment.author.createdAt,
          isAdmin: comment.author.isAdmin || false,
          isOwner: comment.author.isOwner || false,
          followerIds: [],
          followingIds: [],
        };

        return {
          id: comment.id,
          threadId: comment.threadId,
          parentId: comment.parentId,
          author: authorUser,
          content: comment.content,
          createdAt: comment.createdAt,
          upvotes: comment.upvotes,
          downvotes: comment.downvotes,
          replies: comment.replies ? mapComments(comment.replies) : [],
        };
      });
    };

    return {
      id: thread.id,
      title: thread.title,
      content: thread.content,
      author: authorUser,
      createdAt: thread.createdAt,
      upvotes: thread.upvotes,
      downvotes: thread.downvotes,
      comments: mapComments(thread.comments),
      commentCount: thread.commentCount,
    };
  });
}

export async function followUserAction(targetUserId: string, currentUserId: string): Promise<{ success: boolean, error?: string }> {
  const targetUser = await findUserById(targetUserId);
  const currentUser = await findUserById(currentUserId);

  if (!targetUser || !currentUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }
  if (targetUser.id === DELETED_USER_PLACEHOLDER.id) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.cannotFollowDeletedUser'] || 'Cannot follow this user.' };
  }

  // Kiểm tra xem đã follow chưa
  const existingFollow = await db.query.followers.findFirst({
    where: and(
      eq(schema.followers.followerId, currentUserId),
      eq(schema.followers.followingId, targetUserId)
    )
  });

  if (existingFollow) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.alreadyFollowing'] || 'Already following this user.' };
  }

  // Thêm mối quan hệ follow
  await db.insert(schema.followers).values({
    followerId: currentUserId,
    followingId: targetUserId
  });

  // Gửi thông báo
  await createNotification(
    targetUserId,
    NotificationType.USER_FOLLOWED_YOU,
    currentUserId,
    currentUserId, 
    'user',
    null,
    'notification.userFollowedYou',
    { actorName: currentUser.displayName || currentUser.username || 'Someone' }
  );
  
  revalidatePath(`/u/${targetUser.username}`);
  revalidatePath(`/u/${currentUser.username}`);
  return { success: true };
}

export async function unfollowUserAction(targetUserId: string, currentUserId: string): Promise<{ success: boolean, error?: string }> {
  const targetUser = await findUserById(targetUserId);
  const currentUser = await findUserById(currentUserId);

  if (!targetUser || !currentUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  // Xóa mối quan hệ follow
  await db.delete(schema.followers)
    .where(and(
      eq(schema.followers.followerId, currentUserId),
      eq(schema.followers.followingId, targetUserId)
    ));
  
  revalidatePath(`/u/${targetUser.username}`);
  revalidatePath(`/u/${currentUser.username}`);
  return { success: true };
}

export async function getNotificationsForUserAction(userId: string): Promise<Notification[]> {
  const notifications = await db.query.notifications.findMany({
    where: eq(schema.notifications.userId, userId),
    orderBy: [desc(schema.notifications.createdAt)]
  });

  // Chuyển đổi từ dạng DB sang dạng Notification
  return notifications.map(notification => ({
    id: notification.id,
    userId: notification.userId,
    type: notification.type as NotificationType,
    actorId: notification.actorId,
    entityId: notification.entityId,
    entityType: notification.entityType as NotificationEntityType,
    relatedEntityId: notification.relatedEntityId,
    contentKey: notification.contentKey,
    contentArgs: JSON.parse(notification.contentArgs || '{}'),
    link: notification.link,
    createdAt: notification.createdAt,
    isRead: notification.isRead,
  }));
}

export async function getUnreadNotificationCountAction(userId: string): Promise<number> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(and(
      eq(schema.notifications.userId, userId),
      eq(schema.notifications.isRead, false)
    ));
  
  return result[0]?.count || 0;
}

export async function markNotificationAsReadAction(notificationId: string, userId: string): Promise<void> {
  await db.update(schema.notifications)
    .set({ isRead: true })
    .where(and(
      eq(schema.notifications.id, notificationId),
      eq(schema.notifications.userId, userId)
    ));
  
  revalidatePath('/notifications');
  revalidatePath('/api/unread-notifications'); 
}

export async function markAllNotificationsAsReadAction(userId: string): Promise<void> {
  await db.update(schema.notifications)
    .set({ isRead: true })
    .where(eq(schema.notifications.userId, userId));
  
  revalidatePath('/notifications');
  revalidatePath('/api/unread-notifications'); 
}

export async function getAllUsersForAdminAction(): Promise<User[]> {
  const users = await db.query.users.findMany({
    where: sql`${schema.users.id} != 'deleted_user_placeholder'`,
    with: {
      followedBy: true,
      following: true,
    }
  });

  // Chuyển đổi từ dạng DB sang dạng User
  return users.map(user => ({
    id: user.id,
    username: user.username,
    displayName: user.displayName || user.username,
    email: user.email,
    avatarUrl: user.avatarUrl || `https://placehold.co/40x40.png?text=${(user.displayName || user.username).charAt(0).toUpperCase()}`,
    createdAt: user.createdAt,
    isAdmin: user.isAdmin || false,
    isOwner: user.isOwner || false,
    followerIds: user.followedBy.map(f => f.followerId),
    followingIds: user.following.map(f => f.followingId),
  }));
}

export async function setUserAdminStatusAction(targetUserId: string, makeAdmin: boolean, currentUserId: string): Promise<{ success: boolean, error?: string }> {
  const currentUser = await findUserById(currentUserId);
  if (!currentUser || !currentUser.isOwner) { // Only owner can change admin status
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.ownerOnlyAction'] || 'Unauthorized: Only an owner can perform this action.' };
  }

  const targetUser = await findUserById(targetUserId);
  if (!targetUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'Target user not found.' };
  }

  if (targetUser.isOwner) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.cannotChangeOwnerStatus'] || 'Cannot change the admin status of an owner.'};
  }
  
  // An owner cannot demote themselves (this implicitly covers the "last admin" if only one owner exists)
  if (targetUser.id === currentUser.id && !makeAdmin) {
     return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.ownerCannotDemoteSelf'] || 'Owner cannot remove their own admin status.' };
  }

  // Cập nhật trạng thái admin
  await db.update(schema.users)
    .set({ isAdmin: makeAdmin })
    .where(eq(schema.users.id, targetUserId));

  revalidatePath('/admin');
  revalidatePath(`/u/${targetUser.username}`);
  return { success: true };
}

async function performUserDeletion(targetUserId: string): Promise<void> {
  // Lấy thông tin user trước khi xóa
  const targetUser = await findUserById(targetUserId);
  if (!targetUser) return;

  // Cập nhật author của threads thành DELETED_USER_PLACEHOLDER
  await db.update(schema.threads)
    .set({ authorId: DELETED_USER_PLACEHOLDER.id })
    .where(eq(schema.threads.authorId, targetUserId));

  // Cập nhật author của comments thành DELETED_USER_PLACEHOLDER
  await db.update(schema.comments)
    .set({ authorId: DELETED_USER_PLACEHOLDER.id })
    .where(eq(schema.comments.authorId, targetUserId));

  // Xóa các mối quan hệ follow
  await db.delete(schema.followers)
    .where(or(
      eq(schema.followers.followerId, targetUserId),
      eq(schema.followers.followingId, targetUserId)
    ));

  // Xóa các thông báo liên quan
  await db.delete(schema.notifications)
    .where(or(
      eq(schema.notifications.userId, targetUserId),
      eq(schema.notifications.actorId, targetUserId)
    ));

  // Cập nhật các thông báo có entityType là 'user' và entityId là targetUserId
  await db.update(schema.notifications)
    .set({ actorId: DELETED_USER_PLACEHOLDER.id })
    .where(and(
      eq(schema.notifications.entityType, 'user'),
      eq(schema.notifications.entityId, targetUserId)
    ));

  // Xóa user
  await db.delete(schema.users)
    .where(eq(schema.users.id, targetUserId));

  // Revalidate các trang
  revalidatePath('/admin');
  revalidatePath('/');
  
  // Lấy danh sách tất cả users để revalidate
  const allUsers = await db.query.users.findMany({
    columns: { username: true }
  });
  allUsers.forEach(u => revalidatePath(`/u/${u.username}`));
  
  // Lấy danh sách tất cả threads để revalidate
  const allThreads = await db.query.threads.findMany({
    columns: { id: true }
  });
  allThreads.forEach(t => revalidatePath(`/t/${t.id}`));
}

export async function deleteUserAction(targetUserId: string, currentUserId: string): Promise<{ success: boolean, error?: string }> {
  const currentUser = await findUserById(currentUserId);
  const targetUser = await findUserById(targetUserId);

  if (!currentUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'Current user not found.' };
  }
  if (!targetUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'Target user not found.' };
  }

  if (targetUser.isOwner) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.cannotDeleteOwner'] || 'Cannot delete an owner account.' };
  }

  if (targetUser.isAdmin && !currentUser.isOwner) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.ownerOnlyDeleteAdmin'] || 'Only an owner can delete an admin account.' };
  }
  
  if (!currentUser.isAdmin && !currentUser.isOwner) { // Should not happen if UI is correct
     return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.adminOrOwnerOnlyAction'] || 'Unauthorized: Only admins or owners can perform this action.' };
  }

  if (targetUserId === currentUserId) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.cannotDeleteSelf'] || 'Cannot delete yourself.' };
  }
  
  await performUserDeletion(targetUserId);
  return { success: true };
}

export async function updateUserProfileAction(
  userId: string,
  data: UpdateProfileData
): Promise<{ success: boolean; user?: User; error?: string }> {
  const user = await findUserById(userId);

  if (!user) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  // Cập nhật thông tin user
  await db.update(schema.users)
    .set({
      displayName: data.displayName !== undefined ? data.displayName : user.displayName,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl,
    })
    .where(eq(schema.users.id, userId));

  // Lấy user đã cập nhật
  const updatedUser = await findUserById(userId);
  if (!updatedUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.updateFailed'] || 'Failed to update user profile.' };
  }
  
  revalidatePath(`/u/${updatedUser.username}`);
  revalidatePath('/account');
  revalidatePath('/');

  const { password, ...userToReturn } = updatedUser;
  return { success: true, user: userToReturn };
}

export async function changePasswordAction(userId: string, currentPasswordAttempt: string, newPasswordVal: string): Promise<{ success: boolean; error?: string }> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { password: true }
  });

  if (!user) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  if (user.password !== currentPasswordAttempt) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.incorrectCurrentPassword'] || 'Incorrect current password.' };
  }

  // Cập nhật mật khẩu
  await db.update(schema.users)
    .set({ password: newPasswordVal })
    .where(eq(schema.users.id, userId));
  
  return { success: true };
}

export async function changeEmailAction(userId: string, newEmail: string, currentPasswordAttempt: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { password: true }
  });

  if (!user) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  if (user.password !== currentPasswordAttempt) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.incorrectCurrentPassword'] || 'Incorrect current password.' };
  }

  // Kiểm tra email đã tồn tại chưa
  const emailExists = await db.query.users.findFirst({
    where: and(
      eq(schema.users.email, newEmail),
      sql`${schema.users.id} != ${userId}`
    ),
    columns: { id: true }
  });

  if (emailExists) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.emailInUse'] || 'This email is already in use.' };
  }

  // Cập nhật email
  await db.update(schema.users)
    .set({ email: newEmail })
    .where(eq(schema.users.id, userId));

  // Lấy user đã cập nhật
  const updatedUser = await findUserById(userId);
  if (!updatedUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.updateFailed'] || 'Failed to update email.' };
  }

  const { password, ...userToReturn } = updatedUser;
  return { success: true, user: userToReturn };
}

export async function deleteCurrentUserAccountAction(userId: string, currentPasswordAttempt: string): Promise<{ success: boolean; error?: string }> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { password: true, isOwner: true }
  });

  if (!user) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  if (user.isOwner) { // Prevent owner from deleting their own account this way
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.ownerCannotDeleteSelfViaAccountPage'] || 'Owner account cannot be deleted this way. Contact support.' };
  }
  
  if (user.password !== currentPasswordAttempt) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.incorrectCurrentPassword'] || 'Incorrect current password for account deletion.' };
  }

  await performUserDeletion(userId); 
  return { success: true };
}

export async function createNewUserAction(userData: Omit<User, 'id' | 'createdAt' | 'followerIds' | 'followingIds'> & { password?: string }): Promise<User | { error: string }> {
  const { email, username, displayName, password: userPassword, avatarUrl, isAdmin, isOwner } = userData;

  // Kiểm tra email hoặc username đã tồn tại chưa
  const existingUser = await db.query.users.findFirst({
    where: or(
      eq(schema.users.email, email),
      eq(schema.users.username, username)
    ),
    columns: { id: true }
  });

  if (existingUser) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.userExists'] || 'User with this email or username already exists.' };
  }

  const userId = `user${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
  
  // Tạo user mới
  await db.insert(schema.users).values({
    id: userId,
    email,
    username,
    displayName: displayName || username,
    avatarUrl: avatarUrl || `https://placehold.co/40x40.png?text=${(displayName || username).charAt(0).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    isAdmin: isAdmin || false,
    isOwner: isOwner || false,
    password: userPassword || 'password123',
  });

  // Lấy user vừa tạo
  const newUser = await findUserById(userId);
  if (!newUser) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.userCreationFailed'] || 'Failed to create user.' };
  }

  const { password, ...userToReturn } = newUser;
  return userToReturn;
}