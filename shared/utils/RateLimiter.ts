/**
 * @fileoverview Rate Limiter Utility
 * @module RateLimiter
 * @category Utilities
 * @subcategory Rate Limiting
 * @version 1.0.0
 * @since 2025-10-07
 * @author WriteCareNotes Development Team
 * 
 * @description
 * Production-ready rate limiter implementing token bucket algorithm.
 * Controls request rates to prevent overwhelming external APIs and
 * ensures compliance with provider rate limits.
 * 
 * @compliance
 * - ISO 27001: Availability management
 * - API Provider Terms: Rate limit compliance
 * 
 * @example
 * ```typescript
 * const limiter = new RateLimiter(60, 60000); // 60 requests per minute
 * await limiter.acquire(); // Waits if rate limit exceeded
 * // Make API call
 * ```
 */

/**
 * Rate limiter configuration
 * 
 * @interface RateLimiterConfig
 */
export interface RateLimiterConfig {
  /** Maximum number of tokens */
  maxTokens: number;
  
  /** Refill interval in milliseconds */
  refillIntervalMs: number;
  
  /** Number of tokens to refill */
  tokensPerRefill?: number;
}

/**
 * Rate limiter class using token bucket algorithm
 * 
 * @class RateLimiter
 */
export class RateLimiter {
  /** Maximum number of tokens in bucket */
  private maxTokens: number;
  
  /** Current number of tokens */
  private currentTokens: number;
  
  /** Refill interval in milliseconds */
  private refillIntervalMs: number;
  
  /** Number of tokens to add on refill */
  private tokensPerRefill: number;
  
  /** Last refill timestamp */
  private lastRefillTime: number;
  
  /** Queue of waiting requests */
  private queue: Array<() => void> = [];
  
  /** Refill timer */
  private refillTimer: NodeJS.Timeout | null = null;

  /**
   * Constructor
   * 
   * @param {number} maxTokens - Maximum tokens (requests allowed)
   * @param {number} refillIntervalMs - Refill interval in milliseconds
   * @param {number} [tokensPerRefill] - Tokens to add per refill (defaults to maxTokens)
   */
  constructor(
    maxTokens: number,
    refillIntervalMs: number,
    tokensPerRefill?: number
  ) {
    if (maxTokens <= 0) {
      throw new Error('maxTokens must be positive');
    }
    
    if (refillIntervalMs <= 0) {
      throw new Error('refillIntervalMs must be positive');
    }

    this.maxTokens = maxTokens;
    this.currentTokens = maxTokens;
    this.refillIntervalMs = refillIntervalMs;
    this.tokensPerRefill = tokensPerRefill || maxTokens;
    this.lastRefillTime = Date.now();
    
    this.startRefillTimer();
  }

  /**
   * Acquire a token (wait if necessary)
   * 
   * @returns {Promise<void>} Resolves when token is acquired
   */
  public async acquire(): Promise<void> {
    // Check if we have tokens available
    if (this.currentTokens > 0) {
      this.currentTokens--;
      return Promise.resolve();
    }

    // No tokens available - wait in queue
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * Try to acquire a token without waiting
   * 
   * @returns {boolean} True if token acquired, false otherwise
   */
  public tryAcquire(): boolean {
    if (this.currentTokens > 0) {
      this.currentTokens--;
      return true;
    }
    
    return false;
  }

  /**
   * Get current token count
   * 
   * @returns {number} Current number of tokens
   */
  public getAvailableTokens(): number {
    return this.currentTokens;
  }

  /**
   * Get queue length
   * 
   * @returns {number} Number of waiting requests
   */
  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Reset rate limiter (refill all tokens)
   */
  public reset(): void {
    this.currentTokens = this.maxTokens;
    this.lastRefillTime = Date.now();
    
    // Process queued requests
    this.processQueue();
  }

  /**
   * Stop the rate limiter (cleanup)
   */
  public stop(): void {
    if (this.refillTimer) {
      clearInterval(this.refillTimer);
      this.refillTimer = null;
    }
    
    // Reject all queued requests
    this.queue = [];
  }

  /**
   * Start refill timer
   * 
   * @private
   */
  private startRefillTimer(): void {
    this.refillTimer = setInterval(() => {
      this.refill();
    }, this.refillIntervalMs);
  }

  /**
   * Refill tokens
   * 
   * @private
   */
  private refill(): void {
    const now = Date.now();
    const timeSinceLastRefill = now - this.lastRefillTime;
    
    // Calculate how many refill intervals have passed
    const refillIntervals = Math.floor(timeSinceLastRefill / this.refillIntervalMs);
    
    if (refillIntervals > 0) {
      const tokensToAdd = refillIntervals * this.tokensPerRefill;
      this.currentTokens = Math.min(this.maxTokens, this.currentTokens + tokensToAdd);
      this.lastRefillTime = now;
      
      // Process queued requests
      this.processQueue();
    }
  }

  /**
   * Process queued requests
   * 
   * @private
   */
  private processQueue(): void {
    while (this.queue.length > 0 && this.currentTokens > 0) {
      const resolve = this.queue.shift();
      if (resolve) {
        this.currentTokens--;
        resolve();
      }
    }
  }
}
