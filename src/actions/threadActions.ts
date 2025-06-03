
'use server';

import { revalidatePath } from 'next/cache';
import { initialMockUsers, initialMockThreads } from '@/lib/mock-data'; // Updated import
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
  followerIds: [],
  followingIds: [],
};

const USERS_STORAGE_KEY = 'forumverse_users_db_global';
const THREADS_STORAGE_KEY = 'forumverse_threads_db_global';
const NOTIFICATIONS_STORAGE_KEY = 'forumverse_notifications_db_global';

// Helper function to persist users to localStorage
function persistUsersToLocalStorage() {
  if (typeof localStorage !== 'undefined' && global.mockDataStore) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(global.mockDataStore.users));
    } catch (error) {
      console.error("Failed to save users to localStorage from threadActions", error);
    }
  }
}

// Helper function to persist threads to localStorage
function persistThreadsToLocalStorage() {
  if (typeof localStorage !== 'undefined' && global.mockDataStore) {
    try {
      localStorage.setItem(THREADS_STORAGE_KEY, JSON.stringify(global.mockDataStore.threads));
    } catch (error) {
      console.error("Failed to save threads to localStorage from threadActions", error);
    }
  }
}

// Helper function to persist notifications to localStorage
function persistNotificationsToLocalStorage() {
  if (typeof localStorage !== 'undefined' && global.mockDataStore) {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(global.mockDataStore.notifications));
    } catch (error) {
      console.error("Failed to save notifications to localStorage from threadActions", error);
    }
  }
}


// Initialize global mock data store if it doesn't exist.
if (typeof global.mockDataStore === 'undefined') {
  let usersFromStorage: User[] = [];
  let threadsFromStorage: Thread[] = [];
  let notificationsFromStorage: Notification[] = [];

  if (typeof localStorage !== 'undefined') {
    try {
      const storedUsersJson = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsersJson) usersFromStorage = JSON.parse(storedUsersJson);

      const storedThreadsJson = localStorage.getItem(THREADS_STORAGE_KEY);
      if (storedThreadsJson) threadsFromStorage = JSON.parse(storedThreadsJson);
      
      const storedNotificationsJson = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (storedNotificationsJson) notificationsFromStorage = JSON.parse(storedNotificationsJson);

    } catch (e) { console.error("Error reading from localStorage during init:", e); }
  }

  const combinedUsersMap = new Map<string, User>();
  initialMockUsers.forEach(u => {
    const defaultPassword = u.password || 'password123'; // Use provided password or default
    combinedUsersMap.set(u.id, { ...u, password: defaultPassword, isAdmin: u.isAdmin || false, followingIds: u.followingIds || [], followerIds: u.followerIds || [] });
  });
  usersFromStorage.forEach(u => combinedUsersMap.set(u.id, u)); // Persisted users override defaults

  const combinedThreadsMap = new Map<string, Thread>();
  initialMockThreads.forEach(t => combinedThreadsMap.set(t.id, t));
  threadsFromStorage.forEach(t => combinedThreadsMap.set(t.id, t));


  global.mockDataStore = {
    threads: Array.from(combinedThreadsMap.values()),
    users: Array.from(combinedUsersMap.values()),
    notifications: notificationsFromStorage.length > 0 ? notificationsFromStorage : [],
  };

  if (typeof localStorage !== 'undefined') {
    persistUsersToLocalStorage();
    persistThreadsToLocalStorage();
    persistNotificationsToLocalStorage();
  }
}


// Helper to get a user by ID (simulating DB access)
function findUserById(userId: string): User | undefined {
  return global.mockDataStore.users.find(u => u.id === userId);
}

function createMockNotification(
  recipientId: string,
  type: NotificationType,
  actorId: string | null,
  entityId: string, 
  entityType: NotificationEntityType,
  relatedEntityId?: string | null, 
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
    id: `notif${Date.now()}${Math.random().toString(36).substring(2, 15)}`,
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
  persistNotificationsToLocalStorage();
  revalidatePath('/notifications'); 
  revalidatePath('/api/unread-notifications'); 
  return newNotification;
}


