import { EventEmitter2 } from "eventemitter2";

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpStatus, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { BlogService } from '../../services/blog/BlogService';
import { CreateBlogPostDto, UpdateBlogPostDto, CreateBlogCategoryDto, UpdateBlogCategoryDto, CreateBlogCommentDto, BlogQueryDto } from '../../dto/blog.dto';
import { BlogPost, BlogCategory, BlogTag, BlogComment } from '../../entities/blog/BlogPost';

@ApiTags('Blog')
@Controller('api/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // Blog Post Endpoints
  @Post('posts')
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({ status: 201, description: 'Blog post created successfully', type: BlogPost })
  async createPost(@Body() createBlogPostDto: CreateBlogPostDto): Promise<BlogPost> {
    // Calculate read time from content
    createBlogPostDto.readTime = await this.blogService.calculateReadTime(createBlogPostDto.content);
    return await this.blogService.createPost(createBlogPostDto);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get all blog posts with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'category', required: false, description: 'Category slug' })
  @ApiQuery({ name: 'tag', required: false, description: 'Tag slug' })
  @ApiQuery({ name: 'status', required: false, description: 'Post status' })
  @ApiQuery({ name: 'featured', required: false, description: 'Featured posts only' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Posts per page' })
  async findAllPosts(@Query() query: BlogQueryDto) {
    return await this.blogService.findAllPosts(query);
  }

  @Get('posts/popular')
  @ApiOperation({ summary: 'Get popular blog posts' })
  async getPopularPosts(@Query('limit') limit?: number) {
    return await this.blogService.getPopularPosts(limit);
  }

  @Get('posts/featured')
  @ApiOperation({ summary: 'Get featured blog posts' })
  async getFeaturedPosts(@Query('limit') limit?: number) {
    return await this.blogService.getFeaturedPosts(limit);
  }

  @Get('posts/recent')
  @ApiOperation({ summary: 'Get recent blog posts' })
  async getRecentPosts(@Query('limit') limit?: number) {
    return await this.blogService.getRecentPosts(limit);
  }

  @Get('posts/:slug')
  @ApiOperation({ summary: 'Get a blog post by slug' })
  @ApiResponse({ status: 200, description: 'Blog post found', type: BlogPost })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  async findPostBySlug(@Param('slug') slug: string): Promise<BlogPost> {
    return await this.blogService.findPostBySlug(slug);
  }

  @Get('posts/:id/related')
  @ApiOperation({ summary: 'Get related blog posts' })
  async getRelatedPosts(@Param('id') id: string, @Query('limit') limit?: number) {
    return await this.blogService.getRelatedPosts(id, limit);
  }

  @Put('posts/:id')
  @ApiOperation({ summary: 'Update a blog post' })
  @ApiResponse({ status: 200, description: 'Blog post updated successfully', type: BlogPost })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  async updatePost(@Param('id') id: string, @Body() updateBlogPostDto: UpdateBlogPostDto): Promise<BlogPost> {
    if (updateBlogPostDto.content) {
      updateBlogPostDto.readTime = await this.blogService.calculateReadTime(updateBlogPostDto.content);
    }
    return await this.blogService.updatePost(id, updateBlogPostDto);
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete a blog post' })
  @ApiResponse({ status: 204, description: 'Blog post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  async deletePost(@Param('id') id: string): Promise<void> {
    await this.blogService.deletePost(id);
  }

  // Category Endpoints
  @Post('categories')
  @ApiOperation({ summary: 'Create a new blog category' })
  @ApiResponse({ status: 201, description: 'Blog category created successfully', type: BlogCategory })
  async createCategory(@Body() createBlogCategoryDto: CreateBlogCategoryDto): Promise<BlogCategory> {
    return await this.blogService.createCategory(createBlogCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all blog categories' })
  async findAllCategories(): Promise<BlogCategory[]> {
    return await this.blogService.findAllCategories();
  }

  @Get('categories/:slug')
  @ApiOperation({ summary: 'Get a blog category by slug' })
  @ApiResponse({ status: 200, description: 'Blog category found', type: BlogCategory })
  @ApiResponse({ status: 404, description: 'Blog category not found' })
  async findCategoryBySlug(@Param('slug') slug: string): Promise<BlogCategory> {
    return await this.blogService.findCategoryBySlug(slug);
  }

  @Put('categories/:id')
  @ApiOperation({ summary: 'Update a blog category' })
  @ApiResponse({ status: 200, description: 'Blog category updated successfully', type: BlogCategory })
  @ApiResponse({ status: 404, description: 'Blog category not found' })
  async updateCategory(@Param('id') id: string, @Body() updateBlogCategoryDto: UpdateBlogCategoryDto): Promise<BlogCategory> {
    return await this.blogService.updateCategory(id, updateBlogCategoryDto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a blog category' })
  @ApiResponse({ status: 204, description: 'Blog category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Blog category not found' })
  async deleteCategory(@Param('id') id: string): Promise<void> {
    await this.blogService.deleteCategory(id);
  }

  // Tag Endpoints
  @Get('tags')
  @ApiOperation({ summary: 'Get all blog tags' })
  async findAllTags(): Promise<BlogTag[]> {
    return await this.blogService.findAllTags();
  }

  @Get('tags/:slug')
  @ApiOperation({ summary: 'Get a blog tag by slug' })
  @ApiResponse({ status: 200, description: 'Blog tag found', type: BlogTag })
  @ApiResponse({ status: 404, description: 'Blog tag not found' })
  async findTagBySlug(@Param('slug') slug: string): Promise<BlogTag> {
    return await this.blogService.findTagBySlug(slug);
  }

  // Comment Endpoints
  @Post('comments')
  @ApiOperation({ summary: 'Create a new blog comment' })
  @ApiResponse({ status: 201, description: 'Blog comment created successfully', type: BlogComment })
  async createComment(@Body() createBlogCommentDto: CreateBlogCommentDto, @Req() req: Request): Promise<BlogComment> {
    // Add IP address for spam protection
    const ipAddress = req.ip || req.connection.remoteAddress;
    const comment = await this.blogService.createComment({
      ...createBlogCommentDto,
      ipAddress
    } as any);
    return comment;
  }

  @Put('comments/:id/approve')
  @ApiOperation({ summary: 'Approve a blog comment' })
  @ApiResponse({ status: 200, description: 'Blog comment approved successfully', type: BlogComment })
  @ApiResponse({ status: 404, description: 'Blog comment not found' })
  async approveComment(@Param('id') id: string): Promise<BlogComment> {
    return await this.blogService.approveComment(id);
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete a blog comment' })
  @ApiResponse({ status: 204, description: 'Blog comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Blog comment not found' })
  async deleteComment(@Param('id') id: string): Promise<void> {
    await this.blogService.deleteComment(id);
  }

  // SEO Endpoints
  @Get('sitemap.xml')
  @ApiOperation({ summary: 'Generate blog sitemap' })
  async generateSitemap(@Res() res: Response): Promise<void> {
    const sitemap = await this.blogService.generateSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(sitemap);
  }

  @Get('rss')
  @ApiOperation({ summary: 'Generate blog RSS feed' })
  async generateRSSFeed(@Res() res: Response): Promise<void> {
    const rss = await this.blogService.generateRSSFeed();
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  async getSearchSuggestions(@Query('q') query: string): Promise<string[]> {
    return await this.blogService.getSearchSuggestions(query);
  }
}