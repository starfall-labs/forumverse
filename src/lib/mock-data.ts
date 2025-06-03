import type { User, Thread, Comment } from './types';

// Mock Users
export const mockUsers: User[] = [
  { id: 'user1', email: 'alice@example.com', avatarUrl: 'https://placehold.co/40x40.png?text=A' },
  { id: 'user2', email: 'bob@example.com', avatarUrl: 'https://placehold.co/40x40.png?text=B' },
  { id: 'user3', email: 'charlie@example.com', avatarUrl: 'https://placehold.co/40x40.png?text=C' },
];

// Mock Comments
const commentsThread1: Comment[] = [
  {
    id: 'comment1_1',
    threadId: 'thread1',
    author: mockUsers[1],
    content: 'Great point! I totally agree.',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    upvotes: 15,
    downvotes: 1,
    replies: [
      {
        id: 'reply1_1_1',
        threadId: 'thread1',
        parentId: 'comment1_1',
        author: mockUsers[0],
        content: 'Thanks Bob! Glad you found it insightful.',
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
        upvotes: 5,
        downvotes: 0,
      },
    ],
  },
  {
    id: 'comment1_2',
    threadId: 'thread1',
    author: mockUsers[2],
    content: "I have a slightly different perspective on this. What about...?",
    createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 minutes ago
    upvotes: 8,
    downvotes: 3,
  },
];

const commentsThread2: Comment[] = [
  {
    id: 'comment2_1',
    threadId: 'thread2',
    author: mockUsers[0],
    content: "This is a really interesting topic. I'm looking forward to seeing what others think.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    upvotes: 22,
    downvotes: 0,
  },
];

// Mock Threads
export let mockThreads: Thread[] = [
  {
    id: 'thread1',
    title: 'The Future of Web Development: Predictions for 2025',
    content: 'The web development landscape is constantly evolving. What major trends, technologies, and methodologies do you foresee shaping the industry by 2025? Consider aspects like AI integration, new frameworks, serverless architectures, WebAssembly, and the evolving role of developers. Let\'s discuss!',
    author: mockUsers[0],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    upvotes: 120,
    downvotes: 5,
    comments: commentsThread1,
    commentCount: commentsThread1.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0),
  },
  {
    id: 'thread2',
    title: 'Best Practices for Remote Team Collaboration',
    content: 'With remote work becoming more prevalent, effective collaboration is key. What are your go-to tools, strategies, and best practices for keeping remote teams connected, productive, and engaged? Share your experiences and tips!',
    author: mockUsers[1],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    upvotes: 250,
    downvotes: 12,
    comments: commentsThread2,
    commentCount: commentsThread2.length,
  },
  {
    id: 'thread3',
    title: 'Exploring the Ethics of Artificial Intelligence in Creative Fields',
    content: 'AI is increasingly capable of generating art, music, and text. This raises important ethical questions about authorship, copyright, and the impact on human artists. What are your thoughts on the ethical implications of AI in creative industries? How can we navigate these challenges responsibly?',
    author: mockUsers[2],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    upvotes: 75,
    downvotes: 2,
    comments: [],
    commentCount: 0,
  },
];

// Functions to interact with mock data (simulating API/DB)
export const getThreads = async (): Promise<Thread[]> => {
  return JSON.parse(JSON.stringify(mockThreads)); // Return a deep copy to avoid direct mutation issues in components
};

export const getThreadById = async (id: string): Promise<Thread | undefined> => {
  const thread = mockThreads.find(t => t.id === id);
  return thread ? JSON.parse(JSON.stringify(thread)) : undefined;
};

export const addThread = async (thread: Omit<Thread, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'comments' | 'commentCount' >): Promise<Thread> => {
  const newThread: Thread = {
    ...thread,
    id: `thread${mockThreads.length + 1}`,
    createdAt: new Date().toISOString(),
    upvotes: 1, // Start with one upvote from the author
    downvotes: 0,
    comments: [],
    commentCount: 0,
  };
  mockThreads.unshift(newThread); // Add to the beginning
  return JSON.parse(JSON.stringify(newThread));
};

export const addComment = async (threadId: string, commentData: Omit<Comment, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'threadId' | 'replies'>, parentId?: string | null): Promise<Comment | null> => {
  const thread = mockThreads.find(t => t.id === threadId);
  if (!thread) return null;

  const newComment: Comment = {
    ...commentData,
    id: `comment${Date.now()}`,
    threadId,
    parentId,
    createdAt: new Date().toISOString(),
    upvotes: 1,
    downvotes: 0,
    replies: [],
  };
  
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
    findParentAndAddReply(thread.comments);
  } else {
    thread.comments.push(newComment);
  }
  thread.commentCount +=1;
  return JSON.parse(JSON.stringify(newComment));
};

export const updateThreadVotes = async (threadId: string, type: 'upvote' | 'downvote'): Promise<Thread | null> => {
  const threadIndex = mockThreads.findIndex(t => t.id === threadId);
  if (threadIndex === -1) return null;

  if (type === 'upvote') {
    mockThreads[threadIndex].upvotes += 1;
  } else {
    mockThreads[threadIndex].downvotes += 1;
  }
  return JSON.parse(JSON.stringify(mockThreads[threadIndex]));
};

export const updateCommentVotes = async (threadId: string, commentId: string, type: 'upvote' | 'downvote'): Promise<Comment | null> => {
  const thread = mockThreads.find(t => t.id === threadId);
  if (!thread) return null;

  let targetComment: Comment | null = null;

  const findAndUpdateComment = (comments: Comment[]): boolean => {
    for (let c of comments) {
      if (c.id === commentId) {
        if (type === 'upvote') c.upvotes += 1;
        else c.downvotes += 1;
        targetComment = c;
        return true;
      }
      if (c.replies && findAndUpdateComment(c.replies)) return true;
    }
    return false;
  }

  findAndUpdateComment(thread.comments);
  return targetComment ? JSON.parse(JSON.stringify(targetComment)) : null;
};
