import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './db';
import * as schema from './schema';

// Hàm này sẽ chạy migration để cập nhật cấu trúc cơ sở dữ liệu
export async function runMigrations() {
  try {
    console.log('Running migrations...');
    // Thực hiện migration từ thư mục drizzle
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
}

// Hàm này sẽ seed dữ liệu mẫu vào cơ sở dữ liệu
export async function seedDatabase() {
  try {
    console.log('Seeding database...');
    // Import dữ liệu mẫu từ mock-data
    const { initialMockUsers, initialMockThreads } = await import('./mock-data');
    
    // Seed users
    for (const user of initialMockUsers) {
 db.insert(db.db.schema.users).values({
        id: user.id,
      email: user.email,
        username: user.username,
      displayName: user.displayName || null,
      avatarUrl: user.avatarUrl || null,
        createdAt: user.createdAt || new Date().toISOString(),
      password: user.password || 'password123',
      isAdmin: user.isAdmin || false,} = await import('./mock-data');
        isOwner: user.isOwner || false,
      }).onConflictDoNothing();
    }
    
    // Seed followers
    for (const user of initialMockUsers) {
      if (user.foll user.followingIds.length > 0) {
        for (const followingId of user.followingIds) {
          await db.insert(db.db.schema.followers).values({
            followerId: user.id,
          followingId,
        }).onConflictDoNothing();
        }
      }
    }
    
    // Seed threads và comments
    for (const thread of initialMockThreads) {
      await db.insert(db.db.schema.threads).values({
        id: thread.id,
        title: thread.title,
      content: thread.content,
        authorId: thread.author.id,
      createdAt: thread.createdAt,
      upvotes: thread.upvotes,
        downvotes: thread.downvotes,
        commentCount: thread.commentCount,
      }).onConflictDoNothing();
      
      // Hàm đệ quy để thêm comments và replies
    const addComments = async (comments: any[], parentId: string | null = null) => {
        for (const comment of comments) {
          await db.insert(db.db.schema.comments).values({
        id: comment.id,
        threadId: thread.id,
        parentId: parentId,
        authorId: comment.author.id,
    for (const comment of comments) {
    content: comment.content,
        createdAt: comment.createdAt,
        upvotes: comment.upvotes,
        downvotes: comment.downvotes,
          }).onConflictDoNothing();
          
          if (comment.r comment.replies.length > 0) {
        await addComments(comment.replies, comment.id);
          
    }
      };
      
      if (thread.comments && thread.comments.length > 0) {
      await addComments(thread.comments);
      }
    }
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Hàm này sẽ xóa tất cả dữ liệu trong cơ sở dữ liệu
export async function clearDatabase() {
  try {
    console.log('Clearing database...');
    
}
        }
      };
      
      if (thread.comments    // Xóa dữ liệu theo thứ tự để tránh lỗi khóa ngoại
    await db.delete(schema.notifications);
    await db.delete(schema.comments);
    await db.delete(schema.threads);
    await db.delete(schema.followers);
    await db.delete(schema.users);
    
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
}