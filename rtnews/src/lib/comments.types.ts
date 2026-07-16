// ─── Comment Model & API Types (Enhanced) ─────────────────────

export interface Comment {
  id: string;
  newsId: string;
  content: string;
  authorName: string;
  parentId: string | null;
  upvotes: number;
  downvotes: number;
  reports: number;
  isExpert: boolean;
  depth: number;
  createdAt: string;
  replies?: Comment[];
}

export interface NewCommentPayload {
  newsId: string;
  content: string;
  authorName: string;
  parentId?: string | null;
  isExpert?: boolean;
}

export type CommentSortOption = 'newest' | 'oldest' | 'most_upvoted';

export type CommentAction = 'upvote' | 'downvote' | 'report';
