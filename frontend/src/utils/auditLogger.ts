export interface AuditLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  action: string;
  userId?: string;
  resource?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  private logs: AuditLogEntry[] = [];

  private log(level: AuditLogEntry['level'], action: string, details?: any) {
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      level,
      action,
      details,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
    };

    this.logs.push(entry);
    console.log(`[AUDIT ${level.toUpperCase()}]`, action, details);

    // In a real implementation, this would send to an audit service
    this.sendToAuditService(entry);
  }

  public info(action: string, details?: any) {
    this.log('info', action, details);
  }

  public warn(action: string, details?: any) {
    this.log('warn', action, details);
  }

  public error(action: string, details?: any) {
    this.log('error', action, details);
  }

  public debug(action: string, details?: any) {
    this.log('debug', action, details);
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
  }

  private getClientIP(): string {
    // In a browser environment, we can't get the real IP
    return 'client';
  }

  private getUserAgent(): string {
    return navigator?.userAgent || 'unknown';
  }

  private async sendToAuditService(entry: AuditLogEntry): Promise<void> {
    try {
      // In a real implementation, this would send to an audit API
      // await fetch('/api/audit', { method: 'POST', body: JSON.stringify(entry) });
    } catch (error) {
      console.error('Failed to send audit log:', error);
    }
  }
}

export const auditLogger = new AuditLogger();