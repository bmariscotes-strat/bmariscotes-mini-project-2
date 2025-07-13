export interface Author {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  created_at: Date | null;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  content: string;
  user_id: number;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date | null;
}

export interface PostImage {
  id: number;
  post_id: number;
  image_url: string;
  created_at: Date | null;
}

export interface ReactionCounts {
  upvotes: number;
  downvotes: number;
}