export async function createThreadAction(formData: FormData, authorEmail: string): Promise<Thread | { error: string }> {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  if (!title || !content) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.titleContentRequired'] || 'Title and content are required.' };
  }
  
  const author = global.mockDataStore.users.find(u => u.email === authorEmail);
  if (!author) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
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
  persistThreadsToLocalStorage();

  author.followerIds?.forEach(followerId => {
    createMockNotification(
      followerId,
      NotificationType.NEW_THREAD_FROM_FOLLOWED_USER,
      author.id,
      newThread.id,
      'thread',
      null,
      'notification.newThreadFromFollowedUser',
      { actorName: author.displayName || author.username || 'Someone', threadTitle: newThread.title}
    );
  });

  revalidatePath('/');
  revalidatePath(`/t/${newThread.id}`);
  return newThread;
}

export async function addCommentAction(threadId: string, formData: FormData, authorEmail: string, parentId?: string | null): Promise<Comment | { error: string }> {
  const content = formData.get('content') as string;

  if (!content) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.commentEmpty'] || 'Comment content cannot be empty.' };
  }

  const author = global.mockDataStore.users.find(u => u.email === authorEmail);
  if (!author) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }
  
  const thread = global.mockDataStore.threads.find(t => t.id === threadId);
  if (!thread) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.threadNotFound'] || 'Thread not found.' };
  }

  const newComment: Comment = {
    id: `comment${Date.now()}${Math.random().toString(36).substring(2, 15)}`,
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
  persistThreadsToLocalStorage();
  
  if (thread.author.id !== author.id) {
    createMockNotification(
      thread.author.id,
      NotificationType.NEW_COMMENT_ON_THREAD,
      author.id,
      newComment.id,
      'comment',
      thread.id,
      'notification.newCommentOnThread',
      { actorName: author.displayName || author.username || 'Someone', threadTitle: thread.title }
    );
  }

  if (parentId && parentCommentAuthorId && parentCommentAuthorId !== author.id && parentCommentAuthorId !== DELETED_USER_PLACEHOLDER.id) {
    createMockNotification(
      parentCommentAuthorId,
      NotificationType.NEW_REPLY_TO_COMMENT,
      author.id,
      newComment.id,
      'comment',
      thread.id,
      'notification.newReplyToComment',
      { actorName: author.displayName || author.username || 'Someone', threadTitle: thread.title }
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
    persistThreadsToLocalStorage();

    if (voterId && thread.author.id !== voterId && thread.author.id !== DELETED_USER_PLACEHOLDER.id) {
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
    persistThreadsToLocalStorage();

    if (voterId && targetComment.author.id !== voterId && targetComment.author.id !== DELETED_USER_PLACEHOLDER.id) {
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
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }
  if (targetUser.id === DELETED_USER_PLACEHOLDER.id) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.cannotFollowDeletedUser'] || 'Cannot follow this user.' };
  }

  if (currentUser.followingIds?.includes(targetUserId)) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.alreadyFollowing'] || 'Already following this user.' };
  }

  currentUser.followingIds = [...(currentUser.followingIds || []), targetUserId];
  targetUser.followerIds = [...(targetUser.followerIds || []), currentUserId];
  persistUsersToLocalStorage();

  createMockNotification(
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
  const targetUser = global.mockDataStore.users.find(u => u.id === targetUserId);
  const currentUser = global.mockDataStore.users.find(u => u.id === currentUserId);

  if (!targetUser || !currentUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  currentUser.followingIds = (currentUser.followingIds || []).filter(id => id !== targetUserId);
  targetUser.followerIds = (targetUser.followerIds || []).filter(id => id !== currentUserId);
  persistUsersToLocalStorage();
  
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
    persistNotificationsToLocalStorage();
  }
  revalidatePath('/notifications');
  revalidatePath('/api/unread-notifications'); 
}

export async function markAllNotificationsAsReadAction(userId: string): Promise<void> {
  (global.mockDataStore.notifications || []).forEach(n => {
    if (n.userId === userId) {
      n.isRead = true;
    }
  });
  persistNotificationsToLocalStorage();
  revalidatePath('/notifications');
  revalidatePath('/api/unread-notifications'); 
}

export async function getAllUsersForAdminAction(): Promise<User[]> {
  return JSON.parse(JSON.stringify(global.mockDataStore.users.filter(u => u.id !== DELETED_USER_PLACEHOLDER.id) || []));
}

export async function setUserAdminStatusAction(targetUserId: string, makeAdmin: boolean, currentAdminId: string): Promise<{ success: boolean, error?: string }> {
  const currentAdmin = findUserById(currentAdminId);
  if (!currentAdmin || !currentAdmin.isAdmin) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.adminOnlyAction'] || 'Unauthorized: Only admins can perform this action.' };
  }

  const targetUser = findUserById(targetUserId);
  if (!targetUser) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'Target user not found.' };
  }
  
  if (targetUser.id === currentAdminId && !makeAdmin) {
     const adminCount = global.mockDataStore.users.filter(u => u.isAdmin).length;
     if (adminCount <= 1) {
        return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.cannotRemoveLastAdmin'] || 'Cannot remove the last admin.' };
     }
  }

  targetUser.isAdmin = makeAdmin;
  
  const userIndex = global.mockDataStore.users.findIndex(u => u.id === targetUserId);
  if (userIndex !== -1) {
    global.mockDataStore.users[userIndex] = targetUser;
    persistUsersToLocalStorage();
  }

  revalidatePath('/admin');
  revalidatePath(`/u/${targetUser.username}`);
  return { success: true };
}

