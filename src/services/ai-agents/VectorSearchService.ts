import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Vector Search Service for AI Agents
 * @module VectorSearchService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Semantic search service using pgvector for knowledge base queries
 */

import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { KnowledgeArticle } from '../../entities/knowledge-base/KnowledgeArticle';
import { Logger } from '@nestjs/common';
import axios from 'axios';

export interface VectorSearchQuery {
  query: string;
  tenantId?: string;
  limit?: number;
  threshold?: number;
  filters?: {
    articleType?: string;
    tags?: string[];
    accessLevel?: string;
  };
}

export interface VectorSearchResult {
  article: KnowledgeArticle;
  similarity: number;
  relevanceScore: number;
  excerpt: string;
}

export interface EmbeddingRequest {
  text: string;
  model?: string;
}

export interface EmbeddingResponse {
  embedding: number[];
  dimensions: number;
  tokensUsed: number;
}

export class VectorSearchService {
  // Logger removed
  private knowledgeRepository: Repository<KnowledgeArticle>;
  private embeddingModel: string;
  private embeddingProvider: 'OPENAI' | 'AZURE_OPENAI' | 'LOCAL';

  constructor() {
    this.knowledgeRepository = AppDataSource.getRepository(KnowledgeArticle);

    this.embeddingModel = process.env['EMBEDDING_MODEL'] || 'text-embedding-ada-002';
    this.embeddingProvider = (process.env['EMBEDDING_PROVIDER'] as any) || 'OPENAI';

  }

  /**
   * Perform semantic search on knowledge base
   */
  async semanticSearch(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    try {
      console.log('Performing semantic search', {
        query: query.query.substring(0, 100),
        tenantId: query.tenantId,
        limit: query.limit || 10
      });

      // Generate embedding for query
      const queryEmbedding = await this.generateEmbedding({
        text: query.query
      });

      // Perform vector similarity search
      const results = await this.performVectorSearch(queryEmbedding, query);

      // Post-process results
      const processedResults = await this.processSearchResults(results, query);

      console.log('Semantic search completed', {
        queryLength: query.query.length,
        resultsCount: processedResults.length,
        avgSimilarity: processedResults.reduce((sum, r) => sum + r.similarity, 0) / processedResults.length
      });

      return processedResults;

    } catch (error: unknown) {
      console.error('Semantic search failed', {
        query: query.query.substring(0, 100),
        tenantId: query.tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });

      // Fallback to text search if vector search fails
      return await this.fallbackTextSearch(query);
    }
  }

