/**
 * @fileoverview knowledge base Service
 * @module Knowledge-base/KnowledgeBaseService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description knowledge base Service
 */

import { EventEmitter2 } from "eventemitter2";

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { KnowledgeArticle, ArticleType, PublicationStatus } from '../../entities/knowledge-base/KnowledgeArticle';

export class KnowledgeBaseService {
  private articleRepository: Repository<KnowledgeArticle>;

  constructor() {
    this.articleRepository = AppDataSource.getRepository(KnowledgeArticle);
  }

  async createArticle(articleData: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    try {
      const articleId = `KB${Date.now()}`;
      
      const article = this.articleRepository.create({
        ...articleData,
        articleId,
        status: PublicationStatus.DRAFT,
        views: 0,
        likes: 0
      });

      return await this.articleRepository.save(article);
    } catch (error: unknown) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  async getKnowledgeAnalytics(): Promise<any> {
    try {
      const articles = await this.articleRepository.find();
      
      return {
        totalArticles: articles.length,
        publishedArticles: articles.filter(a => a.isPublished()).length,
        totalViews: articles.reduce((sum, a) => sum + a.views, 0),
        totalLikes: articles.reduce((sum, a) => sum + a.likes, 0),
        articlesByType: articles.reduce((acc, article) => {
          acc[article.articleType] = (acc[article.articleType] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error: unknown) {
      console.error('Error getting knowledge analytics:', error);
      throw error;
    }
  }
}