function performUserDeletion(targetUserId: string): void {
  const targetUserIndex = global.mockDataStore.users.findIndex(u => u.id === targetUserId);
  if (targetUserIndex === -1) return;

  global.mockDataStore.users.splice(targetUserIndex, 1);

  global.mockDataStore.threads.forEach(thread => {
    if (thread.author.id === targetUserId) {
      thread.author = { ...DELETED_USER_PLACEHOLDER };
    }
    const updateCommentAuthors = (comments: Comment[]) => {
      comments.forEach(comment => {
        if (comment.author.id === targetUserId) {
          comment.author = { ...DELETED_USER_PLACEHOLDER };
        }
        if (comment.replies) updateCommentAuthors(comment.replies);
      });
    };
    updateCommentAuthors(thread.comments);
  });
  persistThreadsToLocalStorage();


  global.mockDataStore.users.forEach(user => {
    user.followerIds = user.followerIds?.filter(id => id !== targetUserId);
    user.followingIds = user.followingIds?.filter(id => id !== targetUserId);
  });
  // No need to call persistUsersToLocalStorage() here as it's called after splice.

  global.mockDataStore.notifications = global.mockDataStore.notifications.filter(
    notif => notif.userId !== targetUserId && notif.actorId !== targetUserId
  );
  global.mockDataStore.notifications.forEach(notif => {
    if (notif.entityType === 'user' && notif.entityId === targetUserId) {
      notif.actorId = DELETED_USER_PLACEHOLDER.id; 
    }
  });
  persistNotificationsToLocalStorage();
  persistUsersToLocalStorage(); // Persist changes from follower/following lists and user deletion

  revalidatePath('/admin');
  revalidatePath('/'); 
  global.mockDataStore.users.forEach(u => revalidatePath(`/u/${u.username}`));
  global.mockDataStore.threads.forEach(t => revalidatePath(`/t/${t.id}`));
}


export async function deleteUserAction(targetUserId: string, currentAdminId: string): Promise<{ success: boolean, error?: string }> {
  const currentAdmin = findUserById(currentAdminId);
  if (!currentAdmin || !currentAdmin.isAdmin) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.adminOnlyAction'] || 'Unauthorized: Only admins can perform this action.' };
  }

  if (targetUserId === currentAdminId) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.adminCannotDeleteSelf'] || 'Admin cannot delete themselves.' };
  }
  
  performUserDeletion(targetUserId);
  return { success: true };
}