  /**
   * Generate text embedding
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      switch (this.embeddingProvider) {
        case 'OPENAI':
          return await this.generateOpenAIEmbedding(request);
        case 'AZURE_OPENAI':
          return await this.generateAzureOpenAIEmbedding(request);
        case 'LOCAL':
          return await this.generateLocalEmbedding(request);
        default:
          throw new Error(`Unsupported embedding provider: ${this.embeddingProvider}`);
      }
    } catch (error: unknown) {
      console.error('Failed to generate embedding', {
        provider: this.embeddingProvider,
        textLength: request.text.length,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      throw error;
    }
  }

  /**
   * Generate OpenAI embedding
   */
  private async generateOpenAIEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const response = await axios.post(
      'https://api.openai.com/v1/embeddings',
      {
        input: request.text,
        model: request.model || this.embeddingModel
      },
      {
        headers: {

          'Authorization': `Bearer ${process.env['OPENAI_API_KEY']}`,

          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return {
      embedding: response.data.data[0].embedding,
      dimensions: response.data.data[0].embedding.length,
      tokensUsed: response.data.usage.total_tokens
    };
  }

  /**
   * Generate Azure OpenAI embedding
   */
  private async generateAzureOpenAIEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {

    const endpoint = process.env['AZURE_OPENAI_ENDPOINT'];
    const deploymentName = process.env['AZURE_OPENAI_EMBEDDING_DEPLOYMENT'] || 'text-embedding-ada-002';

    
    const response = await axios.post(
      `${endpoint}/openai/deployments/${deploymentName}/embeddings?api-version=2023-12-01-preview`,
      {
        input: request.text
      },
      {
        headers: {

          'api-key': process.env['AZURE_OPENAI_API_KEY'],

          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return {
      embedding: response.data.data[0].embedding,
      dimensions: response.data.data[0].embedding.length,
      tokensUsed: response.data.usage.total_tokens
    };
  }

  /**
   * Generate local embedding (placeholder for local model)
   */
  private async generateLocalEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Placeholder for local embedding model
    // In production, this would use a local transformer model
    const dimensions = 1536; // Standard embedding dimension
    const embedding = Array(dimensions).fill(0).map(() => Math.random() - 0.5);
    
    return {
      embedding,
      dimensions,
      tokensUsed: Math.ceil(request.text.length / 4) // Approximate token count
    };
  }

  /**
   * Perform vector similarity search using pgvector
   */
  private async performVectorSearch(
    queryEmbedding: EmbeddingResponse,
    query: VectorSearchQuery
  ): Promise<Array<{ article: KnowledgeArticle; similarity: number }>> {
    try {
      // Build SQL query with vector similarity
      let sqlQuery = `
        SELECT 
          ka.*,
          1 - (ka.embedding_vector <=> $1::vector) AS similarity
        FROM enhanced_knowledge_base_articles ka
        WHERE ka.ai_searchable = true
          AND (ka.embedding_vector IS NOT NULL)
          AND (1 - (ka.embedding_vector <=> $1::vector)) > $2
      `;

      const queryParams: any[] = [
        `[${queryEmbedding.embedding.join(',')}]`, // Vector as string
        query.threshold || 0.5 // Similarity threshold
      ];

      let paramIndex = 3;

      // Add tenant filter if specified
      if (query.tenantId) {
        sqlQuery += ` AND ka.tenant_id = $${paramIndex}`;
        queryParams.push(query.tenantId);
        paramIndex++;
      } else {
        // Public articles only
        sqlQuery += ` AND ka.tenant_id IS NULL`;
      }

      // Add filters
      if (query.filters?.articleType) {
        sqlQuery += ` AND ka.article_type = $${paramIndex}`;
        queryParams.push(query.filters.articleType);
        paramIndex++;
      }

      if (query.filters?.accessLevel) {
        sqlQuery += ` AND ka.access_level = $${paramIndex}`;
        queryParams.push(query.filters.accessLevel);
        paramIndex++;
      }

      if (query.filters?.tags && query.filters.tags.length > 0) {
        sqlQuery += ` AND ka.tags && $${paramIndex}`;
        queryParams.push(query.filters.tags);
        paramIndex++;
      }

      // Order by similarity and limit results
      sqlQuery += ` ORDER BY similarity DESC LIMIT $${paramIndex}`;
      queryParams.push(query.limit || 10);

      // Execute query
      const rawResults = await AppDataSource.query(sqlQuery, queryParams);

      // Map results to proper format
      return rawResults.map(row => ({
        article: {
          id: row.id,
          title: row.title,
          content: row.content,
          articleType: row.article_type,
          tags: row.tags,
          accessLevel: row.access_level,
          tenantId: row.tenant_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        } as KnowledgeArticle,
        similarity: parseFloat(row.similarity)
      }));

    } catch (error: unknown) {
      console.error('Vector search query failed', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        tenantId: query.tenantId
      });
      throw error;
    }
  }

  /**
   * Process search results for relevance and security
   */
  private async processSearchResults(
    results: Array<{ article: KnowledgeArticle; similarity: number }>,
    query: VectorSearchQuery
  ): Promise<VectorSearchResult[]> {
    return results.map(result => {
      // Calculate relevance score (combines similarity with other factors)
      const relevanceScore = this.calculateRelevanceScore(result, query);
      
      // Generate excerpt
      const excerpt = this.generateExcerpt(result.article.content, query.query);
      
      return {
        article: result.article,
        similarity: result.similarity,
        relevanceScore,
        excerpt
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(
    result: { article: KnowledgeArticle; similarity: number },
    query: VectorSearchQuery
  ): number {
    let score = result.similarity;
    
    // Boost score for exact keyword matches in title
    const queryWords = query.query.toLowerCase().split(/\s+/);
    const titleWords = result.article.title.toLowerCase().split(/\s+/);
    const titleMatches = queryWords.filter(word => titleWords.includes(word)).length;
    score += (titleMatches / queryWords.length) * 0.2;
    
    // Boost score for tag matches
    if (result.article.tags) {
      const tagMatches = queryWords.filter(word => 
        result.article.tags.some(tag => tag.toLowerCase().includes(word))
      ).length;
      score += (tagMatches / queryWords.length) * 0.1;
    }
    
    // Boost score for recent articles
    const daysSinceUpdate = (Date.now() - result.article.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) {
      score += 0.05; // Slight boost for recent content
    }
    
    return Math.min(score, 1);
  }

  /**
   * Generate excerpt from article content
   */
  private generateExcerpt(content: string, query: string): string {
    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/);
    
    // Find sentence with most query word matches
    let bestSentence = sentences[0] || '';
    let maxMatches = 0;
    
    for (const sentence of sentences) {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const matches = queryWords.filter(word => 
        sentenceWords.some(sentenceWord => sentenceWord.includes(word))
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    }
    
    // Limit excerpt length
    if (bestSentence.length > 200) {
      bestSentence = bestSentence.substring(0, 197) + '...';
    }
    
    return bestSentence.trim();
  }

  /**
   * Fallback text search when vector search fails
   */
  private async fallbackTextSearch(query: VectorSearchQuery): Promise<VectorSearchResult[]> {
    try {
      console.log('Using fallback text search', {
        query: query.query.substring(0, 100),
        tenantId: query.tenantId
      });

      const whereConditions: any = {
        aiSearchable: true
      };

      // Add tenant filter
      if (query.tenantId) {
        whereConditions.tenantId = query.tenantId;
      } else {
        whereConditions.tenantId = null; // Public articles only
      }

      // Add additional filters
      if (query.filters?.articleType) {
        whereConditions.articleType = query.filters.articleType;
      }

      if (query.filters?.accessLevel) {
        whereConditions.accessLevel = query.filters.accessLevel;
      }

      const articles = await this.knowledgeRepository
        .createQueryBuilder('article')
        .where(whereConditions)
        .andWhere(
          "to_tsvector('english', article.title || ' ' || article.content) @@ plainto_tsquery('english', :query)",
          { query: query.query }
        )
        .orderBy(
          "ts_rank(to_tsvector('english', article.title || ' ' || article.content), plainto_tsquery('english', :query))",
          'DESC'
        )
        .limit(query.limit || 10)
        .getMany();

      return articles.map(article => ({
        article,
        similarity: 0.7, // Default similarity for text search
        relevanceScore: 0.7,
        excerpt: this.generateExcerpt(article.content, query.query)
      }));

    } catch (error: unknown) {
      console.error('Fallback text search failed', {
        query: query.query.substring(0, 100),
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      return [];
    }
  }

  /**
   * Index knowledge article with vector embedding
   */
  async indexArticle(article: KnowledgeArticle): Promise<void> {
    try {
      // Generate embedding for article content
      const embedding = await this.generateEmbedding({
        text: `${article.title} ${article.content}`
      });

      // Update article with embedding
      await this.knowledgeRepository.update(article.id, {
        embeddingVector: embedding.embedding as any
      });

      console.log('Article indexed successfully', {
        articleId: article.id,
        title: article.title,
        embeddingDimensions: embedding.dimensions
      });

    } catch (error: unknown) {
      console.error('Failed to index article', {
        articleId: article.id,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Reindex all articles
   */
  async reindexAllArticles(tenantId?: string): Promise<void> {
    try {
      const whereConditions: any = { aiSearchable: true };
      if (tenantId) {
        whereConditions.tenantId = tenantId;
      }

      const articles = await this.knowledgeRepository.find({
        where: whereConditions
      });

      console.log('Starting article reindexing', {
        articleCount: articles.length,
        tenantId
      });

      // Process in batches to avoid overwhelming the embedding API
      const batchSize = 10;
      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(article => this.indexArticle(article))
        );

        // Small delay between batches
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('Article reindexing completed', {
        articleCount: articles.length,
        tenantId
      });

    } catch (error: unknown) {
      console.error('Article reindexing failed', {
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Search for similar articles
   */
  async findSimilarArticles(
    articleId: string,
    tenantId?: string,
    limit: number = 5
  ): Promise<VectorSearchResult[]> {
    try {
      // Get the reference article
      const article = await this.knowledgeRepository.findOne({
        where: { id: articleId }
      });

      if (!article || !article.embeddingVector) {
        return [];
      }

      // Find similar articles using vector similarity
      const query: VectorSearchQuery = {
        query: article.title + ' ' + article.content.substring(0, 500),
        tenantId,
        limit: limit + 1, // +1 to exclude the original article
        threshold: 0.3
      };

      const results = await this.semanticSearch(query);
      
      // Remove the original article from results
      return results.filter(result => result.article.id !== articleId);

    } catch (error: unknown) {
      console.error('Failed to find similar articles', {
        articleId,
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      return [];
    }
  }

  /**
   * Get trending search queries
   */
  async getTrendingQueries(tenantId?: string, days: number = 7): Promise<{
    query: string;
    count: number;
    avgSimilarity: number;
  }[]> {
    try {
      // In production, this would analyze actual search logs
      // For now, return mock trending queries
      const mockTrending = [
        { query: 'medication management', count: 45, avgSimilarity: 0.82 },
        { query: 'CQC compliance', count: 38, avgSimilarity: 0.79 },
        { query: 'care planning', count: 32, avgSimilarity: 0.85 },
        { query: 'risk assessment', count: 28, avgSimilarity: 0.77 },
        { query: 'family communication', count: 24, avgSimilarity: 0.74 }
      ];

      return mockTrending;

    } catch (error: unknown) {
      console.error('Failed to get trending queries', {
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      return [];
    }
  }

  /**
   * Optimize vector search performance
   */
  async optimizeVectorIndex(tenantId?: string): Promise<void> {
    try {
      // Create or update vector index for better performance
      const indexName = tenantId ? `idx_vector_${tenantId}` : 'idx_vector_public';
      
      await AppDataSource.query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
        ON enhanced_knowledge_base_articles 
        USING ivfflat (embedding_vector vector_cosine_ops)
        WITH (lists = 100)
        WHERE ${tenantId ? 'tenant_id = $1' : 'tenant_id IS NULL'}
        AND embedding_vector IS NOT NULL
      `, tenantId ? [tenantId] : []);

      console.log('Vector index optimized', {
        indexName,
        tenantId
      });

    } catch (error: unknown) {
      console.error('Failed to optimize vector index', {
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
    }
  }

  /**
   * Get vector search statistics
   */
  async getSearchStatistics(tenantId?: string): Promise<{
    totalArticles: number;
    indexedArticles: number;
    avgEmbeddingQuality: number;
    lastIndexUpdate: Date;
  }> {
    try {
      const whereConditions: any = { aiSearchable: true };
      if (tenantId) {
        whereConditions.tenantId = tenantId;
      } else {
        whereConditions.tenantId = null;
      }

      const totalArticles = await this.knowledgeRepository.count({
        where: whereConditions
      });

      const indexedArticles = await this.knowledgeRepository.count({
        where: {
          ...whereConditions,
          embeddingVector: { $ne: null } as any
        }
      });

      return {
        totalArticles,
        indexedArticles,
        avgEmbeddingQuality: indexedArticles / totalArticles,
        lastIndexUpdate: new Date()
      };

    } catch (error: unknown) {
      console.error('Failed to get search statistics', {
        tenantId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      
      return {
        totalArticles: 0,
        indexedArticles: 0,
        avgEmbeddingQuality: 0,
        lastIndexUpdate: new Date()
      };
    }
  }

  /**
   * Check if vector search is available
   */
  async isVectorSearchAvailable(): Promise<boolean> {
    try {
      // Check if pgvector extension is available
      const result = await AppDataSource.query(`
        SELECT EXISTS(
          SELECT 1 FROM pg_extension WHERE extname = 'vector'
        ) as has_vector
      `);

      return result[0]?.has_vector || false;

    } catch (error: unknown) {
      console.error('Failed to check vector search availability', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      return false;
    }
  }

  /**
   * Setup vector database
   */
  async setupVectorDatabase(): Promise<void> {
    try {
      // Enable pgvector extension
      await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
      
      // Create vector index
      await AppDataSource.query(`
        CREATE INDEX IF NOT EXISTS idx_knowledge_vector_cosine
        ON enhanced_knowledge_base_articles 
        USING ivfflat (embedding_vector vector_cosine_ops)
        WITH (lists = 100)
      `);

      console.log('Vector database setup completed');

    } catch (error: unknown) {
      console.error('Vector database setup failed', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      throw error;
    }
  }
}

export default VectorSearchService;