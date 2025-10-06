export class RateLimitService {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async checkRateLimit(
    key: string, 
    maxAttempts: number, 
    windowSeconds: number
  ): Promise<{ allowed: boolean; remainingAttempts: number; resetTime: number }> {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const existing = this.attempts.get(key);

    if (!existing || now > existing.resetTime) {
      // First attempt or window expired
      this.attempts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      
      return {
        allowed: true,
        remainingAttempts: maxAttempts - 1,
        resetTime: now + windowMs
      };
    }

    if (existing.count >= maxAttempts) {
      // Rate limit exceeded
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: existing.resetTime
      };
    }

    // Increment attempt count
    existing.count += 1;
    this.attempts.set(key, existing);

    return {
      allowed: true,
      remainingAttempts: maxAttempts - existing.count,
      resetTime: existing.resetTime
    };
  }

  async isRateLimited(key: string, maxAttempts: number, windowSeconds: number): Promise<boolean> {
    const result = await this.checkRateLimit(key, maxAttempts, windowSeconds);
    return !result.allowed;
  }

  async getRemainingAttempts(key: string, maxAttempts: number): Promise<number> {
    const existing = this.attempts.get(key);
    if (!existing) {
      return maxAttempts;
    }

    const now = Date.now();
    if (now > existing.resetTime) {
      return maxAttempts;
    }

    return Math.max(0, maxAttempts - existing.count);
  }

  async resetRateLimit(key: string): Promise<void> {
    this.attempts.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.attempts.entries()) {
      if (now > data.resetTime) {
        this.attempts.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.attempts.clear();
  }
}