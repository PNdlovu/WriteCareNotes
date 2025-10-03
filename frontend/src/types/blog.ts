export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  viewCount: number;
  readTime: number;
  publishedAt?: string;
  authorName?: string;
  authorEmail?: string;
  categories?: BlogCategory[];
  tags?: BlogTag[];
  comments?: BlogComment[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  sortOrder: number;
  posts?: BlogPost[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  color?: string;
  posts?: BlogPost[];
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  approved: boolean;
  ipAddress?: string;
  postId: string;
  post?: BlogPost;
  createdAt: string;
  updatedAt: string;
}

export interface BlogQuery {
  search?: string;
  category?: string;
  tag?: string;
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  total: number;
  pages: number;
}

export interface CreateBlogPostData {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featuredImage?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  status?: 'draft' | 'published' | 'archived';
  featured?: boolean;
  readTime?: number;
  authorName?: string;
  authorEmail?: string;
  categoryIds?: string[];
  tags?: string[];
}

export interface CreateBlogCommentData {
  content: string;
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  postId: string;
}

export interface CreateBlogCategoryData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  sortOrder?: number;
}