import { EventEmitter2 } from "eventemitter2";

import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { BlogPost, BlogCategory, BlogTag, BlogComment, BlogPostStatus } from '../../entities/blog/BlogPost';
import { CreateBlogPostDto, UpdateBlogPostDto, CreateBlogCategoryDto, UpdateBlogCategoryDto, CreateBlogCommentDto, BlogQueryDto } from '../../dto/blog.dto';


export class BlogService {
  constructor(
    
    private blogPostRepository: Repository<BlogPost>,
    
    private blogCategoryRepository: Repository<BlogCategory>,
    
    private blogTagRepository: Repository<BlogTag>,
    
    private blogCommentRepository: Repository<BlogComment>,
  ) {}

  // Blog Post Methods
  async createPost(createBlogPostDto: CreateBlogPostDto): Promise<BlogPost> {
    const { categoryIds, tags, ...postData } = createBlogPostDto;

    // Check if slug already exists
    const existingPost = await this.blogPostRepository.findOne({ where: { slug: postData.slug } });
    if (existingPost) {
      throw new ConflictException('A post with this slug already exists');
    }

    const post = this.blogPostRepository.create(postData);

    // Handle categories
    if (categoryIds && categoryIds.length > 0) {
      post.categories = await this.blogCategoryRepository.findBy({ id: In(categoryIds) });
    }

    // Handle tags
    if (tags && tags.length > 0) {
      const tagEntities = [];
      for (const tagName of tags) {
        let tag = await this.blogTagRepository.findOne({ where: { name: tagName } });
        if (!tag) {
          tag = this.blogTagRepository.create({
            name: tagName,
            slug: this.generateSlug(tagName),
            color: this.generateRandomColor()
          });
          tag = await this.blogTagRepository.save(tag);
        }
        tagEntities.push(tag);
      }
      post.tags = tagEntities;
    }

    // Set published date if status is published
    if (post.status === BlogPostStatus.PUBLISHED && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    return await this.blogPostRepository.save(post);
  }

  async findAllPosts(query: BlogQueryDto): Promise<{ posts: BlogPost[]; total: number; pages: number }> {
    const {
      search,
      category,
      tag,
      status,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 10
    } = query;

    const queryBuilder = this.blogPostRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'category')
      .leftJoinAndSelect('post.tags', 'tag')
      .leftJoinAndSelect('post.comments', 'comment');

    // Apply filters
    if (search) {
      queryBuilder.andWhere('(post.title ILIKE :search OR post.content ILIKE :search OR post.excerpt ILIKE :search)', 
        { search: `%${search}%` });
    }

    if (category) {
      queryBuilder.andWhere('category.slug = :category', { category });
    }

    if (tag) {
      queryBuilder.andWhere('tag.slug = :tag', { tag });
    }

    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }

    if (featured !== undefined) {
      queryBuilder.andWhere('post.featured = :featured', { featured });
    }

