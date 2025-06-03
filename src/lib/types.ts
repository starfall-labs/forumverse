export type User = {
  id: string;
  email: string; // For simplicity, username is email
  avatarUrl?: string;
};

export type Comment = {
  id: string;
  threadId: string;
  parentId?: string | null; // For nested comments
  author: User;
  content: string;
  createdAt: string; // ISO date string
  upvotes: number;
  downvotes: number;
  replies?: Comment[]; 
};

export type Thread = {
  id: string;
  title: string;
  content: string;
  author: User;
  createdAt: string; // ISO date string
  upvotes: number;
  downvotes: number;
  comments: Comment[];
  commentCount: number;
};
