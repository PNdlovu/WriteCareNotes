import { 
  BlogPost, 
  BlogCategory, 
  BlogTag, 
  BlogComment, 
  BlogQuery, 
  BlogPostsResponse,
  CreateBlogPostData,
  CreateBlogCommentData,
  CreateBlogCategoryData 
} from '../types/blog';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.writecarenotes.com' 
  : 'http://localhost:3000';

class BlogService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}/api/blog${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Blog Posts
  async getPosts(query?: BlogQuery): Promise<BlogPostsResponse> {
    const searchParams = new URLSearchParams();
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }

    const endpoint = searchParams.toString() ? `/posts?${searchParams.toString()}` : '/posts';
    return this.request<BlogPostsResponse>(endpoint);
  }

  async getPostBySlug(slug: string): Promise<BlogPost> {
    return this.request<BlogPost>(`/posts/${slug}`);
  }

  async getPostById(id: string): Promise<BlogPost> {
    return this.request<BlogPost>(`/posts/${id}`);
  }

  async getPopularPosts(limit?: number): Promise<BlogPost[]> {
    const endpoint = limit ? `/posts/popular?limit=${limit}` : '/posts/popular';
    return this.request<BlogPost[]>(endpoint);
  }

  async getFeaturedPosts(limit?: number): Promise<BlogPost[]> {
    const endpoint = limit ? `/posts/featured?limit=${limit}` : '/posts/featured';
    return this.request<BlogPost[]>(endpoint);
  }

  async getRecentPosts(limit?: number): Promise<BlogPost[]> {
    const endpoint = limit ? `/posts/recent?limit=${limit}` : '/posts/recent';
    return this.request<BlogPost[]>(endpoint);
  }

  async getRelatedPosts(postId: string, limit?: number): Promise<BlogPost[]> {
    const endpoint = limit ? `/posts/${postId}/related?limit=${limit}` : `/posts/${postId}/related`;
    return this.request<BlogPost[]>(endpoint);
  }

  async createPost(data: CreateBlogPostData): Promise<BlogPost> {
    return this.request<BlogPost>('/posts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePost(id: string, data: Partial<CreateBlogPostData>): Promise<BlogPost> {
    return this.request<BlogPost>(`/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePost(id: string): Promise<void> {
    await this.request<void>(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  async getCategories(): Promise<BlogCategory[]> {
    return this.request<BlogCategory[]>('/categories');
  }

  async getCategoryBySlug(slug: string): Promise<BlogCategory> {
    return this.request<BlogCategory>(`/categories/${slug}`);
  }

  async createCategory(data: CreateBlogCategoryData): Promise<BlogCategory> {
    return this.request<BlogCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: Partial<CreateBlogCategoryData>): Promise<BlogCategory> {
    return this.request<BlogCategory>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Tags
  async getTags(): Promise<BlogTag[]> {
    return this.request<BlogTag[]>('/tags');
  }

  async getTagBySlug(slug: string): Promise<BlogTag> {
    return this.request<BlogTag>(`/tags/${slug}`);
  }

  // Comments
  async createComment(data: CreateBlogCommentData): Promise<BlogComment> {
    return this.request<BlogComment>('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveComment(id: string): Promise<BlogComment> {
    return this.request<BlogComment>(`/comments/${id}/approve`, {
      method: 'PUT',
    });
  }

  async deleteComment(id: string): Promise<void> {
    await this.request<void>(`/comments/${id}`, {
      method: 'DELETE',
    });
  }

  // Search and SEO
  async getSearchSuggestions(query: string): Promise<string[]> {
    return this.request<string[]>(`/search/suggestions?q=${encodeURIComponent(query)}`);
  }

  async getSitemap(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/blog/sitemap.xml`);
    return response.text();
  }

  async getRSSFeed(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/api/blog/rss`);
    return response.text();
  }
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const blogService = new BlogService();