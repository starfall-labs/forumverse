import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Định nghĩa bảng users
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull(),
  password: text('password').notNull(), // Trong thực tế nên lưu hash password
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  isOwner: integer('is_owner', { mode: 'boolean' }).default(false),
});

// Định nghĩa bảng followers
export const followers = sqliteTable('followers', {
  followerId: text('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: text('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] }),
}));

// Định nghĩa bảng threads
export const threads = sqliteTable('threads', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  commentCount: integer('comment_count').default(0),
});

// Định nghĩa bảng comments
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  threadId: text('thread_id').notNull().references(() => threads.id, { onDelete: 'cascade' }),
  parentId: text('parent_id').references(() => comments.id, { onDelete: 'cascade' }),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: text('created_at').notNull(),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
});

// Định nghĩa bảng notifications
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  entityId: text('entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  relatedEntityId: text('related_entity_id'),
  contentKey: text('content_key').notNull(),
  contentArgs: text('content_args'), // JSON string
  link: text('link').notNull(),
  createdAt: text('created_at').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
});

// Định nghĩa mối quan hệ giữa các bảng
export const usersRelations = relations(users, ({ many }) => ({
  threads: many(threads),
  comments: many(comments),
  followedBy: many(followers, { relationName: 'followed_by', foreignKey: 'followingId' }),
  following: many(followers, { relationName: 'following', foreignKey: 'followerId' }),
  notifications: many(notifications, { relationName: 'user_notifications' }),
  actorNotifications: many(notifications, { relationName: 'actor_notifications', foreignKey: 'actorId' }),
}));

export const threadsRelations = relations(threads, ({ one, many }) => ({
  author: one(users, { fields: [threads.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  thread: one(threads, { fields: [comments.threadId], references: [threads.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id] }),
  replies: many(comments, { relationName: 'comment_replies' }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  actor: one(users, { fields: [notifications.actorId], references: [users.id] }),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(users, { fields: [followers.followerId], references: [users.id], relationName: 'following' }),
  following: one(users, { fields: [followers.followingId], references: [users.id], relationName: 'followed_by' }),
}));