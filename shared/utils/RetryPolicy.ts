/**
 * @fileoverview Retry Policy Utilities
 * @module RetryPolicy
 * @category Utilities
 * @subcategory Error Handling
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Production-ready retry policy implementations with support for:
 * - Exponential backoff
 * - Fixed delay retries
 * - Jitter to prevent thundering herd
 * - Configurable retry conditions
 * 
 * @compliance
 * - ISO 27001: Availability management
 * - Healthcare IT: Resilience requirements
 * 
 * @example
 * ```typescript
 * const retryPolicy = new ExponentialBackoff({
 *   maxRetries: 3,
 *   initialDelayMs: 1000,
 *   maxDelayMs: 30000
 * });
 * 
 * const result = await retryPolicy.execute(async () => {
 *   return await apiCall();
 * });
 * ```
 */

import { Logger } from './Logger';

/**
 * Retry policy configuration
 * 
 * @interface RetryPolicyConfig
 */
export interface RetryPolicyConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  
  /** Initial delay in milliseconds */
  initialDelayMs: number;
  
  /** Maximum delay in milliseconds */
  maxDelayMs: number;
  
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;
  
  /** Add jitter to prevent thundering herd */
  useJitter?: boolean;
  
  /** Function to determine if error should trigger retry */
  shouldRetry?: (error: any) => boolean;
}

/**
 * Retry statistics
 * 
 * @interface RetryStats
 */
export interface RetryStats {
  /** Total attempts made */
  attempts: number;
  
  /** Total delay time in milliseconds */
  totalDelayMs: number;
  
  /** Success status */
  success: boolean;
  
  /** Final error (if failed) */
  finalError?: any;
}

/**
 * Abstract retry policy base class
 * 
 * @abstract
 * @class RetryPolicy
 */
export abstract class RetryPolicy {
  /** Configuration */
  protected config: RetryPolicyConfig;
  
  /** Logger */
  protected logger: Logger;

  /**
   * Constructor
   * 
   * @param {RetryPolicyConfig} config - Retry configuration
   */
  constructor(config: RetryPolicyConfig) {
    this.config = config;
    this.logger = new Logger('RetryPolicy');
  }

  /**
   * Execute function with retry logic
   * 
   * @template T
   * @param {() => Promise<T>} fn - Function to execute
   * @returns {Promise<T>} Result
   * @throws {Error} If all retries exhausted
   */
  public async execute<T>(fn: () => Promise<T>): Promise<T> {
    const stats: RetryStats = {
      attempts: 0,
      totalDelayMs: 0,
      success: false
    };

    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      stats.attempts++;

      try {
        const result = await fn();
        stats.success = true;
        
        if (attempt > 0) {
          this.logger.info('Operation succeeded after retry', {
            attempts: stats.attempts,
            totalDelayMs: stats.totalDelayMs
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;

        // Check if we should retry
        const shouldRetry = this.shouldRetry(error, attempt);
        
        if (!shouldRetry || attempt >= this.config.maxRetries) {
          stats.finalError = error;
          this.logger.error('Operation failed after all retries', {
            attempts: stats.attempts,
            totalDelayMs: stats.totalDelayMs,
            error: error instanceof Error ? error.message : String(error)
          });
          throw error;
        }

        // Calculate delay for next attempt
        const delayMs = this.calculateDelay(attempt);
        stats.totalDelayMs += delayMs;

        this.logger.warn('Operation failed, retrying', {
          attempt: attempt + 1,
          maxRetries: this.config.maxRetries,
          delayMs,
          error: error instanceof Error ? error.message : String(error)
        });

        // Wait before retry
        await this.delay(delayMs);
      }
    }

    throw lastError;
  }

  /**
   * Calculate delay for next retry attempt
   * 
   * @abstract
   * @protected
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  protected abstract calculateDelay(attempt: number): number;

  /**
   * Check if error should trigger retry
   * 
   * @protected
   * @param {any} error - Error that occurred
   * @param {number} attempt - Current attempt number
   * @returns {boolean} True if should retry
   */
  protected shouldRetry(error: any, attempt: number): boolean {
    // Use custom retry condition if provided
    if (this.config.shouldRetry) {
      return this.config.shouldRetry(error);
    }

    // Default: retry on network errors and 5xx server errors
    return this.isRetryableError(error);
  }

  /**
   * Check if error is retryable by default
   * 
   * @protected
   * @param {any} error - Error to check
   * @returns {boolean} True if retryable
   */
  protected isRetryableError(error: any): boolean {
    // Network errors
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNREFUSED') {
      return true;
    }

    // Rate limit errors (429)
    if (error.response && error.response.status === 429) {
      return true;
    }

    // Server errors (5xx)
    if (error.response && error.response.status >= 500 && error.response.status < 600) {
      return true;
    }

    return false;
  }

  /**
   * Add jitter to delay
   * 
   * @protected
   * @param {number} delayMs - Base delay
   * @returns {number} Delay with jitter
   */
  protected addJitter(delayMs: number): number {
    if (!this.config.useJitter) {
      return delayMs;
    }

    // Add random jitter between 0% and 25% of delay
    const jitter = Math.random() * delayMs * 0.25;
    return delayMs + jitter;
  }

  /**
   * Sleep for specified duration
   * 
   * @protected
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Exponential backoff retry policy
 * 
 * @class ExponentialBackoff
 * @extends {RetryPolicy}
 */
export class ExponentialBackoff extends RetryPolicy {
  /**
   * Calculate delay using exponential backoff
   * 
   * @protected
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  protected calculateDelay(attempt: number): number {
    const multiplier = this.config.backoffMultiplier || 2;
    const delay = this.config.initialDelayMs * Math.pow(multiplier, attempt);
    const cappedDelay = Math.min(delay, this.config.maxDelayMs);
    
    return this.addJitter(cappedDelay);
  }
}

/**
 * Fixed delay retry policy
 * 
 * @class FixedDelay
 * @extends {RetryPolicy}
 */
export class FixedDelay extends RetryPolicy {
  /**
   * Calculate delay using fixed delay
   * 
   * @protected
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  protected calculateDelay(attempt: number): number {
    return this.addJitter(this.config.initialDelayMs);
  }
}

/**
 * Linear backoff retry policy
 * 
 * @class LinearBackoff
 * @extends {RetryPolicy}
 */
export class LinearBackoff extends RetryPolicy {
  /**
   * Calculate delay using linear backoff
   * 
   * @protected
   * @param {number} attempt - Current attempt number (0-based)
   * @returns {number} Delay in milliseconds
   */
  protected calculateDelay(attempt: number): number {
    const delay = this.config.initialDelayMs * (attempt + 1);
    const cappedDelay = Math.min(delay, this.config.maxDelayMs);
    
    return this.addJitter(cappedDelay);
  }
}
