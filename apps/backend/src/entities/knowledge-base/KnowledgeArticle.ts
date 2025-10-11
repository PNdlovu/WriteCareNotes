import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum ArticleType {
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  TRAINING = 'training',
  NEWS = 'news',
  BEST_PRACTICE = 'best_practice',
  REGULATION = 'regulation'
}

export enum PublicationStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

@Entity('knowledge_articles')
export class KnowledgeArticle extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  articleId: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: ArticleType
  })
  articleType: ArticleType;

  @Column({
    type: 'enum',
    enum: PublicationStatus,
    default: PublicationStatus.DRAFT
  })
  status: PublicationStatus;

  @Column()
  authorId: string;

  @Column('simple-array')
  tags: string[];

  @Column('int', { default: 0 })
  views: number;

  @Column('int', { default: 0 })
  likes: number;

  @Column('date', { nullable: true })
  publishedDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isPublished(): boolean {
    return this.status === PublicationStatus.PUBLISHED;
  }

  incrementViews(): void {
    this.views++;
  }

  addLike(): void {
    this.likes++;
  }
}