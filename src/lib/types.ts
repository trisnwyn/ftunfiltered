export type PostType = "confession" | "letter" | "shoutout" | "rant";
export type PostStatus = "approved" | "pending" | "rejected";

export interface Post {
  id: string;
  user_id: string;
  type: PostType;
  content: string;
  template: string;
  styles: Record<string, string>;
  hearts_count: number;
  status: PostStatus;
  created_at: string;
  photos?: PostPhoto[];
  hearted_by_user?: boolean;
}

export interface PostPhoto {
  id: string;
  post_id: string;
  url: string;
  position: number;
}

export interface Heart {
  id: string;
  post_id: string;
  user_id: string;
}

export interface AdminMessage {
  id: string;
  email: string;
  subject: string;
  body: string;
  read: boolean;
  created_at: string;
}
