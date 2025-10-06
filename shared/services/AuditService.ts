import fs from 'fs/promises';
import path from 'path';

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId?: string;
  action: string;
  resource?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  sessionId?: string;
  organizationId?: string;
}

export class AuditService {
  private readonly auditLogPath: string;
  private eventBuffer: AuditEvent[] = [];
  private readonly bufferSize = 100;
  private flushTimer?: NodeJS.Timeout;

  constructor(logDirectory?: string) {
    const baseDir = logDirectory || process.env.AUDIT_LOG_DIR || './logs/audit';
    const today = new Date().toISOString().split('T')[0];
    this.auditLogPath = path.join(baseDir, `audit-${today}.jsonl`);
    this.ensureLogDirectory();
    this.startPeriodicFlush();
  }

  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.auditLogPath), { recursive: true });
    } catch (error) {
      console.error('Failed to create audit log directory:', error);
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushBuffer();
    }, 30000); // Flush every 30 seconds
  }

  async logEvent(event: Partial<AuditEvent> & { action: string }): Promise<void> {
    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      success: true,
      ...event
    };

    this.eventBuffer.push(auditEvent);

    if (this.eventBuffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      const logEntries = events.map(event => JSON.stringify(event)).join('\n');
      await fs.appendFile(this.auditLogPath, logEntries + '\n');
    } catch (error) {
      console.error('Failed to write audit events:', error);
      // Return events to buffer if write failed
      this.eventBuffer.unshift(...this.eventBuffer);
    }
  }

  async getEvents(filters?: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditEvent[]> {
    try {
      const logContent = await fs.readFile(this.auditLogPath, 'utf-8');
      const events = logContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line) as AuditEvent);

      let filteredEvents = events;

      if (filters?.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
      }
      if (filters?.action) {
        filteredEvents = filteredEvents.filter(e => e.action === filters.action);
      }
      if (filters?.resource) {
        filteredEvents = filteredEvents.filter(e => e.resource === filters.resource);
      }
      if (filters?.startDate) {
        filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) >= filters.startDate!);
      }
      if (filters?.endDate) {
        filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) <= filters.endDate!);
      }

      if (filters?.limit) {
        filteredEvents = filteredEvents.slice(0, filters.limit);
      }

      return filteredEvents.reverse(); // Most recent first
    } catch (error) {
      console.error('Failed to read audit events:', error);
      return [];
    }
  }

  async createAuditTrail(action: string, details?: any): Promise<void> {
    await this.logEvent({
      action,
      details,
      userId: 'system'
    });
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flushBuffer();
  }
}