export async function updateUserProfileAction(
  userId: string,
  data: UpdateProfileData
): Promise<{ success: boolean; user?: User; error?: string }> {
  const userIndex = global.mockDataStore.users.findIndex((u: User) => u.id === userId);

  if (userIndex === -1) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  const currentUserData = global.mockDataStore.users[userIndex];
  
  const updatedUser = {
    ...currentUserData,
    displayName: data.displayName !== undefined ? data.displayName : currentUserData.displayName,
    avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : currentUserData.avatarUrl,
  };

  global.mockDataStore.users[userIndex] = updatedUser;
  persistUsersToLocalStorage();

  global.mockDataStore.threads.forEach((thread: Thread) => {
    if (thread.author.id === userId) {
      thread.author = { ...thread.author, ...updatedUser };
    }
    thread.comments.forEach((comment: Comment) => {
      if (comment.author.id === userId) {
        comment.author = { ...comment.author, ...updatedUser };
      }
      comment.replies?.forEach(reply => {
        if (reply.author.id === userId) {
          reply.author = { ...reply.author, ...updatedUser };
        }
      });
    });
  });
  persistThreadsToLocalStorage();
  
  revalidatePath(`/u/${updatedUser.username}`);
  revalidatePath('/account');
  revalidatePath('/');

  const { password, ...userToReturn } = updatedUser;
  return { success: true, user: userToReturn };
}

export async function changePasswordAction(userId: string, currentPasswordAttempt: string, newPasswordVal: string): Promise<{ success: boolean; error?: string }> {
  const userIndex = global.mockDataStore.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  const user = global.mockDataStore.users[userIndex];
  if (user.password !== currentPasswordAttempt) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.incorrectCurrentPassword'] || 'Incorrect current password.' };
  }

  global.mockDataStore.users[userIndex].password = newPasswordVal;
  persistUsersToLocalStorage();
  
  return { success: true };
}

export async function changeEmailAction(userId: string, newEmail: string, currentPasswordAttempt: string): Promise<{ success: boolean; user?: User; error?: string }> {
  const userIndex = global.mockDataStore.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  const user = global.mockDataStore.users[userIndex];
  if (user.password !== currentPasswordAttempt) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.incorrectCurrentPassword'] || 'Incorrect current password.' };
  }

  const emailExists = global.mockDataStore.users.some(u => u.email === newEmail && u.id !== userId);
  if (emailExists) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.emailInUse'] || 'This email is already in use.' };
  }

  global.mockDataStore.users[userIndex].email = newEmail;
  persistUsersToLocalStorage();

  const { password, ...userToReturn } = global.mockDataStore.users[userIndex];
  return { success: true, user: userToReturn };
}

export async function deleteCurrentUserAccountAction(userId: string, currentPasswordAttempt: string): Promise<{ success: boolean; error?: string }> {
  const userIndex = global.mockDataStore.users.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.userNotFound'] || 'User not found.' };
  }

  const user = global.mockDataStore.users[userIndex];
  if (user.password !== currentPasswordAttempt) {
    return { success: false, error: PREDEFINED_TRANSLATIONS_EN['error.incorrectCurrentPassword'] || 'Incorrect current password for account deletion.' };
  }

  performUserDeletion(userId); // This already calls persistUsersToLocalStorage
  // No need to revalidate paths here, performUserDeletion handles it.

  return { success: true };
}

export async function createNewUserAction(userData: Omit<User, 'id' | 'createdAt' | 'isAdmin' | 'followerIds' | 'followingIds'> & { password?: string }): Promise<User | { error: string }> {
  const { email, username, displayName, password: userPassword, avatarUrl } = userData;

  if (global.mockDataStore.users.find(u => u.email === email || u.username === username)) {
    return { error: PREDEFINED_TRANSLATIONS_EN['error.userExists'] || 'User with this email or username already exists.' };
  }

  const newUser: User = {
    id: `user${Date.now()}${Math.random().toString(36).substring(2, 15)}`,
    email,
    username,
    displayName: displayName || username,
    avatarUrl: avatarUrl || `https://placehold.co/40x40.png?text=${(displayName || username).charAt(0).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    isAdmin: false,
    followerIds: [],
    followingIds: [],
    password: userPassword || 'password123', // Store password for mock auth
  };

  global.mockDataStore.users.push(newUser);
  persistUsersToLocalStorage();
  
  const { password, ...userToReturn } = newUser;
  return userToReturn;
}

// The exports for initialMockUsers and initialMockThreads were removed as they caused a 'use server' violation.
// If these are needed by client components, they should be imported directly from '@/lib/mock-data'.
// AuthContext and other server-side logic within this file already initialize the global.mockDataStore correctly using these initial values.
    
