
import type { User, Thread, Comment } from './types'; // Removed Notification type

// Initial Mock Users
export const initialMockUsers: User[] = [
  { id: 'user1', email: 'alice@example.com', username: 'alice', displayName: 'Alice Wonderland', password: 'password123', avatarUrl: 'https://placehold.co/40x40.png?text=A', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), followingIds: ['user2'], followerIds: ['user3'], isAdmin: false, isOwner: false },
  { id: 'user2', email: 'bob@example.com', username: 'bob', displayName: 'Bob The Builder', password: 'password123', avatarUrl: 'https://placehold.co/40x40.png?text=B', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), followingIds: [], followerIds: ['user1'], isAdmin: false, isOwner: false },
  { id: 'user3', email: 'charlie@example.com', username: 'charlie', displayName: 'Charlie Brown', password: 'password123', avatarUrl: 'https://placehold.co/40x40.png?text=C', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), followingIds: ['user1'], followerIds: [], isAdmin: false, isOwner: false },
  { id: 'user4', email: 'diana@example.com', username: 'diana', displayName: 'Diana Prince', password: 'password123', avatarUrl: 'https://placehold.co/40x40.png?text=D', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), followingIds: [], followerIds: [], isAdmin: false, isOwner: false },
  { id: 'user5', email: 'edward@example.com', username: 'edward', displayName: 'Edward Nygma', password: 'password123', avatarUrl: 'https://placehold.co/40x40.png?text=E', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), followingIds: [], followerIds: [], isAdmin: false, isOwner: false },
  { id: 'adminuser', email: 'admin@example.com', username: 'admin', displayName: 'Site Owner', password: 'password123', avatarUrl: 'https://placehold.co/40x40.png?text=OWN', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(), followingIds: [], followerIds: [], isAdmin: true, isOwner: true },
];

// Initial Mock Comments for Thread 1
const commentsThread1: Comment[] = [
  {
    id: 'comment1_1',
    threadId: 'thread1',
    author: initialMockUsers.find(u => u.username === 'bob')!,
    content: 'Great point! I totally agree.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    upvotes: 15,
    downvotes: 1,
    replies: [
      {
        id: 'reply1_1_1',
        threadId: 'thread1',
        parentId: 'comment1_1',
        author: initialMockUsers.find(u => u.username === 'alice')!,
        content: 'Thanks Bob! Glad you found it insightful.',
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        upvotes: 5,
        downvotes: 0,
        replies: [],
      },
    ],
  },
  {
    id: 'comment1_2',
    threadId: 'thread1',
    author: initialMockUsers.find(u => u.username === 'charlie')!,
    content: "I have a slightly different perspective on this. What about...?",
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    upvotes: 8,
    downvotes: 3,
    replies: [],
  },
];

// Initial Mock Comments for Thread 2
const commentsThread2: Comment[] = [
  {
    id: 'comment2_1',
    threadId: 'thread2',
    author: initialMockUsers.find(u => u.username === 'alice')!,
    content: "This is a really interesting topic. I'm looking forward to seeing what others think.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    upvotes: 22,
    downvotes: 0,
    replies: [],
  },
];

// Initial Mock Threads
export const initialMockThreads: Thread[] = [
  {
    id: 'thread1',
    title: 'The Future of Web Development: Predictions for 2025',
    content: 'The web development landscape is constantly evolving. What major trends, technologies, and methodologies do you foresee shaping the industry by 2025? Consider aspects like AI integration, new frameworks, serverless architectures, WebAssembly, and the evolving role of developers. Let\'s discuss!',
    author: initialMockUsers.find(u => u.username === 'alice')!,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    upvotes: 120,
    downvotes: 5,
    comments: commentsThread1,
    commentCount: commentsThread1.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0),
  },
  {
    id: 'thread2',
    title: 'Best Practices for Remote Team Collaboration',
    content: 'With remote work becoming more prevalent, effective collaboration is key. What are your go-to tools, strategies, and best practices for keeping remote teams connected, productive, and engaged? Share your experiences and tips!',
    author: initialMockUsers.find(u => u.username === 'bob')!,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    upvotes: 250,
    downvotes: 12,
    comments: commentsThread2,
    commentCount: commentsThread2.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0),
  },
  {
    id: 'thread3',
    title: 'Exploring the Ethics of Artificial Intelligence in Creative Fields',
    content: 'AI is increasingly capable of generating art, music, and text. This raises important ethical questions about authorship, copyright, and the impact on human artists. What are your thoughts on the ethical implications of AI in creative industries? How can we navigate these challenges responsibly?',
    author: initialMockUsers.find(u => u.username === 'charlie')!,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    upvotes: 75,
    downvotes: 2,
    comments: [],
    commentCount: 0,
  },
  {
    id: 'thread4',
    title: 'Advanced TypeScript Techniques for Large Scale Applications',
    content: 'TypeScript offers powerful features for managing complexity in large codebases. What are some advanced patterns, tips, or configurations (like project references, module path aliases, conditional types) that you\'ve found particularly effective for maintaining and scaling TypeScript projects? Share your insights and real-world examples.',
    author: initialMockUsers.find(u => u.username === 'admin')!,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    upvotes: 95,
    downvotes: 3,
    comments: [],
    commentCount: 0,
  }
];