    // Apply sorting
    queryBuilder.orderBy(`post.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();
    const pages = Math.ceil(total / limit);

    return { posts, total, pages };
  }

  async findPostBySlug(slug: string): Promise<BlogPost> {
    const post = await this.blogPostRepository.findOne({
      where: { slug },
      relations: ['categories', 'tags', 'comments']
    });

    if (!post) {
      throw new Error('Blog post not found');
    }

    // Increment view count
    await this.blogPostRepository.increment({ id: post.id }, 'viewCount', 1);
    post.viewCount += 1;

    return post;
  }

  async findPostById(id: string): Promise<BlogPost> {
    const post = await this.blogPostRepository.findOne({
      where: { id },
      relations: ['categories', 'tags', 'comments']
    });

    if (!post) {
      throw new Error('Blog post not found');
    }

    return post;
  }

  async updatePost(id: string, updateBlogPostDto: UpdateBlogPostDto): Promise<BlogPost> {
    const post = await this.findPostById(id);
    const { categoryIds, tags, ...updateData } = updateBlogPostDto;

    // Check if slug already exists (if being updated)
    if (updateData.slug && updateData.slug !== post.slug) {
      const existingPost = await this.blogPostRepository.findOne({ where: { slug: updateData.slug } });
      if (existingPost) {
        throw new ConflictException('A post with this slug already exists');
      }
    }

    // Update basic fields
    Object.assign(post, updateData);

    // Handle categories
    if (categoryIds !== undefined) {
      if (categoryIds.length > 0) {
        post.categories = await this.blogCategoryRepository.findBy({ id: In(categoryIds) });
      } else {
        post.categories = [];
      }
    }

    // Handle tags
    if (tags !== undefined) {
      if (tags.length > 0) {
        const tagEntities = [];
        for (const tagName of tags) {
          let tag = await this.blogTagRepository.findOne({ where: { name: tagName } });
          if (!tag) {
            tag = this.blogTagRepository.create({
              name: tagName,
              slug: this.generateSlug(tagName),
              color: this.generateRandomColor()
            });
            tag = await this.blogTagRepository.save(tag);
          }
          tagEntities.push(tag);
        }
        post.tags = tagEntities;
      } else {
        post.tags = [];
      }
    }

    // Set published date if status changed to published
    if (updateData.status === BlogPostStatus.PUBLISHED && !post.publishedAt) {
      post.publishedAt = new Date();
    }

    return await this.blogPostRepository.save(post);
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.findPostById(id);
    await this.blogPostRepository.remove(post);
  }

  async getRelatedPosts(postId: string, limit: number = 4): Promise<BlogPost[]> {
    const post = await this.findPostById(postId);
    
    const categoryIds = post.categories.map(cat => cat.id);
    const tagIds = post.tags.map(tag => tag.id);

    const queryBuilder = this.blogPostRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.categories', 'category')
      .leftJoinAndSelect('post.tags', 'tag')
      .where('post.id != :postId', { postId })
      .andWhere('post.status = :status', { status: BlogPostStatus.PUBLISHED });

    if (categoryIds.length > 0 || tagIds.length > 0) {
      queryBuilder.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('DISTINCT relatedPost.id')
          .from(BlogPost, 'relatedPost')
          .leftJoin('relatedPost.categories', 'relatedCategory')
          .leftJoin('relatedPost.tags', 'relatedTag')
          .where('relatedCategory.id IN (:...categoryIds) OR relatedTag.id IN (:...tagIds)', {
            categoryIds: categoryIds.length > 0 ? categoryIds : [''],
            tagIds: tagIds.length > 0 ? tagIds : ['']
          })
          .getQuery();
        return 'post.id IN ' + subQuery;
      });
    }

    return await queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  // Category Methods
  async createCategory(createBlogCategoryDto: CreateBlogCategoryDto): Promise<BlogCategory> {
    const existingCategory = await this.blogCategoryRepository.findOne({ 
      where: [{ name: createBlogCategoryDto.name }, { slug: createBlogCategoryDto.slug }] 
    });
    
    if (existingCategory) {
      throw new ConflictException('A category with this name or slug already exists');
    }

    const category = this.blogCategoryRepository.create(createBlogCategoryDto);
    return await this.blogCategoryRepository.save(category);
  }

  async findAllCategories(): Promise<BlogCategory[]> {
    return await this.blogCategoryRepository.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
      relations: ['posts']
    });
  }

  async findCategoryBySlug(slug: string): Promise<BlogCategory> {
    const category = await this.blogCategoryRepository.findOne({
      where: { slug },
      relations: ['posts']
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, updateBlogCategoryDto: UpdateBlogCategoryDto): Promise<BlogCategory> {
    const category = await this.blogCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new Error('Category not found');
    }

    // Check for conflicts if name or slug is being updated
    if (updateBlogCategoryDto.name || updateBlogCategoryDto.slug) {
      const conflicts = [];
      if (updateBlogCategoryDto.name && updateBlogCategoryDto.name !== category.name) {
        conflicts.push({ name: updateBlogCategoryDto.name });
      }
      if (updateBlogCategoryDto.slug && updateBlogCategoryDto.slug !== category.slug) {
        conflicts.push({ slug: updateBlogCategoryDto.slug });
      }

      if (conflicts.length > 0) {
        const existingCategory = await this.blogCategoryRepository.findOne({ where: conflicts });
        if (existingCategory && existingCategory.id !== id) {
          throw new ConflictException('A category with this name or slug already exists');
        }
      }
    }

    Object.assign(category, updateBlogCategoryDto);
    return await this.blogCategoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const category = await this.blogCategoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new Error('Category not found');
    }
    await this.blogCategoryRepository.remove(category);
  }

  // Tag Methods
  async findAllTags(): Promise<BlogTag[]> {
    return await this.blogTagRepository.find({
      order: { name: 'ASC' },
      relations: ['posts']
    });
  }

  async findTagBySlug(slug: string): Promise<BlogTag> {
    const tag = await this.blogTagRepository.findOne({
      where: { slug },
      relations: ['posts']
    });

    if (!tag) {
      throw new Error('Tag not found');
    }

    return tag;
  }

  // Comment Methods
  async createComment(createBlogCommentDto: CreateBlogCommentDto): Promise<BlogComment> {
    const post = await this.findPostById(createBlogCommentDto.postId);
    
    const comment = this.blogCommentRepository.create({
      ...createBlogCommentDto,
      post
    });

    return await this.blogCommentRepository.save(comment);
  }

  async approveComment(id: string): Promise<BlogComment> {
    const comment = await this.blogCommentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new Error('Comment not found');
    }

    comment.approved = true;
    return await this.blogCommentRepository.save(comment);
  }

  async deleteComment(id: string): Promise<void> {
    const comment = await this.blogCommentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new Error('Comment not found');
    }
    await this.blogCommentRepository.remove(comment);
  }

  // SEO and Utility Methods
  async generateSitemap(): Promise<string> {
    const posts = await this.blogPostRepository.find({
      where: { status: BlogPostStatus.PUBLISHED },
      order: { updatedAt: 'DESC' }
    });

    const categories = await this.blogCategoryRepository.find();
    const tags = await this.blogTagRepository.find();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://writecarenotes.com/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Add blog posts
    for (const post of posts) {
      sitemap += `
  <url>
    <loc>https://writecarenotes.com/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add categories
    for (const category of categories) {
      sitemap += `
  <url>
    <loc>https://writecarenotes.com/blog/category/${category.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    // Add tags
    for (const tag of tags) {
      sitemap += `
  <url>
    <loc>https://writecarenotes.com/blog/tag/${tag.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }

    sitemap += `
</urlset>`;

    return sitemap;
  }

  async generateRSSFeed(): Promise<string> {
    const posts = await this.blogPostRepository.find({
      where: { status: BlogPostStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
      take: 20,
      relations: ['categories', 'tags']
    });

    let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WriteCareNotes Blog</title>
    <description>Latest insights on healthcare technology, care management, and regulatory compliance</description>
    <link>https://writecarenotes.com/blog</link>
    <atom:link href="https://writecarenotes.com/blog/rss" rel="self" type="application/rss+xml"/>
    <language>en-GB</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`;

    for (const post of posts) {
      const categories = post.categories.map(cat => cat.name).join(', ');
      rss += `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt || post.content.substring(0, 300) + '...'}]]></description>
      <link>https://writecarenotes.com/blog/${post.slug}</link>
      <guid>https://writecarenotes.com/blog/${post.slug}</guid>
      <pubDate>${post.publishedAt.toUTCString()}</pubDate>
      <author>${post.authorEmail} (${post.authorName})</author>
      <category><![CDATA[${categories}]]></category>
      <content:encoded><![CDATA[${post.content}]]></content:encoded>
    </item>`;
    }

    rss += `
  </channel>
</rss>`;

    return rss;
  }

  async getPopularPosts(limit: number = 5): Promise<BlogPost[]> {
    return await this.blogPostRepository.find({
      where: { status: BlogPostStatus.PUBLISHED },
      order: { viewCount: 'DESC', publishedAt: 'DESC' },
      take: limit,
      relations: ['categories', 'tags']
    });
  }

  async getFeaturedPosts(limit: number = 3): Promise<BlogPost[]> {
    return await this.blogPostRepository.find({
      where: { 
        status: BlogPostStatus.PUBLISHED,
        featured: true 
      },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: ['categories', 'tags']
    });
  }

  async getRecentPosts(limit: number = 5): Promise<BlogPost[]> {
    return await this.blogPostRepository.find({
      where: { status: BlogPostStatus.PUBLISHED },
      order: { publishedAt: 'DESC' },
      take: limit,
      relations: ['categories', 'tags']
    });
  }

  // Utility Methods
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  private generateRandomColor(): string {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  async calculateReadTime(content: string): Promise<number> {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    const posts = await this.blogPostRepository
      .createQueryBuilder('post')
      .select('post.title')
      .where('post.title ILIKE :query', { query: `%${query}%` })
      .andWhere('post.status = :status', { status: BlogPostStatus.PUBLISHED })
      .limit(5)
      .getMany();

    return posts.map(post => post.title);
  }
}