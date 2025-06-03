
export type User = {
  id: string;
  email: string; 
  username: string; 
  displayName?: string; 
  avatarUrl?: string;
  createdAt?: string; 
  followingIds?: string[]; // IDs of users this user is following
  followerIds?: string[];  // IDs of users following this user
  password?: string; // Only for mock data, not for real User object
  isAdmin?: boolean; // Flag to identify admin users
  isOwner?: boolean; // Flag to identify the owner
};

export interface UpdateProfileData {
  displayName?: string;
  avatarUrl?: string;
}

export type Comment = {
  id: string;
  threadId: string;
  parentId?: string | null; 
  author: User;
  content: string;
  createdAt: string; 
  upvotes: number;
  downvotes: number;
  replies?: Comment[];
};

export type Thread = {
  id:string;
  title: string;
  content: string;
  author: User;
  createdAt: string; 
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  commentCount: number;
};

export enum NotificationType {
  NEW_THREAD_FROM_FOLLOWED_USER = 'new_thread_from_followed_user',
  NEW_COMMENT_ON_THREAD = 'new_comment_on_thread',
  NEW_REPLY_TO_COMMENT = 'new_reply_to_comment',
  USER_FOLLOWED_YOU = 'user_followed_you',
  THREAD_UPVOTE = 'thread_upvote',
  THREAD_DOWNVOTE = 'thread_downvote',
  COMMENT_UPVOTE = 'comment_upvote',
  COMMENT_DOWNVOTE = 'comment_downvote',
}

export type NotificationEntityType = 'thread' | 'comment' | 'user';

export type Notification = {
  id: string;
  userId: string; // The ID of the user who should receive the notification
  type: NotificationType;
  actorId: string | null; // ID of the user who performed the action (optional)
  entityId: string; // ID of the primary entity (e.g., threadId, commentId, followedUserId)
  entityType: NotificationEntityType;
  relatedEntityId?: string | null; // e.g., threadId if entity is a comment, or original thread ID for a comment vote
  contentKey: string; // Key for translation, e.g., 'notification.newComment'
  contentArgs?: Record<string, string>; // Arguments for the translation string, e.g., { actorName: 'Bob', threadTitle: 'My Post' }
  link: string;
  createdAt: string; // ISO date string
  isRead: boolean;
};

