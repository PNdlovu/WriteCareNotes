/**
 * @fileoverview database Service
 * @module Core/DatabaseService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description database Service
 */

import { Pool, PoolClient, QueryResult } from 'pg';
import { configService } from './ConfigurationService';
import { loggerService } from './LoggerService';

interface QueryOptions {
  name?: string;
  timeout?: number;
  retries?: number;
}

interface TransactionCallback<T> {
  (client: PoolClient): Promise<T>;
}

interface ConnectionStats {
  totalConnections: number;
  idleConnections: number;
  waitingClients: number;
}

class DatabaseService {
  private staticinstance: DatabaseService;
  privatepool: Pool;
  privateisConnected: boolean = false;

  private const ructor() {
    this.pool = this.createPool();
    this.setupEventHandlers();
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private createPool(): Pool {
    const dbConfig = configService.getDatabase();
    
    return new Pool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.username,
      password: dbConfig.password,
      ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
      max: dbConfig.maxConnections,
      idleTimeoutMillis: dbConfig.idleTimeoutMillis,
      connectionTimeoutMillis: dbConfig.connectionTimeoutMillis,
      query_timeout: 30000,
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 30000
    });
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client) => {
      loggerService.debug('New database client connected');
      this.isConnected = true;
    });

    this.pool.on('acquire', (client) => {
      loggerService.debug('Database client acquired from pool');
    });

    this.pool.on('remove', (client) => {
      loggerService.debug('Database client removed from pool');
    });

    this.pool.on('error', (err, client) => {
      loggerService.error('Database pool error', err);
      this.isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', () => this.close());
    process.on('SIGTERM', () => this.close());
  }

  public async initialize(): Promise<void> {
    try {
      // Test the connection
      const startTime = Date.now();
      const client = await this.pool.connect();
      
      // Run a simple query to verify connection
      await client.query('SELECT NOW() as current_time');
      client.release();
      
      const duration = Date.now() - startTime;
      this.isConnected = true;
      
      loggerService.info('Database connection established', { duration });
      loggerService.performance('Database initialization', duration);
    } catch (error) {
      this.isConnected = false;
      loggerService.error('Failed to initialize database connection', error as Error);
      throw error;
    }
  }

  public async query<T = any>(
    text: string, 
    params?: any[], 
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const queryId = Math.random().toString(36).substring(7);
    
    try {
      loggerService.debug('Executing database query', { 
        queryId, 
        query: options?.name || 'unnamed',
        paramCount: params?.length || 0 
      });

      let result: QueryResult<T>;
      
      if (options?.retries && options.retries > 0) {
        result = await this.queryWithRetry(text, params, options);
      } else {
        result = await this.pool.query(text, params);
      }

      const duration = Date.now() - startTime;
      
      loggerService.databaseQuery(
        options?.name || text,
        duration,
        result.rowCount || 0,
        { queryId }
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      loggerService.error('Database query failed', error as Error, {
        queryId,
        query: options?.name || 'unnamed',
        duration
      });
      
      throw error;
    }
  }

  private async queryWithRetry<T = any>(
    text: string, 
    params?: any[], 
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const maxRetries = options?.retries || 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.pool.query(text, params);
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        loggerService.warn(`Database query attempt ${attempt} failed, retrying...`, {
          error: (error as Error).message,
          attempt,
          maxRetries
        });
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  public async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const client = await this.pool.connect();
    const transactionId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    try {
      loggerService.debug('Starting database transaction', { transactionId });
      
      await client.query('BEGIN');
      
      const result = await callback(client);
      
      await client.query('COMMIT');
      
      const duration = Date.now() - startTime;
      loggerService.info('Database transaction completed', { 
        transactionId, 
        duration 
      });
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      
      const duration = Date.now() - startTime;
      loggerService.error('Database transaction rolled back', error as Error, {
        transactionId,
        duration
      });
      
      throw error;
    } finally {
      client.release();
    }
  }

  // Batch operations
  public async batchInsert(
    table: string, 
    columns: string[], 
    rows: any[][], 
    options?: { onConflict?: string }
  ): Promise<QueryResult> {
    if (rows.length === 0) {
      throw new Error('No rows provided for batch insert');
    }

    const startTime = Date.now();
    
    try {
      loggerService.debug('Executing batch insert', {
        table,
        columnCount: columns.length,
        rowCount: rows.length
      });

      const placeholders = rows.map((_, rowIndex) => {
        const rowPlaceholders = columns.map((_, colIndex) => 
          `$${rowIndex * columns.length + colIndex + 1}`
        );
        return `(${rowPlaceholders.join(', ')})`;
      }).join(', ');

      const values = rows.flat();
      const conflictClause = options?.onConflict ? `ON CONFLICT ${options.onConflict}` : '';
      
      const query = `
        INSERT INTO ${table} (${columns.join(', ')})
        VALUES ${placeholders}
        ${conflictClause}
      `;

      const result = await this.pool.query(query, values);
      
      const duration = Date.now() - startTime;
      loggerService.performance('Batch insert', duration, {
        table,
        rowCount: rows.length,
        insertedCount: result.rowCount
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      loggerService.error('Batch insert failed', error as Error, {
        table,
        rowCount: rows.length,
        duration
      });
      throw error;
    }
  }

  public async batchUpdate(
    table: string,
    updates: { where: string; set: Record<string, any>; params?: any[] }[]
  ): Promise<number> {
    if (updates.length === 0) {
      return 0;
    }

    return this.transaction(async (client) => {
      let totalUpdated = 0;

      for (const update of updates) {
        const setClause = Object.keys(update.set)
          .map((key, index) => `${key} = $${index + 1}`)
          .join(', ');
        
        const setValues = Object.values(update.set);
        const allParams = [...setValues, ...(update.params || [])];
        
        const query = `
          UPDATE ${table}
          SET ${setClause}
          WHERE ${update.where}
        `;

        const result = await client.query(query, allParams);
        totalUpdated += result.rowCount || 0;
      }

      loggerService.info('Batch update completed', {
        table,
        updateCount: updates.length,
        totalUpdated
      });

      return totalUpdated;
    });
  }

  // Connection health checks
  public async healthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const result = await this.pool.query('SELECT 1 as health_check');
      const duration = Date.now() - startTime;
      
      loggerService.debug('Database health check passed', { duration });
      return result.rowCount === 1;
    } catch (error) {
      loggerService.error('Database health check failed', error as Error);
      return false;
    }
  }

  public getConnectionStats(): ConnectionStats {
    return {
      totalConnections: this.pool.totalCount,
      idleConnections: this.pool.idleCount,
      waitingClients: this.pool.waitingCount
    };
  }

  public isHealthy(): boolean {
    return this.isConnected;
  }

  // Utility methods for common queries
  public async findById<T = any>(
    table: string, 
    id: string | number, 
    columns: string[] = ['*']
  ): Promise<T | null> {
    const query = `SELECT ${columns.join(', ')} FROM ${table} WHEREid = $1`;
    const result = await this.query<T>(query, [id], { name: `findById_${table}` });
    return result.rows[0] || null;
  }

  public async findByCondition<T = any>(
    table: string,
    condition: string,
    params: any[],
    columns: string[] = ['*'],
    limit?: number,
    offset?: number
  ): Promise<T[]> {
    let query = `SELECT ${columns.join(', ')} FROM ${table} WHERE ${condition}`;
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    if (offset) {
      query += ` OFFSET ${offset}`;
    }

    const result = await this.query<T>(query, params, { 
      name: `findByCondition_${table}` 
    });
    
    return result.rows;
  }

  public async insert<T = any>(
    table: string,
    data: Record<string, any>,
    returning: string[] = ['id']
  ): Promise<T> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING ${returning.join(', ')}
    `;

    const result = await this.query<T>(query, values, { name: `insert_${table}` });
    return result.rows[0];
  }

  public async update<T = any>(
    table: string,
    id: string | number,
    data: Record<string, any>,
    returning: string[] = ['id']
  ): Promise<T | null> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');

    const query = `
      UPDATE ${table}
      SET ${setClause}, updated_at = NOW()
      WHEREid = $${values.length + 1}
      RETURNING ${returning.join(', ')}
    `;

    const result = await this.query<T>(query, [...values, id], { 
      name: `update_${table}` 
    });
    
    return result.rows[0] || null;
  }

  public async delete(table: string, id: string | number): Promise<boolean> {
    const query = `DELETE FROM ${table} WHEREid = $1`;
    const result = await this.query(query, [id], { name: `delete_${table}` });
    return (result.rowCount || 0) > 0;
  }

  public async softDelete(table: string, id: string | number): Promise<boolean> {
    const query = `
      UPDATE ${table} 
      SET deleted_at = NOW(), updated_at = NOW() 
      WHEREid = $1 AND deleted_at IS NULL
    `;
    
    const result = await this.query(query, [id], { name: `softDelete_${table}` });
    return (result.rowCount || 0) > 0;
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      loggerService.info('Database pool closed');
    } catch (error) {
      loggerService.error('Error closing database pool', error as Error);
    }
  }
}

export const databaseService = DatabaseService.getInstance();
export { DatabaseService, QueryOptions, TransactionCallback, ConnectionStats };
export default databaseService;
