/**
 * @fileoverview rate limit Service
 * @module Auth/RateLimitService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description rate limit Service
 */

import { EventEmitter2 } from "eventemitter2";

import { logger } from '../../utils/logger';

export class RateLimitService {
  privateattempts: Map<string, { count: number; lastAttempt: Date }> = new Map();
  private readonly maxAttempts: number = 5;
  private readonly windowMs: number = 15 * 60 * 1000; // 15 minutes

  async checkRateLimit(identifier: string): Promise<boolean> {
    const now = new Date();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Reset if window has passed
    if (now.getTime() - attempt.lastAttempt.getTime() > this.windowMs) {
      this.attempts.set(identifier, { count: 1, lastAttempt: now });
      return true;
    }

    // Check if max attempts exceeded
    if (attempt.count >= this.maxAttempts) {
      console.warn(`Rate limit exceeded for identifier: ${identifier}`);
      return false;
    }

    // Increment attempt count
    attempt.count++;
    attempt.lastAttempt = now;
    this.attempts.set(identifier, attempt);

    return true;
  }

  async resetRateLimit(identifier: string): Promise<void> {
    this.attempts.delete(identifier);
  }

  async getRemainingAttempts(identifier: string): Promise<number> {
    const attempt = this.attempts.get(identifier);
    if (!attempt) {
      return this.maxAttempts;
    }

    const now = new Date();
    if (now.getTime() - attempt.lastAttempt.getTime() > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - attempt.count);
  }
}
