/**
 * Circuit Breaker Implementation
 * Protects against cascading failures
 */

import { logger } from './logger';

export enum CircuitState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Failure threshold exceeded
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
  failureThreshold: number;     // Number of failures before opening
  successThreshold: number;     // Number of successes to close from half-open
  timeout: number;              // Time before attempting half-open (ms)
  monitoringPeriod: number;     // Time window for failure counting (ms)
}

export class CircuitBreaker {
  privatestate: CircuitState = CircuitState.CLOSED;
  privatefailureCount: number = 0;
  privatesuccessCount: number = 0;
  privatenextAttempt: number = Date.now();
  privateoptions: CircuitBreakerOptions;
  privatename: string;

  constructor(name: string, options?: Partial<CircuitBreakerOptions>) {
    this.name = name;
    this.options = {
      failureThreshold: options?.failureThreshold || 5,
      successThreshold: options?.successThreshold || 2,
      timeout: options?.timeout || 60000, // 60 seconds
      monitoringPeriod: options?.monitoringPeriod || 60000 // 60 seconds
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check current state
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        const error = new Error(
          `Circuit breaker [${this.name}] is OPEN. Service unavailable.`
        );
        logger.warn(`Circuit breaker ${this.name} rejected request - OPEN state`, {
          nextAttempt: new Date(this.nextAttempt).toISOString(),
          failureCount: this.failureCount
        });
        throw error;
      } else {
        // Try half-open
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.info(`Circuit breaker ${this.name} entering HALF_OPEN state`);
      }
    }

    try {
      // Execute the function
      const result = await fn();
      
      // Success
      this.onSuccess();
      return result;
      
    } catch (error) {
      // Failure
      this.onFailure(error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
        logger.info(`Circuit breaker ${this.name} closed after successful recovery`, {
          successCount: this.successCount
        });
      }
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(error: any): void {
    this.failureCount++;

    logger.error(`Circuit breaker ${this.name} recorded failure`, {
      failureCount: this.failureCount,
      threshold: this.options.failureThreshold,
      error: error.message,
      state: this.state
    });

    if (
      this.state === CircuitState.HALF_OPEN ||
      this.failureCount >= this.options.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.options.timeout;
      
      logger.error(`Circuit breaker ${this.name} opened`, {
        failureCount: this.failureCount,
        nextAttempt: new Date(this.nextAttempt).toISOString(),
        timeout: `${this.options.timeout}ms`
      });
    }
  }

  /**
   * Get current circuit breaker status
   */
  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.state === CircuitState.OPEN 
        ? new Date(this.nextAttempt).toISOString() 
        : null,
      options: this.options
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    
    logger.info(`Circuit breaker ${this.name} manually reset`);
  }

  /**
   * Manually open the circuit breaker
   */
  open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.timeout;
    
    logger.warn(`Circuit breaker ${this.name} manually opened`);
  }
}

// ===================================================================
// USAGE EXAMPLES
// ===================================================================

/**
 * Example: Protect external API calls
 */
export class ExternalAPIService {
  privatecircuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('ExternalAPI', {
      failureThreshold: 5,
      successThreshold: 2,
      timeout: 60000 // 1 minute
    });
  }

  async callExternalAPI(endpoint: string, data: any): Promise<any> {
    return await this.circuitBreaker.execute(async () => {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      return await response.json();
    });
  }
}

/**
 * Example: Protect database queries
 */
export class DatabaseService {
  privatecircuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('Database', {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000 // 30 seconds
    });
  }

  async query(sql: string, params: any[]): Promise<any> {
    return await this.circuitBreaker.execute(async () => {
      // Your database query logic here
      // const result = await dataSource.query(sql, params);
      // return result;
      throw new Error('Not implemented');
    });
  }
}

/**
 * Example: Protect email sending
 */
export class EmailService {
  privatecircuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker('EmailService', {
      failureThreshold: 10,
      successThreshold: 3,
      timeout: 120000 // 2 minutes
    });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    try {
      return await this.circuitBreaker.execute(async () => {
        // Your email sending logic here
        // await transporter.sendMail({ to, subject, html: body });
        return true;
      });
    } catch (error) {
      // Circuit is open - queue email for later
      logger.warn('Email circuit breaker open - queuing email', { to, subject });
      await this.queueEmail(to, subject, body);
      return false;
    }
  }

  private async queueEmail(to: string, subject: string, body: string): Promise<void> {
    // Queue email in database or message queue for retry
    logger.info('Email queued for retry', { to, subject });
  }
}

export default CircuitBreaker;
