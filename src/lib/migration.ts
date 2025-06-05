import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from './db';

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
      await db.insert(db.schema.users).values({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName || null,
        avatarUrl: user.avatarUrl || null,
        createdAt: user.createdAt || new Date().toISOString(),
        password: user.password || 'password123',
        isAdmin: user.isAdmin || false,
        isOwner: user.isOwner || false,
      }).onConflictDoNothing();
    }
    
    // Seed followers
    for (const user of initialMockUsers) {
      if (user.followingIds && user.followingIds.length > 0) {
        for (const followingId of user.followingIds) {
          await db.insert(db.schema.followers).values({
            followerId: user.id,
            followingId,
          }).onConflictDoNothing();
        }
      }
    }
    
    // Seed threads và comments
    for (const thread of initialMockThreads) {
      await db.insert(db.schema.threads).values({
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
          await db.insert(db.schema.comments).values({
            id: comment.id,
            threadId: thread.id,
            parentId: parentId,
            authorId: comment.author.id,
            content: comment.content,
            createdAt: comment.createdAt,
            upvotes: comment.upvotes,
            downvotes: comment.downvotes,
          }).onConflictDoNothing();
          
          if (comment.replies && comment.replies.length > 0) {
            await addComments(comment.replies, comment.id);
          }
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