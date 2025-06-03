
import type { User, Thread, Comment } from './types';

// Initial Mock Users
export const initialMockUsers: User[] = [
  { id: 'user1', email: 'alice@example.com', username: 'alice', displayName: 'Alice Wonderland', avatarUrl: 'https://placehold.co/40x40.png?text=A', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString() },
  { id: 'user2', email: 'bob@example.com', username: 'bob', displayName: 'Bob The Builder', avatarUrl: 'https://placehold.co/40x40.png?text=B', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString() },
  { id: 'user3', email: 'charlie@example.com', username: 'charlie', displayName: 'Charlie Brown', avatarUrl: 'https://placehold.co/40x40.png?text=C', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString() },
  { id: 'user4', email: 'diana@example.com', username: 'diana', displayName: 'Diana Prince', avatarUrl: 'https://placehold.co/40x40.png?text=D', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
  { id: 'user5', email: 'edward@example.com', username: 'edward', displayName: 'Edward Nygma', avatarUrl: 'https://placehold.co/40x40.png?text=E', createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
];

// Initial Mock Comments for Thread 1
const commentsThread1: Comment[] = [
  {
    id: 'comment1_1',
    threadId: 'thread1',
    author: initialMockUsers[1], // Bob
    content: 'Great point! I totally agree.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    upvotes: 15,
    downvotes: 1,
    replies: [
      {
        id: 'reply1_1_1',
        threadId: 'thread1',
        parentId: 'comment1_1',
        author: initialMockUsers[0], // Alice
        content: 'Thanks Bob! Glad you found it insightful.',
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        upvotes: 5,
        downvotes: 0,
      },
    ],
  },
  {
    id: 'comment1_2',
    threadId: 'thread1',
    author: initialMockUsers[2], // Charlie
    content: "I have a slightly different perspective on this. What about...?",
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    upvotes: 8,
    downvotes: 3,
  },
];

// Initial Mock Comments for Thread 2
const commentsThread2: Comment[] = [
  {
    id: 'comment2_1',
    threadId: 'thread2',
    author: initialMockUsers[0], // Alice
    content: "This is a really interesting topic. I'm looking forward to seeing what others think.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    upvotes: 22,
    downvotes: 0,
  },
];

// Initial Mock Threads
export const initialMockThreads: Thread[] = [
  {
    id: 'thread1',
    title: 'The Future of Web Development: Predictions for 2025',
    content: 'The web development landscape is constantly evolving. What major trends, technologies, and methodologies do you foresee shaping the industry by 2025? Consider aspects like AI integration, new frameworks, serverless architectures, WebAssembly, and the evolving role of developers. Let\'s discuss!',
    author: initialMockUsers[0], // Alice
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
    author: initialMockUsers[1], // Bob
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    upvotes: 250,
    downvotes: 12,
    comments: commentsThread2,
    commentCount: commentsThread2.length,
  },
  {
    id: 'thread3',
    title: 'Exploring the Ethics of Artificial Intelligence in Creative Fields',
    content: 'AI is increasingly capable of generating art, music, and text. This raises important ethical questions about authorship, copyright, and the impact on human artists. What are your thoughts on the ethical implications of AI in creative industries? How can we navigate these challenges responsibly?',
    author: initialMockUsers[2], // Charlie
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    upvotes: 75,
    downvotes: 2,
    comments: [],
    commentCount: 0,
  },
];
