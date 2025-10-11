import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum BlogPostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

@Entity('blog_posts')
export class BlogPost extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 500 })
  slug: string;

  @Column({ length: 500, nullable: true })
  excerpt: string;

  @Column('text')
  content: string;

  @Column({ length: 500, nullable: true })
  featuredImage: string;

  @Column({ length: 255, nullable: true })
  metaTitle: string;

  @Column({ length: 500, nullable: true })
  metaDescription: string;

  @Column('simple-array', { nullable: true })
  metaKeywords: string[];

  @Column({
    type: 'enum',
    enum: BlogPostStatus,
    default: BlogPostStatus.DRAFT
  })
  status: BlogPostStatus;

  @Column({ default: false })
  featured: boolean;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  readTime: number; // in minutes

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ length: 255, nullable: true })
  authorName: string;

  @Column({ length: 255, nullable: true })
  authorEmail: string;

  @ManyToMany(() => BlogCategory, category => category.posts, { cascade: true })
  @JoinTable({
    name: 'blog_post_categories',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
  })
  categories: BlogCategory[];

  @ManyToMany(() => BlogTag, tag => tag.posts, { cascade: true })
  @JoinTable({
    name: 'blog_post_tags',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' }
  })
  tags: BlogTag[];

  @OneToMany(() => BlogComment, comment => comment.post)
  comments: BlogComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('blog_categories')
export class BlogCategory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  name: string;

  @Column({ length: 500, unique: true })
  slug: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({ length: 255, nullable: true })
  color: string;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToMany(() => BlogPost, post => post.categories)
  posts: BlogPost[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('blog_tags')
export class BlogTag extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  name: string;

  @Column({ length: 500, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true })
  color: string;

  @ManyToMany(() => BlogPost, post => post.tags)
  posts: BlogPost[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('blog_comments')
export class BlogComment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ length: 255 })
  authorName: string;

  @Column({ length: 255 })
  authorEmail: string;

  @Column({ length: 255, nullable: true })
  authorWebsite: string;

  @Column({ default: false })
  approved: boolean;

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @ManyToOne(() => BlogPost, post => post.comments, { onDelete: 'CASCADE' })
  post: BlogPost;

  @Column()
  postId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
